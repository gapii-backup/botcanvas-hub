-- Create storage bucket for bot avatars
INSERT INTO storage.buckets (id, name, public)
VALUES ('bot-avatars', 'bot-avatars', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload their own avatars
CREATE POLICY "Users can upload their own bot avatars"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'bot-avatars' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to update their own avatars
CREATE POLICY "Users can update their own bot avatars"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'bot-avatars' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow authenticated users to delete their own avatars
CREATE POLICY "Users can delete their own bot avatars"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'bot-avatars' 
  AND auth.uid() IS NOT NULL
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- Allow public access to view bot avatars (they're public images)
CREATE POLICY "Anyone can view bot avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'bot-avatars');