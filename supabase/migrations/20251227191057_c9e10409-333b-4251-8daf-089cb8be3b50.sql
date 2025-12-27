-- Add website_url and addons columns to widgets table
ALTER TABLE public.widgets 
ADD COLUMN IF NOT EXISTS website_url text,
ADD COLUMN IF NOT EXISTS addons jsonb DEFAULT '[]'::jsonb;