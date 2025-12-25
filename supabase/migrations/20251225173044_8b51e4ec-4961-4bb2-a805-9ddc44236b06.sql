-- Create user_bots table
CREATE TABLE IF NOT EXISTS public.user_bots (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  user_id UUID NOT NULL,
  user_email TEXT NOT NULL,
  plan TEXT,
  bot_name TEXT,
  welcome_message TEXT,
  primary_color TEXT,
  dark_mode BOOLEAN NOT NULL DEFAULT true,
  position TEXT NOT NULL DEFAULT 'right',
  quick_questions TEXT[] NOT NULL DEFAULT '{}'::text[],
  booking_url TEXT,
  status TEXT NOT NULL DEFAULT 'pending',
  api_key TEXT,
  CONSTRAINT user_bots_one_per_user UNIQUE (user_id)
);

-- Enable Row Level Security
ALTER TABLE public.user_bots ENABLE ROW LEVEL SECURITY;

-- Policies: each user can access only their row
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_bots' AND policyname = 'Users can view their own bot'
  ) THEN
    CREATE POLICY "Users can view their own bot"
    ON public.user_bots
    FOR SELECT
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_bots' AND policyname = 'Users can create their own bot'
  ) THEN
    CREATE POLICY "Users can create their own bot"
    ON public.user_bots
    FOR INSERT
    WITH CHECK (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_bots' AND policyname = 'Users can update their own bot'
  ) THEN
    CREATE POLICY "Users can update their own bot"
    ON public.user_bots
    FOR UPDATE
    USING (auth.uid() = user_id);
  END IF;

  IF NOT EXISTS (
    SELECT 1 FROM pg_policies 
    WHERE schemaname = 'public' AND tablename = 'user_bots' AND policyname = 'Users can delete their own bot'
  ) THEN
    CREATE POLICY "Users can delete their own bot"
    ON public.user_bots
    FOR DELETE
    USING (auth.uid() = user_id);
  END IF;
END $$;