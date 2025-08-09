# Discord Bot Review Feature Setup Guide

## Quick Start (Core Features)

The bot works immediately with text-only embeds. Image rendering is optional and requires additional setup.

### 1. Install Core Dependencies
```bash
npm install
```

### 2. Environment Setup
Create a `.env` file with your credentials:
```env
# Discord Bot Configuration
DISCORD_TOKEN=your_discord_bot_token
CLIENT_ID=your_discord_application_id

# OpenAI Configuration  
OPENAI_API_KEY=your_openai_api_key
OPENAI_VISION_MODEL=gpt-4o-mini

# Development/Testing
GUILD_ID=123456789012345678

# Review Feature Configuration
QUEUE_CONCURRENCY=2
ALLOW_RENDER=false
```

### 3. Deploy Commands & Start
```bash
# Deploy commands globally
npm run deploy

# OR for development (single guild - faster)
npm run register:dev

# Start the bot
npm start
```

### 4. Test the Feature
Use `/review` in Discord:
- Upload 1-5 chat screenshots
- Choose `embed` mode (default)
- Get chess-style analysis with emojis and ratings!

---

## 🎨 Optional: Image Rendering Setup

The bot includes an optional image renderer that creates annotated screenshots with classification badges. This requires additional setup on Windows.

### Windows Prerequisites

**Option A: Install Visual Studio Build Tools (Recommended)**
1. Download [Visual Studio Installer](https://visualstudio.microsoft.com/downloads/)
2. Install "Build Tools for Visual Studio 2022" 
3. Select workload: "C++ build tools"
4. Include: MSVC v143, Windows 10/11 SDK, CMake tools

**Option B: Install Visual Studio Community**
1. Download [Visual Studio Community](https://visualstudio.microsoft.com/vs/community/)
2. During installation, select "Desktop development with C++"

### Enable Image Rendering

After installing build tools:

```bash
# Install canvas dependency
npm install canvas

# Enable rendering in .env
ALLOW_RENDER=true
```

### Test Image Rendering
```bash
# Use rendered mode in Discord
/review mode:rendered
```

---

## 🔧 Troubleshooting

### Canvas Installation Issues

**Problem**: `npm install canvas` fails with Visual Studio errors

**Solutions**:
1. **Use text-only mode** (default): The bot works perfectly without canvas
2. **Install build tools** (see above) if you want image rendering
3. **Alternative**: Use Docker (see below)

### Docker Alternative (Avoids Windows Build Issues)

Create `Dockerfile`:
```dockerfile
FROM node:18-alpine
RUN apk add --no-cache cairo-dev pango-dev giflib-dev libjpeg-turbo-dev
WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .
CMD ["npm", "start"]
```

Build and run:
```bash
docker build -t discord-bot .
docker run --env-file .env discord-bot
```

### Common Issues

**"Canvas not available"** - This is normal without the optional dependency. The bot will use text embeds only.

**Rate limiting errors** - Increase `QUEUE_CONCURRENCY=1` to be more conservative.

**OpenAI errors** - Check your API key and ensure you have Vision API access.

---

## 📱 Usage Examples

### Basic Review
```
/review images:[screenshot.png]
```

### Multi-image Review  
```
/review images:[pic1.png] images2:[pic2.png] mode:embed
```

### With Rendering (if canvas installed)
```
/review images:[chat.png] mode:rendered language:en
```

---

## 🚀 Next Steps

1. **Test locally** with sample images
2. **Deploy globally** when ready for production  
3. **Monitor console logs** for any issues
4. **Install canvas later** if you want image rendering

The bot is now ready to provide entertaining chat analysis with chess-style ratings! 🏆
