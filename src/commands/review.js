// src/commands/review.js
import {
  SlashCommandBuilder, AttachmentBuilder, PermissionFlagsBits
} from 'discord.js';
import { analyzeChat } from '../analyze.js';
import { renderWithBadges } from '../render.js';
import { createMockAnnotatedImage } from '../render/text-visual.js';
import { buildEmbed, pngAttachment } from '../util/discord.js';
import { friendly } from '../util/errors.js';

export const data = new SlashCommandBuilder()
  .setName('review')
  .setDescription('Analyze a chat screenshot and annotate with game badges.')
  .addAttachmentOption(o=>o.setName('images').setDescription('Image 1').setRequired(true))
  .addAttachmentOption(o=>o.setName('images2').setDescription('Image 2'))
  .addAttachmentOption(o=>o.setName('images3').setDescription('Image 3'))
  .setDMPermission(false);

function getImageUrls(interaction) {
  const atts = [
    interaction.options.getAttachment('images'),
    interaction.options.getAttachment('images2'),
    interaction.options.getAttachment('images3'),
  ].filter(Boolean);
  if (!atts.length) throw new Error('Attach at least one image.');
  if (atts.length > 3) throw new Error('Attach at most 3 images.');
  const urls = [];
  for (const f of atts) {
    const ct = (f.contentType||'').toLowerCase();
    if (!/^image\/(png|jpeg|jpg|webp)$/.test(ct)) throw new Error(`Unsupported file type: ${ct}`);
    if (f.size > 8*1024*1024) throw new Error(`File too large (>8 MB): ${f.name}`);
    urls.push(f.url);
  }
  return urls;
}

export async function execute(interaction) {
  console.log('🎮 Review command started by', interaction.user.username);
  
  let urls;
  try { 
    urls = getImageUrls(interaction); 
    console.log('📎 Extracted', urls.length, 'image URLs');
  }
  catch (e) { 
    console.warn('❌ Image validation failed:', e.message);
    return interaction.reply({ content: e.message, flags: [64] }); 
  }

  // Quick environment check
  if (!process.env.OPENAI_API_KEY) {
    console.error('❌ OPENAI_API_KEY not found in environment');
    return interaction.reply({ content: 'OpenAI API key not configured. Please check bot configuration.', flags: [64] });
  }

  console.log('⏳ Deferring reply...');
  try {
    await interaction.deferReply();
    console.log('✅ Successfully deferred reply');
  } catch (deferError) {
    console.error('❌ Failed to defer reply (interaction may have expired):', deferError.message);
    // Interaction expired - try to reply immediately instead
    try {
      return await interaction.reply({ content: '⏳ Processing your screenshot...', ephemeral: false });
    } catch (replyError) {
      console.error('❌ Also failed to reply immediately:', replyError.message);
      return; // Give up - interaction is dead
    }
  }

  try {
    // Step 1: Quick initial response to keep interaction alive
    console.log('🔄 Sending initial status...');
    try {
      await interaction.editReply({ content: '🔍 Analyzing your chat screenshot... This may take a moment.' });
    } catch (editError) {
      console.warn('⚠️ Failed to edit reply, interaction may be expired:', editError.message);
      return; // Exit gracefully if interaction is dead
    }

    // Step 2: Perform analysis with aggressive timeout
    console.log('🔍 Starting image analysis...');
    // Note: analyzeChat expects a single image URL, use the first one
    const primaryImageUrl = urls[0];
    const analysis = await analyzeChat(primaryImageUrl);
    console.log('✅ Analysis complete! Found', analysis.messages.length, 'messages');

    // Convert data format for compatibility with buildEmbed
    analysis.summary_line = analysis.summary || 'Chat analyzed successfully';
    if (analysis.messages) {
      analysis.messages.forEach(msg => {
        if (msg.quality && !msg.label) {
          msg.label = msg.quality; // Map quality -> label
        }
      });
    }

    // Step 3: Send annotated image first (if canvas available)
    try {
      console.log('🎨 Attempting to render properly positioned chat bubbles...');
      const png = await renderWithBadges(primaryImageUrl, analysis);
      const file = pngAttachment(png);
      console.log('✅ Sending annotated image...');
      await interaction.editReply({ 
        content: '🎯 **Game Analysis Complete!**', 
        files: [file] 
      });
      
      // Step 4: Follow up with stats embed
      console.log('📊 Sending stats embed...');
      const embed = buildEmbed(analysis);
      await interaction.followUp({ embeds: [embed] });
      
    } catch (renderErr) {
      console.warn('🎨 Image rendering failed, using text visual fallback:', renderErr.message);
      
      // Step 3b: Send text-based visual representation 
      const mockImage = createMockAnnotatedImage(analysis);
      await interaction.editReply({ 
        content: mockImage 
      });
      
      // Step 4b: Follow up with stats embed
      console.log('📊 Sending stats embed...');
      const embed = buildEmbed(analysis);
      embed.setFooter({ text: 'Entertainment only. No advice. (Install canvas for full image rendering)' });
      await interaction.followUp({ embeds: [embed] });
    }
    
  } catch (err) {
    console.error('❌ Review command error:', err.message);
    try {
      await interaction.editReply({ content: friendly(err) });
    } catch (replyErr) {
      console.error('❌ Failed to send error response:', replyErr.message);
    }
  }
}
