# 🌲⚡ Vegetationspflegeplan PDF-Agent

**Automatisierte Datenextraktion aus Pflegeplänen für Hochspannungsfreileitungen.**

Dieses Projekt ist ein spezialisierter PDF-Agent, der entwickelt wurde, um **Vegetationspflegepläne (BMP/ÖTM)** von Netzbetreibern wie **Amprion** und **Westnetz** zu analysieren. Er extrahiert strukturierte Daten über Pflegemaßnahmen, Maststandorte und administrative Metadaten aus komplexen, layout-basierten PDF-Kartenwerken.

## 🎯 Zielsetzung

Die Instandhaltung von Hochspannungsleitungen erfordert präzise Planung der Grünpflege. Diese Informationen liegen oft nur in proprietären PDF-Formaten vor, die eine Mischung aus Vektorgrafiken, Textblöcken und Kartenmaterial sind.

Dieser Agent löst das Problem der manuellen Digitalisierung, indem er:
1.  Den **Plan-Typ** (Amprion BMP vs. Westnetz ÖTM) automatisch erkennt.
2.  **Metadaten** (Blattnummer, Leitungs-ID, Datum) aus dem Plankopf ausliest.
3.  **Pflegemaßnahmen** (Farbige Rechtecke auf der Karte) erkennt, klassifiziert und georeferenziert.
4.  **Mast-Objekte** auf der Karte identifiziert und zuordnet.

## 🚀 Features

*   **Multi-Betreiber Support:** Erkennt und verarbeitet Layouts von Amprion (BMP) und Westnetz (ÖTM).
*   **Intelligente Extraktion:**
    *   Unterscheidung zwischen Metadaten, Karteninhalt und Legende durch Crop-Box-Logik.
    *   Extraktion von Maßnahmen-Details (Art, Fläche, Aufarbeitung).
    *   Erkennung von Masten (Symbolik & Textzuordnung).
*   **Daten-Normalisierung:**
    *   Standardisierung von Mastnummern (4-stelliges Padding).
    *   Generierung eindeutiger IDs für Pläne, Masten und Maßnahmen.
*   **Typisierte Ausgabe:** Validierte JSON-Ausgabe basierend auf strikten Schemas.

## 📚 Dokumentation

Die detaillierte technische Dokumentation befindet sich im `docs/` Ordner:

| Datei | Beschreibung |
| :--- | :--- |
| [📄 **PDF-Plan Spezifikation**](docs/pdf_plan.md) | Detaillierte Beschreibung der Eingabe-Formate, Layouts und Dateinamen-Konventionen. |
| [💾 **JSON Schemas**](docs/schemas.md) | Definition der Ausgabe-Datenstrukturen (Plan-Info, Maßnahmen, Masten). |
| [🏗️ **Architektur**](docs/architecture.md) | *(Geplant)* Einblick in die Extraktions-Pipeline und genutzte Technologien. |
| [🌍 **Georeferenzierung**](docs/georeferencing.md) | *(Geplant)* Umgang mit Koordinatensystemen und Verortung der Maßnahmen. |

## 🛠️ Technologie-Stack

*   **Sprache:** TypeScript / Node.js
*   **PDF-Verarbeitung:** `pdf-lib`, `pdfjs-dist`
*   **Validierung:** JSON Schema
*   **Datenformate:** JSON, GeoJSON (für Geometrien)

## 📦 Datenmodelle

Der Agent extrahiert Daten in drei Hauptkategorien. Die genauen JSON-Schemas sind in `docs/schemas.md` definiert.

1.  **Plan-Info (`PDF-Plan-Info`)**:
    *   Administrative Daten (Betreiber, Blatt, Datum).
    *   Geografische Zuordnung (Kreis, Gemeinde).
2.  **Maßnahmen (`Maßnahmen`)**:
    *   Art der Pflege (z.B. "Einzelentnahme", "Mulchen").
    *   Details zur Aufarbeitung.
    *   Position auf dem Plan (`rectangle`).
3.  **Masten (`Masten`)**:
    *   Identifikation der Masten auf dem Kartenausschnitt.
    *   Verknüpfung von Mastsymbol und Mastnummer.

## 🚀 Installation & Nutzung

```bash
# Repository klonen
git clone https://github.com/dein-username/powerline-plan-extractor.git

# Abhängigkeiten installieren
npm install

# Build
npm run build

# Agent ausführen (Beispiel)
npm start -- --input ./data/plans --output ./data/json
```

## 🤝 Konventionen

Um die Datenkonsistenz zu gewährleisten, wendet der Agent strikte Regeln an (siehe `docs/pdf_plan.md`):
*   **Mastnummern:** Immer 4-stellig gepaddet (z.B. `"0015"`).
*   **IDs:** Zusammengesetzt aus Dateiname, Datum und Objekt-ID.
*   **Dateinamen:** Müssen den definierten Regex-Mustern für BMP oder ÖTM entsprechen, um verarbeitet zu werden.

## 📄 Lizenz

[MIT](LICENSE)

---

*Entwickelt für die effiziente Digitalisierung von Trassenmanagement-Prozessen.*
