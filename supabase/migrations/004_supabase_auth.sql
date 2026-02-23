-- Migration 004: Migrate authentication to Supabase Auth (Google OAuth)
--
-- Changes:
--   1. Add supabase_auth_id (UUID) to users table for Supabase Auth integration
--   2. Make telegram_id nullable (Google-only users won't have it)
--   3. Enable RLS on users table
--   4. Rewrite all RLS policies from current_setting('app.telegram_id') to auth.uid()
--   5. Add INSERT/UPDATE/DELETE policies where missing
--   6. Create link_codes table for Telegram linking from Settings
--   7. Create merge_users() function for linking existing Telegram accounts
--   8. Create get_current_user_id() helper function

-- =========================================================================
-- 1. Schema changes to users table
-- =========================================================================

-- Add supabase_auth_id column
ALTER TABLE users ADD COLUMN IF NOT EXISTS supabase_auth_id UUID UNIQUE;

-- Make telegram_id nullable (Google-only users won't have it initially)
ALTER TABLE users ALTER COLUMN telegram_id DROP NOT NULL;

-- Index for fast lookups by supabase_auth_id
CREATE INDEX IF NOT EXISTS idx_users_supabase_auth_id ON users (supabase_auth_id);

-- =========================================================================
-- 2. Helper function: get internal user ID from auth.uid()
-- =========================================================================

CREATE OR REPLACE FUNCTION get_current_user_id()
RETURNS BIGINT
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT id FROM users WHERE supabase_auth_id = auth.uid()
$$;

-- =========================================================================
-- 3. Enable RLS on users table (was previously disabled)
-- =========================================================================

ALTER TABLE users ENABLE ROW LEVEL SECURITY;

-- Users can read their own row
CREATE POLICY "users_select_own"
  ON users FOR SELECT
  USING (supabase_auth_id = auth.uid());

-- Users can update their own row
CREATE POLICY "users_update_own"
  ON users FOR UPDATE
  USING (supabase_auth_id = auth.uid());

-- =========================================================================
-- 4. Drop old RLS policies (telegram_id-based)
-- =========================================================================

DROP POLICY IF EXISTS "members can select own household" ON households;
DROP POLICY IF EXISTS "members can select own household_members" ON household_members;
DROP POLICY IF EXISTS "members can select own household expenses" ON expenses;
DROP POLICY IF EXISTS "members can insert expenses in own household" ON expenses;
DROP POLICY IF EXISTS "members can select own recurring expenses" ON recurring_expenses;
DROP POLICY IF EXISTS "members can select own automation rules" ON automation_rules;

-- =========================================================================
-- 5. New RLS policies using auth.uid()
-- =========================================================================

-- HOUSEHOLDS — SELECT
CREATE POLICY "households_select_member"
  ON households FOR SELECT
  USING (
    id IN (
      SELECT hm.household_id FROM household_members hm
      WHERE hm.user_id = get_current_user_id()
      AND hm.is_active = TRUE
    )
  );

-- HOUSEHOLDS — INSERT (for household creation during onboarding)
CREATE POLICY "households_insert_authenticated"
  ON households FOR INSERT
  WITH CHECK (auth.uid() IS NOT NULL);

-- HOUSEHOLDS — UPDATE (owners/admins only)
CREATE POLICY "households_update_owner"
  ON households FOR UPDATE
  USING (
    id IN (
      SELECT hm.household_id FROM household_members hm
      WHERE hm.user_id = get_current_user_id()
      AND hm.is_active = TRUE
      AND hm.role IN ('owner', 'admin')
    )
  );

-- HOUSEHOLD_MEMBERS — SELECT
CREATE POLICY "hm_select_member"
  ON household_members FOR SELECT
  USING (
    household_id IN (
      SELECT hm2.household_id FROM household_members hm2
      WHERE hm2.user_id = get_current_user_id()
      AND hm2.is_active = TRUE
    )
  );

-- HOUSEHOLD_MEMBERS — INSERT (owners/admins can add members, or self for creation)
CREATE POLICY "hm_insert_owner_or_self"
  ON household_members FOR INSERT
  WITH CHECK (
    -- Owner/admin adding someone to their household
    household_id IN (
      SELECT hm.household_id FROM household_members hm
      WHERE hm.user_id = get_current_user_id()
      AND hm.is_active = TRUE
      AND hm.role IN ('owner', 'admin')
    )
    OR
    -- User adding themselves as owner (during household creation)
    (user_id = get_current_user_id() AND role = 'owner')
  );

-- HOUSEHOLD_MEMBERS — DELETE (owners/admins can remove members)
CREATE POLICY "hm_delete_owner"
  ON household_members FOR DELETE
  USING (
    household_id IN (
      SELECT hm.household_id FROM household_members hm
      WHERE hm.user_id = get_current_user_id()
      AND hm.is_active = TRUE
      AND hm.role IN ('owner', 'admin')
    )
  );

-- EXPENSES — SELECT
CREATE POLICY "expenses_select_member"
  ON expenses FOR SELECT
  USING (
    household_id IN (
      SELECT hm.household_id FROM household_members hm
      WHERE hm.user_id = get_current_user_id()
      AND hm.is_active = TRUE
    )
  );

-- EXPENSES — INSERT
CREATE POLICY "expenses_insert_member"
  ON expenses FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT hm.household_id FROM household_members hm
      WHERE hm.user_id = get_current_user_id()
      AND hm.is_active = TRUE
    )
  );

