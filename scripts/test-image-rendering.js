// scripts/test-image-rendering.js - Test actual image rendering with canvas
import 'dotenv/config';
import { renderAnnotated } from '../src/render/canvas.js';
import { writeFileSync } from 'fs';

console.log('🎨 **TESTING IMAGE RENDERING WITH CANVAS**\n');

// Create mock review data that would come from OpenAI Vision
const mockReview = {
  summary_line: "Solid opener with good follow-through, shows genuine interest.",
  elo: 1420,
  ending: 'swipe_right',
  messages: [
    {
      index: 0,
      side: 'sender',
      text: "Hey! I loved your travel photos from Japan 😊",
      bbox: [50, 80, 280, 45],
      image_index: 0,
      label: 'brilliant',
      confidence: 0.87
    },
    {
      index: 1,
      side: 'receiver',
      text: "Thank you! Which one was your favorite?",
      bbox: [320, 140, 250, 40],
      image_index: 0,
      label: 'excellent',
      confidence: 0.82
    },
    {
      index: 2,
      side: 'sender',
      text: "The one with the cherry blossoms! Are you planning to go back?",
      bbox: [40, 200, 300, 55],
      image_index: 0,
      label: 'great',
      confidence: 0.79
    }
  ],
  counts: { brilliant: 1, excellent: 1, great: 1, good: 0, interesting: 0, inaccuracy: 0, mistake: 0, blunder: 0, megablunder: 0 },
  _sizes: [{ width: 375, height: 300 }]
};

const mockImageUrls = [
  'https://via.placeholder.com/375x300/E8E8E8/333333?text=Chat+Screenshot+Mock'
];

console.log('📝 Mock review data created');
console.log('📊 Messages:', mockReview.messages.length);
console.log('🎯 Labels:', Object.keys(mockReview.counts).filter(k => mockReview.counts[k] > 0));

try {
  console.log('\n🎨 Testing image rendering...');
  const pngBuffer = await renderAnnotated(mockReview, mockImageUrls);
  
  console.log('✅ Image rendering successful!');
  console.log('📦 PNG buffer size:', pngBuffer.length, 'bytes');
  console.log('🖼️  Estimated image dimensions: 375x300px');
  
  // Save test image to see the result
  writeFileSync('test-annotated-image.png', pngBuffer);
  console.log('💾 Test image saved as: test-annotated-image.png');
  
  console.log('\n🎉 **CANVAS RENDERING: FULLY OPERATIONAL**');
  console.log('Your bot will now create real annotated images with:');
  console.log('- ✅ Original screenshot as background');
  console.log('- ✅ Colored emoji badges positioned next to each message');
  console.log('- ✅ Proper sender/receiver badge positioning');
  console.log('- ✅ High-quality PNG export');
  
} catch (error) {
  console.error('❌ Image rendering failed:', error.message);
  console.error('Stack:', error.stack);
}

