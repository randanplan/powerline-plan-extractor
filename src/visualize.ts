import { PDFDocument, rgb, Color } from 'pdf-lib';
import { readFileSync, writeFileSync, existsSync, readdirSync, statSync } from 'fs';
import { resolve, basename, join, extname } from 'path';
import { parsePdfPlan } from './parsers/pdf';

async function visualizeAll(inputPath: string, outputFileName: string = 'visualize.PDF') {
  const mergedPdf = await PDFDocument.create();
  let filesToProcess: string[] = [];

  // Determine if input is file or directory
  if (statSync(inputPath).isDirectory()) {
    console.log(`Scanning directory: ${inputPath}`);
    const files = readdirSync(inputPath).filter(f => extname(f).toLowerCase() === '.pdf');
    filesToProcess = files.map(f => join(inputPath, f));
  } else {
    filesToProcess = [inputPath];
  }

  console.log(`Found ${filesToProcess.length} PDF files to process.`);

  for (const filePath of filesToProcess) {
    console.log(`Processing: ${basename(filePath)}`);
    try {
      // 1. Parse data
      const extractionResult = await parsePdfPlan(filePath);
      const measures = extractionResult.map.measures;
      
      // 2. Load source PDF
      const fileBuffer = readFileSync(filePath);
      const srcPdf = await PDFDocument.load(fileBuffer);
      
      // 3. Draw on the first page of source
      const pages = srcPdf.getPages();
      if (pages.length === 0) continue;
      const firstPage = pages[0];
      
      if (measures && measures.length > 0) {
         console.log(`  Found ${measures.length} measures.`);
         // Log first 5 measures to see what we found
         measures.slice(0, 5).forEach((m, i) => {
             const r = m.rectangle;
             if (r) {
                console.log(`    [${i}] x:${r.x.toFixed(1)} y:${r.y.toFixed(1)} w:${r.width.toFixed(1)} h:${r.height.toFixed(1)}`);
             }
         });

         for (const {rectangle: rect} of measures) {
            rect && firstPage.drawRectangle({
              x: rect.x,
              y: rect.y,
              width: rect.width,
              height: rect.height,
              borderColor: rgb(1, 0, 1), // Magenta
              borderWidth: 2,
              color: undefined,
            });
         }
      } else {
        console.log(`  No measures found.`);
      }

      // 4. Copy page to merged PDF
      const [copiedPage] = await mergedPdf.copyPages(srcPdf, [0]);
      mergedPdf.addPage(copiedPage);

    } catch (err) {
      console.error(`  Error processing ${basename(filePath)}:`, err);
    }
  }

  // 5. Save merged PDF
  const outputPath = resolve(process.cwd(), outputFileName);
  const pdfBytes = await mergedPdf.save();
  writeFileSync(outputPath, pdfBytes);
  console.log(`Saved combined visualization to: ${outputPath}`);
}

// CLI
const args = process.argv.slice(2);
const inputPath = args[0];

if (inputPath && existsSync(inputPath)) {
  visualizeAll(resolve(process.cwd(), inputPath)).catch(console.error);
} else {
  console.log("Usage: npx ts-node src/visualize.ts <path-to-pdf-or-directory>");
}
