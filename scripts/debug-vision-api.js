// scripts/debug-vision-api.js - Debug Vision API issues
import 'dotenv/config';
import { analyzeImages } from '../src/llm/analyze.js';

console.log('🔍 **DEBUGGING VISION API ISSUES**\n');

// Check environment
console.log('🔧 **Environment Check:**');
console.log('   OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('   DISABLE_OCR_FALLBACK:', process.env.DISABLE_OCR_FALLBACK || 'false');
console.log('   OPENAI_VISION_MODEL:', process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini');

// Test with a simple image URL that should work
const testImageUrl = 'https://via.placeholder.com/375x300/E8E8E8/333333?text=Test+Chat+Screenshot';

console.log('\n📡 **Testing Vision API with simple image:**');
console.log('   Image URL:', testImageUrl);

try {
  console.log('🚀 Making Vision API call...');
  const result = await analyzeImages({ 
    imageUrls: [testImageUrl], 
    language: 'en' 
  });
  
  console.log('✅ **Vision API Success!**');
  console.log('   Messages found:', result.messages.length);
  console.log('   ELO:', result.elo);
  console.log('   Summary:', result.summary_line);
  console.log('   Labels used:', Object.keys(result.counts).filter(k => result.counts[k] > 0));
  
} catch (error) {
  console.error('❌ **Vision API Failed:**');
  console.error('   Error:', error.message);
  console.error('   Stack:', error.stack);
  
  if (error.message.includes('timeout')) {
    console.log('\n💡 **Timeout Issue:** Try increasing the timeout in analyze.js');
  }
  if (error.message.includes('API key')) {
    console.log('\n💡 **API Key Issue:** Check your OPENAI_API_KEY in .env');
  }
  if (error.message.includes('quota') || error.message.includes('billing')) {
    console.log('\n💡 **Billing Issue:** Check your OpenAI account billing and usage');
  }
}

console.log('\n🎯 **Next Steps:**');
console.log('   1. If Vision API works: The issue is with Discord image URLs or interaction timing');
console.log('   2. If Vision API fails: Check the error message above for specific fixes');
console.log('   3. Test with your actual Discord screenshot URL to verify');
