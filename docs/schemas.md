# Daten-Schemas (Zod)

Diese Dokumentation beschreibt die Datenstrukturen, die für die Extraktion und Strukturierung von Informationen aus Vegetationspflegeplänen verwendet werden.

**Single Source of Truth:** Die definitiven Schemas sind im Code in [`src/models/index.ts`](../src/models/index.ts) definiert. Wir nutzen [Zod](https://zod.dev/) für die Laufzeit-Validierung.

## 1. PDF-Plan-Info (`PlanInfo`)

Metadaten und administrative Informationen vom Deckblatt oder Plankopf.

| Feld | Typ | Beschreibung |
| :--- | :--- | :--- |
| `planId` | `string` | Generierte ID (z.B. `4113_Limburg-Weilburg_0003_9_16_111024`). |
| `planType` | `'BMP' \| 'ÖTM'` | Typ des Plans (Amprion vs. Westnetz). |
| `betreiber` | `Enum` | Netzbetreiber (z.B. Westnetz, Amprion, RWE). |
| `beschreibung` | `string` | Beschreibung der Leitung. |
| `bl` | `string` | Bauleitnummer (z.B. "2449"). |
| `mastbereich` | `{ start: string, end: string }` | Start- und Endmast des Abschnitts. |
| `blatt` | `string` | Blattnummer (z.B. "0010"). |
| `ausgabe` | `string` | Ausgabedatum (Format: DDMMYY). |
| ... | ... | *Siehe `PlanInfoSchema` in `src/models/index.ts` für alle Felder.* |

## 2. Maßnahmen (`Massnahme`)

Vegetationspflegemaßnahmen, die auf den Kartenausschnitten als farbige Rechtecke markiert sind.

| Feld | Typ | Beschreibung |
| :--- | :--- | :--- |
| `peId` | `string` | ID der Maßnahme auf dem Plan (z.B. "0.1"). |
| `type` | `string` | Art der Maßnahme (z.B. "Einzelentnahme", "Mulchen"). |
| `aufarbeitung` | `string` | Art der Aufarbeitung (z.B. "Astwerk Häckseln"). |
| `fläche_m2` | `number` | Fläche in m². |
| `rectangle` | `Rectangle` | Koordinaten auf dem Plan (`x, y, width, height`). |
| `confidence` | `number` | Vertrauenswert der Extraktion (0-100). |
| ... | ... | *Siehe `MassnahmeSchema` in `src/models/index.ts` für alle Felder.* |

## 3. Masten (`Mast`)

Mast-Objekte, die auf den Kartenausschnitten identifiziert wurden.

| Feld | Typ | Beschreibung |
| :--- | :--- | :--- |
| `mastId` | `string` | Mastnummer (z.B. "0015"). |
| `symbol_rectangle` | `Rectangle` | Position des Mast-Symbols. |
| `text_rectangle` | `Rectangle` | Position der Mast-Nummer. |
| `confidence` | `number` | Vertrauenswert (0-100). |

## Shared Types

### Rectangle
```typescript
{
  x: number;
  y: number;
  width: number;
  height: number;
}
```

### Geometry (GeoJSON Point)
```typescript
{
  type: 'Point';
  coordinates: [number, number] | [number, number, number]; // Longitude, Latitude, [Elevation]
}
```
