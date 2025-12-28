-- Create leads table
CREATE TABLE public.leads (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  email TEXT,
  session_id TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on leads
ALTER TABLE public.leads ENABLE ROW LEVEL SECURITY;

-- Create message_limits table for tracking conversation limits
CREATE TABLE public.message_limits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL UNIQUE,
  monthly_count INTEGER NOT NULL DEFAULT 0,
  monthly_limit INTEGER NOT NULL DEFAULT 1000,
  reset_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT (date_trunc('month', now()) + interval '1 month'),
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on message_limits
ALTER TABLE public.message_limits ENABLE ROW LEVEL SECURITY;

-- Create conversation_topics table for analytics
CREATE TABLE public.conversation_topics (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  session_id TEXT NOT NULL,
  category TEXT NOT NULL,
  topic TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS on conversation_topics
ALTER TABLE public.conversation_topics ENABLE ROW LEVEL SECURITY;

-- RLS policies for leads - users can view leads for their widget's table_name
CREATE POLICY "Users can view leads for their widget"
ON public.leads
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.widgets w
    WHERE w.user_id = auth.uid()
    AND w.table_name = leads.table_name
  )
);

-- RLS policies for message_limits
CREATE POLICY "Users can view message_limits for their widget"
ON public.message_limits
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.widgets w
    WHERE w.user_id = auth.uid()
    AND w.table_name = message_limits.table_name
  )
);

-- RLS policies for conversation_topics
CREATE POLICY "Users can view conversation_topics for their widget"
ON public.conversation_topics
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.widgets w
    WHERE w.user_id = auth.uid()
    AND w.table_name = conversation_topics.table_name
  )
);

-- Create trigger for updating updated_at on message_limits
CREATE TRIGGER update_message_limits_updated_at
BEFORE UPDATE ON public.message_limits
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();