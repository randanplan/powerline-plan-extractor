# Schemas für Vegetationspflegepläne (docs/schemas.md)

Diese Dokumentation beschreibt die JSON-Schemata, die für die Extraktion und Strukturierung von Informationen aus Vegetationspflegeplänen für Hochspannungsleitungen verwendet werden. Es gibt zwei Hauptschemata:

1. **PDF-Plan-Info Schema**: Beschreibt die Metadaten und administrativen Informationen, die typischerweise auf dem Deckblatt eines Plans zu finden sind.
2. **Maßnahmen Schema**: Beschreibt die einzelnen Vegetationspflegemaßnahmen, die auf den Kartenausschnitten des Plans detailliert sind.
3. **Masten Schema**: Beschreibt die einzelnen Mast-Objekte, die auf den Kartenausschnitten des Plans identifiziert werden können.

---

## 1. PDF-Plan-Info Schema

Dieses Schema dient der Extraktion von allgemeinen Informationen und Metadaten eines Vegetationspflegeplans. Diese Daten stammen in der Regel vom Deckblatt oder dem Plankopf.

**Dateiname:** [`schema/planinfo_schema.json`](../schema/planinfo_schema.json)

```json
{
  "type": "object",
  "description": "Informationen zu einem Vegetationspflegeplan (BMP-/ÖTM-Plan) für Hochspannungsleitungen",
  "properties": {
    "planId": {
      "type": "string",
      "description": "Eindeutige PDF-Plan-ID (z.B. '4113_Limburg-Weilburg_0003_9_16_111024'). Eine generierte ID, die wichtige Metadaten des Plans zusammenfasst."
    },
    "planType": {
      "type": "string",
      "description": "Typ des Plans, je nachdem von welchem Betreiber der Plan stammt. 'BMP' (Biotopmanagementplan) oder 'ÖTM' (Ökologischer Trassenmanagementplan). Im Dateinamen ist oft ein 'OETM' oder 'ÖTM' enthalten.",
      "enum": [
        "BMP",
        "ÖTM"
      ]
    },
    "betreiber": {
      "type": "string",
      "description": "Name des Betreibers der Hochspannungsleitung.",
      "enum": [
        "Westnetz",
        "Rhein Energie",
        "Rheinische Netzgesellschaft",
        "RWE",
        "RWE Power",
        "Amprion"
      ]
    },
    "beschreibung": {
      "type": "string",
      "description": "Detaillierte Beschreibung der Hochspannungsleitung, oft inklusive Spannungsebenen (z.B. '110-/220-/380-kV-Höchstspannungsfreileitung ...')."
    },
    "bl": {
      "type": "string",
      "description": "Bauleit-Nummer der Stromleitung (z.B. 'BL 2449'). Es wird empfohlen, nur die Zahl als String zu speichern, z.B. '2449'."
    },
    "mastbereich": {
      "type": "object",
      "description": "Definierter Start- und End-Mast des im Plan behandelten Abschnitts, wie auf dem Deckblatt angegeben. Zusätzliche Angaben wie 'Po' (Portal im Umspannwerk) oder Verweise auf andere BL-Nummern werden ignoriert.",
      "properties": {
        "start": {
          "type": "string",
          "description": "Start Mast als String. Sollte auf 4 Stellen mit voranstehenden Nullen aufgefüllt werden, mit optionalen Buchstaben (z.B. '28' -> '0028', '28A' -> '028A')."
        },
        "end": {
          "type": "string",
          "description": "End Mast als String. Sollte auf 4 Stellen mit voranstehenden Nullen aufgefüllt werden, mit optionalen Buchstaben (z.B. '31' -> '0031', '35A' -> '035A')."
        }
      },
      "required": [
        "start",
        "end"
      ]
    },
    "ltg_name": {
      "type": "string",
      "description": "Name der Hochspannungsleitung (z.B. 'St. Tönis - Osterath'). Manchmal identisch mit der Beschreibung."
    },
    "abschnitt": {
      "type": "string",
      "description": "Name des spezifischen Abschnitts der Leitung (z.B. 'Pkt. Schreckenend - Osterath')."
    },
    "region": {
      "type": "string",
      "description": "Region oder Kreis, in dem der Plan gültig ist (z.B. 'Rhein-Lahn-Kreis')."
    },
    "losId": {
      "type": "string",
      "description": "Los-ID, falls vorhanden. Tritt bei ÖTM-Plänen auf (z.B. 'Los 2006 Köln' -> '2006').",
      "enum": [
        "2006",
        "2008",
        "2009"
      ],
      "nullable": true
    },
    "losName": {
      "type": "string",
      "description": "Los-Name, falls vorhanden. Tritt bei ÖTM-Plänen auf (z.B. 'Los 2006 Köln' -> 'Köln').",
      "enum": [
        "Köln",
        "Düsseldorf-Neuss",
        "Mönchengladbach-Grevenbroich"
      ],
      "nullable": true
    },
    "projekt": {
      "type": "string",
      "description": "Projekt-Nummer, falls vorhanden. Tritt bei BMP-Plänen auf (z.B. 'Projekt 01080' -> '01080').",
      "nullable": true
    },
    "blatt": {
      "type": "string",
      "description": "Blattnummer des aktuellen Plans. Sollte auf 4 Stellen mit voranstehenden Nullen aufgefüllt werden (z.B. '10' -> '0010')."
    },
    "referenzplan": {
      "type": "string",
      "description": "Nummer des Referenzplans (z.B. 'LP23880006'), zu finden hinter 'Referenzplan: xxxxxxxx'."
    },
    "ausgabe": {
      "type": "string",
      "description": "Datum der letzten Ausgabe im Format DDMMYY (z.B. 'AUSGABE: 11.10.24 11:26:07' -> '111024')."
    },
    "maßstab": {
      "type": "string",
      "description": "Maßstab des Plans (z.B. '1:2000')."
    },
    "gemarkung": {
      "type": "array",
      "description": "Liste der Gemarkungen, die auf dem Blatt aufgeführt sind (z.B. 'KÖLN'). Die Werte sollten in Großbuchstaben gespeichert werden. Es können mehrere vorhanden sein.",
      "items": {
        "type": "string"
      }
    },
    "gemeinde": {
      "type": "array",
      "description": "Liste der Gemeinden, die auf dem Blatt aufgeführt sind (z.B. 'Wesseling'). Es können mehrere vorhanden sein.",
      "items": {
        "type": "string"
      }
    },
    "verbandsgemeinde": {
      "type": "array",
      "description": "Liste der Verbandsgemeinden, die auf dem Blatt aufgeführt sind (z.B. 'Köln, Stadt'). Es können mehrere vorhanden sein.",
      "items": {
        "type": "string"
      }
    },
    "kreis": {
      "type": "array",
      "description": "Liste der Kreise, die auf dem Blatt aufgeführt sind (z.B. 'Rhein-Sieg-Kreis'). Es können mehrere vorhanden sein.",
      "items": {
        "type": "string"
      }
    },
    "reg_bezirk": {
      "type": "array",
      "description": "Liste der Regierungsbezirke, die auf dem Blatt aufgeführt sind (z.B. 'Köln'). Es können mehrere vorhanden sein.",
      "items": {
        "type": "string"
      }
    },
    "land": {
      "type": "array",
      "description": "Liste der Länder, die auf dem Blatt aufgeführt sind (z.B. 'Nordrhein-Westfalen'). Es können mehrere vorhanden sein.",
      "items": {
        "type": "string"
      }
    }
  },
  "required": [
    "betreiber",
    "beschreibung",
    "bl",
    "mastbereich",
    "region",
    "blatt",
    "referenzplan",
    "ausgabe"
  ]
}
```

