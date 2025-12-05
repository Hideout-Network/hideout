"""
Hideout Network Discord Bot
Syncs global chat between Discord and the Hideout website
"""

import os
import json
import asyncio
import discord
from discord.ext import commands, tasks
from discord import app_commands
from dotenv import load_dotenv
from supabase import create_client, Client
from datetime import datetime
import re

# Load environment variables
load_dotenv()

DISCORD_TOKEN = os.getenv('DISCORD_BOT_TOKEN')
SUPABASE_URL = os.getenv('SUPABASE_URL')
SUPABASE_KEY = os.getenv('SUPABASE_SERVICE_KEY')

if not DISCORD_TOKEN:
    raise ValueError("DISCORD_BOT_TOKEN not set in .env file")
if not SUPABASE_URL or not SUPABASE_KEY:
    raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set in .env file")

# Initialize Supabase client
supabase: Client = create_client(SUPABASE_URL, SUPABASE_KEY)

# Data file path
DATA_FILE = 'data.json'

# Chat filter patterns (same as website)
BLOCKED_PATTERNS = [
    r'n[i!1|l][g9][g9][e3]r',
    r'n[i!1|l][g9]{2}[a@4]',
    r'n[i!1|l][g9][a@4]',
    r'n[i!1|l]gg',
    r'f[u\*@][c\(k]',
    r'sh[i!1][t\+]',
    r'f[a@4][g9]{2}[o0]t',
    r'f[a@4][g9]',
    r'r[e3]t[a@4]rd',
    r'c[u\*][n\*]t',
    r'b[i!1]tch',
    r'k[i!1]ll[\s]*y[o0]urs[e3]lf',
    r'kys',
]

BLOCKED_WORDS = {
    'nigger', 'nigga', 'nig', 'niger', 'n1gger', 'n1gga',
    'fuck', 'fucker', 'fucking', 'fck', 'fuk',
    'shit', 'shitty', 'sh1t',
    'cunt', 'cunts',
    'fag', 'faggot', 'fags',
    'retard', 'retarded',
    'kys', 'nazi', 'hitler', 'kkk',
}

def normalize_text(text: str) -> str:
    """Normalize text to detect bypass attempts"""
    text = text.lower()
    replacements = {
        '0': 'o', '@': 'o',
        '1': 'i', '!': 'i', '|': 'i', 'l': 'i',
        '3': 'e',
        '4': 'a',
        '5': 's', '$': 's',
        '7': 't',
        '8': 'b',
        '9': 'g',
    }
    for old, new in replacements.items():
        text = text.replace(old, new)
    text = re.sub(r'[\s._\-*]+', '', text)
    text = re.sub(r'[^\w]', '', text)
    return text

def contains_blocked_content(message: str) -> bool:
    """Check if message contains blocked content"""
    lower_message = message.lower()
    normalized_message = normalize_text(message)
    
    # Check exact word matches
    words = lower_message.split()
    for word in words:
        clean_word = re.sub(r'[^\w]', '', word)
        if clean_word in BLOCKED_WORDS:
            return True
    
    # Check normalized text
    for blocked_word in BLOCKED_WORDS:
        if blocked_word.replace(' ', '') in normalized_message:
            return True
    
    # Check regex patterns
    for pattern in BLOCKED_PATTERNS:
        if re.search(pattern, message, re.IGNORECASE) or re.search(pattern, normalized_message, re.IGNORECASE):
            return True
    
    return False

def load_data() -> dict:
    """Load bot configuration data"""
    if os.path.exists(DATA_FILE):
        with open(DATA_FILE, 'r') as f:
            return json.load(f)
    return {}

def save_data(data: dict):
    """Save bot configuration data"""
    with open(DATA_FILE, 'w') as f:
        json.dump(data, f, indent=2)

