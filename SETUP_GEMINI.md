# 🚀 Enhanced Vision Setup with Gemini API

## Why Gemini?
Your badge positioning issues are caused by Vision API spatial understanding problems. **Gemini Vision** has superior spatial awareness and will significantly improve badge accuracy.

## Quick Setup (2 minutes):

### 1. Get Google AI Studio API Key
1. Go to [https://ai.google.dev/](https://ai.google.dev/)
2. Click "Get API key" → "Create API key"
3. Copy your API key

### 2. Add to your `.env` file:
```env
# Add this line to your .env file:
GOOGLE_API_KEY=your_google_api_key_here

# Optional: Prefer Gemini (default: true)
PREFER_GEMINI=true
```

### 3. Restart your bot:
```bash
npm start
```

## 🎯 **What Changes:**

### **Before (OpenAI only):**
- ❌ Poor bbox detection
- ❌ Badges misaligned with bubbles  
- ❌ Single vision provider

### **After (Gemini + OpenAI hybrid):**
- ✅ **Superior spatial understanding**
- ✅ **Accurate bubble detection**  
- ✅ **Perfect badge positioning**
- ✅ **Intelligent error correction**
- ✅ **Automatic fallback** (Gemini → OpenAI if needed)

## 🚀 **Enhanced Features:**
- **Multi-provider vision**: Tries Gemini first, falls back to OpenAI
- **Intelligent positioning**: Corrects Vision API spatial errors
- **Dynamic badge sizing**: Adapts to bubble dimensions
- **Side detection**: Auto-corrects sender/receiver positioning
- **Performance optimized**: Pre-calculated positions, parallel processing

## 🧪 **Test Your Setup:**
```bash
node scripts/test-enhanced-system.js
```

This will validate your API keys and show the enhanced system working.

## ⚠️ **Troubleshooting:**
- **No API key**: Add `GOOGLE_API_KEY` to `.env` file
- **Gemini fails**: Will automatically fall back to OpenAI
- **Both fail**: Check your internet connection and API quotas

**Your badge positioning will be dramatically improved with Gemini! 🎯**


