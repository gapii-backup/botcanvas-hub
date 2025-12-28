import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TopicRecord {
  id: string;
  category: string;
  specific: string | null;
  created_at: string;
  session_id: string;
}

export interface TopicCategory {
  category: string;
  count: number;
}

export interface TopTopic {
  topic: string;
  count: number;
}

interface UseConversationTopicsOptions {
  startDate?: Date | null;
  endDate?: Date | null;
}

export function useConversationTopics(
  tableName: string | null | undefined,
  options: UseConversationTopicsOptions = {}
) {
  const [rawData, setRawData] = useState<TopicRecord[]>([]);
  const [categories, setCategories] = useState<TopicCategory[]>([]);
  const [topTopics, setTopTopics] = useState<TopTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const { startDate, endDate } = options;

  useEffect(() => {
    if (!tableName) {
      setLoading(false);
      return;
    }

    const fetchTopics = async () => {
      try {
        setLoading(true);

        let query = supabase
          .from('conversation_topics')
          .select('id, category, specific, created_at, session_id')
          .eq('table_name', tableName);

        if (startDate) {
          query = query.gte('created_at', startDate.toISOString());
        }
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          query = query.lte('created_at', endOfDay.toISOString());
        }

        const { data, error: fetchError } = await query as { 
          data: TopicRecord[] | null; 
          error: any 
        };

        if (fetchError) throw fetchError;

        const records = data || [];
        setRawData(records);

        // Group by category
        const categoryMap = new Map<string, number>();
        const topicMap = new Map<string, number>();

        records.forEach(item => {
          categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1);
          if (item.specific) {
            topicMap.set(item.specific, (topicMap.get(item.specific) || 0) + 1);
          }
        });

        // Convert to arrays and sort
        const categoriesArray = Array.from(categoryMap.entries())
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count);

        const topicsArray = Array.from(topicMap.entries())
          .map(([topic, count]) => ({ topic, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setCategories(categoriesArray);
        setTopTopics(topicsArray);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [tableName, startDate?.getTime(), endDate?.getTime()]);

  return { rawData, categories, topTopics, loading, error };
}
