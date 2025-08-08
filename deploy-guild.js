/**
 * Quick guild-specific command deployment for testing
 * Commands appear instantly in your test server
 */

import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

const GUILD_ID = '1393267244850745384'; // Your test server

const askCommand = new SlashCommandBuilder()
  .setName('ask')
  .setDescription('Ask Gleam a question')
  .addStringOption(option =>
    option
      .setName('prompt')
      .setDescription('Your question or prompt for Gleam')
      .setRequired(true)
      .setMaxLength(1000)
  );

const commands = [askCommand.toJSON()];
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

try {
  console.log('🚀 Deploying commands to guild (instant)...');
  
  const data = await rest.put(
    Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
    { body: commands }
  );

  console.log('\x1b[32m✓ Guild commands deployed instantly\x1b[0m');
  console.log(`📊 Deployed ${data.length} command(s) to guild ${GUILD_ID}`);
} catch (error) {
  console.error('❌ Failed to deploy guild commands:', error);
  process.exit(1);
}
