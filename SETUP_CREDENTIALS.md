# 🔐 Discord Bot Credentials Setup Guide

Your bot upgrade is ready, but you need to configure credentials first!

## ❌ Current Issue
```
Missing DISCORD_TOKEN, CLIENT_ID, or GUILD_ID
```

## 🔧 Quick Fix

### Step 1: Create .env File
Create a file called `.env` in your project root:

```env
# Discord Bot Configuration
DISCORD_TOKEN=your_actual_discord_bot_token
CLIENT_ID=your_actual_discord_application_id
GUILD_ID=your_actual_discord_guild_id

# OpenAI Configuration  
OPENAI_API_KEY=your_actual_openai_api_key
OPENAI_VISION_MODEL=gpt-4o-mini

# Optional Settings
QUEUE_CONCURRENCY=2
ALLOW_RENDER=false
```

### Step 2: Get Discord Credentials

**🤖 DISCORD_TOKEN**
1. Go to https://discord.com/developers/applications
2. Select your bot application
3. Go to **"Bot"** section
4. Copy the **"Token"** (keep this secret!)

**🆔 CLIENT_ID**
1. Same Discord Developer Portal page
2. Go to **"General Information"**
3. Copy **"Application ID"**

**🏠 GUILD_ID** (Your test server)
1. In Discord, enable **Developer Mode**:
   - User Settings → Advanced → Developer Mode ✅
2. Right-click your **test server** name
3. Click **"Copy Server ID"**

**🧠 OPENAI_API_KEY**
1. Go to https://platform.openai.com/api-keys
2. Create a new API key
3. Copy it (you'll need gpt-4o-mini access)

### Step 3: Verify Setup
```bash
npm run check:env
```

### Step 4: Deploy & Test
```bash
# Deploy command to Discord
npm run register:dev

# Start your bot
npm start

# Then in Discord, use:
/review images:[upload-screenshot]
```

## 🚨 Security Notes

- **Never commit .env to git** (it's in .gitignore)
- **Keep your bot token secret**
- **Use a test server first**

## 🎯 Expected Flow

1. **Terminal**: `npm run register:dev` ← Registers slash command
2. **Discord**: `/review images:[file]` ← Use the command
3. **Magic**: Get annotated image with badges! 🎭

## 🔍 Troubleshooting

**"Canvas not available"** - Normal warning, the bot works without it

**"Missing variables"** - Run `npm run check:env` to see what's missing

**"Command not found"** - Make sure you're using `/review` in Discord, not terminal

## ✅ Success Checklist

- [ ] `.env` file created with real credentials
- [ ] `npm run check:env` shows all green checkmarks
- [ ] `npm run register:dev` runs without errors
- [ ] Bot is online in your Discord server
- [ ] `/review` appears in Discord slash command autocomplete


