// src/util/discord.js
import { EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { LABEL_ORDER, LABELS } from './labels.js';
import { hexToInt } from './labels.js';

export function countsTable(counts = {}) {
  const rows = LABEL_ORDER.map(k => {
    const v = String(counts[k] || 0).padStart(2, ' ');
    return `${k.padEnd(14,' ')} ${v}`;
  }).join('\n');
  return '```\n' + rows + '\n```';
}

export function buildEmbed(review) {
  const primary = review.messages?.[0]?.label || 'interesting';
  const color = hexToInt((LABELS[primary] || LABELS.interesting).color);

  const e = new EmbedBuilder()
    .setTitle('Game Review ♟️')
    .setColor(color)
    .setDescription(`**Summary:** ${review.summary_line}\n**ELO:** ${review.elo} · **Ending:** ${review.ending}`)
    .addFields(
      { name: 'Counts', value: countsTable(review.counts) }
    )
    .setFooter({ text: 'Entertainment only. No advice.' });

  return e;
}

export function pngAttachment(buf) {
  return new AttachmentBuilder(buf, { name: 'review.png' });
}

// Testing checklist:
// - No "Moves …" section appears in the embed
// - Counts match total rendered badges
// - Embed color picked from first message's label (or interesting if none)

