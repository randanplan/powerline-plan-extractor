import { getDocument, GlobalWorkerOptions } from 'pdfjs-dist';
import { resolve, basename } from 'path';
import { TextItem } from 'pdfjs-dist/types/src/display/api';
import { PlanInfo, PlanInfoSchema } from '../models';
import { parseMetadataText } from './text_processor';
import { extractRectangles, Rect } from './geometry';
import { parseMeasureText } from './measure_parser';

// Set the worker source for pdfjs-dist
const workerPath = resolve(__dirname, '../../node_modules/pdfjs-dist/build/pdf.worker.mjs');
GlobalWorkerOptions.workerSrc = `file:///${workerPath.replace(/\\/g, '/')}`;

// --- Constants & Configuration ---

const PADDING = {
  LEFT: 70.6,
  RIGHT: 13.9,
  TOP: 14.2,
  BOTTOM: 13.9,
};

const LAYOUT_OFFSETS = {
  MAP_END_OFFSET: 1572.9,
  LEGEND_START_OFFSET: 1573.4,
  LEGEND_END_OFFSET: 1048.5,
  DETAILS_START_OFFSET: 1049.0,
  DETAILS_END_OFFSET: 524.1,
  INFO_START_OFFSET: 524.6,
  INFO_END_OFFSET: 13.9,
};

// --- Helper Functions ---

/**
 * Pads a mast number to 4 digits with leading zeros.
 * Handles suffixes (e.g., "35A" -> "0035A") and 'P' prefix ("P1" -> "P001").
 */
export function padMastNumber(mastNr: string): string {
  const trimmed = mastNr.trim();
  
  // Handle Portal Masts (P-Prefix)
  if (trimmed.toUpperCase().startsWith('P')) {
    const numberPart = trimmed.substring(1);
    // Check if the rest is numeric or alphanumeric
    const match = numberPart.match(/^(\d+)(.*)$/);
    if (match) {
      const num = match[1].padStart(3, '0'); // P + 3 digits = 4 chars? No, usually P001. 
      // AGENTS.md says: P1 -> P001. 
      return `P${num}${match[2]}`;
    }
    return trimmed; // Fallback
  }

  // Standard Masts
  const match = trimmed.match(/^(\d+)(.*)$/);
  if (match) {
    const num = match[1].padStart(4, '0');
    const suffix = match[2];
    return `${num}${suffix}`;
  }
  
  return trimmed; // Return original if no number found (should not happen for valid masts)
}

/**
 * Parses the filename to extract metadata based on BMP or ÖTM patterns.
 */
export function parseFilename(filePath: string): Partial<PlanInfo> | null {
  const filename = basename(filePath);
  
  // BMP Pattern: 4113_Limburg-Weilburg_0004_15_20.pdf
  // Regex: (\d+)_(\w+)_(\d{4})_(.+)-(.+)\.(pdf|PDF)
  // Note: \w+ might not catch hyphens in city names, using [^_\.]+ instead
  // Note: The separator between start and end mast can be '-' or '_' based on examples vs regex
  const bmpRegex = /^(\d+)_([^_]+)_(\d{4})_(.+)[_\-](.+)\.(pdf|PDF)$/i;
  const bmpMatch = filename.match(bmpRegex);

  if (bmpMatch) {
    return {
      planType: 'BMP',
      bl: bmpMatch[1],
      region: bmpMatch[2], // Kreis/Ort
      blatt: bmpMatch[3],
      mastbereich: {
        start: padMastNumber(bmpMatch[4]),
        end: padMastNumber(bmpMatch[5]),
      },
      betreiber: 'Amprion', // Default for BMP
    };
  }

  // ÖTM Pattern: ÖTM-2006 Köln-0008.PDF
  // Regex: ÖTM-(\d{4}) (\w+)-(\d{4})\.(pdf|PDF)
  // Updated Regex to handle spaces and hyphens in LosName correctly
  const oetmRegex = /^ÖTM-(\d{4})\s+(.+)-(\d{4})\s*\.(pdf|PDF)$/i;
  const oetmMatch = filename.match(oetmRegex);

  if (oetmMatch) {
    const losId = oetmMatch[1] as '2006' | '2008' | '2009'; // Cast to known enum
    const losName = oetmMatch[2].trim() as 'Köln' | 'Düsseldorf-Neuss' | 'Mönchengladbach-Grevenbroich';
    
    return {
      planType: 'ÖTM',
      losId: losId,
      losName: losName,
      blatt: oetmMatch[3],
      betreiber: 'Westnetz', // Default for ÖTM
      // Mastbereich is not in filename for ÖTM, must be extracted from content
    };
  }

  return null;
}

