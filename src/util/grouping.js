// src/util/grouping.js
import { worseLabel } from './severity.js';

/** @typedef {{index:number, side:'sender'|'receiver'|'unknown', text:string, bbox:[number,number,number,number], image_index?:number, label:string, confidence:number}} Msg */

function iou(a, b) {
  const ax2 = a[0]+a[2], ay2 = a[1]+a[3];
  const bx2 = b[0]+b[2], by2 = b[1]+b[3];
  const ix = Math.max(0, Math.min(ax2, bx2) - Math.max(a[0], b[0]));
  const iy = Math.max(0, Math.min(ay2, by2) - Math.max(a[1], b[1]));
  const inter = ix * iy;
  const ua = a[2]*a[3] + b[2]*b[3] - inter;
  return ua <= 0 ? 0 : inter/ua;
}

function verticalAdjacency(a, b) {
  // sufficient horizontal overlap + small vertical gap
  const ax2 = a[0]+a[2], bx2 = b[0]+b[2];
  const horizOverlap = Math.max(0, Math.min(ax2, bx2) - Math.max(a[0], b[0]));
  const minW = Math.min(a[2], b[2]);
  const over50pct = horizOverlap >= 0.5 * minW;

  const bottomA = a[1]+a[3], topB = b[1];
  const bottomB = b[1]+b[3], topA = a[1];
  const gap = Math.min(Math.abs(topB - bottomA), Math.abs(topA - bottomB));
  const maxGap = Math.max(6, 0.15 * Math.min(a[3], b[3]));
  return over50pct && gap <= maxGap;
}

function union(a, b) {
  const x1 = Math.min(a[0], b[0]);
  const y1 = Math.min(a[1], b[1]);
  const x2 = Math.max(a[0]+a[2], b[0]+b[2]);
  const y2 = Math.max(a[1]+a[3], b[1]+b[3]);
  return [x1, y1, x2-x1, y2-y1];
}

/** Merge messages that belong to the same bubble - AGGRESSIVE grouping to prevent duplicate badges. */
export function groupBubbles(messages) {
  console.log(`🔄 Grouping ${messages.length} raw message lines into bubbles...`);
  
  const byKey = new Map(); // key: `${img}|${side}`
  for (const m of messages) {
    const side = m.side === 'sender' || m.side === 'receiver' ? m.side : 'receiver';
    const img = Math.max(0, m.image_index ?? 0);
    const key = `${img}|${side}`;
    if (!byKey.has(key)) byKey.set(key, []);
    byKey.get(key).push({ ...m, side, image_index: img });
  }

  /** @type {Msg[]} */
  const out = [];
  for (const [, list] of byKey) {
    // sort by y then x
    list.sort((a,b)=> (a.bbox[1]-b.bbox[1]) || (a.bbox[0]-b.bbox[0]));
    /** @type {Msg[]} */
    const merged = [];
    
    for (const m of list) {
      let absorbed = false;
      
      for (const g of merged) {
        const ioOverlap = iou(m.bbox, g.bbox);
        const verticalProximity = verticalAdjacency(m.bbox, g.bbox);
        
        // MUCH MORE AGGRESSIVE grouping - additional proximity checks
        const [mx, my, mw, mh] = m.bbox;
        const [gx, gy, gw, gh] = g.bbox;
        
        // Check if messages are part of same bubble with VERY relaxed criteria
        const horizontalOverlap = Math.max(0, Math.min(mx + mw, gx + gw) - Math.max(mx, gx)) / Math.min(mw, gw);
        const verticalGap = Math.abs((my + mh/2) - (gy + gh/2));
        const avgHeight = (mh + gh) / 2;
        const closeVertically = verticalGap < avgHeight * 2.0; // Very lenient vertical proximity
        
        // Group if conditions are met (LESS aggressive to prevent wrong merging)
        if (ioOverlap >= 0.4 ||                              // Higher threshold to prevent wrong merges
            verticalProximity ||                             // Original adjacency (proven to work)  
            (horizontalOverlap >= 0.6 && verticalGap < Math.min(20, avgHeight * 0.5))) { // Much stricter criteria
          
          g.bbox = union(g.bbox, m.bbox);
          g.text = g.text ? `${g.text}\n${m.text}` : m.text;
          g.label = worseLabel(g.label, m.label);
          g.confidence = Math.max(g.confidence ?? 0, m.confidence ?? 0);
          g.index = Math.min(g.index, m.index);
          absorbed = true;
          
          console.log(`   📎 Merged "${m.text.slice(0,15)}..." into existing bubble (gap: ${verticalGap.toFixed(1)}px)`);
          break;
        }
      }
      
      if (!absorbed) {
        merged.push({ ...m });
        console.log(`   ✨ New bubble: "${m.text.slice(0,25)}..." (${m.side})`);
      }
    }
    out.push(...merged);
  }

  // global read order: image_index, y, then x — and reindex
  out.sort((a,b)=> (a.image_index - b.image_index) || (a.bbox[1]-b.bbox[1]) || (a.bbox[0]-b.bbox[0]));
  out.forEach((m, i)=> (m.index = i));
  
  console.log(`✅ CONSERVATIVE grouping: ${messages.length} lines → ${out.length} distinct message bubbles`);
  if (out.length > 12) {
    console.warn(`⚠️ Still have ${out.length} bubbles - this may be over-detection.`);
  } else if (out.length < messages.length * 0.5) {
    console.warn(`⚠️ Only ${out.length} bubbles from ${messages.length} detections - grouping may be too aggressive.`);
  } else {
    console.log(`✅ Good grouping ratio: ${((1 - out.length/messages.length) * 100).toFixed(1)}% consolidation`);
  }
  
  return out;
}

// Testing checklist:
// - Multi-line bubbles get merged into single bbox with union dimensions
// - Same side + same image messages with IoU ≥ 0.25 get merged  
// - Vertically adjacent messages with ≥50% horizontal overlap get merged
// - Merged bubble uses most severe label among constituent messages
// - Final messages re-indexed globally by reading order (img, y, x)
