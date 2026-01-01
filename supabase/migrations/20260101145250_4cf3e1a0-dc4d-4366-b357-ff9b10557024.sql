-- Create knowledge_qa table for Q&A pairs
CREATE TABLE public.knowledge_qa (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  question TEXT NOT NULL,
  answer TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_qa ENABLE ROW LEVEL SECURITY;

-- RLS policies for knowledge_qa
CREATE POLICY "Users can view knowledge_qa for their widget"
ON public.knowledge_qa
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM widgets w
  WHERE w.user_id = auth.uid() AND w.table_name = knowledge_qa.table_name
));

CREATE POLICY "Users can insert knowledge_qa for their widget"
ON public.knowledge_qa
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM widgets w
  WHERE w.user_id = auth.uid() AND w.table_name = knowledge_qa.table_name
));

CREATE POLICY "Users can update knowledge_qa for their widget"
ON public.knowledge_qa
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM widgets w
  WHERE w.user_id = auth.uid() AND w.table_name = knowledge_qa.table_name
));

CREATE POLICY "Users can delete knowledge_qa for their widget"
ON public.knowledge_qa
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM widgets w
  WHERE w.user_id = auth.uid() AND w.table_name = knowledge_qa.table_name
));

-- Create knowledge_documents table
CREATE TABLE public.knowledge_documents (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  table_name TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'pending',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.knowledge_documents ENABLE ROW LEVEL SECURITY;

-- RLS policies for knowledge_documents
CREATE POLICY "Users can view knowledge_documents for their widget"
ON public.knowledge_documents
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM widgets w
  WHERE w.user_id = auth.uid() AND w.table_name = knowledge_documents.table_name
));

CREATE POLICY "Users can insert knowledge_documents for their widget"
ON public.knowledge_documents
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM widgets w
  WHERE w.user_id = auth.uid() AND w.table_name = knowledge_documents.table_name
));

CREATE POLICY "Users can update knowledge_documents for their widget"
ON public.knowledge_documents
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM widgets w
  WHERE w.user_id = auth.uid() AND w.table_name = knowledge_documents.table_name
));

CREATE POLICY "Users can delete knowledge_documents for their widget"
ON public.knowledge_documents
FOR DELETE
USING (EXISTS (
  SELECT 1 FROM widgets w
  WHERE w.user_id = auth.uid() AND w.table_name = knowledge_documents.table_name
));

-- Add webhook columns to widgets table
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS qa_webhook_url TEXT;
ALTER TABLE public.widgets ADD COLUMN IF NOT EXISTS documents_webhook_url TEXT;

-- Create storage bucket for knowledge documents
INSERT INTO storage.buckets (id, name, public) VALUES ('knowledge-documents', 'knowledge-documents', false)
ON CONFLICT (id) DO NOTHING;

-- Storage policies for knowledge-documents bucket
CREATE POLICY "Users can upload their own knowledge documents"
ON storage.objects
FOR INSERT
WITH CHECK (
  bucket_id = 'knowledge-documents' 
  AND EXISTS (
    SELECT 1 FROM widgets w 
    WHERE w.user_id = auth.uid() 
    AND w.table_name = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can view their own knowledge documents"
ON storage.objects
FOR SELECT
USING (
  bucket_id = 'knowledge-documents' 
  AND EXISTS (
    SELECT 1 FROM widgets w 
    WHERE w.user_id = auth.uid() 
    AND w.table_name = (storage.foldername(name))[1]
  )
);

CREATE POLICY "Users can delete their own knowledge documents"
ON storage.objects
FOR DELETE
USING (
  bucket_id = 'knowledge-documents' 
  AND EXISTS (
    SELECT 1 FROM widgets w 
    WHERE w.user_id = auth.uid() 
    AND w.table_name = (storage.foldername(name))[1]
  )
);