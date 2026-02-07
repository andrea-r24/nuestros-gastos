"""
Supabase client and database helpers for NuestrosGastos bot.

Single source of truth for:
  - The Supabase client singleton
  - The CATEGORIES map (name → type) used for validation and auto-fill
  - All database query helpers consumed by the command handlers
"""

import os
import logging
from typing import Optional, List, Dict
from supabase import create_client, Client

logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Category definitions — single source of truth
# The bot auto-fills expenses.type from this map; users never type it.
# ---------------------------------------------------------------------------
CATEGORIES: Dict[str, Dict[str, str]] = {
    "Supermercado":    {"type": "variable"},
    "Delivery":        {"type": "variable"},
    "Servicios":       {"type": "fixed"},
    "Suscripciones":   {"type": "fixed"},
    "Transporte":      {"type": "variable"},
    "Salud":           {"type": "variable"},
    "Entretenimiento": {"type": "variable"},
    "Mantenimiento":   {"type": "fixed"},
    "Otros":           {"type": "variable"},
}

VALID_CATEGORIES: List[str] = list(CATEGORIES.keys())

# ---------------------------------------------------------------------------
# Client singleton
# ---------------------------------------------------------------------------
_client: Optional[Client] = None


def init_client() -> Client:
    """Create the Supabase client from env vars. Called once at bot startup."""
    global _client
    url = os.getenv("SUPABASE_URL", "")
    key = os.getenv("SUPABASE_SERVICE_KEY", "")
    if not url or not key:
        raise ValueError("SUPABASE_URL and SUPABASE_SERVICE_KEY must be set")
    _client = create_client(url, key)
    logger.info("Supabase client initialized")
    return _client


def get_client() -> Client:
    """Return the already-initialized client."""
    if _client is None:
        raise RuntimeError("Supabase client not initialized. Call init_client() first.")
    return _client


# ---------------------------------------------------------------------------
# User helpers
# ---------------------------------------------------------------------------
def get_user_by_telegram_id(telegram_id: int) -> Optional[Dict]:
    """Return the users row matching telegram_id, or None."""
    resp = get_client().table("users").select("*").eq("telegram_id", telegram_id).execute()
    return resp.data[0] if resp.data else None


def ensure_user_exists(telegram_id: int, name: str) -> Dict:
    """Upsert: insert if new, return existing row otherwise."""
    user = get_user_by_telegram_id(telegram_id)
    if user:
        return user
    resp = get_client().table("users").insert({
        "telegram_id": telegram_id,
        "name": name,
    }).execute()
    logger.info(f"Created user: telegram_id={telegram_id}, name={name}")
    return resp.data[0]


# ---------------------------------------------------------------------------
# Household helpers
# ---------------------------------------------------------------------------
def get_active_household(user_id: int) -> Optional[Dict]:
    """Return the households row that is the user's active_household_id."""
    user = get_client().table("users").select("active_household_id").eq("id", user_id).execute()
    if not user.data or not user.data[0].get("active_household_id"):
        return None
    hid = user.data[0]["active_household_id"]
    resp = get_client().table("households").select("*").eq("id", hid).execute()
    return resp.data[0] if resp.data else None


def get_user_households(user_id: int) -> List[Dict]:
    """Return all households the user is an active member of."""
    members = (
        get_client()
        .table("household_members")
        .select("household_id")
        .eq("user_id", user_id)
        .eq("is_active", True)
        .execute()
    )
    if not members.data:
        return []
    household_ids = [m["household_id"] for m in members.data]
    resp = get_client().table("households").select("*").in_("id", household_ids).execute()
    return resp.data


def set_active_household(user_id: int, household_id: int) -> None:
    """Update users.active_household_id."""
    get_client().table("users").update({"active_household_id": household_id}).eq("id", user_id).execute()
    logger.info(f"User {user_id} switched active household to {household_id}")


def get_household_members(household_id: int) -> List[Dict]:
    """Return all active users who are members of the given household."""
    members = (
        get_client()
        .table("household_members")
        .select("user_id")
        .eq("household_id", household_id)
        .eq("is_active", True)
        .execute()
    )
    if not members.data:
        return []
    user_ids = [m["user_id"] for m in members.data]
    resp = get_client().table("users").select("*").in_("id", user_ids).execute()
    return resp.data


# ---------------------------------------------------------------------------
# Expense helpers
# ---------------------------------------------------------------------------
def insert_expense(
    household_id: int,
    paid_by: int,
    amount: float,
    category: str,
    description: str,
    shared_with: List[int],
    store: Optional[str] = None,
) -> Dict:
    """Insert a row into expenses. Type is auto-filled from CATEGORIES."""
    exp_type = CATEGORIES.get(category, {}).get("type", "variable")
    payload = {
        "household_id": household_id,
        "paid_by": paid_by,
        "amount": amount,
        "category": category,
        "type": exp_type,
        "description": description,
        "shared_with": shared_with,
    }
    if store:
        payload["store"] = store
    resp = get_client().table("expenses").insert(payload).execute()
    logger.info(f"Inserted expense: {payload}")
    return resp.data[0]


def get_monthly_expenses(household_id: int, year: int, month: int) -> List[Dict]:
    """Return all expenses for a household in a given month, newest first."""
    # Build the month boundaries
    start = f"{year}-{month:02d}-01"
    if month == 12:
        end = f"{year + 1}-01-01"
    else:
        end = f"{year}-{month + 1:02d}-01"

    resp = (
        get_client()
        .table("expenses")
        .select("*")
        .eq("household_id", household_id)
        .gte("expense_date", start)
        .lt("expense_date", end)
        .order("expense_date", desc=True)
        .execute()
    )
    return resp.data


def get_monthly_balance(household_id: int, year: int, month: int) -> Dict[int, float]:
    """Compute net balance per user_id for the month.

    Algorithm:
        For each expense:
            per_person_share = amount / len(shared_with)
            Each person in shared_with owes that share.
            The payer (paid_by) gets full credit for the amount.
        net[user] = credit[user] - owed[user]
            positive  → others owe this person
            negative  → this person owes others

    Returns:
        { user_id: net_amount }
    """
    expenses = get_monthly_expenses(household_id, year, month)
    credit: Dict[int, float] = {}
    owed: Dict[int, float] = {}

    for exp in expenses:
        amount = float(exp["amount"])
        paid_by = exp["paid_by"]
        shared = exp["shared_with"]
        share = amount / len(shared) if shared else amount

        credit[paid_by] = credit.get(paid_by, 0.0) + amount
        for uid in shared:
            owed[uid] = owed.get(uid, 0.0) + share

    # Merge into net
    all_users = set(credit.keys()) | set(owed.keys())
    return {uid: round(credit.get(uid, 0.0) - owed.get(uid, 0.0), 2) for uid in all_users}


def get_monthly_summary(household_id: int, year: int, month: int) -> Dict[str, float]:
    """Return { category: total_amount } for the month."""
    expenses = get_monthly_expenses(household_id, year, month)
    summary: Dict[str, float] = {}
    for exp in expenses:
        cat = exp["category"]
        summary[cat] = round(summary.get(cat, 0.0) + float(exp["amount"]), 2)
    return summary
