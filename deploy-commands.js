/**
 * @fileoverview Discord slash command deployment script
 * Registers the /ask command globally using Discord.js v14 and ES modules
 */

// Load environment variables
import 'dotenv/config';
import { REST, Routes, SlashCommandBuilder } from 'discord.js';

/**
 * Build the /ask slash command with required prompt option
 * @type {SlashCommandBuilder}
 */
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

/**
 * Array of commands to register
 * @type {Array<Object>}
 */
const commands = [askCommand.toJSON()];

/**
 * Initialize Discord REST client with bot token
 * @type {REST}
 */
const rest = new REST({ version: '10' }).setToken(process.env.DISCORD_TOKEN);

/**
 * Deploy slash commands to Discord API
 * Uses top-level await (ES modules)
 */
try {
  console.log('🚀 Clearing old commands and deploying fresh...');
  
  // First, clear all existing global commands
  console.log('🧹 Clearing existing global commands...');
  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: [] }
  );
  
  // Also clear any guild-specific commands (from previous testing)
  // This helps remove any cached commands from development
  const GUILD_ID = '1393267244850745384'; // Previous test guild
  try {
    console.log('🧹 Clearing guild-specific commands...');
    await rest.put(
      Routes.applicationGuildCommands(process.env.CLIENT_ID, GUILD_ID),
      { body: [] }
    );
  } catch (guildError) {
    console.log('ℹ️  No guild commands to clear (this is normal)');
  }
  
  // Wait a moment for Discord to process the deletions
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  // Now register the new commands
  console.log('📝 Registering new commands...');
  const data = await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands }
  );

  // Success - log with green checkmark
  console.log('\x1b[32m✓ Slash commands refreshed successfully\x1b[0m');
  console.log(`📊 Deployed ${data.length} command(s) globally`);
  console.log('⏱️  Commands may take up to 1 hour to appear globally');
} catch (error) {
  // Error handling - log and exit with error code
  console.error('❌ Failed to deploy commands:', error);

  // Provide helpful error context
  if (error.status === 401) {
    console.error('🔑 Invalid DISCORD_TOKEN - check your .env file');
  } else if (error.status === 403) {
    console.error(
      '🚫 Missing permissions - ensure bot has applications.commands scope',
    );
  } else if (!process.env.CLIENT_ID) {
    console.error('🆔 Missing CLIENT_ID - check your .env file');
  }

  // Exit with error code
  process.exit(1);
}
