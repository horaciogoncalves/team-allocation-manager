-- Add standard hourly cost to members (EUR, 2 decimal places)
ALTER TABLE public.members
ADD COLUMN IF NOT EXISTS std_cst NUMERIC(10, 2);
