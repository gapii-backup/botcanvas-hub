
-- Create partner_customers table
CREATE TABLE public.partner_customers (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id),
  promo_code text NOT NULL,
  customer_email text NOT NULL,
  customer_name text,
  stripe_customer_id text,
  plan text NOT NULL,
  billing_period text NOT NULL,
  status text NOT NULL DEFAULT 'pending',
  first_paid_at timestamptz,
  months_covered integer NOT NULL DEFAULT 0,
  commissions_total numeric NOT NULL DEFAULT 0,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  original_billing_period text,
  max_months integer NOT NULL DEFAULT 24,
  commission_locked boolean NOT NULL DEFAULT false
);

-- Create partner_commissions table
CREATE TABLE public.partner_commissions (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid NOT NULL REFERENCES public.partners(id),
  partner_customer_id uuid REFERENCES public.partner_customers(id),
  type text NOT NULL,
  amount numeric NOT NULL,
  commission_number integer,
  milestone_type text,
  stripe_invoice_id text,
  invoice_requested boolean NOT NULL DEFAULT false,
  invoice_requested_at timestamptz,
  invoice_paid boolean NOT NULL DEFAULT false,
  invoice_paid_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.partner_customers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_commissions ENABLE ROW LEVEL SECURITY;

-- RLS: Partners can view their own customers
CREATE POLICY "Partners can view their own customers"
ON public.partner_customers
FOR SELECT
TO authenticated
USING (partner_id = (SELECT id FROM public.partners WHERE user_id = auth.uid()));

-- RLS: Partners can view their own commissions
CREATE POLICY "Partners can view their own commissions"
ON public.partner_commissions
FOR SELECT
TO authenticated
USING (partner_id = (SELECT id FROM public.partners WHERE user_id = auth.uid()));

-- RLS: Partners can update invoice fields on their own commissions
CREATE POLICY "Partners can request invoice on their own commissions"
ON public.partner_commissions
FOR UPDATE
TO authenticated
USING (partner_id = (SELECT id FROM public.partners WHERE user_id = auth.uid()))
WITH CHECK (partner_id = (SELECT id FROM public.partners WHERE user_id = auth.uid()));

-- Remove deprecated bonus columns from partners
ALTER TABLE public.partners
  DROP COLUMN IF EXISTS bonus_bronze_claimed,
  DROP COLUMN IF EXISTS bonus_silver_claimed,
  DROP COLUMN IF EXISTS bonus_gold_claimed,
  DROP COLUMN IF EXISTS bonus_platinum_claimed,
  DROP COLUMN IF EXISTS bonus_diamond_claimed;
