import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface UserBot {
  id: string;
  created_at: string;
  user_id: string;
  user_email: string;
  plan: string | null;
  bot_name: string | null;
  welcome_message: string | null;
  primary_color: string | null;
  dark_mode: boolean | null;
  position: string | null;
  quick_questions: string[] | null;
  booking_url: string | null;
  status: string | null;
  api_key: string | null;
}

export function useUserBot() {
  const { user } = useAuth();
  const [userBot, setUserBot] = useState<UserBot | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchUserBot = async () => {
    if (!user) {
      setUserBot(null);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const { data, error } = await (supabase as any)
        .from('user_bots')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      setUserBot(data as UserBot | null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUserBot();
  }, [user]);

  const createUserBot = async (email: string, userId: string) => {
    const { data, error } = await (supabase as any)
      .from('user_bots')
      .insert({
        user_id: userId,
        user_email: email,
      })
      .select()
      .single();

    if (error) throw error;
    setUserBot(data as UserBot);
    return data as UserBot;
  };

  const updateUserBot = async (updates: Partial<Omit<UserBot, 'id' | 'created_at' | 'user_id' | 'user_email'>>) => {
    if (!user) throw new Error('User not authenticated');

    // Check if user_bots row exists, create if not
    let existingBot = userBot;
    if (!existingBot) {
      const { data: fetchedBot } = await (supabase as any)
        .from('user_bots')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      existingBot = fetchedBot as UserBot | null;
    }

    if (!existingBot) {
      // Create new row with updates
      const { data, error } = await (supabase as any)
        .from('user_bots')
        .insert({
          user_id: user.id,
          user_email: user.email,
          ...updates,
        })
        .select()
        .single();

      if (error) throw error;
      setUserBot(data as UserBot);
      return data as UserBot;
    }

    // Update existing row
    const { data, error } = await (supabase as any)
      .from('user_bots')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setUserBot(data as UserBot);
    return data as UserBot;
  };

  return {
    userBot,
    loading,
    error,
    fetchUserBot,
    createUserBot,
    updateUserBot,
  };
}
