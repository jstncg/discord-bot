// scripts/test-review-local.js
import 'dotenv/config';
import { analyzeImages } from '../src/llm/analyze.js';

const urls = [
  // Put a public test image URL here to test vision + JSON
];

if (!urls.length) {
  console.log('Add at least one image URL to scripts/test-review-local.js');
  process.exit(0);
}

const out = await analyzeImages({ imageUrls: urls, language: 'en' });
console.log(JSON.stringify(out, null, 2));
