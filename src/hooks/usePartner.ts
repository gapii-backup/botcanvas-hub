import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';

export interface Partner {
  id: string;
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  website: string | null;
  terms_accepted: boolean;
  terms_version: string | null;
  ip_address: string | null;
  submitted_at: string | null;
  created_at: string;
  promo_code: string | null;
  is_active: boolean;
  user_id: string | null;
  bonus_bronze_claimed: boolean;
  bonus_silver_claimed: boolean;
  bonus_gold_claimed: boolean;
  bonus_platinum_claimed: boolean;
  bonus_diamond_claimed: boolean;
}

export interface PartnerReferral {
  id: string;
  partner_id: string;
  promo_code: string;
  customer_email: string;
  customer_name: string | null;
  plan: string;
  commission_amount: number;
  tier_at_purchase: string | null;
  invoice_requested: boolean;
  invoice_requested_at: string | null;
  invoice_paid: boolean;
  invoice_paid_at: string | null;
  status: string;
  created_at: string;
}

export interface TierInfo {
  name: string;
  emoji: string;
  min: number;
  max: number;
  bonus: number;
  bonusField: keyof Partner;
}

export const TIERS: TierInfo[] = [
  { name: 'Bronze', emoji: '🟤', min: 1, max: 10, bonus: 0, bonusField: 'bonus_bronze_claimed' },
  { name: 'Silver', emoji: '⚪', min: 11, max: 25, bonus: 200, bonusField: 'bonus_silver_claimed' },
  { name: 'Gold', emoji: '🟡', min: 26, max: 50, bonus: 500, bonusField: 'bonus_gold_claimed' },
  { name: 'Platinum', emoji: '💠', min: 51, max: 100, bonus: 1000, bonusField: 'bonus_platinum_claimed' },
  { name: 'Diamond', emoji: '💎', min: 101, max: Infinity, bonus: 2000, bonusField: 'bonus_diamond_claimed' },
];

export function calculateTier(activeCount: number): TierInfo {
  for (const tier of TIERS) {
    if (activeCount >= tier.min && activeCount <= tier.max) {
      return tier;
    }
  }
  return TIERS[0]; // Default to Bronze
}

export function getNextTierInfo(activeCount: number): { tier: TierInfo; remaining: number } | null {
  const currentTier = calculateTier(activeCount);
  const currentIndex = TIERS.findIndex(t => t.name === currentTier.name);
  
  if (currentIndex >= TIERS.length - 1) {
    return null; // Already at highest tier
  }
  
  const nextTier = TIERS[currentIndex + 1];
  const remaining = nextTier.min - activeCount;
  
  return { tier: nextTier, remaining };
}

export function usePartner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [referrals, setReferrals] = useState<PartnerReferral[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchPartner = useCallback(async () => {
    if (!user?.email) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      setError(null);

      // Fetch partner by email
      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('email', user.email)
        .eq('is_active', true)
        .maybeSingle();

      if (partnerError) {
        throw partnerError;
      }

      if (!partnerData) {
        setPartner(null);
        setReferrals([]);
        setLoading(false);
        return;
      }

      setPartner(partnerData as Partner);

      // Fetch referrals for this partner
      const { data: referralsData, error: referralsError } = await supabase
        .from('partner_referrals')
        .select('*')
        .eq('partner_id', partnerData.id)
        .order('created_at', { ascending: false });

      if (referralsError) {
        throw referralsError;
      }

      setReferrals((referralsData || []) as PartnerReferral[]);
    } catch (err: any) {
      console.error('Error fetching partner data:', err);
      setError(err.message || 'Napaka pri nalaganju podatkov');
      toast({
        title: 'Napaka',
        description: 'Ni bilo mogoče naložiti podatkov partnerja.',
        variant: 'destructive',
      });
    } finally {
      setLoading(false);
    }
  }, [user?.email, toast]);

  useEffect(() => {
    fetchPartner();
  }, [fetchPartner]);

  const requestPayout = async (referralId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('partner_referrals')
        .update({
          invoice_requested: true,
          invoice_requested_at: new Date().toISOString(),
        })
        .eq('id', referralId);

      if (updateError) {
        throw updateError;
      }

      // Refresh referrals
      await fetchPartner();

      toast({
        title: 'Zahtevek poslan',
        description: 'Zahtevek za izplačilo je bil uspešno poslan.',
      });

      return { error: null };
    } catch (err: any) {
      console.error('Error requesting payout:', err);
      toast({
        title: 'Napaka',
        description: 'Ni bilo mogoče poslati zahtevka za izplačilo.',
        variant: 'destructive',
      });
      return { error: err };
    }
  };

  // Calculate stats
  const activeReferralsCount = referrals.filter(r => r.status === 'active').length;
  const totalCommission = referrals.reduce((sum, r) => sum + Number(r.commission_amount), 0);
  const currentTier = calculateTier(activeReferralsCount);
  const nextTierInfo = getNextTierInfo(activeReferralsCount);

  // Pending payouts (not requested, active)
  const pendingPayouts = referrals.filter(r => !r.invoice_requested && r.status === 'active');
  
  // Requested payouts (requested but not paid)
  const requestedPayouts = referrals.filter(r => r.invoice_requested && !r.invoice_paid);
  
  // Paid payouts
  const paidPayouts = referrals.filter(r => r.invoice_paid);

  return {
    partner,
    referrals,
    loading,
    error,
    refetch: fetchPartner,
    requestPayout,
    // Stats
    activeReferralsCount,
    totalCommission,
    currentTier,
    nextTierInfo,
    pendingPayouts,
    requestedPayouts,
    paidPayouts,
  };
}

// Check if user is an active partner (for sidebar visibility)
export function useIsActivePartner() {
  const { user } = useAuth();
  const [isActivePartner, setIsActivePartner] = useState<boolean | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkPartner = async () => {
      if (!user?.email) {
        setIsActivePartner(false);
        setLoading(false);
        return;
      }

      try {
        const { data, error } = await supabase
          .from('partners')
          .select('id')
          .eq('email', user.email)
          .eq('is_active', true)
          .maybeSingle();

        if (error) {
          console.error('Error checking partner status:', error);
          setIsActivePartner(false);
        } else {
          setIsActivePartner(!!data);
        }
      } catch (err) {
        console.error('Error checking partner status:', err);
        setIsActivePartner(false);
      } finally {
        setLoading(false);
      }
    };

    checkPartner();
  }, [user?.email]);

  return { isActivePartner, loading };
}
