import 'dotenv/config';
import { REST, Routes } from 'discord.js';

const commands = [
  {
    name: 'review',
    description: '🎯 Analyze chat screenshots with AI-powered quality badges',
    options: [
      {
        name: 'image',
        type: 11, // ATTACHMENT
        description: 'Chat screenshot to analyze',
        required: true
      }
    ]
  }
];

const rest = new REST().setToken(process.env.DISCORD_TOKEN);

try {
  console.log('🚀 Started refreshing /review command...');

  await rest.put(
    Routes.applicationCommands(process.env.CLIENT_ID),
    { body: commands },
  );

  console.log('✅ Successfully registered /review command globally!');
  console.log('💡 Use: /review image:[attach-screenshot]');
} catch (error) {
  console.error('❌ Error deploying commands:', error);
}