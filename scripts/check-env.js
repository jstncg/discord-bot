// scripts/check-env.js
import 'dotenv/config';

console.log('🔍 Checking environment variables...\n');

const required = [
  'DISCORD_TOKEN',
  'CLIENT_ID', 
  'GUILD_ID',
  'OPENAI_API_KEY'
];

let allGood = true;

for (const key of required) {
  const value = process.env[key];
  const status = value ? '✅' : '❌';
  const display = value ? `${value.substring(0, 8)}...` : 'MISSING';
  console.log(`${status} ${key.padEnd(20)} ${display}`);
  if (!value) allGood = false;
}

console.log('\n' + (allGood ? '🎉 All required variables are set!' : '⚠️  Please add missing variables to .env file'));

if (allGood) {
  console.log('\n✅ Ready to run: npm run register:dev');
} else {
  console.log('\n📝 Create .env file with your actual credentials first');
}

