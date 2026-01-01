-- Drop the problematic RLS policies that may cause infinite recursion
DROP POLICY IF EXISTS "Admins can view all widgets" ON public.widgets;
DROP POLICY IF EXISTS "Admins can update all widgets" ON public.widgets;
DROP POLICY IF EXISTS "Admins can delete all widgets" ON public.widgets;
DROP POLICY IF EXISTS "Admins can insert any widget" ON public.widgets;

-- Create a security definer function to check if user is admin
CREATE OR REPLACE FUNCTION public.is_admin(_user_id uuid)
RETURNS boolean
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.widgets
    WHERE user_id = _user_id
      AND is_admin = true
  )
$$;

-- Recreate RLS policies using the security definer function
CREATE POLICY "Admins can view all widgets" 
ON public.widgets 
FOR SELECT 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can update all widgets" 
ON public.widgets 
FOR UPDATE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can delete all widgets" 
ON public.widgets 
FOR DELETE 
USING (public.is_admin(auth.uid()));

CREATE POLICY "Admins can insert any widget" 
ON public.widgets 
FOR INSERT 
WITH CHECK (public.is_admin(auth.uid()) OR auth.uid() = user_id);