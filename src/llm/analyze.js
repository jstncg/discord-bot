// src/llm/analyze.js
import { safeParseReview } from '../schema/review.js';
import { analyzeWithBestVision } from './vision-apis.js';
import { eloFromCounts } from '../util/math.js';

// Conditional canvas import - graceful fallback if not installed
let canvas;
try {
  canvas = await import('canvas');
} catch (e) {
  console.warn('Canvas not available - some features may be disabled.');
  canvas = null;
}

/** Fast exponential backoff for 429/5xx */
async function withBackoff(fn, tries = 2, base = 500) {
  let last;
  for (let i = 0; i < tries; i++) {
    try { return await fn(); } catch (e) {
      last = e;
      const st = e?.status || e?.response?.status;
      // Only retry on server errors, not timeouts or client errors
      if (![429,500,502,503,504].includes(st)) break;
      if (i < tries - 1) { // Don't wait on last attempt
        console.log(`⏳ Retrying in ${base * (i + 1)}ms due to ${st} error...`);
        await new Promise(r => setTimeout(r, base * (i + 1)));
      }
    }
  }
  throw last;
}

/** Get image sizes for clamping */
export async function getImageMeta(urls) {
  if (!canvas) {
    // Fallback: assume standard mobile screenshot dimensions
    return urls.map(() => ({ width: 375, height: 667 }));
  }
  
  const sizes = [];
  for (const url of urls) {
    const img = await canvas.loadImage(url);
    sizes.push({ width: img.width, height: img.height });
  }
  return sizes;
}

