-- Migration 002: Row Level Security policies for NuestrosGastos
--
-- Auth model: the Next.js frontend identifies users by telegram_id, which is
-- stored in a PostgreSQL session variable via:
--   SELECT set_config('app.telegram_id', '<id>', false);
-- (called by the frontend before any RLS-gated query).
--
-- The bot uses the service_role key, which bypasses all RLS automatically.
-- These policies therefore only govern the anon/authenticated roles used by
-- the Next.js frontend.
--
-- Helper CTE used in every policy:
--   current_user_id = (SELECT id FROM users WHERE telegram_id = current_setting('app.telegram_id')::BIGINT)

-- -------------------------------------------------------------------------
-- Enable RLS on all tables that need it
-- -------------------------------------------------------------------------
ALTER TABLE households         ENABLE ROW LEVEL SECURITY;
ALTER TABLE household_members  ENABLE ROW LEVEL SECURITY;
ALTER TABLE expenses           ENABLE ROW LEVEL SECURITY;
ALTER TABLE recurring_expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE automation_rules   ENABLE ROW LEVEL SECURITY;
-- users: no RLS; the bot manages it with service_role and the frontend
-- never queries users directly.

-- -------------------------------------------------------------------------
-- HOUSEHOLDS — SELECT
-- A user can see a household if they are an active member of it.
-- -------------------------------------------------------------------------
CREATE POLICY "members can select own household"
  ON households
  FOR SELECT
  USING (
    id IN (
      SELECT hm.household_id
      FROM household_members hm
      WHERE hm.user_id = (
        SELECT u.id FROM users u
        WHERE u.telegram_id = current_setting('app.telegram_id')::BIGINT
      )
      AND hm.is_active = TRUE
    )
  );

-- -------------------------------------------------------------------------
-- HOUSEHOLD_MEMBERS — SELECT
-- A user can see the member list of any household they belong to.
-- -------------------------------------------------------------------------
CREATE POLICY "members can select own household_members"
  ON household_members
  FOR SELECT
  USING (
    household_id IN (
      SELECT hm2.household_id
      FROM household_members hm2
      WHERE hm2.user_id = (
        SELECT u.id FROM users u
        WHERE u.telegram_id = current_setting('app.telegram_id')::BIGINT
      )
      AND hm2.is_active = TRUE
    )
  );

-- -------------------------------------------------------------------------
-- EXPENSES — SELECT
-- A user can see expenses that belong to their households.
-- -------------------------------------------------------------------------
CREATE POLICY "members can select own household expenses"
  ON expenses
  FOR SELECT
  USING (
    household_id IN (
      SELECT hm.household_id
      FROM household_members hm
      WHERE hm.user_id = (
        SELECT u.id FROM users u
        WHERE u.telegram_id = current_setting('app.telegram_id')::BIGINT
      )
      AND hm.is_active = TRUE
    )
  );

-- EXPENSES — INSERT
-- A member can insert expenses into their own households.
-- (Bot bypasses this via service_role; this exists for future dashboard add-expense.)
CREATE POLICY "members can insert expenses in own household"
  ON expenses
  FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT hm.household_id
      FROM household_members hm
      WHERE hm.user_id = (
        SELECT u.id FROM users u
        WHERE u.telegram_id = current_setting('app.telegram_id')::BIGINT
      )
      AND hm.is_active = TRUE
    )
  );

-- -------------------------------------------------------------------------
-- RECURRING_EXPENSES — SELECT
-- -------------------------------------------------------------------------
CREATE POLICY "members can select own recurring expenses"
  ON recurring_expenses
  FOR SELECT
  USING (
    household_id IN (
      SELECT hm.household_id
      FROM household_members hm
      WHERE hm.user_id = (
        SELECT u.id FROM users u
        WHERE u.telegram_id = current_setting('app.telegram_id')::BIGINT
      )
      AND hm.is_active = TRUE
    )
  );

-- -------------------------------------------------------------------------
-- AUTOMATION_RULES — SELECT
-- -------------------------------------------------------------------------
CREATE POLICY "members can select own automation rules"
  ON automation_rules
  FOR SELECT
  USING (
    household_id IN (
      SELECT hm.household_id
      FROM household_members hm
      WHERE hm.user_id = (
        SELECT u.id FROM users u
        WHERE u.telegram_id = current_setting('app.telegram_id')::BIGINT
      )
      AND hm.is_active = TRUE
    )
  );
