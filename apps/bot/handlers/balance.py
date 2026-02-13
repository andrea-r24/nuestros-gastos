"""
/balance handler — shows who owes whom this month.

Algorithm:
  1. Fetch all expenses for the active household in the current month.
  2. Compute net balance per user (credit from paying minus share owed).
  3. Use greedy settlement to produce the minimal set of "X debe a Y" lines.
     (Optimal in transaction count; trivially one line for 2-person households.)
"""

import logging
from datetime import datetime
from telegram import Update
from telegram.ext import ContextTypes
from utils.supabase_client import (
    get_user_by_telegram_id,
    get_active_household,
    get_household_members,
    get_monthly_balance,
)

logger = logging.getLogger(__name__)


async def balance_handler(update: Update, context: ContextTypes.DEFAULT_TYPE) -> None:
    """Query monthly balance and send formatted message."""
    db_user = get_user_by_telegram_id(update.effective_user.id)
    if not db_user:
        await update.effective_message.reply_text("No encontré tu cuenta. Usa /start primero.")
        return

    household = get_active_household(db_user["id"])
    if not household:
        await update.effective_message.reply_text("No tienes un hogar activo. Usa /espacio.")
        return

    now = datetime.now()
    balances = get_monthly_balance(household["id"], now.year, now.month)

    members = get_household_members(household["id"])
    name_map = {m["id"]: m["name"] for m in members}

    # --- Header ---
    month_name = now.strftime("%B").capitalize()
    lines = [f"Balance de {month_name} {now.year}:", ""]

    # --- Per-person net ---
    for uid, net in sorted(balances.items(), key=lambda x: -x[1]):
        sign = "+" if net >= 0 else ""
        lines.append(f"  {name_map.get(uid, '?')}: S/ {sign}{net:.2f}")

    # --- Debt lines via greedy settlement ---
    creditors = {uid: net for uid, net in balances.items() if net > 0}
    debtors = {uid: -net for uid, net in balances.items() if net < 0}
    debt_lines = _settle(creditors, debtors, name_map)

    if debt_lines:
        lines.append("")
        lines.extend(debt_lines)
    else:
        lines.append("\nTodos están al par.")

    await update.effective_message.reply_text("\n".join(lines))


def _settle(creditors: dict, debtors: dict, name_map: dict) -> list:
    """Greedy settlement: produce human-readable debt lines.

    Iterates creditors and debtors, matching the smallest available amounts
    until all debts are settled. Produces the minimum number of transfers.

    Returns:
        List of strings like "  Pamela debe S/ 175.00 a Andrea"
    """
    lines = []
    c = dict(creditors)  # copy — we mutate
    d = dict(debtors)
    while c and d:
        c_id = next(iter(c))
        d_id = next(iter(d))
        amount = min(c[c_id], d[d_id])
        lines.append(
            f"  {name_map.get(d_id, '?')} debe S/ {amount:.2f} a {name_map.get(c_id, '?')}"
        )
        c[c_id] = round(c[c_id] - amount, 2)
        d[d_id] = round(d[d_id] - amount, 2)
        if c[c_id] == 0:
            del c[c_id]
        if d[d_id] == 0:
            del d[d_id]
    return lines
