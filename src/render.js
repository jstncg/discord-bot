import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';

// Register Inter font for authentic typography with error handling
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const fontPath = path.join(__dirname, '..', 'fonts', 'Inter_24pt-Regular.ttf');

try {
  // Try registering with different family names to see what works
  registerFont(fontPath, { family: 'Inter' });
  registerFont(fontPath, { family: 'Inter Regular' });
  registerFont(fontPath, { family: 'Inter_24pt-Regular' });
  
  console.log('✅ Inter font registered with multiple names:', fontPath);
  
  // Test all font names
  const testCanvas = createCanvas(100, 100);
  const testCtx = testCanvas.getContext('2d');
  
  testCtx.font = '20px Inter';
  testCtx.font = '20px "Inter Regular"';  
  testCtx.font = '20px "Inter_24pt-Regular"';
  
  console.log('🔍 Font test - Inter availability with all variants completed');
} catch (error) {
  console.error('❌ Failed to register Inter font:', error.message);
  console.error('   Font path:', fontPath);
  console.error('🚨 Will fallback to system fonts');
}

// Quality to badge image mapping per user requirements
const BADGE_MAPPING = {
  // Incredibly Good (above excellent) → brilliant.png
  superbrilliant: 'brilliant.png',
  brilliant: 'brilliant.png',
  
  // Excellent → excellent move.png
  excellent: 'excellent move.png',
  
  // Good → good move.png
  great: 'good move.png',
  good: 'good move.png',
  
  // Bad → mistake.png
  interesting: 'mistake.png',  // Neutral/boring = bad
  inaccuracy: 'mistake.png',
  mistake: 'mistake.png',
  
  // Horrible → blunder.png
  blunder: 'blunder.png',
  megablunder: 'blunder.png'
};

