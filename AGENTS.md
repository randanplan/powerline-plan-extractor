# AGENTS.md - Instructions for AI Coding Agents

> **⚠️ IMPORTANT FOR AI AGENTS:** Read this file before generating code, refactoring, or writing documentation. This project handles specific proprietary PDF formats for powerline vegetation management ("Pflegepläne"). Strict adherence to domain logic and data schemas is required.

## 1. Project Context & Goal

This tool is a specialized extraction agent. It reads PDF files containing vegetation management plans from German grid operators (**Amprion** and **Westnetz**).

* **Input:** Single-page PDF files with a specific layout (Map on the left, Metadata on the right).
* **Output:** Structured JSON data adhering to strict schemas.
* **Domain:** High-voltage powerlines (Hochspannungsfreileitungen). Terms are in German (e.g., "Mast", "Gemarkung", "Durchforsten").

## 2. Tech Stack & Style

* **Language:** TypeScript (Strict Mode).
* **Runtime:** Node.js.
* **Libraries:** `pdf-lib` (PDF manipulation), `pdfjs-dist` (Text extraction), `zod` (Schema validation - recommended).
* **Coding Style:** Functional, immutable where possible. Explicit typing.
* **Language Rule:**
  * **Code/Variables:** English or Mixed (matching Schema keys like `fläche_m2` or `mastbereich`).
  * **Comments/Docs:** **German**.
  * **User Interactions:** **German**.

## 3. Core Domain Rules (The "Prime Directives")

### 3.1. Mast Numbers (Critical)

* **ALWAYS** treat mast numbers as **Strings**.
* **ALWAYS** pad numeric mast numbers to 4 characters with leading zeros:
  * `15` -> `"0015"`
  * `102` -> `"0102"`
  * `7A` -> `"007A"`
  * `1003` -> `"1003"`
* **Preserve Suffixes:** `35A` -> `"035A"`.
* **Portal Masts:** Handle 'P' prefix. `P1` -> `"P001"`.

### 3.2. File Identification

* Files are identified by Regex patterns defined in `docs/pdf_plan.md`.
* **BMP (Amprion):** `[BL]_[District]_[Sheet]_[Start]-[End].pdf`
* **ÖTM (Westnetz):** `ÖTM-[Los] [Name]-[Sheet].pdf`
* Ignore files that do not match these patterns (e.g., `.xlsx`, `.log`, or large overview maps).

### 3.3. Coordinate Systems

* **PDF Origin:** Bottom-Left (`0,0`).
* **Image/Vision Origin:** Top-Left (`0,0`).
* When extracting `rectangles` for the JSON schema, ensure coordinates are consistent (prefer image coordinates: Top-Left origin).

## 4. Data Schemas (Source of Truth)

Do not invent new JSON structures. Stick rigidly to the definitions in `docs/schemas.md`.

* **`PDF-Plan-Info`**: Metadata from the right side of the PDF.
* **`Maßnahmen` (Measures)**: Objects extracted from the map (colored rectangles). Key fields: `peId`, `type`, `rectangle`.
* **`Masten` (Masts)**: Mast symbols and numbers on the map.

## 5. Crop Regions (Layout)

The PDF layout is fixed-height (A4) but variable-width. Crop regions are defined relative to the **right edge** or padding.

* Refer to `docs/pdf_plan.md` -> "Bereiche der PDF-Datei" for exact crop formulas.
* **Map Area:** Dynamic width (Left side).
* **Metadata Area:** Fixed width (Right side).

## 6. ID Generation Strategy

Generate deterministic IDs for database consistency:

* `planId`: `${filename_stem}_${issue_date}` for PDF file identification.
* `mastId` (Global): `${bl_number}${padded_mast_number}` (e.g., `41130015`)
* `measureId`: `${planId}_${peId}`

## 7. Documentation Maintenance

If you make changes to code, parsing logic, or domain rules, ensure the following documentation files are updated accordingly:

1. Update `docs/schemas.md` if the JSON structure changes.
2. Update `docs/pdf_plan.md` if parsing logic for file names or layout changes.
3. Keep `README.md` in sync with new features.
4. Update this `AGENTS.md` if domain rules or coding conventions change.

## 8. Glossary (German -> Context)

* *Blatt* = Sheet/Page
* *Gemarkung* = Land registry district
* *Flur* = Land parcel group
* *Aufarbeitung* = Processing of cut wood (chipping, hauling)
* *Maßnahme* = Vegetation management action (e.g., "Einzelentnahme", "Mulchen")
* *Mast* = Power pylon/pole
* *Mastbereich* = Range group of masts
* *Netzbetreiber* = Grid operator (e.g., Amprion, Westnetz)
* *Pflegeplan* = Vegetation management plan (PDF file)
* *PeId* = Unique identifier for a measure on the plan (e.g., "0.1")
* *Fläche_m2* = Area in square meters
* *AusgabeDatum* = Issue date of the plan
* *Betreiber* = Operator (grid company)
* *Kreis* = District (administrative region)
* *Gemeinde* = Municipality
* *BL (Bauleitnummer)* = Construction line number
* *BMP* = Amprion's PDF plan format
* *ÖTM* = Westnetz's PDF plan format
* *Hochspannungsfreileitung* = High-voltage overhead powerline
* *Kronenrückschnitt* = Crown reduction (tree trimming)
* *Einzelentnahme* = Individual tree removal
* *Durchforsten* = Thinning of vegetation
* *Mulchen* = Mulching
* *Standortpflege Mast* = Mast site maintenance
* *Astwerk Häckseln* = Chipping of cut branches
* *Astwerk Abfahren* = Hauling away cut branches
* *PDF-Plan-Info* = Metadata structure for the plan
* *Maßnahmen* = Measures structure for vegetation actions
* *Masten* = Masts structure for power pylons
* *Plan-ID* = Unique identifier for the plan
* *Mast-ID* = Unique identifier for a mast
* *Maßnahmen-ID* = Unique identifier for a measure
* *Leitungs-ID* = Powerline identifier
* *Traverse* = Crossarm of a power pylon
* *Los* = Lot/Batch of plans

## 9. Git Workflow & Version Control

* **Commit Style:** Follow [Conventional Commits](https://www.conventionalcommits.org/).
  * Format: `type(scope): description`
  * Types: `feat`, `fix`, `docs`, `style`, `refactor`, `test`, `chore`.
  * Example: `feat(parser): implement regex for Westnetz filenames`
* **Atomic Commits:** Group changes logically. Do not mix formatting fixes with logic changes.
* **Pushing:**
  * **Never push automatically** without user confirmation.
  * Before pushing, ensure build (`npm run build`) passes, tsc runs without errors (`tsc --noEmit`) and documentation is updated.
* **Branching:** Use feature branches for new features or bug fixes. Merge into `main` only after review.
* Pull the latest `main` before starting new work to avoid conflicts.
* Write clear commit messages in German, reflecting the changes made.
* Include references to relevant documentation updates in commit messages.
* Tag releases with semantic versioning (e.g., `v1.0.0`).
* Regularly review and update this `AGENTS.md` file to reflect any changes in workflow or project structure.
