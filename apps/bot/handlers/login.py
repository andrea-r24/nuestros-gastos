"""
/login handler — generate a magic-link token and send it to the user.

Flow:
  1. Upsert user in DB (same as /start — ensures they exist).
  2. Create a one-time auth token valid for 15 minutes.
  3. Send the user a link to https://<WEB_BASE_URL>/auth?token=<UUID>.

The user clicks the link in their browser, the web app validates the token,
sets localStorage.telegram_id, and redirects to the dashboard.
"""

import os
import logging
from telegram import Update
from telegram.ext import ContextTypes
from utils.supabase_client import ensure_user_exists, create_auth_token

logger = logging.getLogger(__name__)

WEB_BASE_URL = os.getenv("WEB_BASE_URL", "https://nuestrosgastos.vercel.app").rstrip("/")

LOGIN_TEXT = (
    "Haz clic en el siguiente link para entrar al dashboard "
    "(válido por 15 minutos):\n\n"
    "{url}\n\n"
    "Si el link expiró, vuelve a escribir /login para obtener uno nuevo."
)


async def login_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Generate a magic-link and send it to the user."""
    tg_user = update.effective_user
    telegram_id = tg_user.id
    name = tg_user.first_name or "Usuario"

    # Ensure the user exists in our DB before issuing a token
    ensure_user_exists(telegram_id, name)

    token = create_auth_token(telegram_id, name)
    url = f"{WEB_BASE_URL}/auth?token={token}"

    await update.effective_message.reply_text(LOGIN_TEXT.format(url=url))
    logger.info(f"Login token issued for telegram_id={telegram_id}")
