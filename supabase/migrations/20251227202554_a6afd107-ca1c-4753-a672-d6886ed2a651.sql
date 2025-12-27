-- Add webhook and admin fields to widgets table
ALTER TABLE public.widgets 
ADD COLUMN IF NOT EXISTS webhook_url text,
ADD COLUMN IF NOT EXISTS lead_webhook_url text,
ADD COLUMN IF NOT EXISTS support_webhook_url text,
ADD COLUMN IF NOT EXISTS health_check_url text,
ADD COLUMN IF NOT EXISTS table_name text;