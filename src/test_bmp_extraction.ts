
import { parsePdfPlan } from './parsers/pdf';
import { join } from 'path';
import { readdirSync } from 'fs';

const sampleDir = join(process.cwd(), 'sample_data');
const files = readdirSync(sampleDir).filter(f => f.match(/^\d{4}_.*\.PDF$/i)); // Filter for BMP files (start with 4 digits)

async function testBmpFiles() {
  console.log(`Found ${files.length} BMP files.`);
  
  // Test the first 3 files
  const filesToTest = files.slice(0, 3);

  for (const file of filesToTest) {
    const filePath = join(sampleDir, file);
    console.log(`\n--------------------------------------------------`);
    console.log(`Testing extraction for: ${file}`);
    console.log(`--------------------------------------------------`);

    try {
      const data = await parsePdfPlan(filePath);
      
      console.log('Metadata:', JSON.stringify(data.metadata, null, 2));
      console.log(`Found ${data.map.measures.length} Measures (Yellow)`);
      
      if (data.map.measures.length > 0) {
        console.log('Measures Sample:');
        data.map.measures.forEach((m: any) => {
             console.log(`  - [${m.peId}] Type: ${m.type}, Count: ${m.anzahl_stk}, Details: '${m.details}'`);
        });
      } else {
          console.log("No measures found.");
      }

    } catch (err) {
      console.error(`Error processing ${file}:`, err);
    }
  }
}

testBmpFiles();
