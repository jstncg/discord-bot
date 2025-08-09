// src/util/image.js - Efficient pixel analysis for precise edge detection

/**
 * Creates cached image data for fast pixel access across stitched pages
 * @param {CanvasRenderingContext2D} ctx - Canvas context after stitching
 * @param {{width:number, height:number}[]} pages - Page dimensions
 * @returns {{data: Uint8ClampedArray, w: number, h: number, yOffset: number}[]}
 */
export function makeImageDataCache(ctx, pages) {
  console.log('📊 Building pixel data cache for', pages.length, 'pages...');
  const caches = [];
  let currentY = 0;
  
  for (let i = 0; i < pages.length; i++) {
    const { width: w, height: h } = pages[i];
    
    // Single expensive getImageData call per page
    const imageData = ctx.getImageData(0, currentY, w, h);
    
    caches.push({
      data: imageData.data,
      w: w,
      h: h,
      yOffset: currentY
    });
    
    currentY += h;
    console.log(`   Page ${i}: ${w}×${h}px cached (${(imageData.data.length / 1024).toFixed(1)}KB)`);
  }
  
  console.log('✅ Pixel cache built:', caches.length, 'pages');
  return caches;
}

/**
 * Fast pixel getter with bounds checking
 * @param {{data: Uint8ClampedArray, w: number, h: number}[]} cache - Image data cache
 * @param {number} page - Page index
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate (relative to page)
 * @returns {{r: number, g: number, b: number}}
 */
export function pxAt(cache, page, x, y) {
  const pageCache = cache[page];
  if (!pageCache) return { r: 0, g: 0, b: 0 };
  
  // Clamp to page bounds
  x = Math.max(0, Math.min(x, pageCache.w - 1));
  y = Math.max(0, Math.min(y, pageCache.h - 1));
  
  // Fast integer index calculation: (y * width + x) * 4 channels
  const i = (y * pageCache.w + x) << 2;
  const data = pageCache.data;
  
  return {
    r: data[i],
    g: data[i + 1], 
    b: data[i + 2]
    // Skip alpha channel for speed
  };
}

/**
 * Luminance calculation (perceived brightness)
 * @param {number} r - Red (0-255)
 * @param {number} g - Green (0-255)
 * @param {number} b - Blue (0-255)
 * @returns {number} Luminance (0-255)
 */
export function luma(r, g, b) {
  // Standard luminance formula optimized for integer math
  return Math.round(0.2126 * r + 0.7152 * g + 0.0722 * b);
}

/**
 * Squared color distance in RGB space (faster than sqrt)
 * @param {{r:number, g:number, b:number}} a - First color
 * @param {{r:number, g:number, b:number}} b - Second color  
 * @returns {number} Squared distance
 */
export function colorDist2(a, b) {
  const dr = a.r - b.r;
  const dg = a.g - b.g;
  const db = a.b - b.b;
  return dr * dr + dg * dg + db * db;
}

/**
 * Scans horizontal stripes to find precise bubble edge
 * @param {Object} params - Scan parameters
 * @param {Array} params.cache - Image data cache
 * @param {number} params.page - Page index
 * @param {[number,number,number,number]} params.bbox - Bubble bounding box [x,y,w,h]
 * @param {'sender'|'receiver'} params.side - Which side to scan
 * @param {number} params.stripeH - Half-height of stripe area (default: 14)
 * @param {number} params.step - Scanning step size (default: 1)
 * @param {number} params.edgePad - Padding from bbox edge (default: 4)
 * @returns {{xEdge: number, yStripe: number}}
 */
export function scanEdge({ cache, page, bbox, side, stripeH = 14, step = 1, edgePad = 4 }) {
  const [bx, by, bw, bh] = bbox;
  const yMid = by + Math.round(bh / 2);
  
  // 1. Calculate local bubble color by sampling interior
  const bubbleColor = calculateBubbleColor(cache, page, bbox);
  
  // 2. Define stripe Y positions to try
  const stripeYs = [
    yMid,
    yMid - Math.round(bh * 0.25),
    yMid + Math.round(bh * 0.25)
  ].filter(y => y >= by + 2 && y <= by + bh - 2); // Keep within bubble bounds
  
  let bestEdge = null;
  let bestScore = 0;
  
  // 3. Scan each stripe for strongest edge
  for (const stripeY of stripeYs) {
    const result = scanStripeForEdge({
      cache, page, bubbleColor, stripeY, 
      bbox, side, edgePad, step
    });
    
    if (result.score > bestScore) {
      bestScore = result.score;
      bestEdge = { xEdge: result.xEdge, yStripe: stripeY };
    }
  }
  
  // 4. Fallback to centerline method if no good edge found
  if (!bestEdge || bestScore < 10) {
    console.log('⚠️ Weak edge signal, using fallback positioning');
    const fallbackX = side === 'sender' ? bx + bw : bx;
    return { xEdge: fallbackX, yStripe: yMid };
  }
  
  return bestEdge;
}

