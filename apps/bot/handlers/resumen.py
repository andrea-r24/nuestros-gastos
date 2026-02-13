"""
/resumen handler — monthly expense summary.

Shows three sections:
  1. Total spent this month.
  2. Breakdown by category (amount + percentage).
  3. Who paid how much (raw totals, not net).
"""

import logging
from datetime import datetime
from telegram import Update
from telegram.ext import ContextTypes
from utils.supabase_client import (
    get_user_by_telegram_id,
    get_active_household,
    get_household_members,
    get_monthly_summary,
    get_monthly_expenses,
)

logger = logging.getLogger(__name__)


async def resumen_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Produce and send the monthly summary message."""
    db_user = get_user_by_telegram_id(update.effective_user.id)
    if not db_user:
        await update.effective_message.reply_text("No encontré tu cuenta. Usa /start primero.")
        return

    household = get_active_household(db_user["id"])
    if not household:
        await update.effective_message.reply_text("No tienes un hogar activo. Usa /espacio.")
        return

    now = datetime.now()
    summary = get_monthly_summary(household["id"], now.year, now.month)   # { category: total }
    expenses = get_monthly_expenses(household["id"], now.year, now.month) # raw rows
    members = get_household_members(household["id"])
    name_map = {m["id"]: m["name"] for m in members}

    total = sum(summary.values())
    month_name = now.strftime("%B").capitalize()

    # --- Header ---
    lines = [
        f"Resumen de {month_name} {now.year}",
        f"Total gastado: S/ {total:.2f}",
        "",
    ]

    # --- By category ---
    lines.append("Por categoría:")
    for cat, amt in sorted(summary.items(), key=lambda x: -x[1]):
        pct = (amt / total * 100) if total else 0
        lines.append(f"  {cat}: S/ {amt:.2f} ({pct:.0f}%)")

    # --- Who paid (raw totals) ---
    lines.append("")
    lines.append("Pagó:")
    paid_totals: dict = {}
    for exp in expenses:
        pid = exp["paid_by"]
        paid_totals[pid] = paid_totals.get(pid, 0.0) + float(exp["amount"])

    for uid, amt in sorted(paid_totals.items(), key=lambda x: -x[1]):
        lines.append(f"  {name_map.get(uid, '?')}: S/ {amt:.2f}")

    await update.effective_message.reply_text("\n".join(lines))
