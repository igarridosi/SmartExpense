-- ============================================================
-- SmartExpense: Full Database Migration
-- Run this ONCE in Supabase SQL Editor
-- ============================================================

-- ============================================================
-- 1. PROFILES: Extends Supabase auth.users
-- ============================================================
CREATE TABLE IF NOT EXISTS public.profiles (
  id            UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  display_name  TEXT NOT NULL DEFAULT '',
  base_currency TEXT NOT NULL DEFAULT 'USD',
  created_at    TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at    TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);
CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Trigger: auto-create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, display_name)
  VALUES (NEW.id, COALESCE(NEW.raw_user_meta_data->>'display_name', ''));
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- ============================================================
-- 2. CATEGORIES: Hybrid (global + user-specific)
-- ============================================================
CREATE TABLE IF NOT EXISTS public.categories (
  id         UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id    UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  name       TEXT NOT NULL,
  icon       TEXT DEFAULT '📦',
  color      TEXT DEFAULT '#6B7280',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  CONSTRAINT unique_category_per_user UNIQUE (user_id, name)
);

ALTER TABLE public.categories ENABLE ROW LEVEL SECURITY;

-- Users see global categories (user_id IS NULL) + their own
CREATE POLICY "categories_select" ON public.categories
  FOR SELECT USING (user_id IS NULL OR user_id = auth.uid());
CREATE POLICY "categories_insert_own" ON public.categories
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "categories_update_own" ON public.categories
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "categories_delete_own" ON public.categories
  FOR DELETE USING (user_id = auth.uid());

-- Seed global categories
INSERT INTO public.categories (user_id, name, icon, color) VALUES
  (NULL, 'Alimentación',   '🍔', '#EF4444'),
  (NULL, 'Transporte',     '🚗', '#F59E0B'),
  (NULL, 'Vivienda',       '🏠', '#3B82F6'),
  (NULL, 'Entretenimiento','🎬', '#8B5CF6'),
  (NULL, 'Salud',          '💊', '#10B981'),
  (NULL, 'Educación',      '📚', '#6366F1'),
  (NULL, 'Servicios',      '💡', '#F97316'),
  (NULL, 'Otros',          '📦', '#6B7280');

-- ============================================================
-- 3. EXPENSES: Core transaction table
-- ============================================================
CREATE TABLE IF NOT EXISTS public.expenses (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id               UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  category_id           UUID NOT NULL REFERENCES public.categories(id) ON DELETE RESTRICT,
  description           TEXT NOT NULL DEFAULT '',
  amount                NUMERIC(12,2) NOT NULL CHECK (amount > 0),
  currency              TEXT NOT NULL DEFAULT 'USD',
  amount_in_base        NUMERIC(12,2) NOT NULL,
  exchange_rate_used    NUMERIC(14,6) NOT NULL DEFAULT 1.0,
  expense_date          DATE NOT NULL DEFAULT CURRENT_DATE,
  source                TEXT NOT NULL DEFAULT 'manual' CHECK (source IN ('manual', 'csv')),
  created_at            TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_expenses_user_date ON public.expenses (user_id, expense_date DESC);
CREATE INDEX IF NOT EXISTS idx_expenses_user_category ON public.expenses (user_id, category_id);
CREATE INDEX IF NOT EXISTS idx_expenses_user_month ON public.expenses (user_id, (DATE_TRUNC('month', expense_date)));

ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "expenses_select_own" ON public.expenses
  FOR SELECT USING (user_id = auth.uid());
CREATE POLICY "expenses_insert_own" ON public.expenses
  FOR INSERT WITH CHECK (user_id = auth.uid());
CREATE POLICY "expenses_update_own" ON public.expenses
  FOR UPDATE USING (user_id = auth.uid());
CREATE POLICY "expenses_delete_own" ON public.expenses
  FOR DELETE USING (user_id = auth.uid());

-- ============================================================
-- 4. EXCHANGE_RATES: Cache for currency conversion
-- ============================================================
CREATE TABLE IF NOT EXISTS public.exchange_rates (
  id          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  base        TEXT NOT NULL,
  target      TEXT NOT NULL,
  rate        NUMERIC(14,6) NOT NULL,
  fetched_at  DATE NOT NULL DEFAULT CURRENT_DATE,
  CONSTRAINT unique_rate_per_day UNIQUE (base, target, fetched_at)
);

CREATE INDEX IF NOT EXISTS idx_exchange_rates_lookup ON public.exchange_rates (base, target, fetched_at DESC);

ALTER TABLE public.exchange_rates ENABLE ROW LEVEL SECURITY;

CREATE POLICY "exchange_rates_select" ON public.exchange_rates
  FOR SELECT USING (auth.role() = 'authenticated');
