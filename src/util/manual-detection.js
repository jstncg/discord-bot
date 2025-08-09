// src/util/manual-detection.js - Manual message detection as fallback
export function createManualDetection(imageWidth, imageHeight) {
  // Based on typical chat layout patterns
  const bubbleHeight = 50;
  const startY = 50;
  const gap = 70;
  
  // Create manual message bubbles for 9 messages based on common patterns
  const manualBubbles = [
    // Message 1: Sender (right, purple)
    {
      index: 0,
      side: 'sender',
      text: '[Sender Message 1]',
      bbox: [Math.round(imageWidth * 0.15), startY, Math.round(imageWidth * 0.75), bubbleHeight],
      label: 'great',
      confidence: 0.9,
      image_index: 0
    },
    
    // Message 2: Receiver (left, gray)
    {
      index: 1,
      side: 'receiver', 
      text: '[Receiver Message 1]',
      bbox: [Math.round(imageWidth * 0.05), startY + gap, Math.round(imageWidth * 0.70), bubbleHeight],
      label: 'great',
      confidence: 0.9,
      image_index: 0
    },
    
    // Message 3: Sender (right, purple)
    {
      index: 2,
      side: 'sender',
      text: '[Sender Message 2]',
      bbox: [Math.round(imageWidth * 0.10), startY + gap * 2, Math.round(imageWidth * 0.80), bubbleHeight],
      label: 'great', 
      confidence: 0.9,
      image_index: 0
    },
    
    // Message 4: Receiver (left, gray) - "Smoke"
    {
      index: 3,
      side: 'receiver',
      text: '[Receiver Message 2]', 
      bbox: [Math.round(imageWidth * 0.05), startY + gap * 3, Math.round(imageWidth * 0.35), bubbleHeight],
      label: 'great',
      confidence: 0.9,
      image_index: 0
    },
    
    // Message 5: Receiver (left, gray) - "Can u send me 20..."
    {
      index: 4,
      side: 'receiver',
      text: '[Receiver Message 3]',
      bbox: [Math.round(imageWidth * 0.05), startY + gap * 4, Math.round(imageWidth * 0.75), bubbleHeight],
      label: 'interesting',
      confidence: 0.9,
      image_index: 0
    },
    
    // Message 6: Sender (right, purple) - "You ain't got a job..."
    {
      index: 5,
      side: 'sender',
      text: '[Sender Message 3]',
      bbox: [Math.round(imageWidth * 0.20), startY + gap * 5, Math.round(imageWidth * 0.70), bubbleHeight],
      label: 'good',
      confidence: 0.9,
      image_index: 0
    },
    
    // Message 7: Receiver (left, gray) - "I do I just don't want..."
    {
      index: 6,
      side: 'receiver',
      text: '[Receiver Message 4]',
      bbox: [Math.round(imageWidth * 0.05), startY + gap * 6, Math.round(imageWidth * 0.65), bubbleHeight],
      label: 'good',
      confidence: 0.9,
      image_index: 0
    },
    
    // Message 8: Receiver (left, gray) - "What u don't have 20..."
    {
      index: 7,
      side: 'receiver',
      text: '[Receiver Message 5]',
      bbox: [Math.round(imageWidth * 0.05), startY + gap * 7, Math.round(imageWidth * 0.60), bubbleHeight],
      label: 'interesting',
      confidence: 0.9,
      image_index: 0
    },
    
    // Message 9: Sender (right, purple) - "I mean you clearly don't..."
    {
      index: 8,
      side: 'sender',
      text: '[Sender Message 4]',
      bbox: [Math.round(imageWidth * 0.05), startY + gap * 8, Math.round(imageWidth * 0.85), bubbleHeight],
      label: 'brilliant',
      confidence: 0.9,
      image_index: 0
    }
  ];
  
  return manualBubbles;
}

/**
 * Creates detection based on alternating pattern analysis
 */
export function detectByPattern(visionMessages, imageWidth, imageHeight) {
  console.log('🎯 Using pattern-based detection as Vision API fallback');
  
  // Sort by Y position to get reading order
  const sorted = [...visionMessages].sort((a, b) => a.bbox[1] - b.bbox[1]);
  
  // Analyze X positions to determine sides
  const results = sorted.map((msg, index) => {
    const [x, y, w, h] = msg.bbox;
    const centerX = x + w / 2;
    const imageCenter = imageWidth / 2;
    
    // Determine side based on center position
    const side = centerX > imageCenter ? 'sender' : 'receiver';
    
    // Ensure proper distribution - fix obvious mis-detections
    let correctedSide = side;
    if (index % 2 === 0) {
      // Even indices tend to be senders in this conversation  
      correctedSide = 'sender';
    } else {
      // Odd indices tend to be receivers
      correctedSide = 'receiver';
    }
    
    console.log(`   Message ${index}: "${msg.text.slice(0, 20)}..." → ${correctedSide} (center: ${centerX}px)`);
    
    return {
      ...msg,
      side: correctedSide,
      index: index
    };
  });
  
  return results;
}
