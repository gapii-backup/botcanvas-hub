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

  useEffect(() => {
    fetchItems();
  }, [tableName]);

  const addItem = async (question: string, answer: string) => {
    if (!tableName) return { data: null, error: new Error('No table name') };
    const { data, error } = await supabase
      .from('knowledge_qa')
      .insert({ table_name: tableName, question, answer })
      .select()
      .single();
    if (!error && data) setItems(prev => [data as KnowledgeQA, ...prev]);
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
    }
    return { data, error };
  };

  const deleteItem = async (id: string) => {
    const { error } = await supabase
      .from('knowledge_qa')
      .delete()
      .eq('id', id);
    if (!error) setItems(prev => prev.filter(item => item.id !== id));
    return { error };
  };

  const getLatestTimestamp = () => {
    if (items.length === 0) return new Date().toISOString();
    const latest = items.reduce((acc, item) => {
      const itemDate = new Date(item.updated_at || item.created_at);
      return itemDate > acc ? itemDate : acc;
    }, new Date(0));
    return latest.toISOString();
  };

  const buildMarkdown = () => {
    return items
      .map(item => `Q: ${item.question}\nA: ${item.answer}`)
      .join('\n---\n');
  };

  return { items, loading, fetchItems, addItem, updateItem, deleteItem, getLatestTimestamp, buildMarkdown };
}
