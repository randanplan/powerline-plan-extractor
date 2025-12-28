# Roadmap & Next Steps

Dieses Dokument skizziert die geplanten Entwicklungsschritte für den `powerline-plan-extractor`. Es dient als Leitfaden für zukünftige Features und technische Verbesserungen.

## 🟢 Phase 1: Core Extraction (Aktueller Fokus)

Das Fundament der Extraktion steht. Wir können BMP- und ÖTM-Pläne unterscheiden und Basisdaten extrahieren.

- [x] **Datei-Identifikation:** Unterscheidung von Amprion (BMP) und Westnetz (ÖTM) anhand von Dateinamen.
- [x] **Metadaten-Extraktion:** Auslesen von Plankopf-Daten (Blatt-Nr, Datum, Leitung).
- [x] **Maßnahmen-Erkennung:** Extraktion farbiger Rechtecke (Gelb) unter Berücksichtigung verschiedener PDF-Operatoren (`fill` vs `closeFillStroke`).
- [x] **Basis-Dokumentation:** Architektur und Schemas sind definiert.
- [ ] **Erweiterte Mast-Erkennung:** Verbesserung der Zuordnung von Mastnummern (Text) zu Mast-Symbolen (Geometrie). Aktuell ist dies noch rudimentär.
- [ ] **Text-Inhalt der Maßnahmen:** OCR oder Text-Extraktion innerhalb der Maßnahmen-Boxen, um z.B. "Einzelentnahme" vs. "Durchforstung" zu unterscheiden, falls dies nicht nur über die Farbe codiert ist.

## 🟡 Phase 2: Georeferencing (Nächster Meilenstein)

Die extrahierten Daten liegen derzeit in Pixel-Koordinaten (relativ zur PDF-Seite) vor. Ziel ist die Umwandlung in echte Geokoordinaten (EPSG:25832 / ETRS89).

- [ ] **Koordinatensystem-Analyse:** Ermittlung der verwendeten Projektionen auf den Plänen (meist Gauss-Krüger oder UTM).
- [ ] **Referenzpunkte-Extraktion:** Automatisches Finden von Koordinatengittern oder Schnittmarken am Kartenrand.
- [ ] **Transformations-Logik:** Implementierung einer Affinen Transformation (Pixel -> Geo).
- [ ] **GeoJSON Output:** Erweiterung des Outputs um standardkonformes GeoJSON für GIS-Integration.

## 🟠 Phase 3: Qualitätssicherung & Validierung

Um die Verlässlichkeit der Daten zu garantieren, müssen Validierungsmechanismen eingeführt werden.

- [ ] **Zod-Schema Integration:** Strikte Runtime-Validierung aller extrahierten Daten gegen die Definitionen in `docs/schemas.md`.
- [ ] **Confidence Scores:** Berechnung einer Wahrscheinlichkeit für die Korrektheit einer Extraktion (z.B. "Wie sicher ist es, dass dies Mast 15 ist?").
- [ ] **Visual Debugger:** Ein Tool, das die extrahierten JSON-Daten (Rechtecke, Masten) wieder über das PDF legt, um visuell Fehler zu prüfen.

## 🔵 Phase 4: Infrastruktur & Skalierung

Verarbeitung großer Mengen von Plänen.

- [ ] **Batch Processing CLI:** Ein robustes CLI-Tool, das ganze Ordnerstrukturen rekursiv verarbeitet und Berichte generiert.
- [ ] **Datenbank-Integration:** Speicherung der Ergebnisse in einer PostgreSQL/PostGIS Datenbank statt nur JSON-Dateien.
- [ ] **Dockerisierung:** Bereitstellung des Parsers als Container für CI/CD-Pipelines oder Cloud-Deployment.

## 🟣 Phase 5: User Interface (Zukunftsmusik)

- [ ] **Web-Viewer:** Eine einfache Web-Oberfläche, um Pläne und extrahierte Daten nebeneinander zu sehen.
- [ ] **Human-in-the-loop:** Möglichkeit für Nutzer, fehlerhafte Extraktionen manuell zu korrigieren.
