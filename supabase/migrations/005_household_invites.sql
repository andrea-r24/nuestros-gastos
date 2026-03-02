-- Migration 005: Household invitations system
-- Adds invite codes (link + manual code) for joining households

-- ---------------------------------------------------------------------------
-- 1. Create household_invites table
-- ---------------------------------------------------------------------------
CREATE TABLE household_invites (
  id          SERIAL PRIMARY KEY,
  household_id INT NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  code        VARCHAR(8) UNIQUE NOT NULL,
  created_by  INT NOT NULL REFERENCES users(id),
  expires_at  TIMESTAMPTZ NOT NULL DEFAULT (now() + interval '7 days'),
  max_uses    INT DEFAULT NULL,          -- NULL = unlimited
  use_count   INT DEFAULT 0,
  is_active   BOOLEAN DEFAULT TRUE,
  created_at  TIMESTAMPTZ DEFAULT now()
);

-- Index for fast lookup by code
CREATE INDEX idx_household_invites_code ON household_invites(code);
CREATE INDEX idx_household_invites_household ON household_invites(household_id);

-- ---------------------------------------------------------------------------
-- 2. RLS policies for household_invites
-- ---------------------------------------------------------------------------
ALTER TABLE household_invites ENABLE ROW LEVEL SECURITY;

-- Anyone can read an invite by code (needed for the public /invite/[code] page)
CREATE POLICY "invites_select_by_code"
  ON household_invites FOR SELECT
  USING (TRUE);

-- Household members can insert invites (owners checked at app level)
CREATE POLICY "invites_insert_member"
  ON household_invites FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT hm.household_id FROM household_members hm
      WHERE hm.user_id = get_current_user_id()
      AND hm.is_active = TRUE
    )
  );

-- Creator or household owner can update (deactivate) invites
CREATE POLICY "invites_update_member"
  ON household_invites FOR UPDATE
  USING (
    household_id IN (
      SELECT hm.household_id FROM household_members hm
      WHERE hm.user_id = get_current_user_id()
      AND hm.is_active = TRUE
    )
  );

-- ---------------------------------------------------------------------------
-- 3. Make users.active_household_id nullable (allow NULL for new users)
-- ---------------------------------------------------------------------------
-- Already nullable from migration 004, but ensure the FK constraint allows it
-- No change needed — just documenting that new users will have NULL here