-- RECURRING_EXPENSES — SELECT
CREATE POLICY "recurring_select_member"
  ON recurring_expenses FOR SELECT
  USING (
    household_id IN (
      SELECT hm.household_id FROM household_members hm
      WHERE hm.user_id = get_current_user_id()
      AND hm.is_active = TRUE
    )
  );

-- AUTOMATION_RULES — SELECT
CREATE POLICY "automation_select_member"
  ON automation_rules FOR SELECT
  USING (
    household_id IN (
      SELECT hm.household_id FROM household_members hm
      WHERE hm.user_id = get_current_user_id()
      AND hm.is_active = TRUE
    )
  );

-- =========================================================================
-- 6. Link codes table for Telegram linking from Settings
-- =========================================================================

CREATE TABLE IF NOT EXISTS link_codes (
  code        TEXT        PRIMARY KEY,
  telegram_id BIGINT      NOT NULL,
  name        TEXT        NOT NULL,
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (NOW() + INTERVAL '10 minutes'),
  used        BOOLEAN     NOT NULL DEFAULT FALSE,
  created_at  TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- =========================================================================
-- 7. Merge function for linking Telegram to existing Google account
-- =========================================================================

CREATE OR REPLACE FUNCTION merge_users(old_user_id BIGINT, new_user_id BIGINT)
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  -- Update household_members (skip if already member of that household)
  UPDATE household_members SET user_id = new_user_id
    WHERE user_id = old_user_id
    AND NOT EXISTS (
      SELECT 1 FROM household_members hm2
      WHERE hm2.user_id = new_user_id
      AND hm2.household_id = household_members.household_id
    );
  -- Delete remaining old memberships (duplicates that couldn't be moved)
  DELETE FROM household_members WHERE user_id = old_user_id;

  -- Update expenses
  UPDATE expenses SET paid_by = new_user_id WHERE paid_by = old_user_id;
  UPDATE expenses SET shared_with = array_replace(shared_with, old_user_id, new_user_id);

  -- Update recurring_expenses
  UPDATE recurring_expenses SET paid_by = new_user_id WHERE paid_by = old_user_id;
  UPDATE recurring_expenses SET shared_with = array_replace(shared_with, old_user_id, new_user_id);

  -- Update automation_rules
  UPDATE automation_rules SET auto_shared_with = array_replace(auto_shared_with, old_user_id, new_user_id);

  -- Update households.created_by
  UPDATE households SET created_by = new_user_id WHERE created_by = old_user_id;

  -- Transfer active_household_id if new user doesn't have one
  UPDATE users SET active_household_id = (
    SELECT active_household_id FROM users WHERE id = old_user_id
  ) WHERE id = new_user_id AND active_household_id IS NULL;

  -- Delete old user
  DELETE FROM users WHERE id = old_user_id;
END;
$$;

-- =========================================================================
-- 8. Keep set_telegram_context for backward compatibility (bot still uses it indirectly)
-- It won't be called by the frontend anymore, but keeping it doesn't hurt.
-- =========================================================================
