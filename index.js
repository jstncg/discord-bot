/**
 * @fileoverview Discord GPT Bot - Main application file
 * Handles slash commands and mentions with OpenAI integration
 */

// Load environment variables first
import 'dotenv/config';

// Import Discord.js v14 classes
import { Client, GatewayIntentBits, Events } from 'discord.js';

// Import OpenAI
import OpenAI from 'openai';

/**
 * Initialize OpenAI client with API key and model configuration
 * @type {OpenAI}
 */
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Initialize Discord client with required intents
 * @type {Client}
 */
const client = new Client({
  intents: [
    GatewayIntentBits.Guilds,
    GatewayIntentBits.GuildMessages,
    GatewayIntentBits.MessageContent,
  ],
});

/**
 * Rate limiting storage - tracks last API call per user
 * @type {Map<string, number>}
 */
const lastCall = new Map();

/**
 * Rate limit cooldown in milliseconds (5 seconds)
 * @type {number}
 */
const RATE_LIMIT_MS = 5000;

/**
 * Helper function to get Gleam's response
 * @param {string} prompt - User's input prompt
 * @returns {Promise<string>} Clean response string
 */
async function getGleamReply(prompt) {
  try {
    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      max_tokens: 512,
      messages: [
        {
          role: 'system',
          content:
            'You are Gleam, a helpful assistant in a Discord server. Keep responses concise and friendly.',
        },
        {
          role: 'user',
          content: prompt,
        },
      ],
    });

    // Return clean response with fallback
    return response.choices[0]?.message?.content?.trim() || 'No response';
  } catch (error) {
    console.error('OpenAI API error:', error);
    return 'Sorry, I encountered an error while processing your request.';
  }
}

/**
 * Check if user is rate limited
 * @param {string} userId - Discord user ID
 * @returns {boolean} True if rate limited
 */
function isRateLimited(userId) {
  const now = Date.now();
  const userLastCall = lastCall.get(userId);

  if (userLastCall && now - userLastCall < RATE_LIMIT_MS) {
    return true;
  }

  // Update last call time
  lastCall.set(userId, now);
  return false;
}

/**
 * Handle slash command interactions
 */
client.on(Events.InteractionCreate, async (interaction) => {
  // Only handle chat input commands
  if (!interaction.isChatInputCommand()) return;

  // Handle /ask command
  if (interaction.commandName === 'ask') {
    const userId = interaction.user.id;

    // Check rate limiting
    if (isRateLimited(userId)) {
      await interaction.reply(
        '⏳ Slow down! Please wait a moment before asking again.',
      );
      return;
    }

    // Get the prompt from the interaction
    const prompt = interaction.options.getString('prompt');

    // Defer reply to prevent timeout
    await interaction.deferReply();

    try {
      // Get Gleam's response
      const answer = await getGleamReply(prompt);

      // Send the response
      await interaction.editReply(answer);
    } catch (error) {
      console.error('Slash command error:', error);
      await interaction.editReply(
        'Sorry, something went wrong while processing your request.',
      );
    }
  }
});

/**
 * Handle message mentions
 */
client.on(Events.MessageCreate, async (message) => {
  // Ignore messages from bots
  if (message.author.bot) return;

  // Check if bot is mentioned
  if (!message.mentions.has(client.user)) return;

  const userId = message.author.id;

  // Check rate limiting
  if (isRateLimited(userId)) {
    await message.reply(
      '⏳ Slow down! Please wait a moment before asking again.',
    );
    return;
  }

  // Strip the mention from the message content
  const prompt = message.content.replace(/<@!?\d+>/g, '').trim();

  // If no content after removing mention, provide help
  if (!prompt) {
    await message.reply(
      'Hello! Ask me anything by mentioning me with your question.',
    );
    return;
  }

  try {
    // Show typing indicator
    await message.channel.sendTyping();

    // Get Gleam's response
    const answer = await getGleamReply(prompt);

    // Reply to the message
    await message.reply(answer);
  } catch (error) {
    console.error('Mention handling error:', error);
    await message.reply(
      'Sorry, something went wrong while processing your request.',
    );
  }
});

/**
 * Bot ready event - log successful login
 */
client.once(Events.ClientReady, (readyClient) => {
  console.log(`🤖 Logged in as ${readyClient.user.tag}`);
  console.log(`📊 Serving ${readyClient.guilds.cache.size} guild(s)`);
});

/**
 * Error handling for the client
 */
client.on('error', (error) => {
  console.error('Discord client error:', error);
});

/**
 * Login to Discord with bot token
 */
client.login(process.env.DISCORD_TOKEN);
