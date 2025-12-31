import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminSupportTicket {
  id: number;
  ticket_id: string;
  subject: string | null;
  priority: string;
  message: string;
  email: string;
  name: string;
  status: string;
  admin_response: string | null;
  responded_at: string | null;
  created_at: string;
  widget_id: string | null;
  table_name: string;
}

export function useAdminSupportTickets() {
  const [tickets, setTickets] = useState<AdminSupportTicket[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchTickets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('support_tickets')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      setTickets((data as AdminSupportTicket[]) || []);
    } catch (err) {
      console.error('Error fetching admin support tickets:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTickets();
  }, []);

  const updateTicketResponse = async (ticketId: string, response: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ 
        admin_response: response, 
        status: 'answered',
        responded_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      })
      .eq('ticket_id', ticketId);
    
    if (error) {
      console.error('Update error:', error);
      return false;
    }
    
    setTickets(prev => prev.map(t => 
      t.ticket_id === ticketId 
        ? { ...t, admin_response: response, status: 'answered', responded_at: new Date().toISOString() } 
        : t
    ));
    return true;
  };

  const closeTicket = async (ticketId: string) => {
    const { error } = await supabase
      .from('support_tickets')
      .update({ 
        status: 'closed',
        updated_at: new Date().toISOString()
      })
      .eq('ticket_id', ticketId);
    
    if (error) {
      console.error('Close error:', error);
      return false;
    }
    
    setTickets(prev => prev.map(t => 
      t.ticket_id === ticketId ? { ...t, status: 'closed' } : t
    ));
    return true;
  };

  return { tickets, loading, refetch: fetchTickets, updateTicketResponse, closeTicket };
}
