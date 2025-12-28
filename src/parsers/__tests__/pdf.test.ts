// src/parsers/__tests__/pdf.test.ts
import { parsePdfPlan, parseFilename, padMastNumber } from '../pdf';
import * as path from 'path';
import { getDocument, OPS } from 'pdfjs-dist';

// Mock the pdfjs-dist module
jest.mock('pdfjs-dist', () => ({
  getDocument: jest.fn(),
  GlobalWorkerOptions: {
    workerSrc: '',
  },
  OPS: {
    setFillRGBColor: 1,
    setFillCMYKColor: 2,
    setFillGray: 3,
    rectangle: 4,
    fill: 6,
    eoFill: 7,
    stroke: 8,
    endPath: 9,
    constructPath: 10
  }
}));

describe('PDF Parser Utilities', () => {
  
  describe('padMastNumber', () => {
    it('should pad standard numbers to 4 digits', () => {
      expect(padMastNumber('15')).toBe('0015');
      expect(padMastNumber('102')).toBe('0102');
      expect(padMastNumber('1003')).toBe('1003');
    });

    it('should preserve suffixes', () => {
      expect(padMastNumber('35A')).toBe('0035A');
      expect(padMastNumber('7A')).toBe('0007A');
    });

    it('should handle Portal Masts (P-Prefix)', () => {
      expect(padMastNumber('P1')).toBe('P001');
      expect(padMastNumber('P12')).toBe('P012');
      expect(padMastNumber('P100')).toBe('P100');
    });
  });

  describe('parseFilename', () => {
    it('should parse valid BMP filenames', () => {
      const result = parseFilename('4113_Limburg-Weilburg_0004_15_20.pdf');
      expect(result).toEqual({
        planType: 'BMP',
        bl: '4113',
        region: 'Limburg-Weilburg',
        blatt: '0004',
        mastbereich: { start: '0015', end: '0020' },
        betreiber: 'Amprion'
      });
    });

    it('should parse valid ÖTM filenames', () => {
      const result = parseFilename('ÖTM-2006 Köln-0008.PDF');
      expect(result).toEqual({
        planType: 'ÖTM',
        losId: '2006',
        losName: 'Köln',
        blatt: '0008',
        betreiber: 'Westnetz'
      });
    });

    it('should return null for invalid filenames', () => {
      expect(parseFilename('invalid_file.pdf')).toBeNull();
      expect(parseFilename('Mengengeruest.xlsx')).toBeNull();
    });
  });
});

describe('parsePdfPlan', () => {
  it('should extract text and geometry from defined boxes', async () => {
    // Arrange
    const mockGetTextContent = jest.fn().mockResolvedValue({
      items: [
        // Item in Map Box (Left side)
        { str: 'MapData', transform: [1, 0, 0, 1, 100, 100], width: 50, height: 10 },
        // Item in Info Box (Right side, assuming width=2000)
        // Info starts at width - 524.6 = 1475.4
        { str: 'MetaData', transform: [1, 0, 0, 1, 1500, 100], width: 50, height: 10 },
      ],
    });
    
    const mockGetViewport = jest.fn().mockReturnValue({
      width: 2000,
      height: 1000,
    });

    // Mock Operator List for Geometry
    // Sequence: SetColor(Red) -> Rect(100,100,50,50) -> Fill
    const mockGetOperatorList = jest.fn().mockResolvedValue({
      fnArray: [
        OPS.setFillRGBColor, 
        OPS.rectangle, 
        OPS.fill
      ],
      argsArray: [
        [1, 0, 0], // Red
        [100, 100, 50, 50], // x, y, w, h (Inside Map Box)
        []
      ]
    });

    const mockGetPage = jest.fn().mockResolvedValue({
      getTextContent: mockGetTextContent,
      getViewport: mockGetViewport,
      getOperatorList: mockGetOperatorList
    });

    const mockPdfDocument = {
      numPages: 1,
      getPage: mockGetPage,
    };

    (getDocument as jest.Mock).mockReturnValue({
      promise: Promise.resolve(mockPdfDocument),
    });

    const samplePdfPath = '4113_Test_0001_10_20.pdf';

    // Act
    const result = await parsePdfPlan(samplePdfPath);

    // Assert
    expect(result.metadata.rawText).toContain('MetaData');
    expect(result.map.rawText).toContain('MapData');
    expect(result.metadata.bl).toBe('4113'); // From filename
    
    // Check Geometry
    expect(result.map.measures).toBeDefined();
    expect(result.map.measures.length).toBe(1);
    expect(result.map.measures[0]).toEqual({
      x: 100,
      y: 100,
      width: 50,
      height: 50,
      color: [1, 0, 0]
    });
  });
});

