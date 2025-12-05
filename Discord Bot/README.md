# Hideout Network Discord Bot

A Discord bot that syncs global chat between Discord and the Hideout website.

## Features

- **Global Chat Sync**: Messages sent in Discord appear on the website and vice versa
- **Chat Filter**: Same content filter as the website to block inappropriate content
- **Easy Setup**: Interactive setup wizard with `.setup` command
- **Admin Controls**: Only admins can configure the bot

## Setup

### 1. Create a Discord Bot

1. Go to the [Discord Developer Portal](https://discord.com/developers/applications)
2. Click "New Application" and give it a name (e.g., "Hideout Network")
3. Go to the "Bot" section and click "Add Bot"
4. Copy the bot token (you'll need this later)
5. Enable these Privileged Gateway Intents:
   - Message Content Intent
   - Server Members Intent

### 2. Invite the Bot to Your Server

1. Go to OAuth2 → URL Generator
2. Select scopes: `bot`, `applications.commands`
3. Select permissions:
   - Send Messages
   - Manage Messages
   - Embed Links
   - Add Reactions
   - Read Message History
   - View Channels
4. Copy the generated URL and open it in your browser
5. Select your server and authorize

### 3. Configure the Bot

1. Copy `.env.example` to `.env`
2. Fill in your values:
   ```
   DISCORD_BOT_TOKEN=your_bot_token_here
   SUPABASE_URL=https://ezxrjflznhydrmmblxni.supabase.co
   SUPABASE_SERVICE_KEY=your_service_role_key_here
   ```

### 4. Install Dependencies

```bash
pip install -r requirements.txt
```

### 5. Run the Bot

```bash
python bot.py
```

## Usage

### Commands

- `.setup` - Start the setup wizard (Admin only)
- `/help` - Show help information

### Setup Wizard

When you run `.setup`, the bot will guide you through:

1. **Welcome Screen** - Overview of what the bot does
2. **Mod Channel** - Select channel for admin commands
3. **Global Chat Channel** - Select channel to sync with the website
4. **Complete** - Confirmation of your settings

### Global Chat

Once configured:
- Messages in the global chat channel are sent to the Hideout website
- Messages from the website appear in the global chat channel
- Both show a tag indicating the source (Website/Discord)

## Chat Filter

The bot uses the same chat filter as the website:
- Blocks inappropriate words and phrases
- Detects bypass attempts (like using numbers for letters)
- Automatically deletes filtered messages

## Files

- `bot.py` - Main bot code
- `requirements.txt` - Python dependencies
- `.env` - Your configuration (create from `.env.example`)
- `.env.example` - Template for configuration
- `data.json` - Server configurations (auto-generated)

## Support

For help, visit the Hideout GitHub repository.
