-- Seed data for NuestrosGastos
-- Idempotent: all INSERTs use ON CONFLICT DO NOTHING.
-- Users: Andrea (id=1), Pamela (id=2)
-- Household: "Hogar" (id=1), budget S/ 8,000, created by Andrea
-- 7 expenses across January 2026
-- 1 recurring expense (Netflix)
-- 1 automation rule (Supermercado auto-shares with both)

-- -------------------------------------------------------------------------
-- USERS
-- Note: active_household_id is set after the household is created.
-- -------------------------------------------------------------------------
INSERT INTO users (id, telegram_id, name)
VALUES
  (1, 111111, 'Andrea'),
  (2, 222222, 'Pamela')
ON CONFLICT (telegram_id) DO NOTHING;

-- -------------------------------------------------------------------------
-- HOUSEHOLD
-- -------------------------------------------------------------------------
INSERT INTO households (id, name, type, created_by, is_active, monthly_budget)
VALUES (1, 'Hogar', 'permanent', 1, TRUE, 8000.00)
ON CONFLICT (id) DO NOTHING;

-- Set active household for both users
UPDATE users SET active_household_id = 1 WHERE active_household_id IS NULL AND id IN (1, 2);

-- -------------------------------------------------------------------------
-- HOUSEHOLD MEMBERS
-- -------------------------------------------------------------------------
INSERT INTO household_members (household_id, user_id, role, is_active)
VALUES
  (1, 1, 'owner',  TRUE),
  (1, 2, 'member', TRUE)
ON CONFLICT (household_id, user_id) DO NOTHING;

-- -------------------------------------------------------------------------
-- EXPENSES (7 rows, January 2026)
--
-- | # | Date       | Category        | Type     | Amount | Paid by | Shared with    | Description            |
-- |---|------------|-----------------|----------|--------|---------|----------------|------------------------|
-- | 1 | 2026-01-05 | Supermercado    | variable | 350.00 | Andrea  | Andrea, Pamela | Compras semanales      |
-- | 2 | 2026-01-07 | Transporte      | variable | 120.00 | Pamela  | Pamela         | Taxi al aeropuerto     |
-- | 3 | 2026-01-15 | Supermercado    | variable | 280.00 | Andrea  | Andrea, Pamela | Compras de quincena    |
-- | 4 | 2026-01-18 | Entretenimiento | variable |  95.00 | Pamela  | Andrea, Pamela | Cine pareja            |
-- | 5 | 2026-01-20 | Servicios       | fixed    | 450.00 | Andrea  | Andrea, Pamela | Factura luz y agua     |
-- | 6 | 2026-01-22 | Salud           | variable | 180.00 | Pamela  | Pamela         | Consulta médica        |
-- | 7 | 2026-01-25 | Suscripciones   | fixed    |  60.00 | Andrea  | Andrea         | Libro / suscripción    |
-- -------------------------------------------------------------------------
INSERT INTO expenses (household_id, paid_by, amount, category, type, description, shared_with, expense_date)
VALUES
  (1, 1, 350.00, 'Supermercado',    'variable', 'Compras semanales',    ARRAY[1, 2], '2026-01-05'),
  (1, 2, 120.00, 'Transporte',      'variable', 'Taxi al aeropuerto',   ARRAY[2],    '2026-01-07'),
  (1, 1, 280.00, 'Supermercado',    'variable', 'Compras de quincena',  ARRAY[1, 2], '2026-01-15'),
  (1, 2,  95.00, 'Entretenimiento', 'variable', 'Cine pareja',          ARRAY[1, 2], '2026-01-18'),
  (1, 1, 450.00, 'Servicios',       'fixed',    'Factura luz y agua',   ARRAY[1, 2], '2026-01-20'),
  (1, 2, 180.00, 'Salud',           'variable', 'Consulta médica',      ARRAY[2],    '2026-01-22'),
  (1, 1,  60.00, 'Suscripciones',   'fixed',    'Libro / suscripción',  ARRAY[1],    '2026-01-25');

-- -------------------------------------------------------------------------
-- RECURRING EXPENSES
-- -------------------------------------------------------------------------
INSERT INTO recurring_expenses (household_id, paid_by, name, amount, category, type, shared_with, frequency, next_due_date, auto_register, is_active)
VALUES
  (1, 2, 'Netflix', 44.90, 'Suscripciones', 'fixed', ARRAY[1, 2], 'monthly', '2026-02-05', TRUE, TRUE);

-- -------------------------------------------------------------------------
-- AUTOMATION RULES
-- Any expense categorized as Supermercado is automatically shared with both members.
-- -------------------------------------------------------------------------
INSERT INTO automation_rules (household_id, name, trigger_type, trigger_category, auto_shared_with, is_active)
VALUES
  (1, 'Supermercado compartido', 'category', 'Supermercado', ARRAY[1, 2], TRUE);