---

## 2. Maßnahmen Schema

Dieses Schema beschreibt die einzelnen Vegetationspflegemaßnahmen, die in farblich gekennzeichneten Rechtecken auf den Kartenausschnitten der Pläne dargestellt und beschrieben werden.

**Dateiname:** [`schema/massnahmen_schema.json`](../schema/massnahmen_schema.json)

```json
{
  "type": "array",
  "description": "Liste aller Pflegeplan-Maßnahmen, die auf einem Kartenausschnitt einer Stromtrasse abgebildet sind. Maßnahmen sind in farblichen Rechtecken beschrieben.",
  "items": {
    "type": "object",
    "description": "Einzelne Pflegeplan-Maßnahme",
    "properties": {
      "peId": {
        "type": "string",
        "description": "ID der Maßnahme, oben im Rechteck zu finden (z.B. '0.1' oder '10.2'). Dient als eindeutiger Identifikator innerhalb des Blattes."
      },
      "type": {
        "type": "string",
        "description": "Art der Maßnahme (z.B. 'Einzelentnahme', 'Standortpflege Mast').",
        "enum": [
          "Einzelentnahme",
          "Einzelentnahme 20 cm bis 40 cm",
          "Einzelentnahme 41 cm bis 60 cm",
          "Kroneneinkürzung",
          "Kronenrückschnitt",
          "Entbuschen",
          "Durchforsten",
          "Auf den Stock setzen",
          "Heckenschnitt",
          "Mulchen",
          "Geh- und Fahrweg (Mulchstreifen)",
          "Standortpflege Mast",
          "Standortpflege unter Traversen"
        ]
      },
      "aufarbeitung": {
        "type": "string",
        "description": "Art der Aufarbeitung des entnommenen Materials (z.B. 'Standard', 'Astwerk häckseln').",
        "enum": [
          "Standard",
          "Astwerk Häckseln",
          "Astwerk Häckseln & Stammholz Meter",
          "Astwerk Häckseln & Stammholz nach Vorgabe zuschneiden",
          "Astwerk Häckseln & Stammholz nach Vorgabe rücken und zuschneiden",
          "Astwerk Standard",
          "Astwerk Standard & Stammholz Meter",
          "Astwerk Standard & Stammholz nach Vorgabe zuschneiden",
          "Astwerk Standard & Stammholz nach Vorgabe rücken und zuschneiden",
          "Astwerk Abfahren",
          "Astwerk & Stammholz Abfahren"
        ]
      },
      "fläche_m2_gesamt": {
        "description": "Die auf dem Plan angegebene Gesamtfläche in Quadratmetern, bei flächenbezogenen Maßnahmen (z.B. '4186m²' für Durchforsten).",
        "type": "number",
        "nullable": true
      },
      "fläche_m2": {
        "description": "Die berechnete oder bearbeitete Fläche in Quadratmetern, oft hinter einer Prozentangabe (z.B. '33% - 1381m²' -> 1381m²). Nur bei flächenbezogenen Maßnahmen.",
        "type": "number",
        "nullable": true
      },
      "prozent": {
        "type": "number",
        "description": "Der prozentuale Anteil der Bearbeitung ('100%' | '50%'), steht vor der Flächenangabe, bei flächenbezogenen Maßnahmen.",
        "nullable": true
      },
      "anzahl_stk": {
        "type": "integer",
        "description": "Die angegebene Stückzahl ('5 Einzelentnahme...'), bei Einzel- oder Kronen-Maßnahmen.",
        "nullable": true
      },
      "details": {
        "type": "string",
        "description": "Wichtige Informationen zur Durchführung der Maßnahme als Freitext (z.B. spezifische Baumarten wie 'Ahorn, Haselnuss, Kirsche', oder besondere Anweisungen)."
      },
      "bl_nr": {
        "type": "string",
        "nullable": true,
        "description": "Bauleit-Nummer der Stromleitung BL als 4-stelliger String (z.B. 'BL 4511' -> '4511'), meistens bei Standortpflege-Maßnahmen."
      },
      "mast_nr": {
        "type": "string",
        "nullable": true,
        "description": "Mastnummer als 4-stelliger String, mit voranstehenden Nullen aufgefüllt, + optionale Buchstaben (z.B. 'Mast 23' -> '0023', 'Mast 35A' -> '035A'), meistens bei Standortpflege-Maßnahmen."
      },
      "kontakt": {
        "type": "string",
        "nullable": true,
        "description": "Informationen zur Kontaktperson (Name, Telefon, E-Mail, etc.), falls relevant für die Maßnahme."
      },
      "confidence": {
        "type": "number",
        "description": "Geschätzter Vertrauenswert (0-100) für die Genauigkeit der extrahierten Daten dieser Maßnahme."
      },
      "rectangle": {
        "type": "object",
        "description": "Die Koordinaten des Rechtecks im Bild (in Pixeln), in dem die Maßnahme (das Beschreibungsfeld) gefunden wurde.",
        "properties": {
          "x": { "type": "number", "description": "X-Koordinate der oberen linken Ecke" },
          "y": { "type": "number", "description": "Y-Koordinate der oberen linken Ecke" },
          "width": { "type": "number", "description": "Breite des Rechtecks" },
          "height": { "type": "number", "description": "Höhe des Rechtecks" }
        },
        "required": ["x", "y", "width", "height"]
      },
      "geometry": {
        "type": "object",
        "description": "GeoJSON-Punkt-Geometrie des Mittelpunkts oder eines Referenzpunkts der Maßnahme auf der Karte. Dieser Punkt muss manuell oder durch Georeferenzierung hinzugefügt werden.",
        "properties": {
          "type": { "type": "string", "enum": ["Point"] },
          "coordinates": {
            "type": "array",
            "description": "Koordinaten der Geometrie [Longitude, Latitude]",
            "items": { "type": "number", "nullable": true },
            "minItems": 2,
            "maxItems": 3
          }
        },
        "required": ["type", "coordinates"]
      }
    },
    "required": [
      "peId",
      "type",
      "aufarbeitung",
      "details",
      "confidence",
      "rectangle"
    ]
  }
}
```