/** Enhanced vision analysis with spatial optimization */
export async function analyzeImages({ imageUrls, language = 'en' }) {
  console.log('🔍 Starting enhanced image analysis for', imageUrls.length, 'images');
  const sizes = await getImageMeta(imageUrls);

  const run = async () => {
    // Use enhanced hybrid vision API (Gemini + OpenAI)
    let json = await analyzeWithBestVision({ imageUrls, language });

    // Robust field mappings and data sanitization
    console.log('🔧 Applying field mappings and sanitization...');
    
    // 1. Handle counts mapping with fallback generation
    if (json.counts_per_label && !json.counts) {
      json.counts = json.counts_per_label;
      delete json.counts_per_label;
    }
    if (!json.counts && json.messages?.length) {
      console.log('🔄 Generating counts from messages (API missed this)');
      json.counts = {};
      for (const m of json.messages) {
        if (m.label) json.counts[m.label] = (json.counts[m.label] || 0) + 1;
      }
    }
    
    // 2. Handle ELO conversion with guaranteed fallback
    if (json.overall_elo && !json.elo) {
      json.elo = eloFromCounts(json.counts || {});
      delete json.overall_elo;
    }
    if (typeof json.elo !== 'number') {
      console.log('🔄 Generating ELO from counts (API missed this)');
      json.elo = eloFromCounts(json.counts || {});
    }
    
    // 3. Sanitize message text fields (critical fix)
    if (json.messages?.length) {
      json.messages = json.messages.map((msg, i) => {
        if (!msg.text || msg.text.trim().length === 0) {
          console.log(`🔧 Fixing empty text for message ${i}`);
          msg.text = `[Message ${i + 1}]`; // Fallback for empty messages
        }
        // Ensure other required fields have defaults
        msg.side = msg.side || 'unknown';
        msg.label = msg.label || 'interesting'; 
        msg.confidence = typeof msg.confidence === 'number' ? msg.confidence : 0.5;
        msg.bbox = Array.isArray(msg.bbox) ? msg.bbox : [0, 0, 100, 50];
        msg.index = typeof msg.index === 'number' ? msg.index : i;
        return msg;
      });
    }
    
    // 4. Handle ending field length
    if (json.ending && json.ending.length > 40) {
      json.ending = json.ending.slice(0, 37) + '...';
    }
    if (!json.ending) {
      json.ending = 'Analysis complete';
    }
    
    // 5. Ensure summary_line is present
    if (!json.summary_line || json.summary_line.length < 3) {
      json.summary_line = 'Chat analysis completed successfully.';
    }

    // validate
    console.log('🔍 Validating JSON response...');
    const r = safeParseReview(json);
    if (!r.ok) throw r.error;
    const out = r.data;

    // build counts if missing
    if (!out.counts || !Object.keys(out.counts).length) {
      out.counts = {};
      for (const m of out.messages) out.counts[m.label] = (out.counts[m.label] || 0) + 1;
    }

    // clamp bboxes once
    out.messages = out.messages.map(m => {
      const page = Math.max(0, Math.min(m.image_index ?? 0, sizes.length - 1));
      const { width, height } = sizes[page];
      const [x,y,w,h] = [m.bbox[0], m.bbox[1], m.bbox[2], m.bbox[3]];
      const clamped = [
        Math.max(0, Math.min(x, width)),
        Math.max(0, Math.min(y, height)),
        Math.max(0, Math.min(w, width - Math.max(0, Math.min(x, width)))),
        Math.max(0, Math.min(h, height - Math.max(0, Math.min(y, height))))
      ];
      return { ...m, image_index: page, bbox: clamped };
    });

    // >>> Enhanced: merge lines into bubbles (preserve original positions for pixel-accurate edge detection)
    const { groupBubbles } = await import('../util/grouping.js');
    const { worseLabel } = await import('../util/severity.js');
    
    // Filter out invalid/tiny text detections before grouping
    out.messages = out.messages.filter(m => {
      // Remove very short text (likely OCR noise)
      if (!m.text || m.text.trim().length < 2) return false;
      
      // Remove single character detections (usually noise)  
      if (m.text.trim().length === 1 && !/[a-zA-Z0-9]/.test(m.text)) return false;
      
      // Remove very small bounding boxes (likely artifacts)
      const [x, y, w, h] = m.bbox;
      if (w < 10 || h < 10) return false;
      
      return true;
    });
    
    console.log(`🧹 Filtered to ${out.messages.length} valid message detections`);

    // Group overlapping messages into bubbles
    out.messages = groupBubbles(out.messages);
    
    // Final validation: If still too many bubbles, apply emergency grouping
    if (out.messages.length > 12) {
      console.warn(`⚠️ ${out.messages.length} bubbles detected - applying emergency consolidation`);
      
      // Emergency: Group by alternating sides and close Y positions
      const consolidated = [];
      let currentSenderGroup = null;
      let currentReceiverGroup = null;
      
      for (const msg of out.messages) {
        if (msg.side === 'sender') {
          if (!currentSenderGroup || 
              Math.abs(msg.bbox[1] - (currentSenderGroup.bbox[1] + currentSenderGroup.bbox[3])) > 100) {
            // Start new sender group
            if (currentSenderGroup) consolidated.push(currentSenderGroup);
            currentSenderGroup = { ...msg };
          } else {
            // Merge into current sender group
            const [x1, y1, x2, y2] = [
              Math.min(currentSenderGroup.bbox[0], msg.bbox[0]),
              Math.min(currentSenderGroup.bbox[1], msg.bbox[1]), 
              Math.max(currentSenderGroup.bbox[0] + currentSenderGroup.bbox[2], msg.bbox[0] + msg.bbox[2]),
              Math.max(currentSenderGroup.bbox[1] + currentSenderGroup.bbox[3], msg.bbox[1] + msg.bbox[3])
            ];
            currentSenderGroup.bbox = [x1, y1, x2-x1, y2-y1];
            currentSenderGroup.text += '\n' + msg.text;
            currentSenderGroup.label = worseLabel(currentSenderGroup.label, msg.label);
          }
        } else {
          if (!currentReceiverGroup || 
              Math.abs(msg.bbox[1] - (currentReceiverGroup.bbox[1] + currentReceiverGroup.bbox[3])) > 100) {
            // Start new receiver group
            if (currentReceiverGroup) consolidated.push(currentReceiverGroup);
            currentReceiverGroup = { ...msg };
          } else {
            // Merge into current receiver group
            const [x1, y1, x2, y2] = [
              Math.min(currentReceiverGroup.bbox[0], msg.bbox[0]),
              Math.min(currentReceiverGroup.bbox[1], msg.bbox[1]), 
              Math.max(currentReceiverGroup.bbox[0] + currentReceiverGroup.bbox[2], msg.bbox[0] + msg.bbox[2]),
              Math.max(currentReceiverGroup.bbox[1] + currentReceiverGroup.bbox[3], msg.bbox[1] + msg.bbox[3])
            ];
            currentReceiverGroup.bbox = [x1, y1, x2-x1, y2-y1];
            currentReceiverGroup.text += '\n' + msg.text;
            currentReceiverGroup.label = worseLabel(currentReceiverGroup.label, msg.label);
          }
        }
      }
      
      // Add final groups
      if (currentSenderGroup) consolidated.push(currentSenderGroup);
      if (currentReceiverGroup) consolidated.push(currentReceiverGroup);
      
      // Re-sort and re-index
      out.messages = consolidated.sort((a,b)=> (a.image_index - b.image_index) || (a.bbox[1]-b.bbox[1]) || (a.bbox[0]-b.bbox[0]));
      out.messages.forEach((m, i)=> (m.index = i));
      
      console.log(`🚨 Emergency consolidation: reduced to ${out.messages.length} bubbles`);
    }
    
    // Skip spatial repositioning for pixel-accurate edge detection
    // Note: enhanceBubblePositions moves bubbles to standard locations,
    // but pixel-accurate rendering needs original Vision API positions
    console.log('🎯 Preserving original bubble positions for pixel-accurate edge detection');

    // recompute counts from merged messages
    out.counts = {};
    for (const m of out.messages) out.counts[m.label] = (out.counts[m.label] || 0) + 1;

    // keep elo sane if not provided
    if (typeof out.elo !== 'number') out.elo = eloFromCounts(out.counts);

    console.log('✅ Enhanced analysis complete! Found', out.messages.length, 'bubbles, ELO:', out.elo);
    console.log('🎯 Provider used:', json._provider || 'unknown');
    return { ...out, _sizes: sizes };
  };

  try { 
    console.log('🚀 Attempting Vision API call with backoff...');
    return await withBackoff(run); 
  }
  catch (e) {
    console.warn('❌ Vision API failed:', e.message);
    
    // Enhanced error context for debugging
    if (e.message.includes('timeout')) {
      console.log('💡 Vision API timed out - consider reducing image complexity or size');
    } else if (e.message.includes('rate limit') || e.status === 429) {
      console.log('💡 Rate limited - implement exponential backoff or reduce request frequency');
    } else if (e.status >= 500) {
      console.log('💡 OpenAI server error - this is usually temporary');
    } else if (e.message.includes('API key')) {
      console.log('💡 Authentication issue - check OPENAI_API_KEY environment variable');
    }
    
    const OCR_DISABLED = process.env.DISABLE_OCR_FALLBACK === 'true';
    if (!OCR_DISABLED) {
      console.log('🔄 Attempting OCR fallback...');
      try {
        return await ocrFallback({ imageUrls, language });
      } catch (ocrError) {
        console.warn('❌ OCR fallback also failed:', ocrError.message);
        // Generate a minimal valid response as last resort
        return createEmergencyFallback(imageUrls, sizes);
      }
    }
    
    // If OCR is disabled, create emergency fallback
    console.log('🚨 Creating emergency fallback response...');
    return createEmergencyFallback(imageUrls, sizes);
  }
}

