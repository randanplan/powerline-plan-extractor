
import { getDocument, GlobalWorkerOptions, OPS } from 'pdfjs-dist';
import { resolve } from 'path';
import { extractRectangles } from './parsers/geometry';

// Set worker
const workerPath = resolve(__dirname, '../node_modules/pdfjs-dist/build/pdf.worker.mjs');
GlobalWorkerOptions.workerSrc = `file:///${workerPath.replace(/\\/g, '/')}`;

// Reverse map OPS to names
const OPS_NAMES = Object.fromEntries(Object.entries(OPS).map(([k, v]) => [v, k]));

async function debugBmpColors() {
  const filePath = resolve(process.cwd(), 'sample_data', '2388_Krefeld_0006_24_29.PDF');
  console.log(`Debugging colors for: ${filePath}`);

  const loadingTask = getDocument(`file:///${filePath.replace(/\\/g, '/')}`);
  const pdfDocument = await loadingTask.promise;
  const page = await pdfDocument.getPage(1);
  
  const operatorList = await page.getOperatorList();
  console.log(`Total operators: ${operatorList.fnArray.length}`);

  // Log first 100 operators to see setup
  console.log('--- First 100 Operators ---');
  for (let i = 0; i < Math.min(100, operatorList.fnArray.length); i++) {
      const fn = operatorList.fnArray[i];
      const args = operatorList.argsArray[i];
      console.log(`${i}: ${OPS_NAMES[fn]}`, args);
  }

  // Check for any color operators
  console.log('\n--- Color Operators Found ---');
  const colorOps = [
      OPS.setFillRGBColor, OPS.setStrokeRGBColor,
      OPS.setFillCMYKColor, OPS.setStrokeCMYKColor,
      OPS.setFillGray, OPS.setStrokeGray,
      OPS.setFillColorSpace, OPS.setStrokeColorSpace,
      OPS.setFillColorN, OPS.setStrokeColorN
  ];
  
  // Find index of the yellow color
  let yellowIndex = -1;
  for (let i = 0; i < operatorList.fnArray.length; i++) {
      const fn = operatorList.fnArray[i];
      const args = operatorList.argsArray[i];
      if (fn === OPS.setFillRGBColor && args[0] === 255 && args[1] === 255 && args[2] === 153) {
          yellowIndex = i;
          break;
      }
  }

  if (yellowIndex !== -1) {
      console.log(`Found Yellow Color at index ${yellowIndex}`);
      console.log('--- Surrounding Operators ---');
      const start = Math.max(0, yellowIndex - 5);
      const end = Math.min(operatorList.fnArray.length, yellowIndex + 20);
      
      for (let i = start; i < end; i++) {
          const fn = operatorList.fnArray[i];
          const args = operatorList.argsArray[i];
          console.log(`${i}: ${OPS_NAMES[fn]}`, JSON.stringify(args));
      }
  } else {
      console.log('Yellow color not found in exact match.');
  }

  const rects = await extractRectangles(page);
  console.log(`\nFound ${rects.length} rectangles via extractRectangles.`);
}

debugBmpColors().catch(console.error);
