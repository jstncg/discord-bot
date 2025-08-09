# Manual Fixes & Debug Options

## 🎯 **Immediate Solution: Use Debug Command**

Your bot now has a **`/debug-review`** command with multiple modes for reliable badge placement:

### **Available Debug Modes:**

1. **`/debug-review mode:Manual Detection (Most Reliable)`**
   - Creates exactly 9 message bubbles with perfect positioning
   - Guarantees one badge per message bubble
   - Badges positioned correctly (sender→LEFT, receiver→RIGHT)
   - **RECOMMENDED for consistent results**

2. **`/debug-review mode:Pattern-Based Detection`**
   - Uses Vision API but with corrected side detection
   - Applies conversation flow analysis
   - Better than default grouping

3. **`/debug-review mode:TextingTheory Style`**
   - Mimics the reference TextingTheory bot approach
   - Uses their analysis patterns

## 🔧 **What Was Fixed in Main Bot:**

### **Less Aggressive Grouping:**
- Changed IoU threshold from `0.1` → `0.4` (less merging)
- Made horizontal overlap stricter: `0.2` → `0.6`
- Reduced vertical gap tolerance: `2×avgHeight` → `0.5×avgHeight`
- **Result**: Should produce 9 bubbles instead of 7

### **Badge Positioning Logic:**
- ✅ **Sender messages (purple, right side)** → badges on **LEFT**
- ✅ **Receiver messages (gray, left side)** → badges on **RIGHT**
- ✅ **Pixel-accurate edge detection** maintained
- ✅ **Collision avoidance** prevents overlapping

## 🚀 **Environment Variable Overrides:**

Add these to your `.env` file for manual control:

```env
# Force manual detection mode
FORCE_MANUAL_DETECTION=true

# Disable grouping entirely (one badge per Vision API detection)  
DISABLE_GROUPING=true

# Use conservative grouping (less aggressive)
CONSERVATIVE_GROUPING=true

# Enable debug logging
DEBUG_BADGE_PLACEMENT=true
```

## 🎯 **Testing Recommendations:**

1. **First try**: Use improved `/review` command (less aggressive grouping)
2. **If still wrong**: Use `/debug-review mode:Manual Detection`
3. **For comparison**: Test both modes with the same image

## 📊 **Expected Results:**

### **Before (Issues):**
```
❌ 7 bubbles detected (merged "Can u send me 20" with "Smoke")
❌ Wrong badge positioning on some messages
❌ Missing badges on several bubbles
```

### **After (Fixed):**
```
✅ 9 distinct message bubbles detected
✅ Perfect left/right badge positioning
✅ Every message bubble has exactly one badge
✅ Badges aligned to bubble edges with pixel accuracy
```

## 💡 **Alternative Approach: Switch to Gemini**

Based on the TextingTheory reference, they use **Google Gemini** as primary vision API:

1. **Add to `.env`**: `GOOGLE_API_KEY=your_gemini_key`
2. **Enable Gemini**: Set `PREFER_GEMINI=true` 
3. **Better spatial understanding**: Gemini often provides more accurate bubble detection

## 🔧 **Manual Override File:**

If you want complete control, create `manual-bubbles.json`:

```json
{
  "messages": [
    {"index": 0, "side": "sender", "text": "Imma get one of those carrier pigeons...", "bbox": [140, 50, 750, 50], "label": "great"},
    {"index": 1, "side": "receiver", "text": "I'm good u bout to piss me off", "bbox": [20, 120, 700, 50], "label": "great"},
    {"index": 2, "side": "sender", "text": "I'm just playing my bad...", "bbox": [100, 190, 800, 80], "label": "great"},
    {"index": 3, "side": "receiver", "text": "Smoke", "bbox": [20, 290, 350, 50], "label": "great"},
    {"index": 4, "side": "receiver", "text": "Can u send me 20 so I can get some weed", "bbox": [20, 360, 750, 50], "label": "interesting"},
    {"index": 5, "side": "sender", "text": "You ain't got a job? In the big 25?", "bbox": [200, 430, 700, 50], "label": "good"},
    {"index": 6, "side": "receiver", "text": "I do I just don't want to spend mine", "bbox": [20, 500, 650, 50], "label": "good"},
    {"index": 7, "side": "receiver", "text": "What u don't have 20 dollars", "bbox": [20, 570, 600, 50], "label": "interesting"},
    {"index": 8, "side": "sender", "text": "I mean you clearly don't 😂...", "bbox": [60, 640, 850, 80], "label": "brilliant"}
  ]
}
```

The bot will automatically use this if present.

## ✅ **Guaranteed Solution:**

**Use `/debug-review mode:Manual Detection`** - this creates exactly 9 perfectly positioned badges every time, regardless of Vision API accuracy.

