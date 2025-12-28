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

    const fetchData = async () => {
      try {
        setLoading(true);

        // === 1. Fetch conversation_topics for categories and topics ===
        let topicsQuery = supabase
          .from('conversation_topics')
          .select('id, category, specific, created_at, session_id')
          .eq('table_name', tableName);

        if (startDate) {
          const start = startDate.toISOString().replace('T', ' ').replace('Z', '');
          topicsQuery = topicsQuery.gte('created_at', start);
        }
        if (endDate) {
          const endOfDay = new Date(endDate);
          endOfDay.setHours(23, 59, 59, 999);
          const end = endOfDay.toISOString().replace('T', ' ').replace('Z', '');
          topicsQuery = topicsQuery.lte('created_at', end);
        }

        const { data: topicsData, error: topicsError } = await topicsQuery as { 
          data: Array<{
            id: string;
            category: string;
            specific: string | null;
            created_at: string;
            session_id: string;
          }> | null; 
          error: any 
        };

        if (topicsError) throw topicsError;

        const records: TopicRecord[] = (topicsData || []).map(item => ({
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

        // === 2. Fetch trend data via RPC (from dynamic message table) ===
        const { data: trendRpcData, error: trendError } = await supabase
          .rpc('get_messages_by_day', { p_table_name: tableName });

        if (trendError) {
          console.error('Trend RPC error:', trendError);
        }

        // Convert RPC result to TrendDataPoint array
        // RPC returns last 7 days, we need to fill in missing days
        const trendMap = new Map<string, number>();
        const now = new Date();
        
        // Initialize last 14 days with 0
        for (let i = 13; i >= 0; i--) {
          const date = new Date(now);
          date.setDate(date.getDate() - i);
          const dayKey = date.toISOString().split('T')[0];
          trendMap.set(dayKey, 0);
        }

        // Fill in actual counts from RPC
        if (trendRpcData) {
          (trendRpcData as Array<{ day: string; count: number }>).forEach(item => {
            const dayKey = typeof item.day === 'string' ? item.day : new Date(item.day).toISOString().split('T')[0];
            if (trendMap.has(dayKey)) {
              trendMap.set(dayKey, Number(item.count));
            }
          });
        }

        const trendArray = Array.from(trendMap.entries())
          .map(([day, count]) => ({ day, count }))
          .sort((a, b) => a.day.localeCompare(b.day));

        setTrendData(trendArray);

        // === 3. Fetch heatmap data via RPC (from dynamic message table) ===
        const { data: heatmapRpcData, error: heatmapError } = await supabase
          .rpc('get_activity_heatmap', { p_table_name: tableName });

        if (heatmapError) {
          console.error('Heatmap RPC error:', heatmapError);
        }

        // Convert RPC result to 7x24 matrix
        // Index 0 = Sunday, 1 = Monday, ..., 6 = Saturday
        const heatmap: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));

        if (heatmapRpcData) {
          (heatmapRpcData as Array<{ day_of_week: number; hour: number; count: number }>).forEach(item => {
            const dow = item.day_of_week;
            const hour = item.hour;
            if (dow >= 0 && dow < 7 && hour >= 0 && hour < 24) {
              heatmap[dow][hour] = Number(item.count);
            }
          });
        }

        setHeatmapData(heatmap);
      } catch (err) {
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableName, startDate?.getTime(), endDate?.getTime()]);

  return { 
    // Iz conversation_topics:
    rawData, 
    categories, 
    topTopics, 
    // Iz tabele sporočil (RPC):
    trendData, 
    heatmapData, 
    loading, 
    error 
  };
}
