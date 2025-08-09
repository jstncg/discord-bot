import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';

// Initialize APIs
const openai = process.env.OPENAI_API_KEY ? new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
}) : null;

const gemini = process.env.GOOGLE_API_KEY ? new GoogleGenerativeAI(process.env.GOOGLE_API_KEY) : null;

export async function analyzeChat(imageUrl) {
  console.log('🎯 Starting chat analysis...');
  
  const prompt = `Analyze this chat screenshot and extract ALL message details for recreation. Return JSON:
{
  "messages": [
    {
      "side": "sender|receiver",
      "text": "exact message content", 
      "quality": "excellent|great|good|interesting|mistake|blunder"
    }
  ],
  "chat_style": {
    "background_color": "#f0f0f0",
    "sender_bubble_color": "#007AFF", 
    "receiver_bubble_color": "#E5E5EA",
    "sender_text_color": "white",
    "receiver_text_color": "black"
  },
  "summary": "Brief chat summary",
  "elo": 1500,
  "ending": "Chat ending assessment",
  "counts": {"great": 2, "good": 1}
}

CRITICAL REQUIREMENTS:
- Extract EXACT message text content
- Identify sender (right/colored) vs receiver (left/gray) messages
- Determine chat app style (iMessage, WhatsApp, etc)
- Rate each message quality
- I will RECREATE the entire chat from scratch
- Return ONLY JSON`;

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
  // Ensure required structure
  const result = {
    messages: [],
    chat_style: analysis.chat_style || {
      background_color: '#f0f0f0',
      sender_bubble_color: '#007AFF', 
      receiver_bubble_color: '#E5E5EA',
      sender_text_color: 'white',
      receiver_text_color: 'black'
    },
    summary: analysis.summary || analysis.summary_line || 'Chat analyzed',
    elo: analysis.elo || 1500,
    ending: analysis.ending || 'Standard chat',
    counts: analysis.counts || {}
  };
  
  // Process messages - no coordinates needed since we're generating from scratch
  if (analysis.messages && Array.isArray(analysis.messages)) {
    result.messages = analysis.messages.map((msg, i) => ({
      side: msg.side === 'sender' || msg.side === 'receiver' ? msg.side : 'receiver',
      text: msg.text || `Message ${i + 1}`,
      quality: msg.quality || msg.label || 'good'
    }));
  }
  
  // Recompute counts if empty
  if (Object.keys(result.counts).length === 0) {
    result.counts = {};
    result.messages.forEach(msg => {
      const q = msg.quality;
      result.counts[q] = (result.counts[q] || 0) + 1;
    });
  }
  
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
