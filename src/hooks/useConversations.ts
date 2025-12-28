import { useState, useEffect } from 'react';
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

  useEffect(() => {
    if (!tableName) {
      setLoading(false);
      return;
    }

    const fetchConversations = async () => {
      try {
        setLoading(true);
        const { data, error } = await supabase
          .rpc('get_conversations', { p_table_name: tableName, p_limit: 50 });
        
        if (error) throw error;
        setConversations(data || []);
      } catch (err) {
        console.error('Error fetching conversations:', err);
      } finally {
        setLoading(false);
      }
    };

    fetchConversations();
  }, [tableName]);

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

  return { conversations, loading, fetchMessages };
}
