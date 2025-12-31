-- Add support_tickets JSONB column to widgets table
ALTER TABLE public.widgets 
ADD COLUMN IF NOT EXISTS support_tickets jsonb DEFAULT '[]'::jsonb;