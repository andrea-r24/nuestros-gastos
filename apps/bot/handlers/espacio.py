"""
/espacio handler — list and switch active household.

Shows an InlineKeyboard with one button per household the user belongs to.
The currently active one is labelled [activo]. Tapping a button switches it.
"""

import logging
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import ExtensionContext
from utils.supabase_client import (
    get_user_by_telegram_id,
    get_user_households,
    set_active_household,
)

logger = logging.getLogger(__name__)


async def espacio_handler(update: Update, context: ExtensionContext) -> None:
    """List user's households as an InlineKeyboard."""
    db_user = get_user_by_telegram_id(update.effective_user.id)
    if not db_user:
        await update.effective_message.reply_text("No encontré tu cuenta. Usa /start primero.")
        return

    households = get_user_households(db_user["id"])
    if not households:
        await update.effective_message.reply_text(
            "No perteneces a ningún hogar. Alguien debe agregarte."
        )
        return

    active_id = db_user.get("active_household_id")
    buttons = []
    for h in households:
        label = f"[activo] {h['name']}" if h["id"] == active_id else h["name"]
        buttons.append([InlineKeyboardButton(label, callback_data=f"espacio:{h['id']}")])

    await update.effective_message.reply_text(
        "Tus hogares:",
        reply_markup=InlineKeyboardMarkup(buttons),
    )


async def espacio_callback(update: Update, context: ExtensionContext) -> None:
    """Handle household selection callback — switch active household."""
    query = update.callback_query
    await query.answer()

    household_id = int(query.data.split(":")[1])
    db_user = get_user_by_telegram_id(update.effective_user.id)
    set_active_household(db_user["id"], household_id)

    # Fetch the household name for a nicer confirmation
    from utils.supabase_client import get_client
    resp = get_client().table("households").select("name").eq("id", household_id).execute()
    name = resp.data[0]["name"] if resp.data else str(household_id)

    await query.edit_message_text(f"Hogar activo cambiado a: {name}")
    logger.info(f"User {db_user['id']} switched to household {household_id}")
