
ALTER TABLE public.profiles
  ADD COLUMN IF NOT EXISTS plan_start_date timestamptz,
  ADD COLUMN IF NOT EXISTS plan_end_date timestamptz,
  ADD COLUMN IF NOT EXISTS trial_used boolean NOT NULL DEFAULT false;
