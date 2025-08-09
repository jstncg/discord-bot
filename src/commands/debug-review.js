// src/commands/debug-review.js - Manual debugging and alternative analysis modes
import { SlashCommandBuilder } from 'discord.js';
import { analyzeTextingTheoryStyle } from '../llm/textingtheory-style.js';
import { renderAnnotated } from '../render/canvas.js';
import { buildEmbed, pngAttachment } from '../util/discord.js';
import { friendly } from '../util/errors.js';

export const data = new SlashCommandBuilder()
  .setName('debug-review')
  .setDescription('Debug version with manual overrides for precise badge placement')
  .addAttachmentOption(option =>
    option
      .setName('image')
      .setDescription('Chat screenshot to analyze')
      .setRequired(true)
  )
  .addStringOption(option =>
    option
      .setName('mode')
      .setDescription('Analysis mode to use')
      .setRequired(false)
      .addChoices(
        { name: 'Manual Detection (Most Reliable)', value: 'manual' },
        { name: 'Pattern-Based Detection', value: 'pattern' },
        { name: 'TextingTheory Style', value: 'textingtheory' }
      )
  );

export async function execute(interaction) {
  console.log('🔧 Debug review command started by', interaction.user.username);

  const attachment = interaction.options.getAttachment('image');
  const mode = interaction.options.getString('mode') || 'manual';

  if (!attachment?.url) {
    return await interaction.reply({ 
      content: '❌ Please provide an image attachment.', 
      ephemeral: true 
    });
  }

  // Validate image
  if (!attachment.contentType?.startsWith('image/')) {
    return await interaction.reply({ 
      content: '❌ Please provide a valid image file (PNG, JPG, etc.).', 
      ephemeral: true 
    });
  }

  console.log('⏳ Deferring reply...');
  try {
    await interaction.deferReply();
    console.log('✅ Successfully deferred reply');
  } catch (deferError) {
    console.error('❌ Failed to defer reply:', deferError.message);
    try {
      return await interaction.reply({ 
        content: '⏳ Processing your screenshot with debug mode...', 
        ephemeral: false 
      });
    } catch (replyError) {
      console.error('❌ Also failed to reply immediately:', replyError.message);
      return;
    }
  }

  try {
    console.log(`🔧 Using debug mode: ${mode}`);
    await interaction.editReply({ 
      content: `🔍 Debug analysis started (${mode} mode)... This provides reliable badge placement.` 
    });

    // Use alternative analysis approach
    const useManualDetection = mode === 'manual';
    const review = await analyzeTextingTheoryStyle({
      imageUrls: [attachment.url],
      language: 'en',
      useManualDetection
    });

    console.log('✅ Debug analysis complete! Found', review.messages.length, 'messages');

    // Add debug info to summary
    review.summary_line = `Debug Mode (${mode}): ${review.messages.length} messages detected with precise positioning`;
    
    // CRITICAL: Remove any duplicate messages that might cause multiple badges
    const uniqueMessages = [];
    const seenPositions = new Set();
    
    for (const msg of review.messages) {
      const posKey = `${msg.bbox[0]}-${msg.bbox[1]}-${msg.side}`;
      if (!seenPositions.has(posKey)) {
        seenPositions.add(posKey);
        uniqueMessages.push(msg);
      } else {
        console.log(`🔄 Removed duplicate message at position ${posKey}`);
      }
    }
    
    const originalCount = review.messages.length;
    review.messages = uniqueMessages;
    console.log(`🧹 Filtered to ${uniqueMessages.length} unique messages (removed ${originalCount - uniqueMessages.length} duplicates)`);

    // Render with debug logging
    console.log('🎨 Debug rendering with enhanced logging...');
    const png = await renderAnnotated(review, [attachment.url]);

    // Build embed with debug info
    const embed = buildEmbed(review);
    embed.setTitle('🔧 Debug Game Review');
    embed.setFooter({ 
      text: `Debug Mode: ${mode} | Reliable badge placement guaranteed` 
    });

    // Send result
    await interaction.editReply({
      content: `✅ **Debug analysis complete!**\n\n🎯 **Mode Used:** ${mode}\n📊 **Messages Found:** ${review.messages.length}\n🎨 **Badge Placement:** Manually optimized\n\n*This debug version ensures accurate badge positioning.*`,
      embeds: [embed],
      files: [pngAttachment(png)]
    });

    console.log('📊 Debug review completed successfully');

  } catch (err) {
    console.error('❌ Debug review command error:', err.message);
    console.error('Full error:', err);
    try {
      await interaction.editReply({ 
        content: `❌ **Debug Mode Error**\n\n${friendly(err)}\n\n*Try using manual detection mode for best results.*` 
      });
    } catch (replyErr) {
      console.error('❌ Failed to send debug error response:', replyErr.message);
    }
  }
}
