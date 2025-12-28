# Dokumentation: PDF-Planwerke für Hochspannungsfreileitungen

## 1. Übersicht

Dieses Dokument beschreibt die technischen Spezifikationen, Strukturen und Konventionen der digitalen Planwerke (PDF-Dateien) für die jährliche Vegetationspflege an Hochspannungsfreileitungen. Diese Pläne werden von Netzbetreibern wie **Amprion** (BMP) und **Westnetz** (ÖTM) bereitgestellt.

Die PDF-Dateien dienen als primäre Datenquelle für die Extraktion von:

* Geografischen Leitungsverläufen (Masten, Trassen).
* Durchzuführenden Pflegemaßnahmen (Bäume schneiden, Mulchen, etc.).
* Administrativen Metadaten (Blattnummern, Ausgabedatum, Zuständigkeiten).

## 2. Plan-Typen und Dateinamenskonventionen

Es werden primär zwei Typen von Plänen unterschieden, die sich in Layout und Benennung unterscheiden.

### 2.1. BMP-Pläne (Amprion)

**Bezeichnung:** Baummanagementplan  
**Dateinamensmuster:**
`[BL]_[Kreis/Ort]_[BlattNr]_[StartMast]-[EndMast].PDF`

* **Regex:** `(\d+)_(\w+)_(\d{4})_(.+)-(.+)\.(pdf|PDF)`
* **Beispiel:** `4113_Limburg-Weilburg_0004_15_20.pdf`
  * `4113`: Bauleitnummer (BL)
  * `Limburg-Weilburg`: Kreis/Region
  * `0004`: Blattnummer (immer 4-stellig)
  * `15_20`: Mastbereich (von Mast 15 bis 20)
  
#### 2.1.1. Metadaten (BMP-spezifisch)

In Plan-Infos von BMP-Plänen können folgende Metadaten extrahiert werden:

* **Projekt-Nummer:** Z.B. `01080`
* **Los-ID:** nicht vorhanden in BMP, nur in ÖTM-Plänen.
* **Los-Name:** nicht vorhanden in BMP, nur in ÖTM-Plänen.
* **Blatt-Nummer:** Z.B. `0004`

### 2.2. ÖTM-Pläne (Westnetz)

**Bezeichnung:** Ökologisches Trassenmanagement  
**Dateinamensmuster:**
`ÖTM-[LosNr] [LosName]-[BlattNr].PDF`

* **Regex:** `ÖTM-(\d{4}) (\w+)-(\d{4})\.(pdf|PDF)`
* **Beispiel:** `ÖTM-2006 Köln-0008.PDF`
  * `2006`: Losnummer (Bekannte Lose: 2006, 2008, 2009)
  * `Köln`: Losname
  * `0008`: Blattnummer (immer 4-stellig)

#### 2.2.1. Metadaten (ÖTM-spezifisch)

In Plan-Infos von ÖTM-Plänen können folgende Metadaten extrahiert werden:

* **Los-ID:** Z.B. `2006`
* **Los-Name:** Z.B. `Köln`
* **Projekt-Nummer:** Nicht vorhanden in ÖTM, nur in BMP-Plänen.

> **Hinweis:** Dateien, die nicht diesen Mustern entsprechen (z.B. Excel-Mengengerüste, Log-Dateien oder Großformat-Übersichtskarten wie `OETM_LOSBLATT-ÖTM-Üb.*.PDF`), werden bei der Plan-Verarbeitung ignoriert.

## 3. Technische Struktur der PDF-Datei

### 3.1. Seitenlayout

* **Format:** Die Pläne besitzen eine **fixe Höhe** (entsprechend DIN A4, ca. 595 Punkte / 210mm) aber eine **variable Breite**, abhängig von der Länge des dargestellten Trassenabschnitts.
* **Seitenanzahl:** Jede Datei besteht aus exakt einer Seite.
* **Koordinatensystem:** PDF-Standard (Origin unten links).

### 3.2. Padding (Ränder)

Die relevanten Inhalte sind von einem festen Rand umgeben (Angaben in PDF-Points):

* Links: `70.6` pt
* Rechts: `13.9` pt
* Oben: `14.2` pt
* Unten: `13.9` pt

### 3.3. Layout-Bereiche (Crop-Boxen)

Die Informationen auf dem Plan sind horizontal in spezifische Zonen unterteilt. Die Breiten der Informationsblöcke (rechts) sind fix, während sich die Karte (links) dynamisch an die Blattbreite anpasst.

| Bereich        | Beschreibung                                    | X-Start (Formel)       | X-Ende (Formel)  |
| :------------- | :---------------------------------------------- | :--------------------- | :--------------- |
| **Plan-Karte** | Grafische Darstellung der Trasse und Maßnahmen. | `70.6` (Padding Links) | `width - 1572.9` |
| **Legende**    | Farbcodes und Symbolerklärungen.                | `width - 1573.4`       | `width - 1048.5` |
| **Details**    | Detaillisten zu Flächen (optional).             | `width - 1049.0`       | `width - 524.1`  |
| **Plan-Infos** | Kopfdaten (Metadaten, Betreiber, etc.).         | `width - 524.6`        | `width - 13.9`   |

*Hinweis: Y-Start und Y-Ende entsprechen jeweils `Padding Oben` bis `Height - Padding Unten`.*

