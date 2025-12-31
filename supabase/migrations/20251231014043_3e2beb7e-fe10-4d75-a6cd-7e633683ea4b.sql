-- Add new columns for warning/grace tracking
ALTER TABLE public.widgets 
ADD COLUMN IF NOT EXISTS grace_ends_at timestamp with time zone DEFAULT NULL,
ADD COLUMN IF NOT EXISTS warning_80_sent boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS warning_100_sent boolean NOT NULL DEFAULT false;