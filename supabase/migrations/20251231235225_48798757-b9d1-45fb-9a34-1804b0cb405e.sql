-- Add is_partner and retention_days columns to widgets table
ALTER TABLE public.widgets 
ADD COLUMN IF NOT EXISTS is_partner boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS retention_days integer NOT NULL DEFAULT 30;

-- Create index for partner lookup
CREATE INDEX IF NOT EXISTS idx_widgets_is_partner ON public.widgets(is_partner);
