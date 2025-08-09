// scripts/test-with-example.js - Test Vision API with your example.jpg
import 'dotenv/config';
import { analyzeImages } from '../src/llm/analyze.js';
import { renderAnnotated } from '../src/render/canvas.js';
import { buildEmbed } from '../src/util/discord.js';
import { writeFileSync } from 'fs';
import { readFileSync } from 'fs';
import path from 'path';

console.log('🎯 **TESTING WITH YOUR EXAMPLE.JPG**\n');

// Check if example.jpg exists
const examplePath = 'example.jpg';
try {
  const stats = readFileSync(examplePath);
  console.log('📁 Found example.jpg:', stats.length, 'bytes');
} catch (e) {
  console.error('❌ Cannot find example.jpg in project root');
  process.exit(1);
}

// Convert local file to data URL for testing
const imageBuffer = readFileSync(examplePath);
const base64 = imageBuffer.toString('base64');
const dataUrl = `data:image/jpeg;base64,${base64}`;

console.log('🔧 **Environment Check:**');
console.log('   OPENAI_API_KEY:', process.env.OPENAI_API_KEY ? '✅ Set' : '❌ Missing');
console.log('   DISABLE_OCR_FALLBACK:', process.env.DISABLE_OCR_FALLBACK || 'false');
console.log('   Data URL length:', dataUrl.length, 'chars');

console.log('\n📡 **Testing Vision API with your example.jpg:**');

try {
  console.log('🚀 Making Vision API call...');
  const result = await analyzeImages({ 
    imageUrls: [dataUrl], 
    language: 'en' 
  });
  
  console.log('✅ **Vision API Success!**');
  console.log('   Messages found:', result.messages.length);
  console.log('   ELO:', result.elo);
  console.log('   Summary:', result.summary_line);
  console.log('   Ending:', result.ending);
  
  // Show first few messages with labels
  console.log('\n📝 **Messages with labels:**');
  result.messages.slice(0, 5).forEach((m, i) => {
    console.log(`   ${i+1}. [${m.side}] "${m.text.slice(0, 50)}${m.text.length > 50 ? '...' : ''}" → ${m.label}`);
  });
  
  // Show counts
  console.log('\n📊 **Label counts:**');
  Object.entries(result.counts).forEach(([label, count]) => {
    if (count > 0) console.log(`   ${label}: ${count}`);
  });
  
  // Test image rendering
  console.log('\n🎨 **Testing image rendering:**');
  try {
    const png = await renderAnnotated(result, [dataUrl]);
    writeFileSync('test-annotated-example.png', png);
    console.log('✅ Annotated image saved as: test-annotated-example.png');
    console.log('   PNG size:', png.length, 'bytes');
  } catch (renderErr) {
    console.error('❌ Image rendering failed:', renderErr.message);
  }
  
  // Test embed generation
  console.log('\n📋 **Testing embed generation:**');
  try {
    const embed = buildEmbed(result);
    console.log('✅ Embed generated successfully');
    console.log('   Title:', embed.data.title);
    console.log('   Color:', embed.data.color);
    console.log('   Fields:', embed.data.fields?.length || 0);
    
    // Show the moves list
    const movesField = embed.data.fields?.find(f => f.name === 'Moves');
    if (movesField) {
      console.log('\n🎯 **Moves list preview:**');
      console.log(movesField.value.split('\n').slice(0, 3).join('\n'));
      if (movesField.value.split('\n').length > 3) {
        console.log('   ... and more');
      }
    }
  } catch (embedErr) {
    console.error('❌ Embed generation failed:', embedErr.message);
  }
  
} catch (error) {
  console.error('❌ **Vision API Failed:**');
  console.error('   Error:', error.message);
  
  if (error.message.includes('timeout')) {
    console.log('\n💡 **Solution:** Vision API timeout - the image might be too complex');
  } else if (error.message.includes('API key')) {
    console.log('\n💡 **Solution:** Check your OPENAI_API_KEY in .env file');
  } else if (error.message.includes('quota') || error.message.includes('billing')) {
    console.log('\n💡 **Solution:** Check your OpenAI account billing and usage limits');
  } else if (error.message.includes('fetch failed')) {
    console.log('\n💡 **Solution:** Network issue - check internet connection and firewall');
  } else {
    console.log('\n🔍 **Debug info:**');
    console.log('   Full error:', error);
  }
}

console.log('\n🎯 **Next Steps:**');
console.log('   1. If this works: The issue is with Discord interaction timing');
console.log('   2. If this fails: We need to fix the Vision API connection first');
console.log('   3. Check the generated test-annotated-example.png to see the result');

