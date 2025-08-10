import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// Initialize APIs
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

const gemini = process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null;

export async function analyzeChat(imageUrl) {
  console.log('🎯 Starting chat analysis...');
  
  const prompt = `ANALYZE THIS CHAT SCREENSHOT for exact recreation. Look carefully at bubble positioning:

CRITICAL VISUAL IDENTIFICATION:
- Look at the ACTUAL VISUAL POSITION of each bubble in the image
- PURPLE/COLORED bubbles = SENDER (regardless of left/right position)  
- GRAY/WHITE bubbles = RECEIVER (regardless of left/right position)
- Do NOT assume based on typical chat layouts - use ACTUAL COLORS
- Extract the EXACT text from each bubble
- Get precise HEX color values from the image

Return JSON:
{
  "messages": [
    {
      "side": "sender|receiver",
      "text": "exact message text with no changes",
      "quality": "excellent|great|good|interesting|mistake|blunder"
    }
  ],
  "chat_style": {
    "background_color": "#EXACT_HEX_COLOR",
    "sender_bubble_color": "#EXACT_HEX_COLOR", 
    "receiver_bubble_color": "#EXACT_HEX_COLOR",
    "sender_text_color": "#EXACT_HEX_COLOR",
    "receiver_text_color": "#EXACT_HEX_COLOR"
  },
  "summary": "Brief witty summary",
  "elo": 1400,
  "ending": "Chat outcome",
  "counts": {"great": 2, "good": 1}
}

ACCURACY REQUIREMENTS:
1. RIGHT SIDE = sender, LEFT SIDE = receiver (DO NOT FLIP)
2. Extract EXACT hex colors from image pixels
3. Copy message text WORD-FOR-WORD
4. Rate message quality/humor appropriately
5. Return ONLY valid JSON`;

  // Try Gemini first (better for spatial analysis)
  if (gemini) {
    try {
      console.log('🚀 Trying Gemini Vision API (recommended)...');
      const result = await callGemini(imageUrl, prompt);
      console.log('✅ Gemini analysis successful');
      return result;
    } catch (error) {
      console.warn('⚠️ Gemini failed:', error.message);
    }
  }

  // Fallback to OpenAI
  if (openai) {
    try {
      console.log('🔄 Falling back to OpenAI Vision...');
      const result = await callOpenAI(imageUrl, prompt);
      console.log('✅ OpenAI analysis successful');
      return result;
    } catch (error) {
      console.error('❌ OpenAI failed:', error.message);
    }
  }

  // Last resort fallback
  console.warn('🆘 All APIs failed, using fallback data');
  return getFallbackAnalysis();
}

async function callGemini(imageUrl, prompt) {
  const model = gemini.getGenerativeModel({ model: 'gemini-1.5-flash' }); // Fixed model name
  
  // Fetch image
  const response = await fetch(imageUrl);
  const buffer = await response.arrayBuffer();
  
  const image = {
    inlineData: {
      data: Buffer.from(buffer).toString('base64'),
      mimeType: response.headers.get('content-type') || 'image/png'
    }
  };
  
  const result = await model.generateContent([prompt, image]);
  const text = await result.response.text();
  
  // Extract JSON from response
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in response');
  
  const analysis = JSON.parse(jsonMatch[0]);
  
  // Validate and fix structure
  return validateAnalysis(analysis);
}

async function callOpenAI(imageUrl, prompt) {
  const response = await openai.chat.completions.create({
    model: 'gpt-4o-mini',
    messages: [{
      role: 'user',
      content: [
        { type: 'text', text: prompt },
        { type: 'image_url', image_url: { url: imageUrl, detail: 'high' }}
      ]
    }],
    max_tokens: 2048,
    temperature: 0.1
  });
  
  const text = response.choices[0].message.content;
  const jsonMatch = text.match(/\{[\s\S]*\}/);
  if (!jsonMatch) throw new Error('No JSON found in response');
  
  const analysis = JSON.parse(jsonMatch[0]);
  return validateAnalysis(analysis);
}

function validateAnalysis(analysis) {
  console.log('🔧 Validating analysis and color data...');
  
  // Ensure required structure with improved color handling
  const result = {
    messages: [],
    chat_style: {
      background_color: analysis.chat_style?.background_color || '#F5F5F5',
      sender_bubble_color: analysis.chat_style?.sender_bubble_color || '#6D5ACF', 
      receiver_bubble_color: analysis.chat_style?.receiver_bubble_color || '#E5E5E7',
      sender_text_color: analysis.chat_style?.sender_text_color || 'white',
      receiver_text_color: analysis.chat_style?.receiver_text_color || 'black'
    },
    summary: analysis.summary || analysis.summary_line || 'Chat analyzed',
    elo: analysis.elo || 1500,
    ending: analysis.ending || 'Standard chat',
    counts: analysis.counts || {}
  };
  
  // Process messages with strict sender/receiver validation
  if (analysis.messages && Array.isArray(analysis.messages)) {
    result.messages = analysis.messages.map((msg, i) => {
      const side = msg.side;
      if (side !== 'sender' && side !== 'receiver') {
        console.warn(`⚠️ Invalid side "${side}" for message ${i}, defaulting to receiver`);
      }
      
      return {
        side: side === 'sender' || side === 'receiver' ? side : 'receiver',
        text: (msg.text || '').trim() || `Message ${i + 1}`,
        quality: msg.quality || msg.label || 'good'
      };
    });
  }
  
  // Validate color format (should be hex)
  Object.keys(result.chat_style).forEach(key => {
    const color = result.chat_style[key];
    if (color && !color.startsWith('#')) {
      result.chat_style[key] = '#' + color.replace('#', '');
    }
  });
  
  // Recompute counts if empty
  if (Object.keys(result.counts).length === 0) {
    result.counts = {};
    result.messages.forEach(msg => {
      const q = msg.quality;
      result.counts[q] = (result.counts[q] || 0) + 1;
    });
  }
  
  console.log(`✅ Validated: ${result.messages.length} messages, colors: ${JSON.stringify(result.chat_style)}`);
  return result;
}

function getFallbackAnalysis() {
  return {
    messages: [
      { side: 'sender', text: 'Hey there!', quality: 'great' },
      { side: 'receiver', text: 'Hello!', quality: 'good' },
      { side: 'sender', text: 'How are you?', quality: 'good' }
    ],
    chat_style: {
      background_color: '#f0f0f0',
      sender_bubble_color: '#007AFF', 
      receiver_bubble_color: '#E5E5EA',
      sender_text_color: 'white',
      receiver_text_color: 'black'
    },
    summary: 'Fallback analysis - APIs unavailable',
    elo: 1500,
    ending: 'Friendly conversation',
    counts: { great: 1, good: 2 }
  };
}
