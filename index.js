import 'dotenv/config';
import { Client, GatewayIntentBits, Events, EmbedBuilder, AttachmentBuilder } from 'discord.js';
import { analyzeChat } from './src/analyze.js';
import { renderWithBadges } from './src/render.js';

const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

// Handle /review slash command
client.on(Events.InteractionCreate, async (interaction) => {
  if (!interaction.isChatInputCommand()) return;
  
  if (interaction.commandName === 'review') {
    console.log(`🎮 Review command started by ${interaction.user.username}`);
    
    const attachment = interaction.options.getAttachment('image');
    
    if (!attachment || !attachment.contentType?.startsWith('image/')) {
      await interaction.reply({
        content: '❌ Please provide a valid image file.',
        ephemeral: true
      });
      return;
    }
    
    try {
      await interaction.deferReply();
      console.log('📸 Processing image:', attachment.url);
      
      // Core Feature: Analyze with best vision API
      console.log('🔍 Analyzing chat with AI vision...');
      const analysis = await analyzeChat(attachment.url);
      
      // Core Feature: Generate completely new chat image with badges
      console.log('🎨 Generating fresh chat image with quality badges...');
      const annotatedBuffer = await renderWithBadges(attachment.url, analysis);
      
      // Core Feature: Send back annotated image + game review
      const embed = new EmbedBuilder()
        .setTitle('🎮 Chat Game Review')
        .setDescription(analysis.summary || 'Your chat has been analyzed!')
        .setColor('#7C3AED')
        .addFields([
          { name: '📈 ELO Rating', value: `\`${analysis.elo}\``, inline: true },
          { name: '🏁 Ending', value: analysis.ending, inline: true },
          { name: '📊 Message Quality', value: formatCounts(analysis.counts), inline: false }
        ])
        .setTimestamp();

      await interaction.editReply({
        content: '✅ **Analysis Complete!**',
        embeds: [embed],
        files: [new AttachmentBuilder(annotatedBuffer, { name: 'chat-review.png' })]
      });
      
      console.log('✅ Analysis complete and sent!');
      
    } catch (error) {
      console.error('❌ Analysis failed:', error);
      
      const errorMessage = error.message?.includes('timeout') ? 
        'Analysis took too long. Try with a smaller image.' :
        'Sorry, I had trouble analyzing your chat. Please try again!';
        
      try {
        if (interaction.deferred) {
          await interaction.editReply(`❌ ${errorMessage}`);
        } else {
          await interaction.reply({ content: `❌ ${errorMessage}`, ephemeral: true });
        }
      } catch (discordError) {
        console.error('Failed to send error message:', discordError);
      }
    }
  }
});

function formatCounts(counts) {
  if (!counts || Object.keys(counts).length === 0) {
    return 'No messages analyzed';
  }
  
  return Object.entries(counts)
    .map(([quality, count]) => `${quality}: ${count}`)
    .join(', ');
}

client.once(Events.ClientReady, (readyClient) => {
  console.log(`🤖 Chat Review Bot ready as ${readyClient.user.tag}`);
  console.log(`📊 Serving ${readyClient.guilds.cache.size} server(s)`);
  console.log('💬 Use /review command with a chat screenshot to get quality analysis!');
});

client.on('error', console.error);

client.login(process.env.DISCORD_TOKEN);