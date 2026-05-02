
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan TEXT NOT NULL DEFAULT 'free';

CREATE TABLE IF NOT EXISTS public.content_generations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_content_generations_user_created
  ON public.content_generations (user_id, created_at DESC);

ALTER TABLE public.content_generations ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users view own generations"
  ON public.content_generations FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users insert own generations"
  ON public.content_generations FOR INSERT
  WITH CHECK (auth.uid() = user_id);
