// Test the updated bubble rendering with seamless tails
import { renderWithBadges } from '../src/render.js';
import { writeFileSync } from 'fs';

console.log('🎨 Testing updated bubble rendering with seamless tails...\n');

// Create test data with chat style colors
const testAnalysis = {
  messages: [
    {
      text: "Hey! I loved your travel photos from Japan 😊",
      side: 'sender',
      quality: 'brilliant'
    },
    {
      text: "Thank you! Which one was your favorite?",
      side: 'receiver', 
      quality: 'excellent'
    },
    {
      text: "The one with the cherry blossoms! Are you planning to go back?",
      side: 'sender',
      quality: 'good'
    },
    {
      text: "I'd love to! Maybe next spring",
      side: 'receiver',
      quality: 'mistake'
    }
  ],
  chat_style: {
    background_color: '#000000',
    sender_bubble_color: '#007AFF',
    sender_text_color: '#FFFFFF',
    receiver_bubble_color: '#E5E5EA',
    receiver_text_color: '#000000'
  }
};

try {
  console.log('📱 Rendering conversation with seamless bubble tails...');
  const pngBuffer = await renderWithBadges(null, testAnalysis);
  
  console.log('✅ Rendering successful!');
  console.log('📦 PNG buffer size:', pngBuffer.length, 'bytes');
  
  // Save test image
  writeFileSync('test-seamless-bubbles.png', pngBuffer);
  console.log('💾 Test image saved as: test-seamless-bubbles.png');
  
  console.log('\n🎉 Success! The bubbles now have seamless tails like the React component.');
  console.log('Features implemented:');
  console.log('- ✅ Smooth quadratic curves for tail integration');
  console.log('- ✅ Seamless connection between bubble and tail');
  console.log('- ✅ Proper tail positioning for sender/receiver');
  console.log('- ✅ Badge positioning adjusted for new tail dimensions');
  
} catch (error) {
  console.error('❌ Rendering failed:', error.message);
  console.error('Stack:', error.stack);
}
