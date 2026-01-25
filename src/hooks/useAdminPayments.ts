import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PartnerReferral {
  id: string;
  customer_name: string | null;
  customer_email: string;
  plan: string;
  commission_amount: number;
  invoice_requested_at: string | null;
  partner_id: string;
}

export interface PartnerWithUnpaidReferrals {
  id: string;
  name: string;
  email: string;
  company: string | null;
  totalUnpaid: number;
  referrals: PartnerReferral[];
}

interface PaymentStats {
  forPayment: number;
  totalPaid: number;
  waitingForRequest: number;
}

export function useAdminPayments() {
  const [partnersWithUnpaid, setPartnersWithUnpaid] = useState<PartnerWithUnpaidReferrals[]>([]);
  const [stats, setStats] = useState<PaymentStats>({
    forPayment: 0,
    totalPaid: 0,
    waitingForRequest: 0,
  });
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch all referrals with partner info
      const { data: referralsData, error: referralsError } = await supabase
        .from('partner_referrals')
        .select('*')
        .order('invoice_requested_at', { ascending: false });

      if (referralsError) throw referralsError;

      // Calculate stats
      const allReferrals = referralsData || [];
      const forPayment = allReferrals
        .filter((r) => r.invoice_requested === true && r.invoice_paid === false)
        .reduce((sum, r) => sum + Number(r.commission_amount || 0), 0);

      const totalPaid = allReferrals
        .filter((r) => r.invoice_paid === true)
        .reduce((sum, r) => sum + Number(r.commission_amount || 0), 0);

      const waitingForRequest = allReferrals
        .filter((r) => r.invoice_requested === false || r.invoice_requested === null)
        .reduce((sum, r) => sum + Number(r.commission_amount || 0), 0);

      setStats({ forPayment, totalPaid, waitingForRequest });

      // Get unpaid referrals
      const unpaidReferrals = allReferrals.filter(
        (r) => r.invoice_requested === true && r.invoice_paid === false
      );

      // Get unique partner IDs
      const partnerIds = [...new Set(unpaidReferrals.map((r) => r.partner_id))];

      // Fetch partner details
      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('*')
        .in('id', partnerIds);

      if (partnersError) throw partnersError;

      // Group referrals by partner
      const grouped: PartnerWithUnpaidReferrals[] = (partnersData || []).map((partner) => {
        const partnerReferrals = unpaidReferrals.filter(
          (r) => r.partner_id === partner.id
        );
        const totalUnpaid = partnerReferrals.reduce(
          (sum, r) => sum + Number(r.commission_amount || 0),
          0
        );

        return {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          company: partner.company,
          totalUnpaid,
          referrals: partnerReferrals.map((r) => ({
            id: r.id,
            customer_name: r.customer_name,
            customer_email: r.customer_email,
            plan: r.plan,
            commission_amount: Number(r.commission_amount),
            invoice_requested_at: r.invoice_requested_at,
            partner_id: r.partner_id,
          })),
        };
      });

      // Sort by total unpaid descending
      grouped.sort((a, b) => b.totalUnpaid - a.totalUnpaid);

      setPartnersWithUnpaid(grouped);
    } catch (error) {
      console.error('Error fetching payment data:', error);
      toast({
        title: 'Napaka',
        description: 'Napaka pri nalaganju podatkov o plačilih',
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const markAsPaid = async (referralId: string) => {
    try {
      const { error } = await supabase
        .from('partner_referrals')
        .update({
          invoice_paid: true,
          invoice_paid_at: new Date().toISOString(),
        })
        .eq('id', referralId);

      if (error) throw error;

      toast({
        title: 'Uspeh',
        description: 'Plačilo označeno kot plačano',
      });

      fetchData();
    } catch (error) {
      console.error('Error marking as paid:', error);
      toast({
        title: 'Napaka',
        description: 'Napaka pri označevanju plačila',
        variant: 'destructive',
      });
    }
  };

  const markAllAsPaid = async (partnerId: string) => {
    try {
      const { error } = await supabase
        .from('partner_referrals')
        .update({
          invoice_paid: true,
          invoice_paid_at: new Date().toISOString(),
        })
        .eq('partner_id', partnerId)
        .eq('invoice_requested', true)
        .eq('invoice_paid', false);

      if (error) throw error;

      toast({
        title: 'Uspeh',
        description: 'Vsa plačila označena kot plačana',
      });

      fetchData();
    } catch (error) {
      console.error('Error marking all as paid:', error);
      toast({
        title: 'Napaka',
        description: 'Napaka pri označevanju plačil',
        variant: 'destructive',
      });
    }
  };

  const getUnpaidInvoiceCount = async (): Promise<number> => {
    try {
      const { count, error } = await supabase
        .from('partner_referrals')
        .select('*', { count: 'exact', head: true })
        .eq('invoice_requested', true)
        .eq('invoice_paid', false);

      if (error) throw error;
      return count || 0;
    } catch (error) {
      console.error('Error getting unpaid count:', error);
      return 0;
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  return {
    partnersWithUnpaid,
    stats,
    isLoading,
    refetch: fetchData,
    markAsPaid,
    markAllAsPaid,
    getUnpaidInvoiceCount,
  };
}