## 4. Inhaltliche Konventionen & Datenformatierung

Um Konsistenz in der Datenbank zu gewährleisten, gelten folgende Normalisierungsregeln für extrahierte Daten.

### 4.1. Mastnummern

Mastnummern werden grundsätzlich als **4-stellige Strings** behandelt und mit führenden Nullen aufgefüllt ("Padding").

* `15` -> `"0015"`
* `102` -> `"0102"`
* `35A` -> `"0035A"` (Buchstaben bleiben erhalten)

**Sonderfälle:**

* **Portale:** Beginnen mit 'P' (z.B. `P1` -> `"P001"`).
* **Ersatzmasten:**
  * *4-stellig:* Beginnen oft mit '1' an erster Stelle bei 4-stelligen Zahlen (z.B. `"1017"` als Ersatz für Mast 17).
  * *3-stellig:* Können ebenfalls Ersatzmasten darstellen, erkennbar an Sprüngen in der Sequenz (z.B. `93` -> `94` -> `195` -> `196` -> `97`). Diese werden wie gewohnt auf 4 Stellen gepadded: `"0195"`, `"0196"`.

### 4.2. Bauleitnummern (BL)

Auch BL-Nummern werden als 4-stellige Strings gespeichert.

* `BL 2449` -> `"2449"`

### 4.3. ID-Generierung

Zur eindeutigen Identifikation von Objekten werden zusammengesetzte IDs verwendet:

* **Plan-ID:** `{Dateiname_ohne_Ext}_{AusgabeDatum}_{Version}`
  * *Beispiel:* `2388_Neuss_0006_24_29_081225_V0`
* **Mast-ID (Global):** `{BL}{MastNr}`
  * *Beispiel:* `00200015` (BL 20, Mast 15)
* **Maßnahmen-ID:** `{Plan-ID}_{peId}`
  * *Beispiel:* `..._081225_V0_0.1` (wobei `peId` die Nummer im Maßnahmen-Kästchen ist, z.B. "0.1").

### 4.4. Farbkodierung der Maßnahmen

Die Maßnahmenflächen auf der Karte werden durch spezifische Füllfarben unterschieden. Diese Farben sind entscheidend für die korrekte Klassifizierung der Rechtecke.

* **Maßnahmen (Vegetationspflege):**
  * **ÖTM-Pläne:**
    * Farbe: **Hellgelb**
    * RGB (0-255): `255, 255, 224`
    * RGB (0-1): `1.0, 1.0, 0.878`
  * **BMP-Pläne:**
    * Farbe: **Gelb**
    * RGB (0-255): `255, 255, 153`
    * RGB (0-1): `1.0, 1.0, 0.6`
  * Darstellung: Gefülltes Rechteck mit schwarzem Rand (`fillStroke` oder `closeFillStroke`).

* **Info-Boxen (Hinweise):**
  * Farbe: **Orange**
  * RGB (0-255): `255, 128, 64`
  * RGB (0-1): `1.0, 0.502, 0.251`
  * Darstellung: Gefülltes Rechteck mit schwarzem Rand (`fillStroke`).

## 5. Extraktionslogik

### 5.1. Maßnahmen (Karte)

Maßnahmen werden im Kartenbereich durch farbige Rechtecke und Verbindungslinien dargestellt.

* **Herausforderung:** Die Textboxen sind grafische Elemente. Eine reine Textextraktion verliert oft den Kontext.
* **Lösung:** Extraktion über Objekterkennung (Bounding Boxes) und OCR oder spezifisches PDF-Parsing der Vektor-Objekte.
* **Zuordnung:** Jede Maßnahme hat eine `peId` (z.B. "0.1"), die sie eindeutig einem Bereich auf der Karte zuweist.

### 5.2. Metadaten (Plan-Infos)

Die Metadaten im rechten Bereich ("Plan-Infos") folgen einem strikten Key-Value-Muster oder Tabellenlayout und können textbasiert extrahiert werden (siehe `schema/planinfo_schema.json`).

## 6. Datentypen (TypeScript Referenz)

Für die Implementierung der Parser stehen folgende TypeScript-Definitionen zur Verfügung:

```typescript
export type PlanType = "BMP" | "ÖTM";

export type Netzbetreiber = "RWE Power" | "Amprion" | "Westnetz" | "RheinEnergie";

export type MassnahmenTypen =
  | "Einzelentnahme"
  | "Kronenrückschnitt"
  | "Durchforsten"
  | "Mulchen"
  | "Standortpflege Mast"
  // ... weitere Typen siehe Schema
  | (string & {});

export type Aufarbeitungsart =
  | "Standard"
  | "Astwerk Häckseln"
  | "Astwerk Abfahren"
  // ... weitere Typen siehe Schema
  | (string & {});
```

## 7. Referenzen

* **JSON-Schemas:**
  * [`docs/schemas.md`](./schemas.md) - Detaillierte Beschreibung der Ausgabe-Formate.
  * [`schema/planinfo_schema.json`](../schema/planinfo_schema.json) - Struktur der Metadaten.
  * [`schema/massnahmen_schema.json`](../schema/massnahmen_schema.json) - Struktur der Pflegemaßnahmen.
  * [`schema/masten_schema.json`](../schema/masten_schema.json) - Struktur der Karten-Masten.
* **Bibliotheken:** `pdf-lib`, `pdfjs-dist`.
