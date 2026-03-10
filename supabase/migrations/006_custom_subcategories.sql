-- Migration 006: Custom subcategories per household
--
-- Allows users to create custom subcategories within a macro category.
-- Custom subcategories are scoped to the household (visible to all members).

CREATE TABLE IF NOT EXISTS custom_subcategories (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id    BIGINT  NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  macro_category  TEXT    NOT NULL,  -- vivienda, alimentos, servicios, etc.
  name            TEXT    NOT NULL,
  created_by      BIGINT  NOT NULL REFERENCES users(id),
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (household_id, macro_category, name)
);

-- Index for fast lookup by household
CREATE INDEX IF NOT EXISTS idx_custom_subcategories_household
  ON custom_subcategories (household_id);

-- RLS
ALTER TABLE custom_subcategories ENABLE ROW LEVEL SECURITY;

-- Members can read custom subcategories of their household
CREATE POLICY "custom_sub_select_member"
  ON custom_subcategories FOR SELECT
  USING (
    household_id IN (
      SELECT hm.household_id FROM household_members hm
      WHERE hm.user_id = get_current_user_id()
      AND hm.is_active = TRUE
    )
  );

-- Members can insert custom subcategories in their household
CREATE POLICY "custom_sub_insert_member"
  ON custom_subcategories FOR INSERT
  WITH CHECK (
    household_id IN (
      SELECT hm.household_id FROM household_members hm
      WHERE hm.user_id = get_current_user_id()
      AND hm.is_active = TRUE
    )
  );

-- Members can delete custom subcategories in their household
CREATE POLICY "custom_sub_delete_member"
  ON custom_subcategories FOR DELETE
  USING (
    household_id IN (
      SELECT hm.household_id FROM household_members hm
      WHERE hm.user_id = get_current_user_id()
      AND hm.is_active = TRUE
    )
  );
