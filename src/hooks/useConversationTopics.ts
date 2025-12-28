import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface TopicCategory {
  category: string;
  count: number;
}

export interface TopTopic {
  topic: string;
  count: number;
}

export function useConversationTopics(tableName: string | null | undefined) {
  const [categories, setCategories] = useState<TopicCategory[]>([]);
  const [topTopics, setTopTopics] = useState<TopTopic[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    if (!tableName) {
      setLoading(false);
      return;
    }

    const fetchTopics = async () => {
      try {
        setLoading(true);

        const { data, error: fetchError } = await supabase
          .from('conversation_topics')
          .select('category, topic')
          .eq('table_name', tableName);

        if (fetchError) throw fetchError;

        // Group by category
        const categoryMap = new Map<string, number>();
        const topicMap = new Map<string, number>();

        (data || []).forEach(item => {
          categoryMap.set(item.category, (categoryMap.get(item.category) || 0) + 1);
          if (item.topic) {
            topicMap.set(item.topic, (topicMap.get(item.topic) || 0) + 1);
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
  }, [tableName]);

  return { categories, topTopics, loading, error };
}