---

## 3. Masten Schema

Dieses Schema beschreibt die einzelnen Masten, die auf den Kartenausschnitten des Plans identifiziert werden können. Es erfasst sowohl die textuellen Informationen (Mastnummer) als auch deren visuelle Position auf der Karte.

**Dateiname:** [`schema/masten_schema.json`](../schema/masten_schema.json)

```json
{
  "type": "array",
  "description": "Liste der Masten, die auf dem Kartenausschnitt des Plans sichtbar sind.",
  "items": {
    "type": "object",
    "description": "Einzelnes Mastobjekt auf der Karte",
    "properties": {
      "mastId": {
        "type": "string",
        "description": "Die Mastnummer, die auf der Karte abgebildet ist. Sollte auf 4 Stellen mit voranstehenden Nullen aufgefüllt werden, mit optionalen Buchstaben (z.B. '38' -> '0038', '38A' -> '038A')."
      },
      "bl_nr": {
        "type": "string",
        "nullable": true,
        "description": "Die Bauleit-Nummer als 4-stelliger String (z.B. 'BL 4511' -> '4511'), zu der der Mast gehört, falls diese explizit am Mast vermerkt ist (z.B. '36(2388)' -> '2388')."
      },
      "symbol_rectangle": {
        "type": "object",
        "description": "Die Koordinaten des Rechtecks im Bild (in Pixeln), das das Mastsymbol (Kästchen mit Kreuz) umschließt.",
        "properties": {
          "x": { "type": "number", "description": "X-Koordinate der oberen linken Ecke" },
          "y": { "type": "number", "description": "Y-Koordinate der oberen linken Ecke" },
          "width": { "type": "number", "description": "Breite des Rechtecks" },
          "height": { "type": "number", "description": "Höhe des Rechtecks" }
        },
        "required": ["x", "y", "width", "height"]
      },
      "text_rectangle": {
        "type": "object",
        "description": "Die Koordinaten des Rechtecks im Bild (in Pixeln), das die Mastnummer (Text) umschließt.",
        "properties": {
          "x": { "type": "number", "description": "X-Koordinate der oberen linken Ecke" },
          "y": { "type": "number", "description": "Y-Koordinate der oberen linken Ecke" },
          "width": { "type": "number", "description": "Breite des Rechtecks" },
          "height": { "type": "number", "description": "Höhe des Rechtecks" }
        },
        "required": ["x", "y", "width", "height"]
      },
      "confidence": {
        "type": "number",
        "description": "Geschätzter Vertrauenswert (0-100) für die Erkennung dieses Mastes und seiner Daten auf der Karte."
      },
      "geometry": {
        "type": "object",
        "description": "GeoJSON-Punkt-Geometrie des Maststandorts. Dieser Punkt muss manuell oder durch Georeferenzierung hinzugefügt werden, da er nicht direkt aus dem Bild extrahiert werden kann.",
        "properties": {
          "type": { "type": "string", "enum": ["Point"] },
          "coordinates": {
            "type": "array",
            "description": "Koordinaten der Geometrie [Longitude, Latitude]",
            "items": { "type": "number", "nullable": true },
            "minItems": 2,
            "maxItems": 3
          }
        },
        "required": ["type", "coordinates"]
      }
    },
    "required": ["mastId", "symbol_rectangle", "text_rectangle", "confidence"]
  }
}
```

