"""
/gasto handler — multi-step expense registration via ConversationHandler.

Flow:
  1. User sends: /gasto 350 Supermercado Compras semanales
     Bot validates amount (numeric, positive) and category (case-insensitive).
     If valid, stores the pending expense in context.user_data and shows
     the member picker (Step 2).

  2. Bot replies with an InlineKeyboard: one toggle button per OTHER household
     member (paid_by is always included automatically). A "Confirmar" button
     finishes the selection.

  3. User taps "Confirmar".
     Bot reads the final shared_with list, inserts the expense (type auto-filled
     from the category map), sends a confirmation, and ends the conversation.

  /cancelar at any point aborts the flow.
"""

import logging
from telegram import Update, InlineKeyboardMarkup, InlineKeyboardButton
from telegram.ext import ExtensionContext, ConversationHandler
from utils.supabase_client import (
    get_user_by_telegram_id,
    get_active_household,
    get_household_members,
    insert_expense,
    VALID_CATEGORIES,
)

logger = logging.getLogger(__name__)

# Conversation states
AWAIT_SHARED = 1
DONE = ConversationHandler.END


# ---------------------------------------------------------------------------
# Step 1 — entry point
# ---------------------------------------------------------------------------
async def gasto_handler(update: Update, context: ExtensionContext) -> int:
    """Parse /gasto arguments, validate, store pending expense, show picker."""
    args = context.args or []

    if len(args) < 2:
        await update.effective_message.reply_text(
            "Uso: /gasto <monto> <categoría> [descripción]\n"
            "Ejemplo: /gasto 350 Supermercado Compras semanales\n\n"
            "Categorías: " + ", ".join(VALID_CATEGORIES)
        )
        return ConversationHandler.END

    # --- Parse amount (accept both 350,50 and 350.50) ---
    try:
        amount = float(args[0].replace(",", "."))
        if amount <= 0:
            raise ValueError
    except ValueError:
        await update.effective_message.reply_text("El monto debe ser un número positivo (ej: 350 o 42,50).")
        return ConversationHandler.END

    # --- Validate category (case-insensitive, store canonical form) ---
    raw_category = args[1]
    category: str | None = None
    for valid in VALID_CATEGORIES:
        if valid.lower() == raw_category.lower():
            category = valid
            break
    if category is None:
        await update.effective_message.reply_text(
            f"Categoría no válida: '{raw_category}'.\n"
            f"Categorías disponibles: {', '.join(VALID_CATEGORIES)}"
        )
        return ConversationHandler.END

    description = " ".join(args[2:]) if len(args) > 2 else ""

    # --- Resolve current user and household ---
    db_user = get_user_by_telegram_id(update.effective_user.id)
    if not db_user:
        await update.effective_message.reply_text("No encontré tu cuenta. Usa /start primero.")
        return ConversationHandler.END

    household = get_active_household(db_user["id"])
    if not household:
        await update.effective_message.reply_text(
            "No tienes un hogar activo. Usa /espacio para configurar uno."
        )
        return ConversationHandler.END

    # --- Store pending expense in user_data (persists across steps) ---
    context.user_data["pending_expense"] = {
        "amount": amount,
        "category": category,
        "description": description,
        "household_id": household["id"],
        "paid_by": db_user["id"],
    }
    # selected is the set of OTHER members chosen to share; paid_by added at confirm
    context.user_data["pending_shared"] = set()

    # --- Build member picker (exclude paid_by) ---
    members = get_household_members(household["id"])
    others = [m for m in members if m["id"] != db_user["id"]]
    context.user_data["members"] = members  # full list cached for confirm message
    context.user_data["others"] = others    # toggle targets

    keyboard = _build_member_keyboard(others, set())
    await update.effective_message.reply_text(
        f"Gasto de S/ {amount:.2f} en {category}.\n"
        "¿Quién más comparte este gasto? (puedes elegir varios)",
        reply_markup=keyboard,
    )
    return AWAIT_SHARED


# ---------------------------------------------------------------------------
# Step 2 — InlineKeyboard callback
# ---------------------------------------------------------------------------
async def gasto_shared_step(update: Update, context: ExtensionContext) -> int:
    """Handle tap on a member toggle button or the Confirm button."""
    query = update.callback_query
    await query.answer()

    data = query.data
    pending = context.user_data["pending_expense"]
    others = context.user_data["others"]
    shared: set = context.user_data["pending_shared"]

    if data == "confirm":
        # paid_by is always part of shared_with
        shared.add(pending["paid_by"])

        expense = insert_expense(
            household_id=pending["household_id"],
            paid_by=pending["paid_by"],
            amount=pending["amount"],
            category=pending["category"],
            description=pending["description"],
            shared_with=list(shared),
        )

        # Build confirmation
        members = context.user_data["members"]
        name_map = {m["id"]: m["name"] for m in members}
        shared_names = ", ".join(name_map.get(uid, "?") for uid in shared)

        msg = (
            f"Gasto registrado:\n"
            f"  Monto:       S/ {pending['amount']:.2f}\n"
            f"  Categoría:   {pending['category']}\n"
            f"  Descripción: {pending['description'] or '—'}\n"
            f"  Compartido:  {shared_names}"
        )
        await query.edit_message_text(msg)

        # Cleanup
        context.user_data.pop("pending_expense", None)
        context.user_data.pop("pending_shared", None)
        context.user_data.pop("members", None)
        context.user_data.pop("others", None)

        return DONE

    elif data.startswith("toggle:"):
        uid = int(data.split(":")[1])
        if uid in shared:
            shared.discard(uid)
        else:
            shared.add(uid)
        context.user_data["pending_shared"] = shared

        keyboard = _build_member_keyboard(others, shared)
        await query.edit_message_reply_markup(reply_markup=keyboard)
        return AWAIT_SHARED

    # Unknown callback data — stay in state
    return AWAIT_SHARED


# ---------------------------------------------------------------------------
# Fallback — /cancelar
# ---------------------------------------------------------------------------
async def cancel_handler(update: Update, context: ExtensionContext) -> int:
    """Abort the /gasto conversation."""
    context.user_data.pop("pending_expense", None)
    context.user_data.pop("pending_shared", None)
    context.user_data.pop("members", None)
    context.user_data.pop("others", None)
    await update.effective_message.reply_text("Gasto cancelado.")
    return ConversationHandler.END


# ---------------------------------------------------------------------------
# Helper — build InlineKeyboard
# ---------------------------------------------------------------------------
def _build_member_keyboard(others: List[Dict], selected: set) -> InlineKeyboardMarkup:
    """One toggle button per other member, plus a Confirm row.

    If no others exist (single-user household), the keyboard shows only Confirm
    and the expense will be shared with paid_by alone.
    """
    buttons = []
    for m in others:
        label = f"[x] {m['name']}" if m["id"] in selected else m["name"]
        buttons.append([InlineKeyboardButton(label, callback_data=f"toggle:{m['id']}")])

    confirm_label = "Confirmar" if others else "Solo yo — Confirmar"
    buttons.append([InlineKeyboardButton(confirm_label, callback_data="confirm")])
    return InlineKeyboardMarkup(buttons)


# Need List and Dict in type hints
from typing import List, Dict  # noqa: E402 (imported at bottom to avoid circular; harmless)
