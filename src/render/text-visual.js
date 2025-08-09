// src/render/text-visual.js - Canvas-free visual representation
import { LABELS } from '../util/labels.js';

/**
 * Create a text-based visual representation when canvas is unavailable
 * @param {*} review - The analyzed review data
 * @param {string[]} imageUrls - Original image URLs  
 * @returns {string} Formatted text representation
 */
export function createTextVisual(review) {
  const lines = [];
  
  lines.push('```');
  lines.push('📱 CHAT ANALYSIS VISUALIZATION');
  lines.push('═══════════════════════════════');
  
  review.messages.forEach((msg, i) => {
    const { emoji } = LABELS[msg.label] || { emoji: '▫️' };
    const side = msg.side === 'sender' ? '→' : '←';
    const indicator = msg.side === 'sender' ? '    ' + emoji : emoji + '    ';
    
    lines.push('');
    lines.push(`${i + 1}. ${side} ${msg.text.slice(0, 50)}${msg.text.length > 50 ? '...' : ''}`);
    lines.push(`   ${indicator} ${msg.label.toUpperCase()}`);
  });
  
  lines.push('```');
  
  return lines.join('\n');
}

/**
 * Create a simple mock "image" using Discord formatting
 * @param {*} review - The analyzed review data
 * @returns {string} Formatted mock visual
 */
export function createMockAnnotatedImage(review) {
  const lines = [];
  
  lines.push('🎯 **Annotated Chat Analysis**');
  lines.push('*Note: Install canvas for full image rendering*');
  lines.push('');
  
  review.messages.forEach((msg, i) => {
    const { emoji } = LABELS[msg.label] || { emoji: '▫️' };
    const alignment = msg.side === 'sender' ? '➡️' : '⬅️';
    
    lines.push(`${alignment} **Message ${i + 1}** ${emoji} \`${msg.label}\``);
    lines.push(`> ${msg.text}`);
    lines.push('');
  });
  
  return lines.join('\n');
}

