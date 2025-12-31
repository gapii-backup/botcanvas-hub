import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface UserSupportTicket {
  id: number;
  ticket_id: string;
  subject: string | null;
  priority: string;
  message: string;
  status: string;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
  widget_id: string | null;
}

export function useUserSupportTickets(widgetId: string | null | undefined) {
  const [tickets, setTickets] = useState<UserSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    if (!widgetId) {
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .eq('widget_id', widgetId)
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTickets((data as UserSupportTicket[]) || []);
    } catch (err) {
      console.error('Error fetching user support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, [widgetId]);

  return { tickets, loading, refetch: fetchTickets };
}
