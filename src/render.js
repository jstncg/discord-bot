import { createCanvas, loadImage, registerFont } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';

// Times New Roman is a system font, no need to register
const __dirname = path.dirname(fileURLToPath(import.meta.url));
console.log('📰 Using Times New Roman font for message rendering');

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
  // Use system font for measurements (matching the rendering font)
  tempCtx.font = '18px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif';
  console.log('📏 Measurement font:', tempCtx.font);
  
  messages.forEach((message, index) => {
    const maxBubbleWidth = canvasWidth * 0.75;
    const padding = 16;
    const lines = wrapTextForMeasurement(tempCtx, message.text, maxBubbleWidth - padding);
    const lineHeight = 18 * 1.2; // Match the measurement font size
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
    const bubbleRadius = 18; // iPhone iMessage corner radius (matching React component)
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
    
    // Draw seamless speech bubble with tail (inspired by React component)
    console.log(`🎨 Drawing seamless bubble for ${message.side} message ${index + 1}`);
    
    // Create seamless bubble path with smooth tail integration
    ctx.fillStyle = bubbleColor;
    ctx.beginPath();
    
    const radius = 18; // Match React component radius
    const tailHeight = 12;
    const tailWidth = 20;
    
    if (message.side === 'sender') {
      // Sent message bubble (right side with tail on bottom right)
      // Top edge
      ctx.moveTo(bubbleX, currentY + radius);
      ctx.quadraticCurveTo(bubbleX, currentY, bubbleX + radius, currentY);
      ctx.lineTo(bubbleX + bubbleWidth - radius, currentY);
      ctx.quadraticCurveTo(bubbleX + bubbleWidth, currentY, bubbleX + bubbleWidth, currentY + radius);
      
      // Right edge down to tail start
      ctx.lineTo(bubbleX + bubbleWidth, currentY + bubbleHeight - radius - tailHeight);
      
      // Seamless tail curve (smooth integration)
      ctx.quadraticCurveTo(
        bubbleX + bubbleWidth, 
        currentY + bubbleHeight - tailHeight, 
        bubbleX + bubbleWidth + tailWidth * 0.6, 
        currentY + bubbleHeight
      );
      ctx.quadraticCurveTo(
        bubbleX + bubbleWidth + tailWidth, 
        currentY + bubbleHeight, 
        bubbleX + bubbleWidth + tailWidth * 0.2, 
        currentY + bubbleHeight
      );
      ctx.quadraticCurveTo(
        bubbleX + bubbleWidth - 4, 
        currentY + bubbleHeight, 
        bubbleX + bubbleWidth - radius, 
        currentY + bubbleHeight
      );
      
      // Bottom edge
      ctx.lineTo(bubbleX + radius, currentY + bubbleHeight);
      ctx.quadraticCurveTo(bubbleX, currentY + bubbleHeight, bubbleX, currentY + bubbleHeight - radius);
      
      // Left edge
      ctx.lineTo(bubbleX, currentY + radius);
      
    } else {
      // Received message bubble (left side with tail on bottom left)
      // Top edge
      ctx.moveTo(bubbleX + radius, currentY);
      ctx.lineTo(bubbleX + bubbleWidth - radius, currentY);
      ctx.quadraticCurveTo(bubbleX + bubbleWidth, currentY, bubbleX + bubbleWidth, currentY + radius);
      
      // Right edge
      ctx.lineTo(bubbleX + bubbleWidth, currentY + bubbleHeight - radius);
      ctx.quadraticCurveTo(bubbleX + bubbleWidth, currentY + bubbleHeight, bubbleX + bubbleWidth - radius, currentY + bubbleHeight);
      
      // Bottom edge to tail start
      ctx.lineTo(bubbleX + radius + tailHeight, currentY + bubbleHeight);
      
      // Seamless tail curve (smooth integration)
      ctx.quadraticCurveTo(
        bubbleX + tailHeight * 0.2, 
        currentY + bubbleHeight, 
        bubbleX - tailWidth * 0.2, 
        currentY + bubbleHeight
      );
      ctx.quadraticCurveTo(
        bubbleX - tailWidth, 
        currentY + bubbleHeight, 
        bubbleX - tailWidth * 0.6, 
        currentY + bubbleHeight
      );
      ctx.quadraticCurveTo(
        bubbleX, 
        currentY + bubbleHeight - tailHeight, 
        bubbleX, 
        currentY + bubbleHeight - radius - tailHeight
      );
      
      // Left edge
      ctx.lineTo(bubbleX, currentY + radius);
      ctx.quadraticCurveTo(bubbleX, currentY, bubbleX + radius, currentY);
    }
    
    ctx.closePath();
    console.log(`   ✅ Seamless bubble with smooth tail created for ${message.side === 'sender' ? 'RIGHT' : 'LEFT'} side`);
    
    ctx.fill();
    
    // Reset all canvas state that might affect text rendering
    ctx.shadowColor = 'transparent';
    ctx.shadowBlur = 0;
    ctx.shadowOffsetX = 0;
    ctx.shadowOffsetY = 0;
    
    // Use consistent font size with measurements for proper text fitting
    const finalFontSize = 18; // Fixed size matching measurement font for consistency
    ctx.fillStyle = textColor;
    // Use system font for better compatibility
    ctx.font = `${finalFontSize}px -apple-system, BlinkMacSystemFont, "Segoe UI", Helvetica, Arial, sans-serif`;
    console.log(`🔤 Using font: ${ctx.font} for message ${index + 1}`);
    
    // Set text alignment for centering within bubble
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Calculate text position to center within the actual bubble (not including tail)
    const bubbleCenterX = bubbleX + bubbleWidth / 2;
    const bubbleCenterY = currentY + bubbleHeight / 2;
    
    // Calculate line spacing (matching measurement calculations)  
    const actualLineHeight = 18 * 1.2;
    const totalTextHeight = lines.length * actualLineHeight;
    const textStartY = bubbleCenterY - totalTextHeight / 2 + actualLineHeight / 2;
    
    console.log(`   📍 Text positioning: bubble center (${bubbleCenterX}, ${bubbleCenterY}), text start Y: ${textStartY}`);
    
    // Render each line of text centered in the bubble
    lines.forEach((line, lineIndex) => {
      const lineY = textStartY + (lineIndex * actualLineHeight);
      ctx.fillText(line, bubbleCenterX, lineY);
      console.log(`   📝 Line ${lineIndex + 1}: "${line}" at (${bubbleCenterX}, ${lineY})`);
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
    const tailWidth = 20; // Match the tail width from bubble drawing
    
    let badgeX, badgeY;
    
      if (bubble.side === 'sender') {
        // Sender messages → badge on LEFT of bubble (tail extends right)
        badgeX = Math.max(4, bubble.x - margin - badgeSize);
      } else {
        // Receiver messages → badge on RIGHT of bubble (tail extends left by tailWidth)  
        badgeX = Math.min(canvasWidth - badgeSize - 4, bubble.x + bubble.width + margin);
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