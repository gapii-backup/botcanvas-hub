-- Add subscription_status column to widgets table
ALTER TABLE public.widgets 
ADD COLUMN subscription_status text NOT NULL DEFAULT 'none';

-- Add comment for documentation
COMMENT ON COLUMN public.widgets.subscription_status IS 'Subscription status: none, active, cancelled';