export async function renderWithBadges(originalImageUrl, analysis) {
  console.log(`🎨 Generating EXACT recreation with ${analysis.messages.length} messages...`);
  console.log(`🎨 Using extracted colors:`, analysis.chat_style);
  
  const messages = analysis.messages;
  const style = analysis.chat_style;
  
  // Proper phone screenshot proportions (vertical aspect ratio) 
  const canvasWidth = 375; // iPhone standard width
  const sidePadding = 20; // iPhone side margins + space for tails (16 + 4)
  const topPadding = 15; // Minimal top space - tight crop
  const bottomPadding = 15; // Minimal bottom space - tight crop
  const messagePadding = 8; // Space between messages to prevent overlap
  
  // Pre-calculate bubble heights for dynamic canvas sizing
  let totalHeight = topPadding + bottomPadding;
  const bubbleData = [];
  
  // Temporary context for measurements
  const tempCanvas = createCanvas(100, 100);
  const tempCtx = tempCanvas.getContext('2d');
  // Try Inter font with fallbacks for measurements
  tempCtx.font = '20px Inter, "Inter Regular", "Inter_24pt-Regular", -apple-system, sans-serif';
  console.log('📏 Measurement font:', tempCtx.font);
  
  messages.forEach((message, index) => {
    const maxBubbleWidth = canvasWidth * 0.75;
    const padding = 16;
    const lines = wrapTextForMeasurement(tempCtx, message.text, maxBubbleWidth - padding);
    const lineHeight = 20 * 1.2;
    const textHeight = lines.length * lineHeight;
    const bubbleHeight = Math.max(40, textHeight + padding);
    
    bubbleData.push({ 
      height: bubbleHeight,
      lines: lines,
      maxLineWidth: Math.max(...lines.map(line => tempCtx.measureText(line).width))
    });
    
    totalHeight += bubbleHeight;
    if (index < messages.length - 1) totalHeight += messagePadding; // Add spacing except after last message
  });
  
  const canvasHeight = totalHeight;
  
  // Create fresh canvas
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  
  // Draw iPhone background (maintain extracted colors) - tightly cropped
  ctx.fillStyle = style.background_color || '#000000';
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  console.log('📱 Drawing tightly cropped iPhone conversation...');
  
  // Track bubble positions for badge placement
  const bubblePositions = [];
  
  // Draw each message bubble using pre-calculated dimensions
  let currentY = topPadding;
  
  messages.forEach((message, index) => {
    const bubbleRadius = 20; // iPhone iMessage corner radius
    const bubbleInfo = bubbleData[index];
    const bubbleHeight = bubbleInfo.height;
    const lines = bubbleInfo.lines;
    
    const maxBubbleWidth = canvasWidth * 0.75;
    const padding = 16;
    const bubbleWidth = Math.min(maxBubbleWidth, Math.max(60, bubbleInfo.maxLineWidth + padding));
    
    let bubbleX, textX;
    let bubbleColor, textColor;
    
    console.log(`   💬 Message ${index + 1}: "${message.text.slice(0, 30)}..." - Side: ${message.side}`);
    
    if (message.side === 'sender') {
      // SENDER messages = RIGHT ALIGNED (iMessage blue/colored bubbles)
      bubbleX = canvasWidth - bubbleWidth - sidePadding;
      textX = bubbleX + bubbleWidth / 2;
      bubbleColor = style.sender_bubble_color;
      textColor = style.sender_text_color || '#FFFFFF';
      console.log(`     📱 SENDER (right): ${bubbleColor} / ${textColor}`);
    } else {
      // RECEIVER messages = LEFT ALIGNED (iMessage gray bubbles with contrast)
      bubbleX = sidePadding;
      textX = bubbleX + bubbleWidth / 2;
      bubbleColor = ensureContrast(style.receiver_bubble_color, style.background_color);
      textColor = style.receiver_text_color || '#000000';
      console.log(`     📱 RECEIVER (left): ${bubbleColor} / ${textColor}`);
    }
    
    // Draw message bubble (rounded rectangle) with subtle shadow
    if (message.side === 'sender') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetY = 1;
    }
    
    // COMPLETELY REWRITTEN: Single continuous speech bubble path (NO separate shapes!)
    console.log(`🎨 Drawing UNIFIED speech bubble for ${message.side} message ${index + 1}`);
    
    // Create ONE path for entire bubble INCLUDING tail (no beginPath/closePath separation)
    ctx.fillStyle = bubbleColor;
    ctx.beginPath();
    
    const radius = bubbleRadius;
    const tailSize = 10;
    
    if (message.side === 'sender') {
      // SENDER BUBBLE - Rounded rectangle with RIGHT tail built into the path
      const tailY = currentY + bubbleHeight - 20;
      
      // Single continuous path: Start -> Top -> Right -> TAIL -> Bottom -> Left -> Close
      ctx.moveTo(bubbleX + radius, currentY);
      
      // Top edge
      ctx.lineTo(bubbleX + bubbleWidth - radius, currentY);
      ctx.quadraticCurveTo(bubbleX + bubbleWidth, currentY, bubbleX + bubbleWidth, currentY + radius);
      
      // Right edge with INTEGRATED tail
      ctx.lineTo(bubbleX + bubbleWidth, tailY);
      ctx.lineTo(bubbleX + bubbleWidth + tailSize, tailY + tailSize/2); // Tail point  
      ctx.lineTo(bubbleX + bubbleWidth, tailY + tailSize);
      ctx.lineTo(bubbleX + bubbleWidth, currentY + bubbleHeight - radius);
      
      // Bottom edge
      ctx.quadraticCurveTo(bubbleX + bubbleWidth, currentY + bubbleHeight, bubbleX + bubbleWidth - radius, currentY + bubbleHeight);
      ctx.lineTo(bubbleX + radius, currentY + bubbleHeight);
      
      // Left edge  
      ctx.quadraticCurveTo(bubbleX, currentY + bubbleHeight, bubbleX, currentY + bubbleHeight - radius);
      ctx.lineTo(bubbleX, currentY + radius);
      ctx.quadraticCurveTo(bubbleX, currentY, bubbleX + radius, currentY);
      
    } else {
      // RECEIVER BUBBLE - Rounded rectangle with LEFT tail built into the path
      const tailY = currentY + bubbleHeight - 20;
      
      // Single continuous path: Start -> Top -> Right -> Bottom -> Left -> TAIL -> Close
      ctx.moveTo(bubbleX + radius, currentY);
      
      // Top edge
      ctx.lineTo(bubbleX + bubbleWidth - radius, currentY);
      ctx.quadraticCurveTo(bubbleX + bubbleWidth, currentY, bubbleX + bubbleWidth, currentY + radius);
      
      // Right edge
      ctx.lineTo(bubbleX + bubbleWidth, currentY + bubbleHeight - radius);
      
      // Bottom edge
      ctx.quadraticCurveTo(bubbleX + bubbleWidth, currentY + bubbleHeight, bubbleX + bubbleWidth - radius, currentY + bubbleHeight);
      ctx.lineTo(bubbleX + radius, currentY + bubbleHeight);
      
      // Left edge with INTEGRATED tail
      ctx.quadraticCurveTo(bubbleX, currentY + bubbleHeight, bubbleX, currentY + bubbleHeight - radius);
      ctx.lineTo(bubbleX, tailY + tailSize);
      ctx.lineTo(bubbleX - tailSize, tailY + tailSize/2); // Tail point
      ctx.lineTo(bubbleX, tailY);
      ctx.lineTo(bubbleX, currentY + radius);
      ctx.quadraticCurveTo(bubbleX, currentY, bubbleX + radius, currentY);
    }
    
    ctx.closePath();
    console.log(`   ✅ Single path created with ${message.side === 'sender' ? 'RIGHT' : 'LEFT'} tail integrated`);
    
    ctx.fill();
    ctx.shadowColor = 'transparent'; // Reset shadow
    
    // Render text with calculated font size (fills ~90% of bubble height)
    const finalFontSize = Math.max(16, bubbleHeight * 0.7); // 70% of bubble height, minimum 16px
    ctx.fillStyle = textColor;
    // Try different Inter font names to ensure it works
    const fontOptions = [
      `${finalFontSize}px Inter, -apple-system, sans-serif`,
      `${finalFontSize}px "Inter Regular", -apple-system, sans-serif`, 
      `${finalFontSize}px "Inter_24pt-Regular", -apple-system, sans-serif`
    ];
    
    // Use the first font option for now
    ctx.font = fontOptions[0];
    console.log(`🔤 Using font: ${ctx.font} for message ${index + 1}`);
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Enable crisp text rendering for iPhone-like quality
    ctx.textRenderingOptimization = 'optimizeQuality';
    
    // Render text lines with exact spacing
    const actualLineHeight = finalFontSize * 1.15;
    const totalTextHeight = lines.length * actualLineHeight;
    const startY = currentY + bubbleHeight / 2 - totalTextHeight / 2 + actualLineHeight / 2;
    
    lines.forEach((line, lineIndex) => {
      ctx.fillText(line, textX, startY + (lineIndex * actualLineHeight));
    });
    
    // Store bubble position for badge placement
    bubblePositions.push({
      side: message.side,
      x: bubbleX,
      y: currentY,
      width: bubbleWidth,
      height: bubbleHeight,
      quality: message.quality
    });
    
    console.log(`   💬 ${message.side} bubble: "${message.text.slice(0, 30)}..." at (${bubbleX}, ${currentY})`);
    
    // Update Y position for next message (prevent overlap)
    currentY += bubbleHeight + messagePadding;
  });
  
  // Now add quality badges
  console.log('🏷️  Adding quality badges...');
  const placedBadges = [];
  
  // Load and place badge images for iPhone layout - proportional to larger bubbles
  for (let index = 0; index < bubblePositions.length; index++) {
    const bubble = bubblePositions[index];
    const badgeFile = BADGE_MAPPING[bubble.quality] || 'good move.png';
    const badgeSize = 30; // Larger badges to match proportional text and bubbles
    const margin = 14; // Proportional margins
    
    let badgeX, badgeY;
    
      if (bubble.side === 'sender') {
        // Sender messages → badge on LEFT of bubble (account for right-pointing tail extending 12px right)
        badgeX = Math.max(4, bubble.x - margin - badgeSize);
      } else {
        // Receiver messages → badge on RIGHT of bubble (account for left-pointing tail extending 12px left)  
        const tailOffset = 12; // Left-pointing tail extends 12px left from bubble
        badgeX = Math.min(canvasWidth - badgeSize - 4, bubble.x + bubble.width + margin + tailOffset);
      }
    
    // Center badge vertically with bubble
    badgeY = bubble.y + bubble.height / 2 - badgeSize / 2;
    
    // Avoid collisions
    const adjustedY = avoidCollisions(badgeX + badgeSize/2, badgeY + badgeSize/2, badgeSize/2, placedBadges);
    badgeY = adjustedY - badgeSize/2;
    
    // Clamp to canvas bounds
    badgeX = Math.max(0, Math.min(canvasWidth - badgeSize, badgeX));
    badgeY = Math.max(0, Math.min(canvasHeight - badgeSize, badgeY));
    
    try {
      // Load and draw badge image with high-DPI support
      const badgePath = path.join(__dirname, '..', 'image assets', badgeFile);
      const badgeImage = await loadImage(badgePath);
      
      // Enable image smoothing for crisp badges
      ctx.imageSmoothingEnabled = true;
      ctx.imageSmoothingQuality = 'high';
      
      ctx.drawImage(badgeImage, badgeX, badgeY, badgeSize, badgeSize);
      
      // Record badge position
      placedBadges.push({ x: badgeX + badgeSize/2, y: badgeY + badgeSize/2, radius: badgeSize/2 });
      
      console.log(`   📱 Badge ${index + 1}: ${bubble.quality} → ${badgeFile} at (${badgeX}, ${badgeY}) for ${bubble.side} message`);
      
    } catch (error) {
      console.warn(`⚠️ Failed to load badge ${badgeFile}:`, error.message);
      console.warn(`⚠️ Attempted path: ${path.join(__dirname, '..', 'image assets', badgeFile)}`);
      
      // Enhanced fallback with better visual quality
      ctx.beginPath();
      ctx.arc(badgeX + badgeSize/2, badgeY + badgeSize/2, badgeSize/2, 0, Math.PI * 2);
      const isGood = ['good', 'great', 'excellent', 'brilliant', 'superbrilliant'].includes(bubble.quality);
      ctx.fillStyle = isGood ? '#10B981' : '#EF4444';
      ctx.fill();
      ctx.strokeStyle = '#FFFFFF';
      ctx.lineWidth = 2;
      ctx.stroke();
      
      placedBadges.push({ x: badgeX + badgeSize/2, y: badgeY + badgeSize/2, radius: badgeSize/2 });
    }
  }
  
  console.log(`📱 Generated tightly cropped iPhone conversation with ${placedBadges.length} quality badges`);
  return canvas.toBuffer('image/png');
}

