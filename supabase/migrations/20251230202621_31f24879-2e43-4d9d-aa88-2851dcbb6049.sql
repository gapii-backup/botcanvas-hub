-- Add Stripe fields to widgets table for tracking
ALTER TABLE public.widgets 
ADD COLUMN IF NOT EXISTS stripe_customer_id TEXT,
ADD COLUMN IF NOT EXISTS stripe_subscription_id TEXT;

-- Add comments for documentation
COMMENT ON COLUMN public.widgets.stripe_customer_id IS 'Stripe Customer ID for billing';
COMMENT ON COLUMN public.widgets.stripe_subscription_id IS 'Stripe Subscription ID for recurring payments';