export interface SupportTicketItem {
  id: string;
  subject: string;
  message: string;
  priority: 'low' | 'normal' | 'high' | 'urgent';
  status: 'open' | 'answered' | 'closed';
  admin_response: string | null;
  created_at: string;
  responded_at: string | null;
}
