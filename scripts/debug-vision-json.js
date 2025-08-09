// scripts/debug-vision-json.js - See exactly what JSON Vision API returns
import 'dotenv/config';
import OpenAI from 'openai';
import { systemPrompt, userPrompt } from '../src/llm/prompt.js';
import { readFileSync } from 'fs';

console.log('🔍 **DEBUGGING VISION API JSON OUTPUT**\n');

// Read your example image
const imageBuffer = readFileSync('example.jpg');
const base64 = imageBuffer.toString('base64');
const dataUrl = `data:image/jpeg;base64,${base64}`;

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
const model = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini';

console.log('📡 **Making direct OpenAI Vision API call...**');

try {
  const completion = await openai.chat.completions.create({
    model, 
    temperature: 0.2, 
    max_tokens: 1500,
    response_format: { type: 'json_object' },
    messages: [
      { role: 'system', content: systemPrompt('en') },
      {
        role: 'user',
        content: [
          { type: 'text', text: userPrompt({ imageUrls: [dataUrl] }) },
          { type: 'image_url', image_url: { url: dataUrl } }
        ]
      }
    ]
  });

  const raw = completion.choices?.[0]?.message?.content?.trim() || '{}';
  console.log('✅ **Raw JSON response:**');
  console.log('```json');
  console.log(raw);
  console.log('```');
  
  console.log('\n📝 **Parsing JSON...**');
  let json;
  try { 
    json = JSON.parse(raw);
    console.log('✅ JSON is valid');
  } catch (parseErr) {
    console.error('❌ JSON parse error:', parseErr.message);
    process.exit(1);
  }
  
  console.log('\n🔍 **Checking required fields:**');
  console.log('   summary_line:', typeof json.summary_line, json.summary_line ? `"${json.summary_line.slice(0,50)}..."` : 'MISSING');
  console.log('   elo:', typeof json.elo, json.elo);
  console.log('   ending:', typeof json.ending, json.ending ? `"${json.ending}"` : 'MISSING', json.ending?.length > 40 ? `(${json.ending.length} chars - TOO LONG)` : '');
  console.log('   messages:', Array.isArray(json.messages) ? `${json.messages.length} items` : 'NOT ARRAY');
  console.log('   counts:', typeof json.counts, json.counts ? Object.keys(json.counts).length + ' labels' : 'MISSING');
  
  if (json.messages && json.messages.length > 0) {
    console.log('\n📋 **First few messages:**');
    json.messages.slice(0, 3).forEach((msg, i) => {
      console.log(`   ${i+1}. [${msg.side || 'unknown'}] "${(msg.text || 'no text').slice(0, 40)}..." → ${msg.label || 'no label'}`);
      console.log(`      bbox: [${(msg.bbox || []).join(', ')}]`);
    });
  }
  
  console.log('\n🎯 **Issues to fix:**');
  const issues = [];
  
  if (!json.elo) {
    issues.push('❌ elo is missing - need to generate from counts');
  }
  if (json.ending && json.ending.length > 40) {
    issues.push(`❌ ending too long (${json.ending.length} chars) - need to truncate`);
  }
  if (!json.counts) {
    issues.push('❌ counts missing - need to generate from messages');
  }
  
  if (issues.length === 0) {
    console.log('✅ All required fields look good!');
  } else {
    issues.forEach(issue => console.log('   ' + issue));
  }
  
} catch (error) {
  console.error('❌ **Vision API call failed:**', error.message);
  if (error.response) {
    console.error('   Response status:', error.response.status);
    console.error('   Response data:', error.response.data);
  }
}

