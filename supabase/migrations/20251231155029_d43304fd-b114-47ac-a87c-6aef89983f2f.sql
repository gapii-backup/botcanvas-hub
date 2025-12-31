-- Add setup fee tracking fields to widgets table
ALTER TABLE public.widgets 
ADD COLUMN IF NOT EXISTS setup_fee_basic_paid boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS setup_fee_pro_paid boolean NOT NULL DEFAULT false,
ADD COLUMN IF NOT EXISTS setup_fee_enterprise_paid boolean NOT NULL DEFAULT false;