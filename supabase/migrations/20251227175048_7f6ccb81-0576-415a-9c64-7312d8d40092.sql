-- Create function to update timestamps
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SET search_path = public;

-- Create widgets table with all BotConfig fields
CREATE TABLE public.widgets (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  api_key TEXT,
  
  -- Plan & billing
  plan TEXT,
  billing_period TEXT NOT NULL DEFAULT 'monthly',
  status TEXT NOT NULL DEFAULT 'pending',
  is_active BOOLEAN NOT NULL DEFAULT false,
  
  -- Basic info
  bot_name TEXT,
  welcome_message TEXT,
  home_title TEXT,
  home_subtitle_line2 TEXT,
  
  -- Colors & style
  primary_color TEXT,
  mode TEXT NOT NULL DEFAULT 'dark',
  header_style TEXT NOT NULL DEFAULT 'solid',
  bot_icon_background TEXT,
  bot_icon_color TEXT,
  
  -- Icons
  bot_avatar TEXT,
  bot_icon JSONB DEFAULT '[]'::jsonb,
  trigger_icon TEXT,
  
  -- Position
  position TEXT NOT NULL DEFAULT 'right',
  vertical_offset INTEGER NOT NULL DEFAULT 20,
  trigger_style TEXT NOT NULL DEFAULT 'floating',
  edge_trigger_text TEXT,
  
  -- Features
  quick_questions JSONB DEFAULT '[]'::jsonb,
  show_email_field BOOLEAN NOT NULL DEFAULT true,
  show_bubble BOOLEAN NOT NULL DEFAULT true,
  bubble_text TEXT,
  booking_enabled BOOLEAN NOT NULL DEFAULT false,
  booking_url TEXT,
  support_enabled BOOLEAN NOT NULL DEFAULT false,
  
  -- Unique constraint on user_id for upsert
  CONSTRAINT widgets_user_id_key UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.widgets ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own widget" 
ON public.widgets 
FOR SELECT 
USING (auth.uid() = user_id);

CREATE POLICY "Users can create their own widget" 
ON public.widgets 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own widget" 
ON public.widgets 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own widget" 
ON public.widgets 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create updated_at trigger
CREATE TRIGGER update_widgets_updated_at
BEFORE UPDATE ON public.widgets
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();