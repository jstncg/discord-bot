// scripts/debug-field-mapping.js - Debug field mapping issues with Discord URLs
import 'dotenv/config';
import OpenAI from 'openai';
import { systemPrompt, userPrompt } from '../src/llm/prompt.js';
import { eloFromCounts } from '../src/util/math.js';
import { safeParseReview } from '../src/schema/review.js';

console.log('🔍 **DEBUGGING FIELD MAPPING ISSUES**\n');

// Use a real Discord CDN URL format (these expire quickly, so test with current ones)
// For this test, we'll use the same data URL approach but simulate Discord processing
const testImageUrl = 'https://cdn.discordapp.com/attachments/123/456/test.png';

console.log('🧪 **Testing Field Mapping Logic Isolation**\n');

// Test the eloFromCounts function directly
console.log('🔧 **Testing eloFromCounts function:**');
const testCounts1 = { brilliant: 1, great: 2, good: 1 };
const testCounts2 = {};
const testCounts3 = null;

console.log('   With counts {brilliant:1, great:2, good:1}:', eloFromCounts(testCounts1));
console.log('   With empty counts {}:', eloFromCounts(testCounts2));
console.log('   With null counts:', eloFromCounts(testCounts3));

// Simulate the exact field mapping logic from analyze.js
console.log('\n🔧 **Testing Field Mapping Logic:**');

// Mock responses that match what we've seen from the API
const mockApiResponse1 = {
  messages: [
    { index: 0, side: 'sender', text: 'test', bbox: [0,0,100,50], label: 'great', confidence: 0.9 }
  ],
  summary_line: 'Test conversation',
  counts_per_label: { great: 1 },
  ending: 'Overall, a humorous chat with a touch of sarcasm.',
  overall_elo: 'great'
};

const mockApiResponse2 = {
  messages: [
    { index: 0, side: 'sender', text: 'test', bbox: [0,0,100,50], label: 'brilliant', confidence: 0.9 }
  ],
  summary_line: 'Test conversation',
  // Missing counts_per_label and overall_elo entirely
  ending: 'Test ending'
};

function testFieldMapping(mockResponse, testName) {
  console.log(`\n📋 **Test: ${testName}**`);
  console.log('   Original response:', JSON.stringify(mockResponse, null, 2));
  
  // Apply the exact same logic from analyze.js
  let json = JSON.parse(JSON.stringify(mockResponse)); // Deep clone
  
  console.log('\n🔧 **Step 1: Fix field mappings**');
  if (json.counts_per_label && !json.counts) {
    console.log('   → Mapping counts_per_label to counts:', json.counts_per_label);
    json.counts = json.counts_per_label;
    delete json.counts_per_label;
  } else {
    console.log('   → No counts_per_label found or counts already exists');
  }
  
  if (json.overall_elo && !json.elo) {
    console.log('   → Converting overall_elo to numeric elo using counts:', json.counts || {});
    json.elo = eloFromCounts(json.counts || {});
    console.log('   → Computed elo:', json.elo, '(type:', typeof json.elo, ')');
    delete json.overall_elo;
  } else {
    console.log('   → No overall_elo found or elo already exists');
  }
  
  if (json.ending && json.ending.length > 40) {
    console.log('   → Truncating ending from', json.ending.length, 'to 40 chars');
    json.ending = json.ending.slice(0, 37) + '...';
  }
  
  console.log('\n📋 **After field mapping:**');
  console.log('   elo:', json.elo, '(type:', typeof json.elo, ')');
  console.log('   counts:', json.counts);
  console.log('   ending:', json.ending, '(length:', json.ending?.length, ')');
  
  // Test validation
  console.log('\n🔍 **Validation test:**');
  const validationResult = safeParseReview(json);
  if (validationResult.ok) {
    console.log('   ✅ Validation passed!');
    console.log('   → Final elo:', validationResult.data.elo);
  } else {
    console.log('   ❌ Validation failed:', validationResult.error.errors);
  }
  
  return validationResult.ok;
}

testFieldMapping(mockApiResponse1, 'Normal API response with counts_per_label and overall_elo');
testFieldMapping(mockApiResponse2, 'API response missing optional fields');

console.log('\n🎯 **Testing with Real OpenAI Call:**');

// Create a simple test image data URL
const simpleTestImage = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';

try {
  const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  
  console.log('📡 Making real OpenAI call with minimal image...');
  const completion = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    temperature: 0.2,
    max_tokens: 800,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt('en') },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt({ imageUrls: [simpleTestImage] }) },
          { type: 'image_url', image_url: { url: simpleTestImage } }
        ]
      }
    ]
  });

  const raw = completion.choices?.[0]?.message?.content?.trim() || '{}';
  console.log('✅ Raw API response:');
  console.log('```json');
  console.log(raw);
  console.log('```');
  
  let json = JSON.parse(raw);
  console.log('\n🔧 **Applying field mappings to real response:**');
  const success = testFieldMapping(json, 'Real OpenAI Response');
  
  if (success) {
    console.log('\n🎉 **SUCCESS: Real API response works with field mapping!**');
  } else {
    console.log('\n❌ **FAILURE: Real API response still failing after field mapping**');
  }
  
} catch (apiError) {
  console.error('❌ OpenAI API call failed:', apiError.message);
  console.log('   → This might be a network, auth, or quota issue');
}

console.log('\n💡 **Analysis & Recommendations:**');
console.log('1. Check if eloFromCounts is actually being called and returning a number');
console.log('2. Verify the order of field mapping operations');
console.log('3. Add defensive programming with fallback values');
console.log('4. Consider the API response format might be changing between calls');
console.log('5. Implement more robust error handling with detailed logging');

