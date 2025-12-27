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
  billing_period: 'monthly' | 'yearly';
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
      const { data, error } = await supabase
        .from('widgets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error) throw error;
      
      // Map widgets data to UserBot format
      if (data) {
        setUserBot({
          id: data.id,
          created_at: data.created_at,
          user_id: data.user_id,
          user_email: data.user_email,
          plan: data.plan,
          bot_name: data.bot_name,
          welcome_message: data.welcome_message,
          primary_color: data.primary_color,
          dark_mode: data.mode === 'dark',
          position: data.position,
          quick_questions: data.quick_questions as string[] | null,
          booking_url: data.booking_url,
          status: data.status,
          api_key: data.api_key,
          billing_period: (data.billing_period || 'monthly') as 'monthly' | 'yearly',
        });
      } else {
        setUserBot(null);
      }
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
    const { data, error } = await supabase
      .from('widgets')
      .insert({
        user_id: userId,
        user_email: email,
      })
      .select()
      .single();

    if (error) throw error;
    
    const mapped: UserBot = {
      id: data.id,
      created_at: data.created_at,
      user_id: data.user_id,
      user_email: data.user_email,
      plan: data.plan,
      bot_name: data.bot_name,
      welcome_message: data.welcome_message,
      primary_color: data.primary_color,
      dark_mode: data.mode === 'dark',
      position: data.position,
      quick_questions: data.quick_questions as string[] | null,
      booking_url: data.booking_url,
      status: data.status,
      api_key: data.api_key,
      billing_period: (data.billing_period || 'monthly') as 'monthly' | 'yearly',
    };
    setUserBot(mapped);
    return mapped;
  };

  const updateUserBot = async (updates: Partial<Omit<UserBot, 'id' | 'created_at' | 'user_id' | 'user_email'>>) => {
    if (!user) throw new Error('User not authenticated');

    // Map UserBot updates to widgets format
    const widgetUpdates: Record<string, any> = {};
    
    if (updates.plan !== undefined) widgetUpdates.plan = updates.plan;
    if (updates.billing_period !== undefined) widgetUpdates.billing_period = updates.billing_period;
    if (updates.bot_name !== undefined) widgetUpdates.bot_name = updates.bot_name;
    if (updates.welcome_message !== undefined) widgetUpdates.welcome_message = updates.welcome_message;
    if (updates.primary_color !== undefined) widgetUpdates.primary_color = updates.primary_color;
    if (updates.dark_mode !== undefined) widgetUpdates.mode = updates.dark_mode ? 'dark' : 'light';
    if (updates.position !== undefined) widgetUpdates.position = updates.position;
    if (updates.quick_questions !== undefined) widgetUpdates.quick_questions = updates.quick_questions;
    if (updates.booking_url !== undefined) widgetUpdates.booking_url = updates.booking_url;
    if (updates.status !== undefined) widgetUpdates.status = updates.status;
    if (updates.api_key !== undefined) widgetUpdates.api_key = updates.api_key;

    // Check if widgets row exists
    const { data: existingWidget } = await supabase
      .from('widgets')
      .select('*')
      .eq('user_id', user.id)
      .maybeSingle();

    if (!existingWidget) {
      // Create new row with updates
      const { data, error } = await supabase
        .from('widgets')
        .insert({
          user_id: user.id,
          user_email: user.email,
          ...widgetUpdates,
        })
        .select()
        .single();

      if (error) throw error;
      
      const mapped: UserBot = {
        id: data.id,
        created_at: data.created_at,
        user_id: data.user_id,
        user_email: data.user_email,
        plan: data.plan,
        bot_name: data.bot_name,
        welcome_message: data.welcome_message,
        primary_color: data.primary_color,
        dark_mode: data.mode === 'dark',
        position: data.position,
        quick_questions: data.quick_questions as string[] | null,
        booking_url: data.booking_url,
        status: data.status,
        api_key: data.api_key,
        billing_period: (data.billing_period || 'monthly') as 'monthly' | 'yearly',
      };
      setUserBot(mapped);
      return mapped;
    }

    // Update existing row
    const { data, error } = await supabase
      .from('widgets')
      .update(widgetUpdates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    
    const mapped: UserBot = {
      id: data.id,
      created_at: data.created_at,
      user_id: data.user_id,
      user_email: data.user_email,
      plan: data.plan,
      bot_name: data.bot_name,
      welcome_message: data.welcome_message,
      primary_color: data.primary_color,
      dark_mode: data.mode === 'dark',
      position: data.position,
      quick_questions: data.quick_questions as string[] | null,
      booking_url: data.booking_url,
      status: data.status,
      api_key: data.api_key,
      billing_period: (data.billing_period || 'monthly') as 'monthly' | 'yearly',
    };
    setUserBot(mapped);
    return mapped;
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