class HideoutBot(commands.Bot):
    def __init__(self):
        intents = discord.Intents.default()
        intents.message_content = True
        intents.guilds = True
        intents.members = True
        
        super().__init__(
            command_prefix='.',
            intents=intents,
            description='Hideout Network Bot - Syncs global chat with the website'
        )
        
        self.data = load_data()
        self.last_message_id = None
        self.setup_complete = {}
        
    async def setup_hook(self):
        """Called when the bot is ready"""
        await self.tree.sync()
        self.check_website_messages.start()
        print(f'Logged in as {self.user} (ID: {self.user.id})')
        print('------')
    
    def get_guild_config(self, guild_id: int) -> dict:
        """Get configuration for a guild"""
        return self.data.get(str(guild_id), {})
    
    def save_guild_config(self, guild_id: int, config: dict):
        """Save configuration for a guild"""
        self.data[str(guild_id)] = config
        save_data(self.data)
    
    @tasks.loop(seconds=5)
    async def check_website_messages(self):
        """Check for new messages from the website and post them to Discord"""
        try:
            for guild_id, config in self.data.items():
                if not config.get('global_chat_channel'):
                    continue
                
                channel = self.get_channel(int(config['global_chat_channel']))
                if not channel:
                    continue
                
                # Get recent messages from Supabase
                result = supabase.table('global_chat').select('*').eq('source', 'website').order('created_at', desc=True).limit(10).execute()
                
                if not result.data:
                    continue
                
                # Track which messages we've already posted
                posted_ids = config.get('posted_message_ids', [])
                
                for msg in reversed(result.data):
                    msg_id = str(msg['id'])
                    if msg_id not in posted_ids:
                        # Post to Discord
                        embed = discord.Embed(
                            description=msg['message'],
                            color=discord.Color.blue(),
                            timestamp=datetime.fromisoformat(msg['created_at'].replace('Z', '+00:00'))
                        )
                        embed.set_author(name=f"{msg['username']} (Website)")
                        
                        await channel.send(embed=embed)
                        
                        # Track that we've posted this message
                        posted_ids.append(msg_id)
                        
                        # Keep only last 100 tracked IDs
                        if len(posted_ids) > 100:
                            posted_ids = posted_ids[-100:]
                
                config['posted_message_ids'] = posted_ids
                self.save_guild_config(int(guild_id), config)
                
        except Exception as e:
            print(f'Error checking website messages: {e}')
    
    @check_website_messages.before_loop
    async def before_check_messages(self):
        await self.wait_until_ready()

bot = HideoutBot()

class SetupView(discord.ui.View):
    """View for the setup wizard"""
    
    def __init__(self, bot: HideoutBot, guild_id: int, step: int = 1):
        super().__init__(timeout=300)
        self.bot = bot
        self.guild_id = guild_id
        self.step = step
        self.config = bot.get_guild_config(guild_id) or {}
    
    async def show_step(self, interaction: discord.Interaction):
        """Show the current setup step"""
        if self.step == 1:
            embed = discord.Embed(
                title="🏠 Hideout Network Bot Setup",
                description="Welcome to the Hideout Network bot setup!\n\nThis bot syncs global chat between Discord and the Hideout website.",
                color=discord.Color.blue()
            )
            embed.add_field(
                name="What this bot does:",
                value="• Syncs messages between Discord and the website\n• Applies the same chat filters as the website\n• Keeps your community connected",
                inline=False
            )
            
            self.clear_items()
            self.add_item(NextButton(self, label="Next →"))
            
        elif self.step == 2:
            embed = discord.Embed(
                title="📋 Step 1: Moderator Channel",
                description="Select the channel where moderators can run admin commands.\n\nOnly users with **Administrator** or **Manage Server** permissions can use admin commands in this channel.",
                color=discord.Color.blue()
            )
            
            self.clear_items()
            self.add_item(ChannelSelect(self, 'mod_channel'))
            self.add_item(NextButton(self, label="Next →", disabled=not self.config.get('mod_channel')))
            
        elif self.step == 3:
            embed = discord.Embed(
                title="💬 Step 2: Global Chat Channel",
                description="Select the channel for global chat.\n\n**Messages in this channel will be synced with the Hideout website!**\n\nMessages from the website will appear here, and messages sent here will appear on the website.",
                color=discord.Color.blue()
            )
            
            self.clear_items()
            self.add_item(ChannelSelect(self, 'global_chat_channel'))
            self.add_item(NextButton(self, label="Finish Setup ✓", disabled=not self.config.get('global_chat_channel')))
            
        elif self.step == 4:
            embed = discord.Embed(
                title="✅ Setup Complete!",
                description="The Hideout Network bot is now configured for this server.",
                color=discord.Color.green()
            )
            
            mod_channel = self.bot.get_channel(int(self.config.get('mod_channel', 0)))
            chat_channel = self.bot.get_channel(int(self.config.get('global_chat_channel', 0)))
            
            embed.add_field(
                name="Configuration:",
                value=f"**Mod Channel:** {mod_channel.mention if mod_channel else 'Not set'}\n**Global Chat:** {chat_channel.mention if chat_channel else 'Not set'}",
                inline=False
            )
            embed.add_field(
                name="What's Next?",
                value="• Messages in the global chat channel will sync with the website\n• Use `/help` for more commands\n• Run `.setup` again to reconfigure",
                inline=False
            )
            
            self.clear_items()
            
        await interaction.response.edit_message(embed=embed, view=self)

