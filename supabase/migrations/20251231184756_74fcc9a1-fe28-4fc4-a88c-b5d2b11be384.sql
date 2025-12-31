-- Add new columns for support ticket system
ALTER TABLE public.support_tickets
ADD COLUMN IF NOT EXISTS subject text,
ADD COLUMN IF NOT EXISTS priority text NOT NULL DEFAULT 'normal',
ADD COLUMN IF NOT EXISTS admin_response text,
ADD COLUMN IF NOT EXISTS responded_at timestamp with time zone,
ADD COLUMN IF NOT EXISTS widget_id uuid REFERENCES public.widgets(id);

-- Add RLS policy for admins to view all tickets
CREATE POLICY "Admins can view all support_tickets"
ON public.support_tickets
FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM widgets w 
    WHERE w.user_id = auth.uid() 
    AND w.user_email IN ('info@botmotion.ai', 'admin@botmotion.ai')
  )
);

-- Add RLS policy for admins to update all tickets
CREATE POLICY "Admins can update all support_tickets"
ON public.support_tickets
FOR UPDATE
USING (
  EXISTS (
    SELECT 1 FROM widgets w 
    WHERE w.user_id = auth.uid() 
    AND w.user_email IN ('info@botmotion.ai', 'admin@botmotion.ai')
  )
);

-- Add RLS policy for users to insert their own tickets
CREATE POLICY "Users can insert support_tickets for their widget"
ON public.support_tickets
FOR INSERT
WITH CHECK (
  EXISTS (
    SELECT 1 FROM widgets w 
    WHERE w.user_id = auth.uid() 
    AND w.id = widget_id
  )
);