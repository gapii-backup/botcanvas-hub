import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

interface PartnerCommission {
  id: string;
  partner_id: string;
  partner_customer_id: string | null;
  type: string;
  amount: number;
  commission_number: number | null;
  milestone_type: string | null;
  invoice_requested_at: string | null;
  customer_name?: string | null;
  customer_email?: string;
}

export interface PartnerWithUnpaidCommissions {
  id: string;
  name: string;
  email: string;
  company: string | null;
  totalUnpaid: number;
  commissions: PartnerCommission[];
}

interface PaymentStats {
  forPayment: number;
  totalPaid: number;
  waitingForRequest: number;
}

export function useAdminPayments() {
  const [partnersWithUnpaid, setPartnersWithUnpaid] = useState<PartnerWithUnpaidCommissions[]>([]);
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
      // Fetch all commissions
      const { data: commissionsData, error: commissionsError } = await supabase
        .from('partner_commissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (commissionsError) throw commissionsError;

      const allCommissions = commissionsData || [];

      // Fetch all partner_customers for name lookup
      const customerIds = [...new Set(allCommissions.filter(c => c.partner_customer_id).map(c => c.partner_customer_id!))];
      let customersMap: Record<string, { customer_name: string | null; customer_email: string }> = {};
      
      if (customerIds.length > 0) {
        const { data: customersData } = await supabase
          .from('partner_customers')
          .select('id, customer_name, customer_email')
          .in('id', customerIds);

        (customersData || []).forEach(c => {
          customersMap[c.id] = { customer_name: c.customer_name, customer_email: c.customer_email };
        });
      }

      // Calculate stats
      const forPayment = allCommissions
        .filter((c) => c.invoice_requested === true && c.invoice_paid === false)
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);

      const totalPaid = allCommissions
        .filter((c) => c.invoice_paid === true)
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);

      const waitingForRequest = allCommissions
        .filter((c) => c.invoice_requested === false || c.invoice_requested === null)
        .reduce((sum, c) => sum + Number(c.amount || 0), 0);

      setStats({ forPayment, totalPaid, waitingForRequest });

      // Get unpaid commissions (requested but not paid)
      const unpaidCommissions = allCommissions.filter(
        (c) => c.invoice_requested === true && c.invoice_paid === false
      );

      const partnerIds = [...new Set(unpaidCommissions.map((c) => c.partner_id))];

      const { data: partnersData, error: partnersError } = await supabase
        .from('partners')
        .select('*')
        .in('id', partnerIds);

      if (partnersError) throw partnersError;

      const grouped: PartnerWithUnpaidCommissions[] = (partnersData || []).map((partner) => {
        const partnerCommissions = unpaidCommissions.filter(
          (c) => c.partner_id === partner.id
        );
        const totalUnpaid = partnerCommissions.reduce(
          (sum, c) => sum + Number(c.amount || 0),
          0
        );

        return {
          id: partner.id,
          name: partner.name,
          email: partner.email,
          company: partner.company,
          totalUnpaid,
          commissions: partnerCommissions.map((c) => {
            const customer = c.partner_customer_id ? customersMap[c.partner_customer_id] : null;
            return {
              id: c.id,
              partner_id: c.partner_id,
              partner_customer_id: c.partner_customer_id,
              type: c.type,
              amount: Number(c.amount),
              commission_number: c.commission_number,
              milestone_type: c.milestone_type,
              invoice_requested_at: c.invoice_requested_at,
              customer_name: customer?.customer_name || null,
              customer_email: customer?.customer_email || '',
            };
          }),
        };
      });

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

  const markAsPaid = async (commissionId: string) => {
    try {
      const { error } = await supabase
        .from('partner_commissions')
        .update({
          invoice_paid: true,
          invoice_paid_at: new Date().toISOString(),
        })
        .eq('id', commissionId);

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
        .from('partner_commissions')
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
        .from('partner_commissions')
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
