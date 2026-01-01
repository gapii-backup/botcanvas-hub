-- Create knowledge_qa_lastmod table for tracking training status
CREATE TABLE public.knowledge_qa_lastmod (
  table_name TEXT PRIMARY KEY,
  lastmod TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  last_trained TIMESTAMP WITH TIME ZONE DEFAULT NULL
);

-- Enable RLS
ALTER TABLE public.knowledge_qa_lastmod ENABLE ROW LEVEL SECURITY;

-- RLS policies
CREATE POLICY "Users can view lastmod for their widget"
ON public.knowledge_qa_lastmod
FOR SELECT
USING (EXISTS (
  SELECT 1 FROM widgets w
  WHERE w.user_id = auth.uid() AND w.table_name = knowledge_qa_lastmod.table_name
));

CREATE POLICY "Users can insert lastmod for their widget"
ON public.knowledge_qa_lastmod
FOR INSERT
WITH CHECK (EXISTS (
  SELECT 1 FROM widgets w
  WHERE w.user_id = auth.uid() AND w.table_name = knowledge_qa_lastmod.table_name
));

CREATE POLICY "Users can update lastmod for their widget"
ON public.knowledge_qa_lastmod
FOR UPDATE
USING (EXISTS (
  SELECT 1 FROM widgets w
  WHERE w.user_id = auth.uid() AND w.table_name = knowledge_qa_lastmod.table_name
));

-- Function to auto-update lastmod when knowledge_qa changes
CREATE OR REPLACE FUNCTION public.update_knowledge_qa_lastmod()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.knowledge_qa_lastmod (table_name, lastmod)
  VALUES (COALESCE(NEW.table_name, OLD.table_name), now())
  ON CONFLICT (table_name) 
  DO UPDATE SET lastmod = now();
  RETURN COALESCE(NEW, OLD);
END;
$$ LANGUAGE plpgsql SECURITY DEFINER SET search_path = public;

-- Triggers on knowledge_qa table
CREATE TRIGGER knowledge_qa_lastmod_insert
AFTER INSERT ON public.knowledge_qa
FOR EACH ROW EXECUTE FUNCTION public.update_knowledge_qa_lastmod();

CREATE TRIGGER knowledge_qa_lastmod_update
AFTER UPDATE ON public.knowledge_qa
FOR EACH ROW EXECUTE FUNCTION public.update_knowledge_qa_lastmod();

CREATE TRIGGER knowledge_qa_lastmod_delete
AFTER DELETE ON public.knowledge_qa
FOR EACH ROW EXECUTE FUNCTION public.update_knowledge_qa_lastmod();