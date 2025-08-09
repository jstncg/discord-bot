// src/llm/textingtheory-style.js - Analysis inspired by TextingTheory bot
import { detectByPattern, createManualDetection } from '../util/manual-detection.js';

/**
 * Analyzes images using TextingTheory bot-inspired approach
 */
export async function analyzeTextingTheoryStyle({ imageUrls, language = 'en', useManualDetection = false }) {
  console.log('🎯 Using TextingTheory-style analysis approach');
  
  const sizes = await getImageMeta(imageUrls);
  const firstImageSize = sizes[0];
  
  if (useManualDetection) {
    console.log('📋 Using manual detection for reliable badge placement');
    const messages = createManualDetection(firstImageSize.width, firstImageSize.height);
    
    return {
      messages,
      counts: generateCounts(messages),
      elo: 1400,
      ending: 'Ongoing',
      summary_line: 'Manual detection used for precise badge placement',
      _sizes: sizes
    };
  }
  
  // Try Vision API first, but with different processing
  try {
    const visionResult = await callVisionAPI({ imageUrls, language });
    
    if (visionResult && visionResult.messages?.length) {
      console.log(`🔍 Vision API returned ${visionResult.messages.length} raw detections`);
      
      // Use pattern-based correction instead of aggressive grouping
      const correctedMessages = detectByPattern(
        visionResult.messages, 
        firstImageSize.width, 
        firstImageSize.height
      );
      
      return {
        messages: correctedMessages,
        counts: generateCounts(correctedMessages),
        elo: visionResult.elo || 1400,
        ending: visionResult.ending || 'Ongoing',
        summary_line: visionResult.summary_line || 'TextingTheory-style analysis',
        _sizes: sizes
      };
    }
    
  } catch (error) {
    console.warn('⚠️ Vision API failed, falling back to manual detection:', error.message);
  }
  
  // Fallback to manual detection
  const messages = createManualDetection(firstImageSize.width, firstImageSize.height);
  
  return {
    messages,
    counts: generateCounts(messages),
    elo: 1400,
    ending: 'Ongoing', 
    summary_line: 'Fallback to manual detection for reliable results',
    _sizes: sizes
  };
}

async function getImageMeta(imageUrls) {
  const { loadImage } = await import('canvas');
  
  const metas = [];
  for (const url of imageUrls) {
    try {
      const img = await loadImage(url);
      metas.push({ width: img.width, height: img.height });
    } catch (error) {
      console.warn('⚠️ Could not load image for metadata:', error.message);
      metas.push({ width: 400, height: 800 }); // Default mobile dimensions
    }
  }
  return metas;
}

async function callVisionAPI({ imageUrls, language }) {
  // Import the existing Vision API system
  const { analyzeWithBestVision } = await import('./vision-apis.js');
  
  try {
    const result = await analyzeWithBestVision({ imageUrls, language });
    return result;
  } catch (error) {
    console.error('Vision API call failed:', error.message);
    return null;
  }
}

function generateCounts(messages) {
  const counts = {};
  for (const msg of messages) {
    counts[msg.label] = (counts[msg.label] || 0) + 1;
  }
  return counts;
}

/**
 * Alternative approach: Extract conversation pattern from TextingTheory bot
 * This creates a conversation structure similar to their system
 */
export function createTextingTheoryConversation(messages) {
  // Convert our message format to TextingTheory format
  const conversation = messages.map((msg, index) => ({
    side: msg.side === 'sender' ? 'right' : 'left', // Their format uses left/right
    content: msg.text || `Message ${index + 1}`,
    classification: mapLabelToClassification(msg.label)
  }));
  
  return conversation;
}

function mapLabelToClassification(label) {
  // Map our labels to TextingTheory classifications
  const mapping = {
    'superbrilliant': 'SUPERBRILLIANT',
    'brilliant': 'BRILLIANT', 
    'excellent': 'EXCELLENT',
    'great': 'GREAT',
    'good': 'GOOD',
    'interesting': 'INTERESTING',
    'inaccuracy': 'INACCURACY',
    'mistake': 'MISTAKE',
    'blunder': 'BLUNDER',
    'megablunder': 'MEGABLUNDER'
  };
  
  return mapping[label] || 'GOOD';
}