---

## Allgemeine Hinweise zu den Schemas

* **Formatierung:** Wo `string`s mit Zahlenwerten (z.B. Mastnummern, BL-Nummern, Blattnummern) erwartet werden, wird oft eine Auffüllung mit führenden Nullen auf eine feste Länge (z.B. 4 Stellen) empfohlen. Dies dient der Datenkonsistenz und erleichtert Sortier- und Suchvorgänge.
* **`nullable: true`:** Zeigt an, dass ein Feld vorhanden sein kann, sein Wert aber `null` sein darf, wenn keine Information verfügbar ist.
* **`enum`:** Begrenzt die möglichen Werte eines Feldes auf eine vordefinierte Liste, um Datenkonsistenz zu gewährleisten und Tippfehler zu reduzieren.
* **`rectangle`:** Definiert eine Bounding Box (in Pixelkoordinaten) für die visuelle Position des extrahierten Objekts im Bild. Dies ist entscheidend für die Nachvollziehbarkeit und Validierung der Extraktion.
* **`confidence`:** Ein Vertrauenswert (0-100) gibt an, wie sicher das Extraktionssystem ist, dass die erkannten Daten korrekt sind. Dies ist besonders wichtig für automatisierte Extraktionsprozesse.
* **`geometry`:** Ein optionales Feld für GeoJSON-Punktkoordinaten. Da die Extraktion aus einem unreferenzierten Bild erfolgt, muss dieses Feld manuell oder durch einen separaten Georeferenzierungsschritt befüllt werden. Es ist jedoch entscheidend für die Integration in GIS-Systeme.

---

## Versionshistorie

* **Version 1.0 (28.12.2025):** Initiale Erstellung der Schemas für PDF-Plan-Info, Maßnahmen und Masten.
