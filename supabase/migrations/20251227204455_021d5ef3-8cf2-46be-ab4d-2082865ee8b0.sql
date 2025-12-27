-- Add footer fields to widgets table
ALTER TABLE public.widgets
ADD COLUMN IF NOT EXISTS footer_prefix TEXT,
ADD COLUMN IF NOT EXISTS footer_link_text TEXT,
ADD COLUMN IF NOT EXISTS footer_link_url TEXT,
ADD COLUMN IF NOT EXISTS footer_suffix TEXT;