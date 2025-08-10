// setup-gemini.js - Test Gemini API and set it as primary
import 'dotenv/config';
import { GoogleGenerativeAI } from '@google/generative-ai';

async function testGeminiAPI() {
  const apiKey = process.env.GOOGLE_API_KEY;
  
  if (!apiKey) {
    console.log('❌ No GOOGLE_API_KEY found in .env file');
    console.log('📝 Steps to get free Gemini API key:');
    console.log('   1. Go to: https://aistudio.google.com/app/apikey');
    console.log('   2. Sign in with Google account');
    console.log('   3. Click "Create API Key"');
    console.log('   4. Copy the key and add to your .env file:');
    console.log('      GOOGLE_API_KEY=your_key_here');
    console.log('      PREFER_GEMINI=true');
    return;
  }
  
  console.log('🔑 Testing Gemini API key...');
  
  try {
    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
    
    const result = await model.generateContent("Hello! Can you respond with just 'API test successful'?");
    const response = await result.response;
    const text = response.text();
    
    console.log('✅ Gemini API test successful!');
    console.log('📤 Response:', text);
    
    console.log('\n🎯 Next steps:');
    console.log('   1. Add PREFER_GEMINI=true to your .env file');
    console.log('   2. Restart your bot');
    console.log('   3. Gemini will be used for vision analysis');
    
    console.log('\n💡 Gemini advantages:');
    console.log('   • Better spatial understanding of chat bubbles');
    console.log('   • More accurate left/right side detection');
    console.log('   • Superior text recognition');
    console.log('   • Free tier with generous limits');
    
  } catch (error) {
    console.error('❌ Gemini API test failed:', error.message);
    
    if (error.message.includes('API_KEY_INVALID')) {
      console.log('🔑 Invalid API key. Get a new one from: https://aistudio.google.com/app/apikey');
    } else if (error.message.includes('quota')) {
      console.log('📊 Quota exceeded. Wait a moment and try again.');
    } else {
      console.log('🔍 Check your internet connection and API key.');
    }
  }
}

testGeminiAPI();


