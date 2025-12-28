import { PlanInfo } from '../models';

/**
 * Extracts specific metadata fields from the raw text content of the Plan-Info block.
 * Uses Regex patterns to find key-value pairs.
 */
export function parseMetadataText(rawText: string): Partial<PlanInfo> {
  const result: Partial<PlanInfo> = {};

  // Helper to extract simple regex matches
  const extract = (pattern: RegExp): string | undefined => {
    const match = rawText.match(pattern);
    return match ? match[1].trim() : undefined;
  };

  // Helper to extract array lists (comma separated)
  const extractArray = (pattern: RegExp): string[] | undefined => {
    const match = rawText.match(pattern);
    if (match && match[1]) {
      return match[1].split(',').map(s => s.trim()).filter(s => s.length > 0);
    }
    return undefined;
  };

  // --- Extraction Logic ---

  // Projekt (e.g., "Projekt: 01080" or "Projekt-Nr.: 01080")
  // Put longer match first
  const projekt = extract(/(?:Projekt-Nr\.?|Projekt)\s*[:.]?\s*(\S+)/i);
  if (projekt) result.projekt = projekt;

  // Ausgabe / Datum (e.g., "Ausgabe: 15.03.2024" or just a date at the end)
  // Looking for standard German date format dd.mm.yyyy
  const ausgabe = extract(/(?:Ausgabe|Datum|Stand)\s*[:.]?\s*(\d{2}\.\d{2}\.\d{4})/i);
  if (ausgabe) result.ausgabe = ausgabe;

  // Maßstab (e.g., "M 1:2000" or "Maßstab 1:2.000")
  const massstab = extract(/(?:Maßstab|M)\s*[:.]?\s*(1\s*:\s*[\d.]+)/i);
  if (massstab) result.maßstab = massstab.replace(/\./g, ''); // Remove thousands separators if any

  // Administrative Regions (often labeled)
  
  // Gemarkung
  const gemarkung = extractArray(/(?:Gemarkung|Gemarkungen)\s*[:.]?\s*([^:\n]+)/i);
  if (gemarkung) result.gemarkung = gemarkung;

  // Gemeinde
  const gemeinde = extractArray(/(?:Gemeinde|Gemeinden)\s*[:.]?\s*([^:\n]+)/i);
  if (gemeinde) result.gemeinde = gemeinde;

  // Kreis / Landkreis
  const kreis = extractArray(/(?:Kreis|Landkreis)\s*[:.]?\s*([^:\n]+)/i);
  if (kreis) result.kreis = kreis;

  // Regierungsbezirk
  const regBezirk = extractArray(/(?:Regierungsbezirk|Reg\.-Bez\.|Bezirk)\s*[:.]?\s*([^:\n]+)/i);
  if (regBezirk) result.reg_bezirk = regBezirk;

  // Land (Bundesland)
  const land = extractArray(/(?:Land|Bundesland)\s*[:.]?\s*([^:\n]+)/i);
  if (land) result.land = land;

  // Beschreibung (often the first line or labeled)
  // This is harder to extract generically without seeing the layout order.
  // For now, we might leave it or try to find a "Leitung:" or similar prefix.
  const beschreibung = extract(/(?:Leitung|Trasse|Beschreibung)\s*[:.]?\s*([^:\n]+)/i);
  if (beschreibung) result.beschreibung = beschreibung;

  return result;
}