function wrapText(ctx, text, maxWidth) {
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0];

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines;
}

function wrapTextForMeasurement(ctx, text, maxWidth) {
  // Same as wrapText but for measurement purposes
  const words = text.split(' ');
  const lines = [];
  let currentLine = words[0] || '';

  for (let i = 1; i < words.length; i++) {
    const word = words[i];
    const width = ctx.measureText(currentLine + ' ' + word).width;
    if (width < maxWidth) {
      currentLine += ' ' + word;
    } else {
      lines.push(currentLine);
      currentLine = word;
    }
  }
  lines.push(currentLine);
  return lines.filter(line => line.trim()); // Remove empty lines
}

function avoidCollisions(x, y, radius, existingBadges) {
  let newY = y;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    let hasCollision = false;
    
    for (const existing of existingBadges) {
      const distance = Math.sqrt((x - existing.x) ** 2 + (newY - existing.y) ** 2);
      const minDistance = radius + existing.radius + 8;
      
      if (distance < minDistance) {
        hasCollision = true;
        break;
      }
    }
    
    if (!hasCollision) break;
    
    // Try moving down
    attempts++;
    newY += 15;
  }
  
  return newY;
}



function ensureContrast(bubbleColor, backgroundColor) {
  // Ensure receiver bubbles have proper contrast against background
  if (!bubbleColor || !backgroundColor) return '#E5E5EA'; // Default iOS gray
  
  // Convert hex to RGB for contrast calculation
  const bubbleRGB = hexToRGB(bubbleColor);
  const bgRGB = hexToRGB(backgroundColor);
  
  if (!bubbleRGB || !bgRGB) return '#E5E5EA';
  
  // Calculate contrast ratio using luminance
  const bubbleLum = getLuminance(bubbleRGB);
  const bgLum = getLuminance(bgRGB);
  const contrast = (Math.max(bubbleLum, bgLum) + 0.05) / (Math.min(bubbleLum, bgLum) + 0.05);
  
  // If contrast is too low, use default iOS receiver bubble color
  if (contrast < 1.5) {
    return '#E5E5EA'; // Standard iOS receiver bubble color
  }
  
  return bubbleColor;
}

function hexToRGB(hex) {
  const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
  return result ? {
    r: parseInt(result[1], 16),
    g: parseInt(result[2], 16),
    b: parseInt(result[3], 16)
  } : null;
}

function getLuminance(rgb) {
  const rsRGB = rgb.r / 255;
  const gsRGB = rgb.g / 255;
  const bsRGB = rgb.b / 255;
  
  const r = rsRGB <= 0.03928 ? rsRGB / 12.92 : Math.pow((rsRGB + 0.055) / 1.055, 2.4);
  const g = gsRGB <= 0.03928 ? gsRGB / 12.92 : Math.pow((gsRGB + 0.055) / 1.055, 2.4);
  const b = bsRGB <= 0.03928 ? bsRGB / 12.92 : Math.pow((bsRGB + 0.055) / 1.055, 2.4);
  
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}