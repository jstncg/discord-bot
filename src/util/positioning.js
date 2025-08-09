// src/util/positioning.js - Intelligent bubble positioning and spatial optimization
import { LABELS } from './labels.js';

/**
 * Enhances bubble positions with intelligent spatial correction
 * Fixes common Vision API positioning errors and optimizes badge placement
 */
export function enhanceBubblePositions(messages, imageSizes) {
  console.log('🎯 Enhancing bubble positions with spatial intelligence...');
  
  return messages.map((msg, index) => {
    const pageIndex = Math.max(0, Math.min(msg.image_index || 0, imageSizes.length - 1));
    const { width: imgW, height: imgH } = imageSizes[pageIndex];
    
    let [x, y, w, h] = msg.bbox;
    
    // 1. Intelligent side detection and correction
    const centerX = x + w / 2;
    const imgCenterX = imgW / 2;
    const detectedSide = centerX > imgCenterX ? 'sender' : 'receiver';
    
    // Correct side if Vision API got it wrong (common issue)
    if (msg.side === 'unknown' || 
        (msg.side === 'sender' && centerX < imgW * 0.3) ||
        (msg.side === 'receiver' && centerX > imgW * 0.7)) {
      console.log(`🔧 Correcting side detection for message ${index}: ${msg.side} → ${detectedSide}`);
      msg.side = detectedSide;
    }
    
    // 2. Bubble dimension enhancement
    // Vision APIs often underestimate bubble padding
    if (w < 50) {
      console.log(`📏 Expanding narrow bubble width: ${w} → ${Math.min(150, w * 1.5)}`);
      w = Math.min(150, w * 1.5);
    }
    
    if (h < 25) {
      console.log(`📏 Expanding short bubble height: ${h} → ${Math.max(35, h * 1.3)}`);
      h = Math.max(35, h * 1.3);
    }
    
    // 3. Position optimization based on side
    if (msg.side === 'sender') {
      // Sender bubbles: ensure they're positioned towards the right
      const minSenderX = imgW * 0.4; // At least 40% from left
      if (x < minSenderX) {
        const newX = Math.min(imgW - w - 20, minSenderX);
        console.log(`➡️ Repositioning sender bubble: x ${x} → ${newX}`);
        x = newX;
      }
    } else if (msg.side === 'receiver') {
      // Receiver bubbles: ensure they're positioned towards the left  
      const maxReceiverX = imgW * 0.6 - w; // End at most 60% from left
      if (x > maxReceiverX) {
        const newX = Math.max(20, maxReceiverX);
        console.log(`⬅️ Repositioning receiver bubble: x ${x} → ${newX}`);
        x = newX;
      }
    }
    
    // 4. Vertical spacing optimization
    // Ensure bubbles don't overlap vertically (common Vision API issue)
    if (index > 0) {
      const prevMsg = messages[index - 1];
      if (prevMsg.image_index === msg.image_index) {
        const [, prevY, , prevH] = prevMsg.bbox;
        const minY = prevY + prevH + 10; // 10px minimum gap
        if (y < minY) {
          console.log(`⬆️ Fixing vertical overlap: y ${y} → ${minY}`);
          y = minY;
        }
      }
    }
    
    // 5. Final bounds checking with enhanced margins
    x = Math.max(10, Math.min(x, imgW - w - 10));
    y = Math.max(10, Math.min(y, imgH - h - 10));
    w = Math.max(20, Math.min(w, imgW - x - 10));
    h = Math.max(20, Math.min(h, imgH - y - 10));
    
    return {
      ...msg,
      bbox: [Math.round(x), Math.round(y), Math.round(w), Math.round(h)]
    };
  });
}

/**
 * Optimized badge positioning with enhanced spatial awareness
 */
export function calculateOptimalBadgePosition(bubble, imageSize, yOffset = 0) {
  const [x, y, w, h] = bubble.bbox;
  const { width: imgW, height: imgH } = imageSize;
  
  // Enhanced margin calculation based on bubble size
  const dynamicMargin = Math.max(15, Math.min(25, w * 0.1));
  
  // Scale radius more intelligently
  const radius = Math.max(16, Math.min(32, h * 0.4));
  
  let badgeX, badgeY;
  
  if (bubble.side === 'sender') {
    // Sender: position badge on the right edge with dynamic spacing
    badgeX = x + w + dynamicMargin;
    badgeY = y + yOffset + h * 0.4; // Slightly higher than center for better visual balance
  } else {
    // Receiver: position badge on the left edge with dynamic spacing  
    badgeX = x - dynamicMargin;
    badgeY = y + yOffset + h * 0.4;
  }
  
  // Enhanced clamping with proper radius consideration
  const minCoord = radius + 2;
  const maxX = imgW - radius - 2;
  const maxY = imgH + yOffset - radius - 2;
  
  badgeX = Math.max(minCoord, Math.min(maxX, badgeX));
  badgeY = Math.max(minCoord, Math.min(maxY, badgeY));
  
  return {
    x: Math.round(badgeX),
    y: Math.round(badgeY),
    radius: Math.round(radius)
  };
}

/**
 * Validates and scores bubble positioning quality
 */
export function validateBubbleQuality(messages, imageSizes) {
  let score = 0;
  let issues = [];
  
  for (const msg of messages) {
    const pageIndex = msg.image_index || 0;
    const { width, height } = imageSizes[pageIndex] || { width: 375, height: 667 };
    const [x, y, w, h] = msg.bbox;
    
    // Check positioning quality
    if (msg.side === 'sender' && x < width * 0.3) issues.push(`Sender bubble too far left: ${msg.text.slice(0, 20)}...`);
    if (msg.side === 'receiver' && x + w > width * 0.7) issues.push(`Receiver bubble too far right: ${msg.text.slice(0, 20)}...`);
    if (w < 30 || h < 20) issues.push(`Bubble too small: ${w}x${h} for "${msg.text.slice(0, 15)}..."`);
    if (x < 0 || y < 0 || x + w > width || y + h > height) issues.push(`Bubble out of bounds: ${msg.text.slice(0, 20)}...`);
    
    score += issues.length === 0 ? 10 : Math.max(0, 10 - issues.length * 2);
  }
  
  const avgScore = messages.length > 0 ? score / messages.length : 0;
  
  if (issues.length > 0) {
    console.log(`⚠️ Bubble positioning quality: ${avgScore.toFixed(1)}/10`);
    console.log('🔧 Issues detected:', issues.slice(0, 3).join('; '));
  } else {
    console.log(`✅ Bubble positioning quality: ${avgScore.toFixed(1)}/10`);
  }
  
  return { score: avgScore, issues };
}
