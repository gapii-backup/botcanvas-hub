export interface TicketMessage {
  id: string;
  sender: 'user' | 'admin';
  message: string;
  attachments: string[];
  created_at: string;
}

export interface SupportTicketItem {
  id: string;
  subject: string;
  status: 'open' | 'answered' | 'closed';
  created_at: string;
  messages: TicketMessage[];
}
