import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  messagesToday: number;
  conversationsThisMonth: number;
  leadsCount: number;
  conversionRate: number;
  monthlyCount: number;
  monthlyLimit: number;
}

export function useDashboardStats(tableName: string | null | undefined) {
  const [stats, setStats] = useState<DashboardStats>({
    messagesToday: 0,
    conversationsThisMonth: 0,
    leadsCount: 0,
    conversionRate: 0,
    monthlyCount: 0,
    monthlyLimit: 1000,
  });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tableName) {
      setLoading(false);
      return;
    }

    const fetchStats = async () => {
      try {
        setLoading(true);

        // Get message limits for this table
        const { data: limitsData } = await supabase
          .from('message_limits')
          .select('monthly_count, monthly_limit')
          .eq('table_name', tableName)
          .maybeSingle();

        // Get leads count for this table
        const { count: leadsCount } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('table_name', tableName);

        // Get unique sessions from conversation_topics (for conversion rate)
        const { data: sessionsData } = await supabase
          .from('conversation_topics')
          .select('session_id')
          .eq('table_name', tableName);

        const uniqueSessions = new Set(sessionsData?.map(s => s.session_id) || []).size;
        const totalLeads = leadsCount || 0;
        const conversionRate = uniqueSessions > 0 
          ? Math.round((totalLeads / uniqueSessions) * 100) 
          : 0;

        setStats({
          messagesToday: 0, // Would need access to the dynamic message table
          conversationsThisMonth: limitsData?.monthly_count || 0,
          leadsCount: totalLeads,
          conversionRate,
          monthlyCount: limitsData?.monthly_count || 0,
          monthlyLimit: limitsData?.monthly_limit || 1000,
        });
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [tableName]);

  return { stats, loading, error };
}
