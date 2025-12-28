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

export interface TrendDataPoint {
  day: string;
  count: number;
}

export type HeatmapData = number[][];

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
  const [trendData, setTrendData] = useState<TrendDataPoint[]>([]);
  const [heatmapData, setHeatmapData] = useState<HeatmapData>([]);
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
          const start = startDate.toISOString().replace('T', ' ').replace('Z', '');
          query = query.gte('created_at', start);
        }
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          const end = endOfDay.toISOString().replace('T', ' ').replace('Z', '');
          query = query.lte('created_at', end);
        }

        const { data, error: fetchError } = await query as { 
          data: Array<{
            id: string;
            category: string;
            specific: string | null;
            created_at: string;
            session_id: string;
          }> | null; 
          error: any 
        };

        if (fetchError) throw fetchError;

        const records: TopicRecord[] = (data || []).map(item => ({
          id: item.id,
          category: item.category,
          specific: item.specific,
          created_at: item.created_at,
          session_id: item.session_id
        }));
        
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

        // Calculate trend data - unique sessions per day (last 14 days)
        const trendMap = new Map<string, Set<string>>();
        const now = new Date();
        
        // Initialize last 14 days
        for (let i = 13; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dayKey = date.toISOString().split('T')[0];
          trendMap.set(dayKey, new Set());
        }

        records.forEach(item => {
          const dayKey = item.created_at.split('T')[0];
          if (trendMap.has(dayKey)) {
            trendMap.get(dayKey)!.add(item.session_id);
          }
        });

        const trendArray = Array.from(trendMap.entries())
          .map(([day, sessions]) => ({ day, count: sessions.size }))
          .sort((a, b) => a.day.localeCompare(b.day));

        setTrendData(trendArray);

        // Calculate heatmap data - 7 days x 24 hours
        // Index 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const heatmap: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));

        records.forEach(item => {
          const date = new Date(item.created_at);
          const dayOfWeek = date.getDay(); // 0 = Sunday
          const hour = date.getHours();
          heatmap[dayOfWeek][hour]++;
        });

        setHeatmapData(heatmap);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchTopics();
  }, [tableName, startDate?.getTime(), endDate?.getTime()]);

  return { rawData, categories, topTopics, trendData, heatmapData, loading, error };
}
