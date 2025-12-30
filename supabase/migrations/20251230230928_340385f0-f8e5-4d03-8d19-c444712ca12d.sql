-- Add billing_period_start and messages_limit columns to widgets table
ALTER TABLE public.widgets 
ADD COLUMN IF NOT EXISTS billing_period_start timestamp with time zone,
ADD COLUMN IF NOT EXISTS messages_limit integer DEFAULT 1000;