-- Add billing_period column to user_bots table
ALTER TABLE public.user_bots 
ADD COLUMN billing_period TEXT NOT NULL DEFAULT 'monthly' 
CHECK (billing_period IN ('monthly', 'yearly'));