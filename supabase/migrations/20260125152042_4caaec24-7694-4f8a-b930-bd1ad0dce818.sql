-- Create partners table
CREATE TABLE public.partners (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  email text NOT NULL UNIQUE,
  company text,
  phone text,
  website text,
  terms_accepted boolean DEFAULT false,
  terms_version text,
  ip_address text,
  submitted_at timestamptz,
  created_at timestamptz DEFAULT now(),
  promo_code text UNIQUE,
  is_active boolean DEFAULT false,
  user_id uuid REFERENCES auth.users(id),
  bonus_bronze_claimed boolean DEFAULT false,
  bonus_silver_claimed boolean DEFAULT false,
  bonus_gold_claimed boolean DEFAULT false,
  bonus_platinum_claimed boolean DEFAULT false,
  bonus_diamond_claimed boolean DEFAULT false
);

-- Create partner_referrals table
CREATE TABLE public.partner_referrals (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  partner_id uuid REFERENCES public.partners(id) ON DELETE CASCADE NOT NULL,
  promo_code text NOT NULL,
  customer_email text NOT NULL,
  customer_name text,
  plan text NOT NULL,
  commission_amount numeric NOT NULL,
  tier_at_purchase text,
  invoice_requested boolean DEFAULT false,
  invoice_requested_at timestamptz,
  invoice_paid boolean DEFAULT false,
  invoice_paid_at timestamptz,
  status text DEFAULT 'active',
  created_at timestamptz DEFAULT now()
);

-- Create indexes
CREATE INDEX idx_partners_email ON public.partners(email);
CREATE INDEX idx_partners_promo_code ON public.partners(promo_code);
CREATE INDEX idx_partner_referrals_promo_code ON public.partner_referrals(promo_code);
CREATE INDEX idx_partner_referrals_partner_id ON public.partner_referrals(partner_id);

-- Enable RLS
ALTER TABLE public.partners ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.partner_referrals ENABLE ROW LEVEL SECURITY;

-- RLS policies for partners table
CREATE POLICY "Users can view their own partner record"
ON public.partners
FOR SELECT
USING (email = (auth.jwt()->>'email'));

CREATE POLICY "Users can update their own partner record"
ON public.partners
FOR UPDATE
USING (email = (auth.jwt()->>'email'));

-- RLS policies for partner_referrals table
CREATE POLICY "Users can view their own referrals"
ON public.partner_referrals
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = partner_referrals.partner_id
    AND p.email = (auth.jwt()->>'email')
  )
);

CREATE POLICY "Users can update their own referrals"
ON public.partner_referrals
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM public.partners p
    WHERE p.id = partner_referrals.partner_id
    AND p.email = (auth.jwt()->>'email')
  )
);