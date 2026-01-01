-- Add doc_id column to knowledge_documents
ALTER TABLE public.knowledge_documents
ADD COLUMN doc_id text;

-- Add documents_delete_webhook_url to widgets
ALTER TABLE public.widgets
ADD COLUMN documents_delete_webhook_url text;