class ChannelSelect(discord.ui.ChannelSelect):
    """Channel selection dropdown"""
    
    def __init__(self, view: SetupView, config_key: str):
        super().__init__(
            placeholder="Select a channel...",
            channel_types=[discord.ChannelType.text],
            min_values=1,
            max_values=1
        )
        self.setup_view = view
        self.config_key = config_key
    
    async def callback(self, interaction: discord.Interaction):
        channel = self.values[0]
        self.setup_view.config[self.config_key] = str(channel.id)
        self.setup_view.bot.save_guild_config(self.setup_view.guild_id, self.setup_view.config)
        
        # Update the view to enable Next button
        await self.setup_view.show_step(interaction)

class NextButton(discord.ui.Button):
    """Next button for setup wizard"""
    
    def __init__(self, view: SetupView, label: str = "Next →", disabled: bool = False):
        super().__init__(label=label, style=discord.ButtonStyle.primary, disabled=disabled)
        self.setup_view = view
    
    async def callback(self, interaction: discord.Interaction):
        self.setup_view.step += 1
        await self.setup_view.show_step(interaction)

@bot.command(name='setup')
@commands.has_permissions(administrator=True)
async def setup_command(ctx: commands.Context):
    """Start the setup wizard for the bot"""
    config = bot.get_guild_config(ctx.guild.id)
    
    # Check if already configured
    if config.get('mod_channel') and config.get('global_chat_channel'):
        embed = discord.Embed(
            title="🏠 Hideout Network Bot",
            description="This server is already configured. Do you want to reconfigure?",
            color=discord.Color.blue()
        )
        
        mod_channel = bot.get_channel(int(config.get('mod_channel', 0)))
        chat_channel = bot.get_channel(int(config.get('global_chat_channel', 0)))
        
        embed.add_field(
            name="Current Configuration:",
            value=f"**Mod Channel:** {mod_channel.mention if mod_channel else 'Not set'}\n**Global Chat:** {chat_channel.mention if chat_channel else 'Not set'}",
            inline=False
        )
        
        view = SetupView(bot, ctx.guild.id, step=1)
        await ctx.send(embed=embed, view=view)
    else:
        view = SetupView(bot, ctx.guild.id, step=1)
        await view.show_step(await ctx.send(embed=discord.Embed(title="Loading...", color=discord.Color.blue())))

@bot.event
async def on_message(message: discord.Message):
    """Handle messages in the global chat channel"""
    # Ignore bot messages
    if message.author.bot:
        return
    
    # Process commands first
    await bot.process_commands(message)
    
    # Check if this is in a configured global chat channel
    if not message.guild:
        return
    
    config = bot.get_guild_config(message.guild.id)
    if not config.get('global_chat_channel'):
        return
    
    if str(message.channel.id) != config['global_chat_channel']:
        return
    
    # Check for blocked content
    if contains_blocked_content(message.content):
        await message.delete()
        await message.channel.send(
            f"{message.author.mention} Your message contains inappropriate content and was not sent.",
            delete_after=5
        )
        return
    
    # Send to Supabase
    try:
        result = supabase.table('global_chat').insert({
            'username': message.author.display_name,
            'message': message.content,
            'source': 'discord'
        }).execute()
        
        if result.data:
            # Add a reaction to confirm it was sent
            await message.add_reaction('✅')
    except Exception as e:
        print(f'Error sending message to Supabase: {e}')
        await message.add_reaction('❌')

@bot.tree.command(name='help', description='Show bot help and commands')
async def help_command(interaction: discord.Interaction):
    """Show help information"""
    embed = discord.Embed(
        title="🏠 Hideout Network Bot Help",
        description="This bot syncs global chat between Discord and the Hideout website.",
        color=discord.Color.blue()
    )
    
    embed.add_field(
        name="Commands:",
        value="`.setup` - Configure the bot (Admin only)\n`/help` - Show this help message",
        inline=False
    )
    
    embed.add_field(
        name="How it works:",
        value="Messages sent in the configured global chat channel are synced to the Hideout website, and messages from the website appear in Discord.",
        inline=False
    )
    
    embed.add_field(
        name="Chat Rules:",
        value="• Same filters as the website apply\n• Inappropriate messages are automatically blocked\n• Be respectful to everyone",
        inline=False
    )
    
    await interaction.response.send_message(embed=embed)

@bot.event
async def on_ready():
    print(f'{bot.user.name} is ready!')
    print(f'Connected to {len(bot.guilds)} guild(s)')

# Run the bot
if __name__ == '__main__':
    bot.run(DISCORD_TOKEN)
