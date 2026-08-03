-- Add billing rate and calculated margin to members
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS billing_rate NUMERIC(10, 2),
ADD COLUMN IF NOT EXISTS margin NUMERIC(5, 2);
