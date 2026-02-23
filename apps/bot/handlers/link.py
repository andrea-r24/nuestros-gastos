"""
/link handler — generate a 6-character code for linking Telegram to a web account.
"""

import logging
from telegram import Update
from telegram.ext import ContextTypes

from utils.supabase_client import ensure_user_exists, create_link_code

logger = logging.getLogger(__name__)

LINK_TEXT = (
    "Tu codigo de vinculacion es:\n\n"
    "🔑 <b>{code}</b>\n\n"
    "Ingresalo en la seccion <b>Ajustes > Conexiones > Telegram</b> "
    "del dashboard web.\n\n"
    "El codigo es valido por 10 minutos."
)


async def link_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Generate a link code and send it to the user."""
    tg_user = update.effective_user
    telegram_id = tg_user.id
    name = tg_user.first_name or "Usuario"

    ensure_user_exists(telegram_id, name)
    code = create_link_code(telegram_id, name)

    await update.effective_message.reply_text(
        LINK_TEXT.format(code=code), parse_mode="HTML"
    )
    logger.info(f"Link code issued for telegram_id={telegram_id}: {code}")