interface BoundingBox {
  x: number;
  y: number;
  width: number;
  height: number;
}

/**
 * Extracts text items from a specific rectangular region of the PDF page.
 * Coordinates are in PDF points (Origin Bottom-Left).
 */
async function extractTextFromBox(page: any, box: BoundingBox): Promise<TextItem[]> {
  const textContent = await page.getTextContent();
  
  return textContent.items.filter((item: any) => {
    // item.transform is [scaleX, skewY, skewX, scaleY, x, y]
    const x = item.transform[4];
    const y = item.transform[5];
    
    // Check if the item's anchor point is within the box
    // Note: This is a simplified check. For better precision, we might need to check the full bounding box of the text.
    return (
      x >= box.x &&
      x <= box.x + box.width &&
      y >= box.y &&
      y <= box.y + box.height
    );
  });
}

/**
 * Main function to parse a PDF plan.
 */
export async function parsePdfPlan(filePath: string) {
  const filenameMetadata = parseFilename(filePath);
  if (!filenameMetadata) {
    throw new Error(`Filename does not match known patterns (BMP or ÖTM): ${basename(filePath)}`);
  }

  const loadingTask = getDocument(`file:///${filePath.replace(/\\/g, '/')}`);
  const pdfDocument = await loadingTask.promise;
  
  // We assume single page plans as per docs
  const page = await pdfDocument.getPage(1);
  const viewport = page.getViewport({ scale: 1.0 });
  const { width, height } = viewport;

  // Define Crop Boxes based on Layout Rules
  // Y-coordinates: PDF origin is Bottom-Left.
  // "Top Padding 14.2" -> y_max = height - 14.2
  // "Bottom Padding 13.9" -> y_min = 13.9
  const contentYMin = PADDING.BOTTOM;
  const contentHeight = height - PADDING.TOP - PADDING.BOTTOM;

  // Plan-Infos (Metadata) Box
  const infoBox: BoundingBox = {
    x: width - LAYOUT_OFFSETS.INFO_START_OFFSET,
    y: contentYMin,
    width: LAYOUT_OFFSETS.INFO_START_OFFSET - LAYOUT_OFFSETS.INFO_END_OFFSET,
    height: contentHeight
  };

  // Map Box
  const mapBox: BoundingBox = {
    x: PADDING.LEFT,
    y: contentYMin,
    width: width - LAYOUT_OFFSETS.MAP_END_OFFSET - PADDING.LEFT,
    height: contentHeight
  };

  // Extract Text
  const infoTextItems = await extractTextFromBox(page, infoBox);
  const mapTextItems = await extractTextFromBox(page, mapBox);

  // Extract Geometry (Rectangles)
  const allRects = await extractRectangles(page);
  
  // Filter rects that are inside the map box
  const mapRects = allRects.filter(r => 
    r.x >= mapBox.x && 
    r.x + r.width <= mapBox.x + mapBox.width &&
    r.y >= mapBox.y && 
    r.y + r.height <= mapBox.y + mapBox.height
  );

  // Color Definitions (Normalized 0-1)
  // ÖTM Yellow: 255, 255, 224 -> 1, 1, 0.8784
  const COLOR_MEASURE_OETM = [1, 1, 224/255]; 
  // BMP Yellow: 255, 255, 153 -> 1, 1, 0.6
  const COLOR_MEASURE_BMP = [1, 1, 153/255];
  
  // Orange: 255, 128, 64 -> 1, 0.502, 0.251
  const COLOR_INFOBOX = [1, 128/255, 64/255];

  const isColorMatch = (c1: number[] | undefined, c2: number[], tolerance = 0.05) => {
    if (!c1) return false;
    if (c1.length !== c2.length) return false;
    return c1.every((v, i) => Math.abs(v - c2[i]) < tolerance);
  };

  const measureRects = mapRects.filter(r => 
    isColorMatch(r.color, COLOR_MEASURE_OETM) || 
    isColorMatch(r.color, COLOR_MEASURE_BMP)
  );
  const infoBoxRects = mapRects.filter(r => isColorMatch(r.color, COLOR_INFOBOX));

  // Helper to find text inside a rectangle
  const getTextInRect = (rect: Rect, items: TextItem[]): string | null => {
    // Find all text items whose anchor point is inside the rect
    // We add buffers to edges to avoid picking up background map text
    // Right edge: ~10 units (fixes "Am Pescher Holz")
    // Vertical edges: ~2 units (fixes "BAB A 57")
    const RIGHT_EDGE_BUFFER = 10;
    const VERTICAL_BUFFER = 2;

    const inside = items.filter((item: any) => {
      const tx = item.transform[4];
      const ty = item.transform[5];
      
      const isInside = (
        tx >= rect.x &&
        tx <= rect.x + rect.width - RIGHT_EDGE_BUFFER &&
        ty >= rect.y + VERTICAL_BUFFER &&
        ty <= rect.y + rect.height - VERTICAL_BUFFER
      );
      return isInside;
    });
    
    if (inside.length === 0) return null;

    // Filter out background noise (map labels) based on font size
    // We assume the "real" content has the largest font size in the box.
    // Map labels are typically much smaller (e.g. 7pt vs 14pt).
    const maxFontSize = Math.max(...inside.map((i: any) => Math.abs(i.transform[3])));
    const FONT_SIZE_TOLERANCE = 0.8; // Keep items within 80% of max size

    const filtered = inside.filter((i: any) => Math.abs(i.transform[3]) >= maxFontSize * FONT_SIZE_TOLERANCE);

    // Sort by Y (descending) then X (ascending) to get reading order
    filtered.sort((a: any, b: any) => {
      const yDiff = b.transform[5] - a.transform[5];
      if (Math.abs(yDiff) > 5) return yDiff; // Significant Y difference
      return a.transform[4] - b.transform[4]; // Same line, sort by X
    });
    
    return filtered.map(i => i.str).join(' ').trim();
  };

  // Map measures to their text (peId) and parse content
  const measuresParsed = measureRects.map(rect => {
    const text = getTextInRect(rect, mapTextItems) || '';
    const parsed = parseMeasureText(text, rect);
    return parsed;
  });

  // Join text for simple analysis
  const rawInfoText = infoTextItems.map(item => item.str).join(' ');
  
  // Parse metadata from text
  const textMetadata = parseMetadataText(rawInfoText);

  // Merge filename metadata with text metadata
  // Filename metadata usually takes precedence for ID-critical fields (like BL, Blatt),
  // but text metadata fills in the gaps (Projekt, Ausgabe, etc.)
  const mergedMetadata = {
    ...textMetadata,
    ...filenameMetadata, // Filename overrides text if conflict (usually safer for IDs)
    rawText: rawInfoText
  };
  
  return {
    metadata: mergedMetadata,
    map: {
      rawText: mapTextItems.map(item => item.str).join(' '),
      measures: measuresParsed,
      infoBoxes: infoBoxRects,
      allRects: mapRects // Keep all for debugging
    },
    dimensions: {
      width,
      height
    }
  };
}
