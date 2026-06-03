# Dizzy Inc — Reddit Community Bot
### Premium Subreddit Automation Tool

**Delivered by Dizzy Inc · Clarity in Complexity. Automation in Action.**

---

## What This Bot Does

Your subreddit runs itself. Here's what's included:

| Feature | Description |
|---------|-------------|
| **Karma Tracker** | Monitors your subreddit weekly, tallies post + comment karma, and auto-posts a sticky leaderboard every Sunday |
| **Auto-Moderator** | Removes posts from accounts below your karma threshold and sends them a polite DM explaining why |
| **Auto-Flair** | Detects keywords in post titles/bodies and applies the correct flair automatically |
| **Scheduled Posts** | Posts weekly threads (Introductions, Feedback, Show & Tell, etc.) on a configurable schedule |
| **Welcome DMs** | Sends a personalized welcome message to every new member — fully customizable template |
| **Keyword Responder** | Detects trigger words in posts and comments, replies with your configured response (with mod distinction) |

Every feature is independently toggleable in `config.json`. Enable only what you need.

---

## Pricing

| Package | Price | Includes |
|---------|-------|---------|
| **Base Bot** | **$35** | Full source code, config files, setup guide |
| **Custom Setup** | **+$50** | I configure everything for your subreddit, test it live, and deploy it for you |
| **Monthly Support** | **+$20/mo** | Updates, tweaks, and bug fixes on request |

---

## Requirements

- Python 3.9 or higher
- A dedicated Reddit bot account (free — takes 2 minutes to create)
- Reddit API credentials (free — instructions below)
- A subreddit where your bot account is a **moderator**

---

## Step 1 — Get Your Reddit API Credentials

1. **Create a bot Reddit account** at reddit.com (e.g., `YourSubreddit_Bot`)
2. Log into that account and go to: **https://www.reddit.com/prefs/apps**
3. Scroll to the bottom and click **"create another app…"**
4. Fill in:
   - **Name:** anything (e.g., `MySubredditBot`)
   - **Type:** select **script**
   - **Redirect URI:** `http://localhost:8080`
5. Click **Create app**
6. Note down:
   - **Client ID** — the string under your app name (looks like `abc123XYZ`)
   - **Client Secret** — labeled "secret"
7. Add your bot account as a **moderator** of your subreddit with at least `posts`, `flair`, `mail`, and `access` permissions

---

## Step 2 — Install & Configure

```bash
# 1. Install dependencies
pip install -r requirements.txt

# 2. Copy the credentials template
cp .env.example .env

# 3. Open .env and fill in your credentials
nano .env
```

Edit `.env`:
```
REDDIT_CLIENT_ID=your_client_id
REDDIT_CLIENT_SECRET=your_client_secret
REDDIT_USERNAME=YourSubreddit_Bot
REDDIT_PASSWORD=your_bot_account_password
REDDIT_USER_AGENT=DizzyBot/1.0 by YourUsername
```

---

## Step 3 — Configure the Bot

Open `config.json` and update:

```json
{
  "subreddit": "YourSubredditName",
  ...
}
```

Enable or disable each feature by setting `"enabled": true` or `"enabled": false`.

Key settings to customize:
- `karma_threshold` — minimum account karma to post (default: 10)
- `welcome_dm.message_template` — your welcome message (supports `{username}` and `{subreddit}` placeholders)
- `keyword_responder.rules` — add your own trigger keywords and auto-replies
- `auto_moderator.flair_rules` — map keywords to flair labels

Edit `schedule.json` to customize weekly thread content, days, and times.

---

## Step 4 — Run the Bot

```bash
python bot.py
```

The bot will:
- Authenticate and log `Authenticated as u/YourBotName`
- Start polling your subreddit every 60 seconds
- Run scheduled jobs in a background thread
- Log all actions to `bot.log`

To stop: press `Ctrl+C`

---

## Step 5 — Deploy Free (Keep It Running 24/7)

### Option A — Railway (Recommended, Free Tier)

1. Go to **https://railway.app** and sign up with GitHub
2. Click **New Project → Deploy from GitHub repo**
3. Connect your repo (or upload the `reddit-bot/` folder as a new repo)
4. Add environment variables under **Variables** (paste from your `.env` file)
5. Set the **Start Command** to: `python bot.py`
6. Railway auto-deploys and keeps the bot running — free tier gives 500 hours/month

### Option B — Replit (Free, Always-On with UptimeRobot)

1. Go to **https://replit.com** and create a new Python Repl
2. Upload all files from this folder
3. Add your `.env` values under **Secrets** (the lock icon)
4. Click **Run**
5. To keep it awake: use **https://uptimerobot.com** to ping your Repl URL every 5 minutes (free)

### Option C — Your Own Server / VPS

```bash
# Run as a background process with nohup
nohup python bot.py > /dev/null 2>&1 &

# Or use screen
screen -S reddit-bot
python bot.py
# Detach with Ctrl+A, then D
```

---

## Logs

All bot activity is written to `bot.log` in the same folder:

```
2025-01-15 09:00:01 [INFO] Authenticated as u/MySubreddit_Bot
2025-01-15 09:00:02 [INFO] WelcomeDM: sent to u/new_member_123
2025-01-15 09:01:05 [INFO] AutoMod: removed post by u/spammer (karma below 10)
2025-01-15 09:01:06 [INFO] AutoMod: flaired 'How do I get started?' → [Question]
2025-01-15 18:00:00 [INFO] Karma Tracker: leaderboard posted → https://redd.it/abc123
```

---

## Customization Reference

### Adding a Keyword Rule

In `config.json` under `keyword_responder.rules`:
```json
{
  "name": "promo-block",
  "triggers": ["check out my", "buy my", "dm me for"],
  "response": "Hi! Promotional posts require mod approval. Please modmail us before sharing links or services. Thanks!"
}
```

### Adding a Scheduled Post

In `schedule.json`:
```json
{
  "title": "[Weekly] Your Thread Title",
  "body": "Thread body content here. Markdown supported.",
  "day": "thursday",
  "time": "12:00",
  "flair": "Weekly Thread",
  "sticky": false,
  "distinguish": true
}
```

Valid days: `monday`, `tuesday`, `wednesday`, `thursday`, `friday`, `saturday`, `sunday`, `daily`

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `prawcore.exceptions.OAuthException` | Check your `.env` credentials — username/password are case-sensitive |
| `Forbidden (403)` on flair/removal | Make sure the bot account has mod permissions: `posts`, `flair`, `mail`, `access` |
| Bot stops after a few hours on Replit | Set up UptimeRobot to ping your Repl URL every 5 minutes |
| Welcome DMs not sending | Reddit sometimes limits DMs for new/low-karma accounts — age the bot account first |
| `new_members` returns empty | Your subreddit may not have the members endpoint available; disable `welcome_dm` if so |

---

## File Structure

```
reddit-bot/
├── bot.py              # Main bot — all features
├── config.json         # All settings (subreddit, thresholds, templates, rules)
├── schedule.json       # Weekly post schedule
├── requirements.txt    # Python dependencies
├── .env.example        # Credentials template (copy to .env)
├── .env                # Your credentials (never share this file)
├── bot.log             # Auto-generated activity log
├── .welcomed_users.json  # Auto-generated: tracks welcomed members
└── .replied_ids.json   # Auto-generated: prevents duplicate replies
```

---

**Delivered by Dizzy Inc**
Clarity in Complexity. Automation in Action.
@thedizzyinc · dzyntwrk.gumroad.com
