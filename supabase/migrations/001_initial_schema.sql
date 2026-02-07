-- Migration 001: Initial schema for NuestrosGastos
-- All CREATE statements are guarded with IF NOT EXISTS for idempotency.
-- Circular FK (users.active_household_id → households, households.created_by → users)
-- is resolved by creating users first without the FK, then adding it after households exists.

-- -------------------------------------------------------------------------
-- USERS (created first, without active_household_id FK)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS users (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  telegram_id         BIGINT  UNIQUE NOT NULL,
  name                TEXT    NOT NULL,
  active_household_id BIGINT,                          -- FK added below after households
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- HOUSEHOLDS
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS households (
  id             BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name           TEXT    NOT NULL,
  type           TEXT    CHECK (type IN ('permanent', 'temporary')) DEFAULT 'permanent',
  description    TEXT,
  icon           TEXT,
  created_by     BIGINT  REFERENCES users(id),
  is_active      BOOLEAN DEFAULT TRUE,
  monthly_budget NUMERIC(12,2),
  settings       JSONB   DEFAULT '{"split_method":"equal","currency":"PEN"}'::jsonb,
  created_at     TIMESTAMPTZ DEFAULT NOW(),
  updated_at     TIMESTAMPTZ DEFAULT NOW()
);

-- Now add the FK from users.active_household_id → households
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint WHERE conname = 'users_active_household_id_fkey'
  ) THEN
    ALTER TABLE users
      ADD CONSTRAINT users_active_household_id_fkey
      FOREIGN KEY (active_household_id) REFERENCES households(id);
  END IF;
END $$;

-- -------------------------------------------------------------------------
-- HOUSEHOLD_MEMBERS (many-to-many)
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS household_members (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id BIGINT  NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  user_id      BIGINT  NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  role         TEXT    NOT NULL DEFAULT 'member' CHECK (role IN ('owner', 'admin', 'member', 'viewer')),
  nickname     TEXT,
  joined_at    TIMESTAMPTZ DEFAULT NOW(),
  is_active    BOOLEAN DEFAULT TRUE,
  UNIQUE (household_id, user_id)
);

-- -------------------------------------------------------------------------
-- EXPENSES
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS expenses (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id     BIGINT  NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  paid_by          BIGINT  NOT NULL REFERENCES users(id),
  amount           NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category         TEXT    NOT NULL,
  type             TEXT    NOT NULL CHECK (type IN ('fixed', 'variable')),
  description      TEXT,
  store            TEXT,
  shared_with      BIGINT[] NOT NULL DEFAULT '{}',
  receipt_url      TEXT,
  expense_date     DATE    NOT NULL DEFAULT CURRENT_DATE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- RECURRING_EXPENSES
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS recurring_expenses (
  id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id        BIGINT  NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  paid_by             BIGINT  NOT NULL REFERENCES users(id),
  name                TEXT    NOT NULL,
  amount              NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  category            TEXT    NOT NULL,
  type                TEXT    NOT NULL CHECK (type IN ('fixed', 'variable')),
  shared_with         BIGINT[] NOT NULL DEFAULT '{}',
  frequency           TEXT    NOT NULL CHECK (frequency IN ('weekly', 'monthly', 'yearly')),
  next_due_date       DATE    NOT NULL,
  reminder_days_before INTEGER[] DEFAULT '{3,1}',
  auto_register       BOOLEAN DEFAULT FALSE,
  is_active           BOOLEAN DEFAULT TRUE,
  created_at          TIMESTAMPTZ DEFAULT NOW(),
  updated_at          TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- AUTOMATION_RULES
-- -------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS automation_rules (
  id               BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  household_id     BIGINT  NOT NULL REFERENCES households(id) ON DELETE CASCADE,
  name             TEXT    NOT NULL,
  trigger_type     TEXT    CHECK (trigger_type IN ('email_pattern', 'schedule', 'category')),
  trigger_category TEXT,                              -- used when trigger_type = 'category'
  auto_shared_with BIGINT[] NOT NULL DEFAULT '{}',
  email_pattern    JSONB,
  extraction_rules JSONB,
  auto_action      JSONB,
  is_active        BOOLEAN DEFAULT TRUE,
  created_at       TIMESTAMPTZ DEFAULT NOW()
);

-- -------------------------------------------------------------------------
-- INDEXES
-- -------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_expenses_household_date
  ON expenses (household_id, expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_paid_by_date
  ON expenses (paid_by, expense_date DESC);

CREATE INDEX IF NOT EXISTS idx_expenses_household_type
  ON expenses (household_id, type);

CREATE INDEX IF NOT EXISTS idx_household_members_household
  ON household_members (household_id);

CREATE INDEX IF NOT EXISTS idx_household_members_user
  ON household_members (user_id);

CREATE INDEX IF NOT EXISTS idx_users_telegram_id
  ON users (telegram_id);

CREATE INDEX IF NOT EXISTS idx_recurring_expenses_household_active
  ON recurring_expenses (household_id, is_active);

CREATE INDEX IF NOT EXISTS idx_automation_rules_household_category
  ON automation_rules (household_id, trigger_category);
