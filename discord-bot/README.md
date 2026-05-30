# Discord Bot — Setup & Delivery Guide

A feature-rich Discord bot with welcome messages, reaction roles, polls, moderation commands, and auto-responses.

---

## Features

| Feature | Command / Trigger |
|---|---|
| Welcome new members | Automatic on join |
| Reaction role assignment | React to pinned message |
| Create polls | `!poll "Question" "Option1" "Option2"` |
| Server info | `!info` |
| Warn a member | `!warn @user reason` (admin) |
| Kick a member | `!kick @user reason` (admin) |
| Auto-responses | Configurable keyword triggers |

---

## Quick Start

### 1. Create a Discord Application

1. Go to [discord.com/developers/applications](https://discord.com/developers/applications)
2. Click **New Application** → give it a name
3. Go to **Bot** → click **Add Bot**
4. Under **Privileged Gateway Intents**, enable:
   - Server Members Intent
   - Message Content Intent
5. Copy your **Bot Token** — paste it into `config.json` as `"token"`

### 2. Invite the Bot to Your Server

In the Developer Portal → **OAuth2 → URL Generator**:
- Scopes: `bot`
- Permissions: `Send Messages`, `Manage Roles`, `Kick Members`, `Read Message History`, `Add Reactions`
- Copy the generated URL and open it in your browser

### 3. Configure the Bot

Edit `config.json`:

```json
{
  "token": "YOUR_BOT_TOKEN",
  "prefix": "!",
  "welcome": {
    "enabled": true,
    "channelId": "paste your #welcome channel ID here"
  }
}
```

**How to get channel/role IDs:** Enable Developer Mode in Discord (Settings → Advanced → Developer Mode), then right-click any channel or role → Copy ID.

### 4. Install & Run

```bash
npm install
node bot.js
```

### 5. Deploy for 24/7 Uptime (Free)

Deploy on [Railway.app](https://railway.app):
1. Push this folder to a GitHub repo
2. Connect to Railway → New Project → Deploy from GitHub
3. Add environment variable: `TOKEN=your_bot_token` (optional: move token out of config)
4. Bot runs 24/7 on the free tier

---

## Customization

### Change command prefix
Edit `"prefix"` in `config.json` (e.g., `"/"`, `"$"`, `">"`)

### Add auto-responses
```json
"autoResponses": {
  "hello": "Hey there! 👋",
  "help": "Use !help to see commands!"
}
```

### Set up reaction roles
1. Send a message in your server listing the available roles
2. Copy that message's ID → set as `reactionRoles.messageId`
3. Map emojis to role IDs in `reactionRoles.map`

---

## Support

Reach out via Fiverr message within 7 days for setup help or customization requests.
