// scripts/dev-register.js
import 'dotenv/config';
import { REST, Routes } from 'discord.js';
import { data as review } from '../src/commands/review.js';

const token = process.env.DISCORD_TOKEN;
const clientId = process.env.CLIENT_ID;
const guildId = process.env.GUILD_ID;
if (!token || !clientId || !guildId) {
  console.error('Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID');
  process.exit(1);
}

const rest = new REST({ version: '10' }).setToken(token);
await rest.put(Routes.applicationGuildCommands(clientId, guildId), { body: [review.toJSON()] });
console.log('✅ Registered /review to guild', guildId);