/** OCR fallback: rough bubbles from Tesseract lines */
async function ocrFallback({ imageUrls, language }) {
  const { createWorker } = await import('tesseract.js');
  const sizes = await getImageMeta(imageUrls);
  const worker = await createWorker('eng');
  const messages = [];
  let idx = 0;

  for (let i = 0; i < imageUrls.length; i++) {
    const res = await worker.recognize(imageUrls[i]);
    const lines = res.data?.lines || [];
    for (const ln of lines) {
      const { x0, y0, x1, y1, text } = ln;
      if (!text?.trim()) continue;
      const w = x1 - x0, h = y1 - y0;
      const mid = sizes[i].width / 2;
      const side = x0 > mid ? 'sender' : 'receiver';
      messages.push({
        index: idx++,
        side, text: text.trim(),
        bbox: [x0, y0, w, h],
        image_index: i,
        label: 'interesting',
        confidence: 0.4
      });
    }
  }
  await worker.terminate();

  // If no messages found, create a simple fallback
  if (messages.length === 0) {
    console.warn('⚠️ OCR found no readable text, creating minimal fallback');
    messages.push({
      index: 0,
      side: 'unknown',
      text: 'Chat content could not be read clearly',
      bbox: [50, 100, 200, 50],
      image_index: 0,
      label: 'interesting',
      confidence: 0.3
    });
  }

  const counts = messages.reduce((acc, m)=>((acc[m.label]=(acc[m.label]||0)+1),acc),{});
  return {
    summary_line: 'OCR fallback used; text recognition was challenging.',
    elo: eloFromCounts(counts),
    ending: 'draw',
    messages, counts, _sizes: sizes
  };
}

/** Emergency fallback: Creates minimal valid response when all analysis fails */
function createEmergencyFallback(imageUrls, sizes) {
  console.log('🚨 Generating emergency fallback for', imageUrls.length, 'images');
  
  const messages = [{
    index: 0,
    side: 'unknown',
    text: 'Unable to analyze chat content - please try uploading a clearer image.',
    bbox: [50, 100, 300, 50],
    image_index: 0,
    label: 'interesting',
    confidence: 0.3
  }];
  
  const counts = { interesting: 1 };
  
  return {
    summary_line: 'Analysis unavailable due to technical limitations.',
    elo: eloFromCounts(counts),
    ending: 'Analysis incomplete',
    messages,
    counts,
    _sizes: sizes
  };
}