/**
 * Calculates representative bubble color by sampling interior points
 */
function calculateBubbleColor(cache, page, bbox) {
  const [bx, by, bw, bh] = bbox;
  const inset = Math.min(6, Math.floor(Math.min(bw, bh) * 0.15));
  
  // Sample 9 points in 3x3 grid within inset area
  const samples = [];
  for (let gy = 0; gy < 3; gy++) {
    for (let gx = 0; gx < 3; gx++) {
      const x = bx + inset + Math.round((gx / 2) * (bw - 2 * inset));
      const y = by + inset + Math.round((gy / 2) * (bh - 2 * inset));
      
      const px = pxAt(cache, page, x, y);
      const luminance = luma(px.r, px.g, px.b);
      
      // Discard very dark pixels (likely text)
      if (luminance >= 60) {
        samples.push(px);
      }
    }
  }
  
  // If we have enough good samples, average them
  if (samples.length >= 5) {
    const avgR = Math.round(samples.reduce((s, p) => s + p.r, 0) / samples.length);
    const avgG = Math.round(samples.reduce((s, p) => s + p.g, 0) / samples.length);  
    const avgB = Math.round(samples.reduce((s, p) => s + p.b, 0) / samples.length);
    return { r: avgR, g: avgG, b: avgB };
  }
  
  // Fallback: use median of all samples including dark ones
  const allSamples = [];
  for (let gy = 0; gy < 3; gy++) {
    for (let gx = 0; gx < 3; gx++) {
      const x = bx + inset + Math.round((gx / 2) * (bw - 2 * inset));
      const y = by + inset + Math.round((gy / 2) * (bh - 2 * inset));
      allSamples.push(pxAt(cache, page, x, y));
    }
  }
  
  // Simple median calculation
  allSamples.sort((a, b) => luma(a.r, a.g, a.b) - luma(b.r, b.g, b.b));
  return allSamples[Math.floor(allSamples.length / 2)];
}

/**
 * Scans a single horizontal stripe for the strongest edge
 */
function scanStripeForEdge({ cache, page, bubbleColor, stripeY, bbox, side, edgePad, step }) {
  const [bx, by, bw, bh] = bbox;
  
  let bestX = -1;
  let bestScore = 0;
  
  // Define scan range and direction
  const scanRange = Math.min(40, Math.floor(Math.min(bw, bh) * 0.8));
  let startX, endX, direction;
  
  if (side === 'receiver') {
    // Scan leftward from inside bubble toward outside
    startX = bx + edgePad;
    endX = Math.max(0, startX - scanRange);
    direction = -step;
  } else {
    // Scan rightward from inside bubble toward outside  
    startX = bx + bw - edgePad;
    endX = Math.min(cache[page].w - 1, startX + scanRange);
    direction = step;
  }
  
  // Scan from inside bubble outward looking for strongest edge
  for (let x = startX; side === 'receiver' ? x >= endX : x <= endX; x += direction) {
    const px = pxAt(cache, page, x, stripeY);
    
    // Calculate gradient (edge strength)
    const prevPx = pxAt(cache, page, x - direction, stripeY);
    const nextPx = pxAt(cache, page, x + direction, stripeY);
    
    const prevLuma = luma(prevPx.r, prevPx.g, prevPx.b);
    const nextLuma = luma(nextPx.r, nextPx.g, nextPx.b);
    const grad = Math.abs(nextLuma - prevLuma);
    
    // Calculate color difference from bubble interior
    const delta = colorDist2(px, bubbleColor);
    
    // Combined score: gradient strength + color divergence from bubble
    const score = grad * 2 + Math.sqrt(delta);
    
    if (score > bestScore) {
      bestScore = score;
      bestX = x;
    }
  }
  
  return {
    xEdge: bestX >= 0 ? bestX : startX,
    score: bestScore
  };
}
