// src/llm/vision-apis.js - Multi-provider vision API with optimized performance
import { GoogleGenerativeAI } from '@google/generative-ai';
import OpenAI from 'openai';
import { systemPrompt, userPrompt } from './prompt.js';

// Performance optimization: Initialize clients once
let geminiClient, openaiClient;

const initClients = () => {
  if (!geminiClient && process.env.GOOGLE_API_KEY) {
    geminiClient = new GoogleGenerativeAI(process.env.GOOGLE_API_KEY);
  }
  if (!openaiClient && process.env.OPENAI_API_KEY) {
    openaiClient = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
};

/** Enhanced Gemini Vision API with superior spatial understanding */
async function callGeminiVision({ imageUrls, language = 'en' }) {
  console.log('🚀 Using Gemini Vision API for enhanced spatial analysis...');
  
  if (!process.env.GOOGLE_API_KEY) {
    throw new Error('GOOGLE_API_KEY not found - add to .env file');
  }
  
  initClients();
  
  // Use Gemini Pro Vision model optimized for spatial understanding
  const model = geminiClient.getGenerativeModel({ 
    model: 'gemini-pro-vision',
    generationConfig: {
      temperature: 0.1, // Lower for more consistent bbox detection
      topK: 1,
      topP: 0.8,
      maxOutputTokens: 2048,
    }
  });

  // Enhanced prompt specifically for better bubble detection
  const enhancedPrompt = `${systemPrompt(language)}

CRITICAL: Focus on detecting complete MESSAGE BUBBLES, not individual text lines.
Each bubble is a rounded rectangle containing one or more lines of text.
For bounding boxes: measure the ENTIRE bubble including padding, not just text.
- sender bubbles: typically on right side, colored (purple/blue)
- receiver bubbles: typically on left side, gray/white
- bbox format: [x, y, width, height] where (x,y) is top-left corner

${userPrompt({ imageUrls })}`;

  // Convert image URLs to proper format for Gemini
  const imageParts = await Promise.all(imageUrls.map(async (url, index) => {
    try {
      // Handle both data URLs and HTTP URLs efficiently
      if (url.startsWith('data:')) {
        const base64Data = url.split(',')[1];
        const mimeType = url.split(';')[0].split(':')[1];
        return {
          inlineData: {
            data: base64Data,
            mimeType: mimeType
          }
        };
      } else {
        // For HTTP URLs, fetch and convert to base64
        const response = await fetch(url);
        const buffer = await response.arrayBuffer();
        const base64 = Buffer.from(buffer).toString('base64');
        const mimeType = response.headers.get('content-type') || 'image/jpeg';
        
        return {
          inlineData: {
            data: base64,
            mimeType: mimeType
          }
        };
      }
    } catch (error) {
      console.warn(`⚠️ Failed to process image ${index}:`, error.message);
      throw new Error(`Failed to process image ${index}: ${error.message}`);
    }
  }));

  // Call Gemini with timeout
  const result = await Promise.race([
    model.generateContent([enhancedPrompt, ...imageParts]),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('Gemini Vision API timed out after 30 seconds')), 30000)
    )
  ]);

  const response = await result.response;
  const text = response.text();
  
  console.log('✅ Gemini Vision API response received');
  
  // Parse JSON response
  let json;
  try {
    // Gemini sometimes wraps JSON in code blocks
    const cleanText = text.replace(/```json\s*|\s*```/g, '').trim();
    json = JSON.parse(cleanText);
  } catch (e) {
    throw new Error(`Gemini returned invalid JSON: ${e.message}`);
  }

  return json;
}

/** Optimized OpenAI Vision API fallback */
async function callOpenAIVision({ imageUrls, language = 'en' }) {
  console.log('🔄 Using OpenAI Vision API as fallback...');
  
  if (!process.env.OPENAI_API_KEY) {
    throw new Error('OPENAI_API_KEY not found - add to .env file');
  }
  
  initClients();
  
  const model = process.env.OPENAI_VISION_MODEL || 'gpt-4o-mini';
  
  const completion = await Promise.race([
    openaiClient.chat.completions.create({
      model, 
      temperature: 0.2, 
      max_tokens: 1500,
      response_format: { type: 'json_object' },
      messages: [
        { role: 'system', content: systemPrompt(language) },
        {
          role: 'user',
          content: [
            { type: 'text', text: userPrompt({ imageUrls }) },
            ...imageUrls.map(u => ({ type: 'image_url', image_url: { url: u } }))
          ]
        }
      ]
    }),
    new Promise((_, reject) => 
      setTimeout(() => reject(new Error('OpenAI Vision API timed out after 30 seconds')), 30000)
    )
  ]);

  const raw = completion.choices?.[0]?.message?.content?.trim() || '{}';
  
  try {
    return JSON.parse(raw);
  } catch (e) {
    throw new Error(`OpenAI returned invalid JSON: ${e.message}`);
  }
}

/** 
 * Hybrid vision API - tries Gemini first for better spatial accuracy, 
 * falls back to OpenAI if needed 
 */
export async function analyzeWithBestVision({ imageUrls, language = 'en' }) {
  const preferGemini = process.env.PREFER_GEMINI !== 'false';
  const hasGeminiKey = !!process.env.GOOGLE_API_KEY;
  const hasOpenAIKey = !!process.env.OPENAI_API_KEY;
  
  if (!hasGeminiKey && !hasOpenAIKey) {
    throw new Error('Either GOOGLE_API_KEY or OPENAI_API_KEY is required');
  }
  
  // Strategy: Try Gemini first if available and preferred, otherwise OpenAI
  if (preferGemini && hasGeminiKey) {
    try {
      const result = await callGeminiVision({ imageUrls, language });
      console.log('🎯 Gemini Vision API successful - using enhanced spatial analysis');
      return { ...result, _provider: 'gemini' };
    } catch (geminiError) {
      console.warn('⚠️ Gemini Vision failed:', geminiError.message);
      
      if (hasOpenAIKey) {
        console.log('🔄 Falling back to OpenAI Vision API...');
        try {
          const result = await callOpenAIVision({ imageUrls, language });
          return { ...result, _provider: 'openai-fallback' };
        } catch (openaiError) {
          throw new Error(`Both vision APIs failed. Gemini: ${geminiError.message}, OpenAI: ${openaiError.message}`);
        }
      } else {
        throw geminiError;
      }
    }
  } else if (hasOpenAIKey) {
    try {
      const result = await callOpenAIVision({ imageUrls, language });
      console.log('🤖 OpenAI Vision API successful');
      return { ...result, _provider: 'openai' };
    } catch (openaiError) {
      if (hasGeminiKey) {
        console.log('🔄 Falling back to Gemini Vision API...');
        try {
          const result = await callGeminiVision({ imageUrls, language });
          return { ...result, _provider: 'gemini-fallback' };
        } catch (geminiError) {
          throw new Error(`Both vision APIs failed. OpenAI: ${openaiError.message}, Gemini: ${geminiError.message}`);
        }
      } else {
        throw openaiError;
      }
    }
  } else {
    throw new Error('No vision API available - check your API keys');
  }
}

