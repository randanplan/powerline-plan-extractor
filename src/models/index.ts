import { z } from 'zod';

// --- Shared Types ---

export const RectangleSchema = z.object({
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
});

export const GeometrySchema = z.object({
  type: z.literal('Point'),
  coordinates: z.array(z.number().nullable()).min(2).max(3),
});

// --- PDF Plan Info Schema ---

export const PlanInfoSchema = z.object({
  planId: z.string().optional(), // Generated later
  planType: z.enum(['BMP', 'ÖTM']).optional(),
  betreiber: z.enum(['Westnetz', 'Rhein Energie', 'Rheinische Netzgesellschaft', 'RWE', 'RWE Power', 'Amprion']),
  beschreibung: z.string(),
  bl: z.string(),
  mastbereich: z.object({
    start: z.string(),
    end: z.string(),
  }),
  ltg_name: z.string().optional(),
  abschnitt: z.string().optional(),
  region: z.string(),
  losId: z.enum(['2006', '2008', '2009']).nullable().optional(),
  losName: z.enum(['Köln', 'Düsseldorf-Neuss', 'Mönchengladbach-Grevenbroich']).nullable().optional(),
  projekt: z.string().nullable().optional(),
  blatt: z.string(),
  referenzplan: z.string(),
  ausgabe: z.string(),
  maßstab: z.string().optional(),
  gemarkung: z.array(z.string()).optional(),
  gemeinde: z.array(z.string()).optional(),
  verbandsgemeinde: z.array(z.string()).optional(),
  kreis: z.array(z.string()).optional(),
  reg_bezirk: z.array(z.string()).optional(),
  land: z.array(z.string()).optional(),
});

export type PlanInfo = z.infer<typeof PlanInfoSchema>;

// --- Maßnahmen Schema ---

export const MassnahmeSchema = z.object({
  peId: z.string(),
  type: z.enum([
    'Einzelentnahme',
    'Einzelentnahme 20 cm bis 40 cm',
    'Einzelentnahme 41 cm bis 60 cm',
    'Kroneneinkürzung',
    'Kronenrückschnitt',
    'Entbuschen',
    'Durchforsten',
    'Auf den Stock setzen',
    'Heckenschnitt',
    'Mulchen',
    'Geh- und Fahrweg (Mulchstreifen)',
    'Standortpflege Mast',
    'Standortpflege unter Traversen',
    // Allow other strings as fallback
  ]).or(z.string()), 
  aufarbeitung: z.enum([
    'Standard',
    'Astwerk Häckseln',
    'Astwerk Häckseln & Stammholz Meter',
    'Astwerk Häckseln & Stammholz nach Vorgabe zuschneiden',
    'Astwerk Häckseln & Stammholz nach Vorgabe rücken und zuschneiden',
    'Astwerk Standard',
    'Astwerk Standard & Stammholz Meter',
    'Astwerk Standard & Stammholz nach Vorgabe zuschneiden',
    'Astwerk Standard & Stammholz nach Vorgabe rücken und zuschneiden',
    'Astwerk Abfahren',
    'Astwerk & Stammholz Abfahren',
  ]).or(z.string()),
  fläche_m2_gesamt: z.number().nullable().optional(),
  fläche_m2: z.number().nullable().optional(),
  prozent: z.number().nullable().optional(),
  anzahl_stk: z.number().int().nullable().optional(),
  details: z.string(),
  bl_nr: z.string().nullable().optional(),
  mast_nr: z.string().nullable().optional(),
  kontakt: z.string().nullable().optional(),
  confidence: z.number().min(0).max(100),
  rectangle: RectangleSchema,
  geometry: GeometrySchema.optional(), // Optional because it's added later
});

export type Massnahme = z.infer<typeof MassnahmeSchema>;

// --- Masten Schema ---

export const MastSchema = z.object({
  mastId: z.string(),
  bl_nr: z.string().nullable().optional(),
  symbol_rectangle: RectangleSchema,
  text_rectangle: RectangleSchema,
  confidence: z.number().min(0).max(100),
  geometry: GeometrySchema.optional(), // Optional because it's added later
});

export type Mast = z.infer<typeof MastSchema>;
