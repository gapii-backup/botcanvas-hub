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
  const [sessionsCount, setSessionsCount] = useState<number>(0);
  const [humanMessagesCount, setHumanMessagesCount] = useState<number>(0);
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

        const categoriesArray = Array.from(categoryMap.entries())
          .map(([category, count]) => ({ category, count }))
          .sort((a, b) => b.count - a.count);

        const topicsArray = Array.from(topicMap.entries())
          .map(([topic, count]) => ({ topic, count }))
          .sort((a, b) => b.count - a.count)
          .slice(0, 5);

        setCategories(categoriesArray);
        setTopTopics(topicsArray);

        // === 2. Fetch trend data via RPC ===
        // Calculate number of days based on date range
        let days = 30; // default
        if (startDate && endDate) {
          const diffTime = Math.abs(endDate.getTime() - startDate.getTime());
          days = Math.ceil(diffTime / (1000 * 60 * 60 * 24)) + 1;
        }

        const { data: trendRaw, error: trendError } = await supabase
          .rpc('get_messages_by_day', { p_table_name: tableName, p_days: days });

        console.log('Trend RPC raw data:', trendRaw);

        if (trendError) {
          console.error('Trend RPC error:', trendError);
        }

        // Use RPC data directly
        if (trendRaw && Array.isArray(trendRaw)) {
          const trendArray: TrendDataPoint[] = trendRaw.map((item: { day: string; count: number }) => ({
            day: typeof item.day === 'string' ? item.day.split('T')[0] : String(item.day),
            count: Number(item.count)
          }));
          
          // Sort by date
          trendArray.sort((a, b) => a.day.localeCompare(b.day));
          
          console.log('Processed trend data:', trendArray);
          setTrendData(trendArray);
        } else {
          setTrendData([]);
        }

        // === 3. Fetch heatmap data via RPC with date range ===
        const heatmapStartDate = startDate 
          ? startDate.toISOString().replace('T', ' ').replace('Z', '') 
          : null;
        
        const heatmapEndDate = endDate 
          ? (() => {
              const endOfDay = new Date(endDate);
              endOfDay.setHours(23, 59, 59, 999);
              return endOfDay.toISOString().replace('T', ' ').replace('Z', '');
            })()
          : null;

        const { data: heatmapRaw, error: heatmapError } = await supabase
          .rpc('get_activity_heatmap', { 
            p_table_name: tableName,
            p_start_date: heatmapStartDate,
            p_end_date: heatmapEndDate
          });

        console.log('Heatmap raw data:', heatmapRaw);

        if (heatmapError) {
          console.error('Heatmap RPC error:', heatmapError);
        }

        // Build 7x24 matrix - Index 0 = Sunday
        const matrix: number[][] = Array(7).fill(null).map(() => Array(24).fill(0));

        if (heatmapRaw && Array.isArray(heatmapRaw)) {
          heatmapRaw.forEach((item: any) => {
            const dow = Number(item.day_of_week ?? item.dayOfWeek ?? item.dow);
            const hour = Number(item.hour ?? item.hour_of_day ?? item.hour_of_day);
            const count = Number(item.count ?? item.message_count ?? item.messageCount);

            if (dow >= 0 && dow < 7 && hour >= 0 && hour < 24) {
              matrix[dow][hour] = count;
            }
          });
        }

        console.log('Heatmap matrix:', matrix);

        setHeatmapData(matrix);

        // === 4. Fetch sessions count with date range ===
        const dateStartStr = startDate 
          ? startDate.toISOString().replace('T', ' ').replace('Z', '') 
          : null;
        
        const dateEndStr = endDate 
          ? (() => {
              const endOfDay = new Date(endDate);
              endOfDay.setHours(23, 59, 59, 999);
              return endOfDay.toISOString().replace('T', ' ').replace('Z', '');
            })()
          : null;

        const { data: sessionsData, error: sessionsError } = await supabase
          .rpc('get_sessions_count', { 
            p_table_name: tableName,
            p_start_date: dateStartStr,
            p_end_date: dateEndStr
          });

        if (sessionsError) {
          console.error('Sessions count error:', sessionsError);
        }
        setSessionsCount(sessionsData || 0);

        // === 5. Fetch human messages count with date range ===
        const { data: humanMsgData, error: humanMsgError } = await supabase
          .rpc('get_human_messages_count_range', { 
            p_table_name: tableName,
            p_start_date: dateStartStr,
            p_end_date: dateEndStr
          });

        if (humanMsgError) {
          console.error('Human messages count error:', humanMsgError);
        }
        setHumanMessagesCount(humanMsgData || 0);

      } catch (err) {
        console.error('useConversationTopics error:', err);
        setError(err instanceof Error ? err : new Error('Unknown error'));
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [tableName, startDate?.getTime(), endDate?.getTime()]);

  return { 
    rawData, 
    categories, 
    topTopics, 
    trendData, 
    heatmapData,
    sessionsCount,
    humanMessagesCount, 
    loading, 
    error 
  };
}
