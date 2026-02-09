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
  milestone_3_claimed: boolean;
  milestone_10_claimed: boolean;
  milestone_25_claimed: boolean;
}

export interface PartnerCustomer {
  id: string;
  partner_id: string;
  promo_code: string;
  customer_email: string;
  customer_name: string | null;
  stripe_customer_id: string | null;
  plan: string;
  billing_period: string;
  status: string;
  first_paid_at: string | null;
  months_covered: number;
  commissions_total: number;
  created_at: string;
  updated_at: string;
  original_billing_period: string | null;
  max_months: number;
  commission_locked: boolean;
}

export interface PartnerCommission {
  id: string;
  partner_id: string;
  partner_customer_id: string | null;
  type: 'recurring' | 'milestone';
  amount: number;
  commission_number: number | null;
  milestone_type: string | null;
  stripe_invoice_id: string | null;
  invoice_requested: boolean;
  invoice_requested_at: string | null;
  invoice_paid: boolean;
  invoice_paid_at: string | null;
  created_at: string;
}

export interface MilestoneInfo {
  key: string;
  count: number;
  bonus: number;
  label: string;
  emoji: string;
}

export const MILESTONES: MilestoneInfo[] = [
  { key: 'milestone_3_claimed', count: 3, bonus: 75, label: '3 stranke', emoji: '🎯' },
  { key: 'milestone_10_claimed', count: 10, bonus: 250, label: '10 strank', emoji: '🚀' },
  { key: 'milestone_25_claimed', count: 25, bonus: 750, label: '25 strank', emoji: '💎' },
];

export function usePartner() {
  const { user } = useAuth();
  const { toast } = useToast();
  const [partner, setPartner] = useState<Partner | null>(null);
  const [customers, setCustomers] = useState<PartnerCustomer[]>([]);
  const [commissions, setCommissions] = useState<PartnerCommission[]>([]);
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

      const { data: partnerData, error: partnerError } = await supabase
        .from('partners')
        .select('*')
        .eq('email', user.email)
        .eq('is_active', true)
        .maybeSingle();

      if (partnerError) throw partnerError;

      if (!partnerData) {
        setPartner(null);
        setCustomers([]);
        setCommissions([]);
        setLoading(false);
        return;
      }

      setPartner(partnerData as Partner);

      // Fetch customers
      const { data: customersData, error: customersError } = await supabase
        .from('partner_customers')
        .select('*')
        .eq('partner_id', partnerData.id)
        .order('created_at', { ascending: false });

      if (customersError) throw customersError;
      setCustomers((customersData || []) as PartnerCustomer[]);

      // Fetch commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('partner_commissions')
        .select('*')
        .eq('partner_id', partnerData.id)
        .order('created_at', { ascending: false });

      if (commissionsError) throw commissionsError;
      setCommissions((commissionsData || []) as PartnerCommission[]);
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

  const requestPayout = async (commissionId: string) => {
    try {
      const { error: updateError } = await supabase
        .from('partner_commissions')
        .update({
          invoice_requested: true,
          invoice_requested_at: new Date().toISOString(),
        })
        .eq('id', commissionId);

      if (updateError) throw updateError;

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

  // Stats
  const activeCustomersCount = customers.filter(c => c.status === 'active').length;
  const totalCommission = commissions.reduce((sum, c) => sum + Number(c.amount), 0);
  const pendingPayoutAmount = commissions
    .filter(c => !c.invoice_requested)
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const requestedPayoutAmount = commissions
    .filter(c => c.invoice_requested && !c.invoice_paid)
    .reduce((sum, c) => sum + Number(c.amount), 0);
  const paidPayoutAmount = commissions
    .filter(c => c.invoice_paid)
    .reduce((sum, c) => sum + Number(c.amount), 0);

  return {
    partner,
    customers,
    commissions,
    loading,
    error,
    refetch: fetchPartner,
    requestPayout,
    activeCustomersCount,
    totalCommission,
    pendingPayoutAmount,
    requestedPayoutAmount,
    paidPayoutAmount,
    MILESTONES,
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
