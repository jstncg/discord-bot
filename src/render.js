import { createCanvas, loadImage } from 'canvas';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Quality to badge image mapping
const BADGE_MAPPING = {
  // Good/positive messages → brilliant badge
  excellent: 'brilliant.png',
  great: 'brilliant.png', 
  good: 'brilliant.png',
  brilliant: 'brilliant.png',
  superbrilliant: 'brilliant.png',
  
  // Bad/negative messages → blunder badge
  interesting: 'blunder.png',  // Neutral/boring = bad
  mistake: 'blunder.png',
  inaccuracy: 'blunder.png', 
  blunder: 'blunder.png',
  megablunder: 'blunder.png'
};

export async function renderWithBadges(originalImageUrl, analysis) {
  console.log(`🎨 Generating EXACT recreation with ${analysis.messages.length} messages...`);
  console.log(`🎨 Using extracted colors:`, analysis.chat_style);
  
  const messages = analysis.messages;
  const style = analysis.chat_style;
  
  // Calculate canvas dimensions to match original screenshot proportions
  const canvasWidth = 800;
  const messageHeight = 75;
  const padding = 30;
  const canvasHeight = Math.max(600, messages.length * messageHeight + padding * 2);
  
  // Create fresh canvas
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  
  // Draw background
  ctx.fillStyle = style.background_color;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  console.log('🖼️  Drawing fresh chat interface...');
  
  // Track bubble positions for badge placement
  const bubblePositions = [];
  
  // Draw each message bubble with exact positioning to match original
  messages.forEach((message, index) => {
    const y = padding + (index * messageHeight);
    const bubbleRadius = 20;
    // More realistic bubble sizing based on text length
    const bubbleWidth = Math.min(500, Math.max(100, message.text.length * 8 + 60));
    const bubbleHeight = Math.max(45, Math.min(65, Math.ceil(message.text.length / 40) * 25 + 35));
    
    let bubbleX, textX;
    let bubbleColor, textColor;
    
    console.log(`   💬 Message ${index + 1}: "${message.text.slice(0, 30)}..." - Side: ${message.side}`);
    
    if (message.side === 'sender') {
      // SENDER messages = COLORED BUBBLES (usually right aligned)
      bubbleX = canvasWidth - bubbleWidth - padding - 20;
      textX = bubbleX + bubbleWidth / 2;
      bubbleColor = style.sender_bubble_color;
      textColor = style.sender_text_color;
      console.log(`     🟣 SENDER (colored): Using ${bubbleColor} / ${textColor}`);
    } else {
      // RECEIVER messages = GRAY/WHITE BUBBLES (usually left aligned)
      bubbleX = padding + 20;
      textX = bubbleX + bubbleWidth / 2;
      bubbleColor = style.receiver_bubble_color;
      textColor = style.receiver_text_color;
      console.log(`     ⚪ RECEIVER (gray): Using ${bubbleColor} / ${textColor}`);
    }
    
    // Draw message bubble (rounded rectangle) with subtle shadow
    if (message.side === 'sender') {
      ctx.shadowColor = 'rgba(0, 0, 0, 0.1)';
      ctx.shadowBlur = 2;
      ctx.shadowOffsetY = 1;
    }
    
    ctx.fillStyle = bubbleColor;
    ctx.beginPath();
    ctx.roundRect(bubbleX, y, bubbleWidth, bubbleHeight, bubbleRadius);
    ctx.fill();
    ctx.shadowColor = 'transparent'; // Reset shadow
    
    // Draw message text with better typography
    ctx.fillStyle = textColor;
    ctx.font = '15px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Wrap text if too long
    const maxWidth = bubbleWidth - 30;
    const lines = wrapText(ctx, message.text, maxWidth);
    const lineHeight = 19;
    const totalTextHeight = lines.length * lineHeight;
    const startY = y + bubbleHeight / 2 - totalTextHeight / 2 + lineHeight / 2;
    
    lines.forEach((line, lineIndex) => {
      ctx.fillText(line, textX, startY + (lineIndex * lineHeight));
    });
    
    // Store bubble position for badge placement
    bubblePositions.push({
      side: message.side,
      x: bubbleX,
      y: y,
      width: bubbleWidth,
      height: bubbleHeight,
      quality: message.quality
    });
    
    console.log(`   💬 ${message.side} bubble: "${message.text.slice(0, 30)}..." at (${bubbleX}, ${y})`);
  });
  
  // Now add quality badges
  console.log('🏷️  Adding quality badges...');
  const placedBadges = [];
  
  // Load and place badge images
  for (let index = 0; index < bubblePositions.length; index++) {
    const bubble = bubblePositions[index];
    const badgeFile = BADGE_MAPPING[bubble.quality] || 'brilliant.png';
    const badgeSize = 32; // Badge image size
    const margin = 25;
    
    let badgeX, badgeY;
    
    if (bubble.side === 'sender') {
      // Sender messages → badge on LEFT of bubble
      badgeX = bubble.x - margin - badgeSize;
    } else {
      // Receiver messages → badge on RIGHT of bubble  
      badgeX = bubble.x + bubble.width + margin;
    }
    
    badgeY = bubble.y + bubble.height / 2 - badgeSize / 2;
    
    // Avoid collisions
    const adjustedY = avoidCollisions(badgeX + badgeSize/2, badgeY + badgeSize/2, badgeSize/2, placedBadges);
    badgeY = adjustedY - badgeSize/2;
    
    // Clamp to canvas bounds
    badgeX = Math.max(0, Math.min(canvasWidth - badgeSize, badgeX));
    badgeY = Math.max(0, Math.min(canvasHeight - badgeSize, badgeY));
    
    try {
      // Load and draw badge image
      const badgePath = path.join(__dirname, '../image assets', badgeFile);
      const badgeImage = await loadImage(badgePath);
      
      ctx.drawImage(badgeImage, badgeX, badgeY, badgeSize, badgeSize);
      
      // Record badge position
      placedBadges.push({ x: badgeX + badgeSize/2, y: badgeY + badgeSize/2, radius: badgeSize/2 });
      
      console.log(`   🏷️  Badge ${index + 1}: ${bubble.quality} → ${badgeFile} at (${badgeX}, ${badgeY}) for ${bubble.side} message`);
      
    } catch (error) {
      console.warn(`⚠️ Failed to load badge ${badgeFile}:`, error.message);
      // Fallback to simple colored circle
      ctx.beginPath();
      ctx.arc(badgeX + badgeSize/2, badgeY + badgeSize/2, badgeSize/2, 0, Math.PI * 2);
      ctx.fillStyle = bubble.quality.includes('good') || bubble.quality.includes('great') || bubble.quality.includes('excellent') ? '#10B981' : '#EF4444';
      ctx.fill();
    }
  }
  
  console.log(`✅ Generated completely new chat image with ${placedBadges.length} quality badges`);
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