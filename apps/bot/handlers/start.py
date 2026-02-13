"""
/start handler — user registration and welcome message.

Flow:
  1. Upsert the user in the users table (telegram_id + first_name).
  2. If the user belongs to exactly one household and has no active one set,
     auto-select it.
  3. Send a welcome message listing all available commands.
"""

import logging
from telegram import Update
from telegram.ext import ContextTypes
from utils.supabase_client import ensure_user_exists, get_user_households, set_active_household

logger = logging.getLogger(__name__)

WELCOME_TEXT = """Hola {name}, bienvenido/a a NuestrosGastos!

Comandos disponibles:
  /login    — Entrar al dashboard web
  /gasto    — Registrar un nuevo gasto
  /balance  — Ver quién debe a quién este mes
  /resumen  — Resumen mensual por categoría
  /espacio  — Ver y cambiar tu hogar activo
  /ayuda    — Mostrar este mensaje
"""


async def start_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Entry point: register user, set default household, send welcome."""
    user = update.effective_user
    telegram_id = user.id
    name = user.first_name or "Usuario"

    db_user = ensure_user_exists(telegram_id, name)

    # Auto-select household if the user has exactly one and none is active
    if not db_user.get("active_household_id"):
        households = get_user_households(db_user["id"])
        if len(households) == 1:
            set_active_household(db_user["id"], households[0]["id"])
            logger.info(f"Auto-selected household {households[0]['id']} for user {telegram_id}")

    await update.effective_message.reply_text(WELCOME_TEXT.format(name=name))
    logger.info(f"User {telegram_id} ({name}) ran /start")
