-- Add knowledge_webhook_url column to widgets table
ALTER TABLE public.widgets 
ADD COLUMN IF NOT EXISTS knowledge_webhook_url TEXT NULL;

-- Optional: migrate existing data from old webhook URLs to the new one
-- If qa_webhook_url exists and knowledge_webhook_url is null, copy it over
UPDATE public.widgets 
SET knowledge_webhook_url = qa_webhook_url 
WHERE knowledge_webhook_url IS NULL 
AND qa_webhook_url IS NOT NULL;