import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface DashboardStats {
  messagesToday: number;
  conversationsThisMonth: number;
  leadsCount: number;
  conversionRate: number;
  monthlyCount: number;
  monthlyLimit: number;
  humanMessagesCount: number;
  sessionsToday: number;
}

export interface MessagesByDay {
  day: string;
  count: number;
}

export function useDashboardStats(tableName: string | null | undefined) {
  const [stats, setStats] = useState<DashboardStats>({
    messagesToday: 0,
    conversationsThisMonth: 0,
    leadsCount: 0,
    conversionRate: 0,
    monthlyCount: 0,
    monthlyLimit: 1000,
    humanMessagesCount: 0,
    sessionsToday: 0,
  });
  const [messagesByDay, setMessagesByDay] = useState<MessagesByDay[]>([]);
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
        console.log('Fetching stats for table:', tableName);

        // Get human messages today (count only messages where message.type = 'human')
        const todayStart = new Date();
        todayStart.setHours(0, 0, 0, 0);

        const { data: messagesTodayData, error: msgError } = await supabase
          .rpc('get_human_messages_count_range', {
            p_table_name: tableName,
            p_start_date: todayStart.toISOString(),
          });

        if (msgError) console.error('Messages today (human) error:', msgError);
        console.log('Messages today (human):', messagesTodayData);

        // Get sessions this month using RPC
        const { data: sessionsData, error: sessError } = await supabase
          .rpc('get_sessions_this_month', { p_table_name: tableName });
        
        if (sessError) console.error('Sessions error:', sessError);
        console.log('Sessions this month:', sessionsData);

        // Get sessions today (unique users today)
        const { data: sessionsTodayData, error: sessionsTodayError } = await supabase
          .rpc('get_sessions_count', { 
            p_table_name: tableName,
            p_start_date: todayStart.toISOString(),
          });
        
        if (sessionsTodayError) console.error('Sessions today error:', sessionsTodayError);
        console.log('Sessions today:', sessionsTodayData);

        // Get messages by day using RPC
        const { data: msgByDayData, error: dayError } = await supabase
          .rpc('get_messages_by_day', { p_table_name: tableName });
        
        if (dayError) console.error('Messages by day error:', dayError);
        console.log('Messages by day:', msgByDayData);


        // Get leads count for this table
        const { count: leadsCount, error: leadsError } = await supabase
          .from('leads')
          .select('*', { count: 'exact', head: true })
          .eq('table_name', tableName);

        if (leadsError) console.error('Leads error:', leadsError);
        console.log('Leads count:', leadsCount);

        // Get human messages count for this table
        const { data: humanMessagesData, error: humanError } = await supabase
          .rpc('get_human_messages_count', { p_table_name: tableName });
        
        if (humanError) console.error('Human messages error:', humanError);
        console.log('Human messages count:', humanMessagesData);

        const totalLeads = leadsCount || 0;
        const totalSessions = sessionsData || 0;
        const conversionRate = totalSessions > 0 
          ? Math.round((totalLeads / totalSessions) * 100) 
          : 0;

        setStats({
          messagesToday: messagesTodayData || 0,
          conversationsThisMonth: totalSessions,
          leadsCount: totalLeads,
          conversionRate,
          monthlyCount: humanMessagesData || 0,
          monthlyLimit: 1000,
          humanMessagesCount: humanMessagesData || 0,
          sessionsToday: sessionsTodayData || 0,
        });

        // Format messages by day for chart
        if (msgByDayData && msgByDayData.length > 0) {
          const formattedData = msgByDayData.map((item: { day: string; count: number }) => ({
            day: new Date(item.day).toLocaleDateString('sl-SI', { weekday: 'short' }),
            count: Number(item.count)
          }));
          setMessagesByDay(formattedData);
        }

      } catch (err) {
        console.error('Dashboard stats error:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchStats();
  }, [tableName]);

  return { stats, messagesByDay, loading, error };
}
