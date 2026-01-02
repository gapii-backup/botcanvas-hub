-- Drop the trigger first
DROP TRIGGER IF EXISTS update_message_limits_updated_at ON public.message_limits;

-- Drop the RLS policy
DROP POLICY IF EXISTS "Users can view message_limits for their widget" ON public.message_limits;

-- Drop the table
DROP TABLE IF EXISTS public.message_limits;