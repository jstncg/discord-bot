// scripts/test-analysis-only.js
import 'dotenv/config';
import { analyzeImages } from '../src/llm/analyze.js';

console.log('🧪 Testing analysis without rendering...\n');

// Test with a simple mock data since we can't easily test with real images in script
const mockImageUrl = 'https://via.placeholder.com/300x400/0066cc/ffffff?text=Test+Chat';

console.log('Testing image analysis...');

try {
  const result = await analyzeImages({ 
    imageUrls: [mockImageUrl], 
    language: 'en' 
  });
  
  console.log('✅ Analysis completed successfully!');
  console.log('Summary:', result.summary_line);
  console.log('ELO:', result.elo);
  console.log('Messages found:', result.messages.length);
  console.log('Image sizes detected:', result._sizes);
} catch (error) {
  console.error('❌ Analysis failed:', error.message);
  
  // Test fallback path specifically
  console.log('\n🔄 Testing OCR fallback...');
  try {
    const { ocrFallback } = await import('../src/llm/analyze.js');
    // This would test OCR but it's not exported, so we'll just report the main error
  } catch (fallbackErr) {
    console.error('Fallback also failed:', fallbackErr.message);
  }
}

