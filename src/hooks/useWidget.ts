import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/contexts/AuthContext';

export interface Widget {
  id: string;
  created_at: string;
  updated_at: string;
  user_id: string;
  user_email: string;
  api_key: string | null;
  
  // Plan & billing
  plan: string | null;
  billing_period: string;
  status: string;
  is_active: boolean;
  
  // Basic info
  bot_name: string | null;
  welcome_message: string | null;
  home_title: string | null;
  home_subtitle_line2: string | null;
  
  // Colors & style
  primary_color: string | null;
  mode: string;
  header_style: string;
  bot_icon_background: string | null;
  bot_icon_color: string | null;
  
  // Icons
  bot_avatar: string | null;
  bot_icon: string[] | null;
  trigger_icon: string | null;
  
  // Position
  position: string;
  vertical_offset: number;
  trigger_style: string;
  edge_trigger_text: string | null;
  
  // Features
  quick_questions: string[] | null;
  show_email_field: boolean;
  show_bubble: boolean;
  bubble_text: string | null;
  booking_enabled: boolean;
  booking_url: string | null;
  support_enabled: boolean;
  
  // Website & add-ons
  website_url: string | null;
  addons: string[] | null;
  table_name: string | null;
  
  // Subscription
  subscription_status: string;
}

export function useWidget() {
  const { user } = useAuth();
  const [widget, setWidget] = useState<Widget | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchWidget = async () => {
    if (!user) {
      setWidget(null);
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
      setWidget(data as Widget | null);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchWidget();
  }, [user]);

  const createWidget = async (email: string, userId: string) => {
    const { data, error } = await supabase
      .from('widgets')
      .insert({
        user_id: userId,
        user_email: email,
      })
      .select()
      .single();

    if (error) throw error;
    setWidget(data as Widget);
    return data as Widget;
  };

  const updateWidget = async (updates: Partial<Omit<Widget, 'id' | 'created_at' | 'updated_at' | 'user_id' | 'user_email'>>) => {
    if (!user) throw new Error('User not authenticated');

    // Check if widgets row exists, create if not
    let existingWidget = widget;
    if (!existingWidget) {
      const { data: fetchedWidget } = await supabase
        .from('widgets')
        .select('*')
        .eq('user_id', user.id)
        .maybeSingle();
      
      existingWidget = fetchedWidget as Widget | null;
    }

    if (!existingWidget) {
      // Create new row with updates
      const { data, error } = await supabase
        .from('widgets')
        .insert({
          user_id: user.id,
          user_email: user.email,
          ...updates,
        })
        .select()
        .single();

      if (error) throw error;
      setWidget(data as Widget);
      return data as Widget;
    }

    // Update existing row
    const { data, error } = await supabase
      .from('widgets')
      .update(updates)
      .eq('user_id', user.id)
      .select()
      .single();

    if (error) throw error;
    setWidget(data as Widget);
    return data as Widget;
  };

  const upsertWidget = async (widgetData: Partial<Omit<Widget, 'id' | 'created_at' | 'updated_at'>>) => {
    if (!user) throw new Error('User not authenticated');

    // Always include user_id and user_email for upsert
    const dataWithUser = {
      user_id: user.id,
      user_email: user.email || '',
      ...widgetData,
    };

    const { data, error } = await supabase
      .from('widgets')
      .upsert(dataWithUser, { onConflict: 'user_id' })
      .select()
      .single();

    if (error) throw error;
    setWidget(data as Widget);
    return data as Widget;
  };

  return {
    widget,
    loading,
    error,
    fetchWidget,
    createWidget,
    updateWidget,
    upsertWidget,
  };
}
