import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Conversation {
  session_id: string;
  message_count: number;
  first_message_at: string;
  last_message_at: string;
  first_question: string;
  first_answer: string;
}

export interface Message {
  id: number;
  session_id: string;
  message: {
    role?: string;
    content?: string;
    text?: string;
  } | string;
  created_at: string;
}

export function useConversations(tableName: string | null | undefined) {
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const LIMIT = 50;

  const fetchConversations = useCallback(async (reset = false) => {
    if (!tableName) {
      setLoading(false);
      return;
    }

    try {
      if (reset) {
        setLoading(true);
        setOffset(0);
      } else {
        setLoadingMore(true);
      }

      const currentOffset = reset ? 0 : offset;
      
      const { data, error } = await supabase
        .rpc('get_conversations', { 
          p_table_name: tableName, 
          p_limit: LIMIT,
          p_offset: currentOffset
        });
      
      if (error) throw error;
      
      const newData = data || [];
      
      if (reset) {
        setConversations(newData);
      } else {
        setConversations(prev => [...prev, ...newData]);
      }
      
      setHasMore(newData.length === LIMIT);
      setOffset(currentOffset + newData.length);
      
    } catch (err) {
      console.error('Error fetching conversations:', err);
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, [tableName, offset]);

  useEffect(() => {
    fetchConversations(true);
  }, [tableName]);

  const loadMore = () => {
    if (!loadingMore && hasMore) {
      fetchConversations(false);
    }
  };

  const fetchMessages = async (sessionId: string): Promise<Message[]> => {
    if (!tableName) return [];
    
    const { data, error } = await supabase
      .rpc('get_conversation_messages', { 
        p_table_name: tableName, 
        p_session_id: sessionId 
      });
    
    if (error) {
      console.error('Error fetching messages:', error);
      return [];
    }
    return data || [];
  };

  const fetchAllConversations = async (dateFilter?: { from?: Date; to?: Date; days?: number }): Promise<Conversation[]> => {
    if (!tableName) return [];
    
    let allConversations: Conversation[] = [];
    let currentOffset = 0;
    const batchSize = 100;
    let hasMoreData = true;
    
    while (hasMoreData) {
      const { data, error } = await supabase
        .rpc('get_conversations', { 
          p_table_name: tableName, 
          p_limit: batchSize,
          p_offset: currentOffset
        });
      
      if (error) {
        console.error('Error fetching all conversations:', error);
        break;
      }
      
      if (!data || data.length === 0) {
        hasMoreData = false;
      } else {
        let filtered = data as Conversation[];
        
        if (dateFilter) {
          const now = new Date();
          
          filtered = (data as Conversation[]).filter((conv) => {
            const convDate = new Date(conv.last_message_at);
            
            if (dateFilter.days) {
              const daysAgo = new Date(now.getTime() - dateFilter.days * 24 * 60 * 60 * 1000);
              return convDate >= daysAgo;
            }
            
            if (dateFilter.from && convDate < dateFilter.from) return false;
            if (dateFilter.to) {
              const endOfDay = new Date(dateFilter.to);
              endOfDay.setHours(23, 59, 59, 999);
              if (convDate > endOfDay) return false;
            }
            
            return true;
          });
        }
        
        allConversations = [...allConversations, ...filtered];
        currentOffset += batchSize;
        
        if (data.length < batchSize) {
          hasMoreData = false;
        }
        
        // Stop early if filtering by date and oldest result is outside filter
        if (dateFilter && data.length > 0) {
          const oldestInBatch = new Date((data as Conversation[])[data.length - 1].last_message_at);
          const now = new Date();
          if (dateFilter.days) {
            const daysAgo = new Date(now.getTime() - dateFilter.days * 24 * 60 * 60 * 1000);
            if (oldestInBatch < daysAgo) hasMoreData = false;
          }
          if (dateFilter.from && oldestInBatch < dateFilter.from) {
            hasMoreData = false;
          }
        }
      }
    }
    
    return allConversations;
  };

  return { conversations, loading, loadingMore, hasMore, loadMore, fetchMessages, fetchAllConversations };
}
