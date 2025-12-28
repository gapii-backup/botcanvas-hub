import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface SupportTicket {
  id: number;
  ticket_id: string;
  table_name: string;
  session_id: string;
  name: string;
  email: string;
  phone: string | null;
  message: string;
  chat_history: string | null;
  status: 'open' | 'closed';
  created_at: string;
  updated_at: string;
}

export function useSupportTickets(tableName: string | null | undefined) {
  const [tickets, setTickets] = useState<SupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!tableName) {
      setLoading(false);
      return;
    }

    const fetchTickets = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .from('support_tickets')
          .select('*')
          .eq('table_name', tableName)
          .order('created_at', { ascending: false });
        
        if (error) throw error;
        setTickets((data as SupportTicket[]) || []);
      } catch (err) {
        console.error('Error fetching support tickets:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchTickets();
  }, [tableName]);

  const updateTicketStatus = async (ticketId: string, status: 'open' | 'closed') => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ status, updated_at: new Date().toISOString() })
      .eq('ticket_id', ticketId);
    
    if (!error) {
      setTickets(prev => prev.map(t => 
        t.ticket_id === ticketId ? { ...t, status } : t
      ));
    }
    return !error;
  };

  return { tickets, loading, updateTicketStatus };
}
