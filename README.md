# Discord GPT Bot

A minimal Discord bot that pipes your prompts to OpenAI's ChatGPT.

## Features

- `/ask` slash command (global)
- Mention the bot (`@Bot question`)
- Simple per-user 5 s rate-limit

## Setup

1. Clone & `cd discord-gpt-bot`
2. `cp .env.example .env` and add your keys
3. `npm install`
4. `npm run deploy` – registers `/ask`
5. **Invite the bot**
   - In Discord Developer Portal → OAuth2 → URL Generator
   - Scopes: **bot**, **applications.commands**
   - Bot permissions: **Send Messages**, **Read Message History**
   - Paste URL in browser → select server → Authorize
6. `npm start` and test in your server

## Docker

```bash
docker build -t discord-gpt-bot .
docker run -d --env-file .env discord-gpt-bot
```

## Deploy

The bot can run on Railway, Fly.io, Render, or a $5 Lightsail instance.  
Provide the same environment variables (`DISCORD_TOKEN`, `OPENAI_API_KEY`, `CLIENT_ID`) in the host's dashboard.

## License

MIT
