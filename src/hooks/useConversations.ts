import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface Conversation {
  session_id: string;
  message_count: number;
  first_message_at: string;
  last_message_at: string;
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

  return { conversations, loading, loadingMore, hasMore, loadMore, fetchMessages };
}
