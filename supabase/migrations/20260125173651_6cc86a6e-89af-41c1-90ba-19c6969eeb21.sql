-- Add INSERT policy for admins to add partners
CREATE POLICY "Admins can insert partners"
ON public.partners
FOR INSERT
TO authenticated
WITH CHECK (
  EXISTS (
    SELECT 1
    FROM widgets w
    WHERE w.user_id = auth.uid()
      AND w.is_admin = true
  )
);