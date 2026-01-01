-- Add is_admin column to widgets table
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS is_admin BOOLEAN NOT NULL DEFAULT false;

-- Create RLS policy for admins to view all widgets
CREATE POLICY "Admins can view all widgets" 
ON public.widgets 
FOR SELECT 
USING (
  EXISTS (
    SELECT 1 FROM public.widgets w 
    WHERE w.user_id = auth.uid() AND w.is_admin = true
  )
);

-- Create RLS policy for admins to update all widgets
CREATE POLICY "Admins can update all widgets" 
ON public.widgets 
FOR UPDATE 
USING (
  EXISTS (
    SELECT 1 FROM public.widgets w 
    WHERE w.user_id = auth.uid() AND w.is_admin = true
  )
);

-- Create RLS policy for admins to delete all widgets
CREATE POLICY "Admins can delete all widgets" 
ON public.widgets 
FOR DELETE 
USING (
  EXISTS (
    SELECT 1 FROM public.widgets w 
    WHERE w.user_id = auth.uid() AND w.is_admin = true
  )
);

-- Create RLS policy for admins to insert widgets for any user
CREATE POLICY "Admins can insert any widget" 
ON public.widgets 
FOR INSERT 
WITH CHECK (
  EXISTS (
    SELECT 1 FROM public.widgets w 
    WHERE w.user_id = auth.uid() AND w.is_admin = true
  )
  OR auth.uid() = user_id
);