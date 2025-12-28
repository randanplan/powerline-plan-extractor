# Architektur & Extraktions-Pipeline

Dieses Dokument beschreibt den technischen Aufbau und den Ablauf der Datenextraktion aus den Pflegeplänen.

## Übersicht

Der `powerline-plan-extractor` ist als Pipeline aufgebaut, die rohe PDF-Dateien in strukturierte JSON-Daten transformiert. Der Prozess ist modular gestaltet, um unterschiedliche Plan-Layouts (Amprion BMP, Westnetz ÖTM) zu unterstützen.

```mermaid
graph TD
    A[PDF Datei] --> B{Datei-Identifikation}
    B -->|Amprion BMP| C[Parser Konfiguration BMP]
    B -->|Westnetz ÖTM| D[Parser Konfiguration ÖTM]
    C --> E[PDF Parsing (pdfjs-dist)]
    D --> E
    E --> F[Geometrie-Extraktion]
    E --> G[Text-Extraktion]
    F --> H[Maßnahmen-Erkennung]
    G --> I[Metadaten-Parsing]
    H --> J[Daten-Assemblierung]
    I --> J
    J --> K[JSON Output]
```

## 1. Datei-Identifikation (`src/index.ts`)

Der Einstiegspunkt analysiert den Dateinamen anhand definierter Regex-Muster (siehe `docs/pdf_plan.md`).
* **Zweck:** Bestimmung des Netzbetreibers (Amprion/Westnetz) und Extraktion initialer Metadaten (Blattnummer, Leitungsnummer) direkt aus dem Dateinamen.
* **Filterung:** Dateien, die nicht dem Namensschema entsprechen, werden ignoriert.

## 2. PDF Parsing (`src/parsers/pdf.ts`)

Wir nutzen `pdfjs-dist`, um das PDF-Dokument auf niedriger Ebene zu lesen. Anstatt nur Text zu extrahieren, greifen wir auf die **Operator List** zu.

### 2.1 Operator-Analyse
PDFs bestehen aus einer Serie von Zeichenbefehlen. Wir analysieren diese Befehle, um grafische Elemente zu finden:
* **Pfad-Konstruktion:** `re` (Rectangle), `m` (MoveTo), `l` (LineTo).
* **Pfad-Painting:** 
  * `f` / `fill`: Füllen eines Pfades (genutzt in ÖTM).
  * `b` / `closeFillStroke`: Schließen, Füllen und Umranden (genutzt in BMP).
* **Status-Änderungen:** `sc` / `rg` (SetFillColor) zur Identifikation von farbigen Flächen.

## 3. Geometrie-Extraktion (`src/parsers/geometry.ts`)

Hier findet die eigentliche "Magie" der Maßnahmen-Erkennung statt.

### 3.1 Farb-Filterung
Maßnahmen werden primär durch ihre Farbe identifiziert. Da die Pläne unterschiedliche Farbprofile nutzen, unterstützt der Parser mehrere Definitionen für "Gelb" (Maßnahmenflächen):
* **ÖTM-Gelb:** `[255, 255, 224]` (Helles Gelb)
* **BMP-Gelb:** `[255, 255, 153]` (Sattes Gelb)

### 3.2 Rechteck-Normalisierung
Die extrahierten Pfade werden in normalisierte Rechtecke (`x, y, width, height`) umgewandelt.
* **Koordinatensystem:** Transformation vom PDF-System (Ursprung unten-links) in das Bild-System (Ursprung oben-links), falls notwendig für die Weiterverarbeitung.
* **Crop-Regionen:** Elemente außerhalb des relevanten Kartenbereichs (z.B. Legende, Plankopf) werden ausgefiltert.

## 4. Text-Extraktion & Metadaten

Parallel zur Geometrie wird der Text extrahiert.
* **Text-Items:** `pdfjs-dist` liefert Textfragmente mit Position.
* **Zonen-Logik:** Wir definieren Zonen (z.B. "Rechte Spalte"), um Metadaten gezielt auszulesen.
* **Regex-Parsing:** Innerhalb der Zonen suchen wir nach Schlüsselwörtern wie "Blatt-Nr.:", "Datum:", "Leitung:".

## 5. Daten-Assemblierung

Die extrahierten Rohdaten (Rechtecke und Metadaten) werden zusammengeführt.
* **ID-Generierung:** Deterministische IDs für Pläne und Maßnahmen werden erzeugt.
* **Typisierung:** Das Ergebnis wird gegen die TypeScript-Interfaces und (optional) Zod-Schemas validiert.

## Technische Herausforderungen & Lösungen

| Herausforderung | Lösung |
| :--- | :--- |
| **Unterschiedliche PDF-Operatoren** | Der Parser unterstützt sowohl `fill` (`f`) als auch `closeFillStroke` (`b`) Operationen, um solide gefüllte Rechtecke in allen Formaten zu erkennen. |
| **Farb-Varianz** | Tolerante Farbprüfung oder Listen von validen RGB-Werten für denselben semantischen Typ (z.B. "Maßnahme"). |
| **Layout-Unterschiede** | Konfigurierbare Crop-Regionen und Regex-Pattern je nach erkanntem Plan-Typ. |

