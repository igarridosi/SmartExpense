CREATE TABLE IF NOT EXISTS public.product_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_name TEXT NOT NULL,
  event_context TEXT NOT NULL,
  metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_product_events_user_created_at
  ON public.product_events (user_id, created_at DESC);

CREATE INDEX IF NOT EXISTS idx_product_events_context
  ON public.product_events (event_context, created_at DESC);

ALTER TABLE public.product_events ENABLE ROW LEVEL SECURITY;

CREATE POLICY "product_events_select_own" ON public.product_events
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "product_events_insert_own" ON public.product_events
  FOR INSERT WITH CHECK (auth.uid() = user_id);
