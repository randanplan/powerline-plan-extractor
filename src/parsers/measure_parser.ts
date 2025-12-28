import { Massnahme, MassnahmeSchema } from '../models';

// Known keywords for parsing
const TYPES = [
  'Einzelentnahme',
  'Kronenrückschnitt',
  'Kroneneinkürzung',
  'Entbuschen',
  'Durchforsten',
  'Auf den Stock setzen',
  'Heckenschnitt',
  'Mulchen',
  'Geh- und Fahrweg',
  'Standortpflege Mast',
  'Standortpflege unter Traversen'
];

const AUFARBEITUNG = [
  'Astwerk Häckseln & Stammholz Meter',
  'Astwerk Häckseln & Stammholz nach Vorgabe zuschneiden',
  'Astwerk Häckseln & Stammholz nach Vorgabe rücken und zuschneiden',
  'Astwerk Standard & Stammholz Meter',
  'Astwerk Standard & Stammholz nach Vorgabe zuschneiden',
  'Astwerk Standard & Stammholz nach Vorgabe rücken und zuschneiden',
  'Astwerk & Stammholz Abfahren',
  'Astwerk Häckseln',
  'Astwerk Standard',
  'Astwerk Abfahren',
  'Standard'
];

export function parseMeasureText(text: string, rect: any): Partial<Massnahme> {
  let cleanText = text.replace(/\s+/g, ' ').trim();
  
  const result: Partial<Massnahme> = {
    rectangle: rect,
    confidence: 100,
    details: ''
  };

  // 1. Extract peId (Pos X.Y or just X.Y)
  // Regex: (?:Pos\.?|Position)?\s*(\d+\.\d+)
  const peIdMatch = cleanText.match(/(?:Pos\.?|Position)?\s*(\d+\.\d+)/i);
  if (peIdMatch) {
    result.peId = peIdMatch[1];
    // Remove the ID from text to avoid confusion, but keep original for details if needed
    // Actually, better to keep the text intact for context, but mark where we found things.
  } else {
    // Fallback: Try to find just a number at the start?
    // For now, require X.Y
    result.peId = "UNKNOWN"; 
    result.confidence = 50;
  }

  // 2. Extract Percentage (X %)
  const percentMatch = cleanText.match(/(\d+)\s*%/);
  if (percentMatch) {
    result.prozent = parseInt(percentMatch[1], 10);
  }

  // 3. Extract Count (X [stk] or X Stk or X Kronenrückschnitte)
  // We also look for "X Kronenrückschnitte" because sometimes the unit is the type itself.
  const countMatch = cleanText.match(/(\d+)\s*(?:\[stk\]|Stk|Stück|Kronenrückschnitte)/i);
  if (countMatch) {
    result.anzahl_stk = parseInt(countMatch[1], 10);
  }

  // 4. Extract Type
  // Sort types by length descending to match longest first
  let matchedTypeString = '';
  const sortedTypes = [...TYPES].sort((a, b) => b.length - a.length);
  for (const type of sortedTypes) {
    if (cleanText.includes(type)) {
      // Special handling for Kronenrückschnitt(e) to avoid leaving an 'e'
      if (type === 'Kronenrückschnitt' && cleanText.includes('Kronenrückschnitte')) {
          result.type = 'Kronenrückschnitt';
          matchedTypeString = 'Kronenrückschnitte';
      } else {
          result.type = type;
          matchedTypeString = type;
      }
      break;
    }
  }
  // Fallback for plural "Kronenrückschnitte" -> "Kronenrückschnitt" if not caught above
  if (!result.type && cleanText.includes('Kronenrückschnitte')) {
      result.type = 'Kronenrückschnitt';
      matchedTypeString = 'Kronenrückschnitte';
  }

  // 5. Extract Aufarbeitung
  const sortedAufarbeitung = [...AUFARBEITUNG].sort((a, b) => b.length - a.length);
  for (const auf of sortedAufarbeitung) {
    if (cleanText.includes(auf)) {
      result.aufarbeitung = auf;
      break;
    }
  }

  // 6. Details
  // Everything that is not ID, Type, Percent, Count, Aufarbeitung is potentially details.
  let details = cleanText;
  if (result.peId && peIdMatch) details = details.replace(peIdMatch[0], '');
  if (matchedTypeString) details = details.replace(matchedTypeString, '');
  if (result.aufarbeitung) details = details.replace(result.aufarbeitung, '');
  if (percentMatch) details = details.replace(percentMatch[0], '');
  
  if (countMatch) {
      // Remove the number
      details = details.replace(countMatch[1], '');
      // Remove common unit strings if they remain
      details = details.replace(/\[stk\]/gi, '');
      details = details.replace(/Stk\.?/gi, '');
      details = details.replace(/Stück/gi, '');
  }
  
  // Clean up artifacts
  details = details.replace(/Pos\.?/i, '')
                   .replace(/\[stk\]/gi, '')
                   .replace(/\s+/g, ' ')
                   .trim();
                   
  // Remove leading numbers that might be artifacts (like "267" from the example)
  // But be careful not to remove street names or similar.
  // The example had "267 Pos 0.2 348".
  
  result.details = details;

  return result;
}
