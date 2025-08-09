// src/util/errors.js - Enhanced error handling for production
export function friendly(err) {
  const msg = (err && err.message) || String(err) || 'Unknown error.';
  
  // API and service errors
  if (/quota|rate|429/i.test(msg)) return '⏳ **Rate Limited**: OpenAI is busy. Please try again in a minute.';
  if (/api key|auth/i.test(msg)) return '🔑 **Config Error**: OpenAI API key issue. Bot admin needs to check configuration.';
  if (/timeout/i.test(msg)) return '⏰ **Timeout**: Analysis took too long. Try with a smaller or clearer image.';
  if (/network|fetch failed|ECONNRESET/i.test(msg)) return '🌐 **Network Issue**: Connection problem. Please try again.';
  
  // Data validation errors  
  if (/non-JSON|invalid|parse/i.test(msg)) return '🤖 **AI Hiccup**: Model returned invalid data. Please try again.';
  if (/validation|schema|required/i.test(msg)) return '📋 **Data Error**: Response validation failed. Trying backup analysis...';
  
  // Image processing errors
  if (/canvas|rendering/i.test(msg)) return '🎨 **Render Issue**: Using text-only mode. Install canvas for full image support.';
  if (/image|unsupported|size/i.test(msg)) return '📷 **Image Issue**: Try uploading a different image (PNG/JPG, <8MB).';
  
  // Discord-specific errors
  if (/interaction|unknown interaction/i.test(msg)) return '⚡ **Discord Timeout**: Command took too long. Results may still appear.';
  if (/permission/i.test(msg)) return '🔒 **Permission Error**: Bot lacks required Discord permissions.';
  
  // Generic fallback with helpful context
  return `❓ **Unexpected Error**: Something went wrong. Try again or contact support.\n\`${msg.slice(0, 100)}\``;
}
