-- Create support_tickets table
CREATE TABLE public.support_tickets (
  id SERIAL PRIMARY KEY,
  ticket_id TEXT NOT NULL UNIQUE,
  table_name TEXT NOT NULL,
  session_id TEXT NOT NULL,
  name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT,
  message TEXT NOT NULL,
  chat_history TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.support_tickets ENABLE ROW LEVEL SECURITY;

-- RLS policy: Users can view tickets for their widget
CREATE POLICY "Users can view support_tickets for their widget"
ON public.support_tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM widgets w
    WHERE w.user_id = auth.uid() AND w.table_name = support_tickets.table_name
  )
);

-- RLS policy: Users can update tickets for their widget (status changes)
CREATE POLICY "Users can update support_tickets for their widget"
ON public.support_tickets
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM widgets w
    WHERE w.user_id = auth.uid() AND w.table_name = support_tickets.table_name
  )
);

-- Create index for faster queries
CREATE INDEX idx_support_tickets_table_name ON public.support_tickets(table_name);
CREATE INDEX idx_support_tickets_status ON public.support_tickets(status);

-- Trigger for updated_at
CREATE TRIGGER update_support_tickets_updated_at
BEFORE UPDATE ON public.support_tickets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();