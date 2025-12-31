-- Add custom_capacity column to widgets table
ALTER TABLE public.widgets ADD COLUMN custom_capacity integer NOT NULL DEFAULT 0;