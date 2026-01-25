import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export interface AdminPartner {
  id: string;
  name: string;
  email: string;
  company: string | null;
  promo_code: string | null;
  is_active: boolean | null;
  created_at: string | null;
  activeReferrals: number;
  totalEarnings: number;
}

export interface NewPartnerData {
  name: string;
  email: string;
  company: string | null;
  phone: string | null;
  website: string | null;
  promo_code: string | null;
}

export function useAdminPartners() {
  const [partners, setPartners] = useState<AdminPartner[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchPartners = async () => {
    setIsLoading(true);
    try {
      // Fetch all partners
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('*')
        .order('created_at', { ascending: false });

      if (partnersError) throw partnersError;

      // Fetch referral stats for each partner
      const partnersWithStats = await Promise.all(
        (partnersData || []).map(async (partner) => {
          // Get active referrals count (excluding bonus)
          const { count: activeReferrals } = await supabase
            .from('partner_referrals')
            .select('*', { count: 'exact', head: true })
            .eq('partner_id', partner.id)
            .eq('status', 'active')
            .neq('plan', 'bonus');

          // Get total earnings
          const { data: earningsData } = await supabase
            .from('partner_referrals')
            .select('commission_amount')
            .eq('partner_id', partner.id);

          const totalEarnings = (earningsData || []).reduce(
            (sum, ref) => sum + Number(ref.commission_amount || 0),
            0
          );

          return {
            id: partner.id,
            name: partner.name,
            email: partner.email,
            company: partner.company,
            promo_code: partner.promo_code,
            is_active: partner.is_active,
            created_at: partner.created_at,
            activeReferrals: activeReferrals || 0,
            totalEarnings,
          };
        })
      );

      setPartners(partnersWithStats);
    } catch (error) {
      console.error('Error fetching partners:', error);
      toast({
        title: 'Napaka',
        description: 'Napaka pri nalaganju partnerjev',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const updatePartnerStatus = async (id: string, is_active: boolean) => {
    try {
      const { error } = await supabase
        .from('partners')
        .update({ is_active })
        .eq('id', id);

      if (error) throw error;

      setPartners((prev) =>
        prev.map((p) => (p.id === id ? { ...p, is_active } : p))
      );

      toast({
        title: 'Uspeh',
        description: `Partner ${is_active ? 'aktiviran' : 'deaktiviran'}`,
      });
    } catch (error) {
      console.error('Error updating partner status:', error);
      toast({
        title: 'Napaka',
        description: 'Napaka pri posodabljanju statusa',
        variant: 'destructive',
      });
    }
  };

  const addPartner = async (data: NewPartnerData): Promise<boolean> => {
    try {
      const { error } = await supabase
        .from('partners')
        .insert({
          name: data.name,
          email: data.email,
          company: data.company,
          phone: data.phone,
          website: data.website,
          promo_code: data.promo_code,
          is_active: false,
          terms_accepted: false,
        });

      if (error) throw error;

      toast({
        title: 'Uspeh',
        description: 'Partner uspešno dodan',
      });

      await fetchPartners();
      return true;
    } catch (error) {
      console.error('Error adding partner:', error);
      toast({
        title: 'Napaka',
        description: 'Napaka pri dodajanju partnerja',
        variant: 'destructive',
      });
      return false;
    }
  };

  const getPartnerStats = async (id: string) => {
    try {
      const { data: referrals, error } = await supabase
        .from('partner_referrals')
        .select('*')
        .eq('partner_id', id)
        .order('created_at', { ascending: false });

      if (error) throw error;

      return referrals || [];
    } catch (error) {
      console.error('Error fetching partner stats:', error);
      return [];
    }
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  return {
    partners,
    isLoading,
    refetch: fetchPartners,
    updatePartnerStatus,
    addPartner,
    getPartnerStats,
  };
}
