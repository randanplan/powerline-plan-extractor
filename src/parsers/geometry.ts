import { OPS } from 'pdfjs-dist';

export interface Rect {
  x: number;
  y: number;
  width: number;
  height: number;
  color?: number[]; // RGB array [r, g, b] (0-1)
}

/**
 * Extracts rectangles (filled and stroked) from the PDF page's operator list.
 * Tracks path state to correctly associate colors with shapes.
 */
export async function extractRectangles(page: any): Promise<Rect[]> {
  const operatorList = await page.getOperatorList();
  const foundRects: Rect[] = [];
  
  let currentFillColor: number[] = [0, 0, 0]; // Default black
  let currentStrokeColor: number[] = [0, 0, 0]; // Default black
  let currentPathRects: Rect[] = []; // Rectangles in the current path

  for (let i = 0; i < operatorList.fnArray.length; i++) {
    const fn = operatorList.fnArray[i];
    const args = operatorList.argsArray[i];

    // --- Color State ---

    // Set Fill Color (RGB) - scn, sc, rg
    if (fn === OPS.setFillRGBColor) {
      // Check if values are 0-255 or 0-1
      if (args[0] > 1 || args[1] > 1 || args[2] > 1) {
         currentFillColor = [args[0] / 255, args[1] / 255, args[2] / 255];
      } else {
         currentFillColor = args;
      }
    } 
    // Set Fill Color (CMYK) - k, K
    else if (fn === OPS.setFillCMYKColor) {
      const [c, m, y, k] = args;
      const r = 1 - Math.min(1, c * (1 - k) + k);
      const g = 1 - Math.min(1, m * (1 - k) + k);
      const b = 1 - Math.min(1, y * (1 - k) + k);
      currentFillColor = [r, g, b];
    }
    // Set Fill Color (Gray) - g
    else if (fn === OPS.setFillGray) {
      const [g] = args;
      currentFillColor = [g, g, g];
    }
    // Set Stroke Color (RGB) - SCN, SC, RG
    else if (fn === OPS.setStrokeRGBColor) {
      if (args[0] > 1 || args[1] > 1 || args[2] > 1) {
         currentStrokeColor = [args[0] / 255, args[1] / 255, args[2] / 255];
      } else {
         currentStrokeColor = args;
      }
    }
    // Set Stroke Color (CMYK) - K
    else if (fn === OPS.setStrokeCMYKColor) {
      const [c, m, y, k] = args;
      const r = 1 - Math.min(1, c * (1 - k) + k);
      const g = 1 - Math.min(1, m * (1 - k) + k);
      const b = 1 - Math.min(1, y * (1 - k) + k);
      currentStrokeColor = [r, g, b];
    }
    // Set Stroke Color (Gray) - G
    else if (fn === OPS.setStrokeGray) {
      const [g] = args;
      currentStrokeColor = [g, g, g];
    }

    // --- Path Construction ---

    // Rectangle: x y w h re
    else if (fn === OPS.rectangle) {
      const [x, y, w, h] = args;
      currentPathRects.push({ x, y, width: w, height: h });
    }
    
    // Construct Path (often used instead of simple rectangle)
    else if (fn === OPS.constructPath) {
      const ops = args[0] as number[];
      const coords = args[1] as number[];
      
      // Check if this path forms a rectangle
      let xCoords: number[] = [];
      let yCoords: number[] = [];
      let cIdx = 0;

      for (const op of ops) {
        if (op === OPS.moveTo || op === OPS.lineTo) {
          if (cIdx + 1 < coords.length) {
            xCoords.push(coords[cIdx]);
            yCoords.push(coords[cIdx + 1]);
            cIdx += 2;
          }
        } else if (op === OPS.rectangle) {
           if (cIdx + 3 < coords.length) {
             const x = coords[cIdx];
             const y = coords[cIdx+1];
             const w = coords[cIdx+2];
             const h = coords[cIdx+3];
             currentPathRects.push({ x, y, width: w, height: h });
             cIdx += 4;
           }
        }
      }

      if (xCoords.length >= 4) {
        const minX = Math.min(...xCoords);
        const maxX = Math.max(...xCoords);
        const minY = Math.min(...yCoords);
        const maxY = Math.max(...yCoords);
        const w = maxX - minX;
        const h = maxY - minY;
        
        if (w > 0 && h > 0) {
           currentPathRects.push({ x: minX, y: minY, width: w, height: h });
        }
      }
    }

    // --- Painting ---

    // Fill (f, F, f*)
    else if (fn === OPS.fill || fn === OPS.eoFill) {
      for (const rect of currentPathRects) {
        console.log(`[Geometry] Found Filled Rect: W=${rect.width.toFixed(2)} H=${rect.height.toFixed(2)} at (${rect.x.toFixed(2)},${rect.y.toFixed(2)}) Color: [${currentFillColor.map(c=>Math.round(c*255)).join(',')}]`);
        foundRects.push({ ...rect, color: [...currentFillColor] });
      }
      currentPathRects = [];
    }
    // Stroke (S, s)
    else if (fn === OPS.stroke) {
      for (const rect of currentPathRects) {
         // console.log(`[Geometry] Found Stroked Rect: W=${rect.width.toFixed(2)} H=${rect.height.toFixed(2)} at (${rect.x.toFixed(2)},${rect.y.toFixed(2)}) Color: [${currentStrokeColor.map(c=>Math.round(c*255)).join(',')}]`);
         foundRects.push({ ...rect, color: [...currentStrokeColor] });
      }
      currentPathRects = [];
    }
    // Fill & Stroke (B, b, B*, b*)
    else if (fn === OPS.fillStroke || fn === OPS.eoFillStroke || fn === OPS.closeFillStroke || fn === OPS.closeEOFillStroke) {
      for (const rect of currentPathRects) {
        console.log(`[Geometry] Found FillStroked Rect: W=${rect.width.toFixed(2)} H=${rect.height.toFixed(2)} at (${rect.x.toFixed(2)},${rect.y.toFixed(2)}) FillColor: [${currentFillColor.map(c=>Math.round(c*255)).join(',')}] StrokeColor: [${currentStrokeColor.map(c=>Math.round(c*255)).join(',')}]`);
        // Add as filled rect (primary interest for measures)
        foundRects.push({ ...rect, color: [...currentFillColor] });
      }
      currentPathRects = [];
    }
    // End Path (n)
    else if (fn === OPS.endPath) {
      currentPathRects = [];
    }
  }
  
  // Filter out very small rectangles (noise)
  return foundRects.filter(r => r.width > 5 && r.height > 5);
}
