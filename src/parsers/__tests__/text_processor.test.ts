import { parseMetadataText } from '../text_processor';

describe('Metadata Text Processor', () => {
  it('should extract standard fields', () => {
    const rawText = `
      Projekt: 01080
      Blatt: 0004
      Ausgabe: 15.03.2024
      Maßstab: 1:2000
      Gemarkung: Limburg, Weilburg
      Gemeinde: Limburg a.d. Lahn
      Kreis: Limburg-Weilburg
      Reg.-Bez.: Gießen
      Land: Hessen
    `;

    const result = parseMetadataText(rawText);

    expect(result.projekt).toBe('01080');
    expect(result.ausgabe).toBe('15.03.2024');
    expect(result.maßstab).toBe('1:2000');
    expect(result.gemarkung).toEqual(['Limburg', 'Weilburg']);
    expect(result.gemeinde).toEqual(['Limburg a.d. Lahn']);
    expect(result.kreis).toEqual(['Limburg-Weilburg']);
    expect(result.reg_bezirk).toEqual(['Gießen']);
    expect(result.land).toEqual(['Hessen']);
  });

  it('should handle variations in labels', () => {
    const rawText = `
      Projekt-Nr.: 12345
      Datum: 01.01.2023
      M 1:500
    `;

    const result = parseMetadataText(rawText);

    expect(result.projekt).toBe('12345');
    expect(result.ausgabe).toBe('01.01.2023');
    expect(result.maßstab).toBe('1:500');
  });

  it('should handle missing fields gracefully', () => {
    const rawText = "Just some random text";
    const result = parseMetadataText(rawText);
    expect(result).toEqual({});
  });
});
