import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface KnowledgeQA {
  id: string;
  table_name: string;
  question: string;
  answer: string;
  created_at: string;
  updated_at: string;
}

export function useKnowledgeQA(tableName: string | null | undefined) {
  const [items, setItems] = useState<KnowledgeQA[]>([]);
  const [loading, setLoading] = useState(true);
  const [lastmod, setLastmod] = useState<string | null>(null);
  const [lastTrained, setLastTrained] = useState<string | null>(null);

  const fetchItems = async () => {
    if (!tableName) {
      setLoading(false);
      return;
    }
    setLoading(true);
    const { data, error } = await supabase
      .from('knowledge_qa')
      .select('*')
      .eq('table_name', tableName)
      .order('created_at', { ascending: false });
    
    if (!error && data) setItems(data as KnowledgeQA[]);
    setLoading(false);
  };

  const fetchLastmod = async () => {
    if (!tableName) return;
    const { data } = await supabase
      .from('knowledge_qa_lastmod')
      .select('lastmod, last_trained')
      .eq('table_name', tableName)
      .maybeSingle();
    
    if (data) {
      setLastmod(data.lastmod);
      setLastTrained(data.last_trained);
    }
  };

  const updateLastTrained = async () => {
    if (!tableName) return;
    const now = new Date().toISOString();
    await supabase
      .from('knowledge_qa_lastmod')
      .upsert({ table_name: tableName, last_trained: now, lastmod: now });
    setLastTrained(now);
  };

  useEffect(() => {
    fetchItems();
    fetchLastmod();
  }, [tableName]);

  const addItem = async (question: string, answer: string) => {
    if (!tableName) return { data: null, error: new Error('No table name') };
    const { data, error } = await supabase
      .from('knowledge_qa')
      .insert({ table_name: tableName, question, answer })
      .select()
      .single();
    if (!error && data) {
      setItems(prev => [data as KnowledgeQA, ...prev]);
      await fetchLastmod();
    }
    return { data, error };
  };

  const updateItem = async (id: string, question: string, answer: string) => {
    const { data, error } = await supabase
      .from('knowledge_qa')
      .update({ question, answer, updated_at: new Date().toISOString() })
      .eq('id', id)
      .select()
      .single();
    if (!error && data) {
      setItems(prev => prev.map(item => item.id === id ? data as KnowledgeQA : item));
      await fetchLastmod();
    }
    return { data, error };
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('knowledge_qa')
      .delete()
      .eq('id', id);
    if (!error) {
      setItems(prev => prev.filter(item => item.id !== id));
      await fetchLastmod();
    }
    return { error };
  };

  const getLatestTimestamp = () => {
    return lastmod || new Date().toISOString();
  };

  const buildMarkdown = () => {
    return items
      .map(item => `Q: ${item.question}\nA: ${item.answer}`)
      .join('\n---\n');
  };

  return { 
    items, 
    loading, 
    fetchItems, 
    addItem, 
    updateItem, 
    deleteItem, 
    getLatestTimestamp, 
    buildMarkdown,
    lastmod,
    lastTrained,
    updateLastTrained,
    fetchLastmod
  };
}
