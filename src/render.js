import { createCanvas } from 'canvas';

// Quality badge styles
const BADGES = {
  excellent: { emoji: '⭐', color: '#F59E0B' },
  great: { emoji: '✅', color: '#10B981' },
  good: { emoji: '👍', color: '#6B7280' },
  interesting: { emoji: '📖', color: '#D2691E' },
  mistake: { emoji: '😅', color: '#FB923C' },
  blunder: { emoji: '😬', color: '#EF4444' }
};

export async function renderWithBadges(originalImageUrl, analysis) {
  console.log(`🎨 Generating completely new chat image with ${analysis.messages.length} messages...`);
  
  const messages = analysis.messages;
  const style = analysis.chat_style;
  
  // Calculate canvas dimensions
  const canvasWidth = 600;
  const messageHeight = 60;
  const padding = 20;
  const canvasHeight = Math.max(400, messages.length * messageHeight + padding * 2);
  
  // Create fresh canvas
  const canvas = createCanvas(canvasWidth, canvasHeight);
  const ctx = canvas.getContext('2d');
  
  // Draw background
  ctx.fillStyle = style.background_color;
  ctx.fillRect(0, 0, canvasWidth, canvasHeight);
  
  console.log('🖼️  Drawing fresh chat interface...');
  
  // Track bubble positions for badge placement
  const bubblePositions = [];
  
  // Draw each message bubble
  messages.forEach((message, index) => {
    const y = padding + (index * messageHeight);
    const bubbleRadius = 20;
    const bubbleWidth = Math.min(350, message.text.length * 8 + 40);
    const bubbleHeight = 45;
    
    let bubbleX, textX;
    let bubbleColor, textColor;
    
    if (message.side === 'sender') {
      // Sender messages on RIGHT side
      bubbleX = canvasWidth - bubbleWidth - padding;
      textX = bubbleX + bubbleWidth / 2;
      bubbleColor = style.sender_bubble_color;
      textColor = style.sender_text_color;
    } else {
      // Receiver messages on LEFT side  
      bubbleX = padding;
      textX = bubbleX + bubbleWidth / 2;
      bubbleColor = style.receiver_bubble_color;
      textColor = style.receiver_text_color;
    }
    
    // Draw message bubble (rounded rectangle)
    ctx.fillStyle = bubbleColor;
    ctx.beginPath();
    ctx.roundRect(bubbleX, y, bubbleWidth, bubbleHeight, bubbleRadius);
    ctx.fill();
    
    // Draw message text
    ctx.fillStyle = textColor;
    ctx.font = '16px -apple-system, BlinkMacSystemFont, "Segoe UI", system-ui, sans-serif';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    
    // Wrap text if too long
    const maxWidth = bubbleWidth - 20;
    const lines = wrapText(ctx, message.text, maxWidth);
    const lineHeight = 18;
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
  
  bubblePositions.forEach((bubble, index) => {
    const badge = BADGES[bubble.quality] || BADGES.good;
    const badgeRadius = 22;
    const margin = 30;
    
    let badgeX, badgeY;
    
    if (bubble.side === 'sender') {
      // Sender messages → badge on LEFT of bubble
      badgeX = bubble.x - margin;
    } else {
      // Receiver messages → badge on RIGHT of bubble
      badgeX = bubble.x + bubble.width + margin;
    }
    
    badgeY = bubble.y + bubble.height / 2;
    
    // Avoid collisions
    badgeY = avoidCollisions(badgeX, badgeY, badgeRadius, placedBadges);
    
    // Clamp to canvas bounds
    badgeX = Math.max(badgeRadius, Math.min(canvasWidth - badgeRadius, badgeX));
    badgeY = Math.max(badgeRadius, Math.min(canvasHeight - badgeRadius, badgeY));
    
    // Draw badge circle
    ctx.beginPath();
    ctx.arc(badgeX, badgeY, badgeRadius, 0, Math.PI * 2);
    ctx.fillStyle = badge.color;
    ctx.fill();
    
    // Add subtle border
    ctx.strokeStyle = 'rgba(255,255,255,0.8)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Draw emoji
    const fontSize = Math.round(badgeRadius * 1.1);
    ctx.font = `${fontSize}px "Segoe UI Emoji", "Apple Color Emoji", "Noto Color Emoji", sans-serif`;
    ctx.fillStyle = 'white';
    ctx.textAlign = 'center';
    ctx.textBaseline = 'middle';
    ctx.fillText(badge.emoji, badgeX, badgeY);
    
    // Record badge position
    placedBadges.push({ x: badgeX, y: badgeY, radius: badgeRadius });
    
    console.log(`   🏷️  Badge ${index + 1}: ${bubble.quality} ${badge.emoji} at (${badgeX}, ${badgeY}) for ${bubble.side} message`);
  });
  
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