// deploy-guild.js - Deploy commands to specific guild for immediate availability
import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { data as reviewCommand } from './src/commands/review.js';
import { data as debugReviewCommand } from './src/commands/debug-review.js';

// Replace with your Discord server ID
const GUILD_ID = '1372572956525465650'; // You'll need to provide this

const commands = [reviewCommand.toJSON(), debugReviewCommand.toJSON()];

const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
  console.log('🚀 Deploying commands to guild for immediate availability...');
  
  const data = await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log('✅ Guild commands deployed successfully!');
  console.log(`📊 Deployed ${data.length} command(s) to guild`);
  console.log('⚡ Commands available immediately in your server');
} catch (error) {
  console.error('❌ Failed to deploy guild commands:', error);
}