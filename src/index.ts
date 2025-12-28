/**
 * Powerline Plan Extractor
 *
 * Haupt-Einstiegspunkt für die Extraktions-Pipeline.
 */

import { existsSync } from "fs";
import { resolve } from "path";
import { parsePdfPlan } from "./parsers/pdf";

async function main() {
  const args = process.argv.slice(2);
  
  // Simple argument parsing
  const inputIndex = args.indexOf('--input');
  let inputPath = inputIndex !== -1 ? args[inputIndex + 1] : args[0];

  if (!inputPath) {
    console.error("Fehler: Bitte geben Sie einen Eingabe-Pfad an.");
    console.error("Verwendung: node dist/index.js --input <path/to/plan.pdf>");
    process.exit(1);
  }

  // Resolve absolute path
  const absolutePath = resolve(process.cwd(), inputPath);

  if (!existsSync(absolutePath)) {
    console.error(`Fehler: Datei nicht gefunden: ${absolutePath}`);
    process.exit(1);
  }

  console.log(`Verarbeite Datei: ${absolutePath}`);

  try {
    const result = await parsePdfPlan(absolutePath);
    
    // Output JSON to stdout
    console.log(JSON.stringify(result, null, 2));
    
  } catch (error) {
    console.error("Fehler bei der Verarbeitung:", error);
    process.exit(1);
  }
}

main().catch(err => {
  console.error("Unerwarteter Fehler:", err);
  process.exit(1);
});
