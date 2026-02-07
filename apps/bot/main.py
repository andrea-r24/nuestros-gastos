"""
NuestrosGastos Telegram Bot — entry point.

Loads environment variables, initializes the Supabase client, registers all
command handlers (and the ConversationHandler for /gasto), and starts the bot
in polling mode.

To run locally:
  cd apps/bot
  pip install -r requirements.txt
  cp .env.example .env          # fill in real values
  python main.py
"""

import os
import sys
import logging
from dotenv import load_dotenv
from telegram.ext import (
    ApplicationBuilder,
    CommandHandler,
    ConversationHandler,
    CallbackQueryHandler,
)

# ---------------------------------------------------------------------------
# Logging (matches the style used in the rest of the project)
# ---------------------------------------------------------------------------
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s - %(name)s - %(levelname)s - %(message)s",
    handlers=[logging.StreamHandler(sys.stdout)],
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Imports (after logging setup so any import-time logs are captured)
# ---------------------------------------------------------------------------
from utils.supabase_client import init_client  # noqa: E402

from handlers.start   import start_handler                           # noqa: E402
from handlers.gasto   import gasto_handler, gasto_shared_step, cancel_handler, AWAIT_SHARED  # noqa: E402
from handlers.balance import balance_handler                         # noqa: E402
from handlers.espacio import espacio_handler, espacio_callback       # noqa: E402
from handlers.resumen import resumen_handler                         # noqa: E402


# ---------------------------------------------------------------------------
# Build the Application
# ---------------------------------------------------------------------------
def build_app():
    """Wire up env, Supabase, and all Telegram handlers. Return the Application."""
    load_dotenv()  # reads apps/bot/.env if present; no-op in production
    init_client()  # Supabase singleton — must happen before any handler runs

    token = os.getenv("TELEGRAM_BOT_TOKEN", "")
    if not token:
        raise ValueError("TELEGRAM_BOT_TOKEN must be set")

    app = ApplicationBuilder().token(token).build()

    # --- Simple command handlers ---
    app.add_handler(CommandHandler("start",   start_handler))
    app.add_handler(CommandHandler("balance", balance_handler))
    app.add_handler(CommandHandler("espacio", espacio_handler))
    app.add_handler(CommandHandler("resumen", resumen_handler))
    # /ayuda is an alias for /start (same welcome text)
    app.add_handler(CommandHandler("ayuda", start_handler))

    # --- ConversationHandler for /gasto (multi-step) ---
    gasto_conversation = ConversationHandler(
        entry_points=[CommandHandler("gasto", gasto_handler)],
        states={
            AWAIT_SHARED: [CallbackQueryHandler(gasto_shared_step)],
        },
        fallbacks=[CommandHandler("cancelar", cancel_handler)],
    )
    app.add_handler(gasto_conversation)

    # --- Standalone callback for /espacio inline keyboard ---
    # Pattern "^espacio:" ensures it only fires for espacio buttons,
    # not for the /gasto toggle:/confirm buttons (those are scoped inside
    # the ConversationHandler above).
    app.add_handler(CallbackQueryHandler(espacio_callback, pattern=r"^espacio:"))

    return app


# ---------------------------------------------------------------------------
# Entry point
# ---------------------------------------------------------------------------
if __name__ == "__main__":
    application = build_app()
    logger.info("Starting NuestrosGastos bot (polling mode)...")
    application.run_polling()
