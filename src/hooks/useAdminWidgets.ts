import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';

export interface AdminWidget {
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
  
  // Webhooks
  webhook_url: string | null;
  lead_webhook_url: string | null;
  support_webhook_url: string | null;
  health_check_url: string | null;
  table_name: string | null;
  
  // Footer
  footer_prefix: string | null;
  footer_link_text: string | null;
  footer_link_url: string | null;
  footer_suffix: string | null;
  
  // Subscription & Stripe
  subscription_status: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  
  // Capacity
  messages_limit: number | null;
  custom_capacity: number;
}

export function useAdminWidgets() {
  const [widgets, setWidgets] = useState<AdminWidget[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  const fetchAllWidgets = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('widgets')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setWidgets(data as AdminWidget[]);
    } catch (err) {
      setError(err instanceof Error ? err : new Error('Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const fetchWidgetById = async (id: string) => {
    const { data, error } = await supabase
      .from('widgets')
      .select('*')
      .eq('id', id)
      .maybeSingle();

    if (error) throw error;
    return data as AdminWidget | null;
  };

  const updateWidgetById = async (id: string, updates: Partial<AdminWidget>) => {
    const { data, error } = await supabase
      .from('widgets')
      .update(updates)
      .eq('id', id)
      .select()
      .single();

    if (error) throw error;
    
    // Update local state
    setWidgets(prev => prev.map(w => w.id === id ? { ...w, ...updates } : w));
    return data as AdminWidget;
  };

  const deleteWidgetById = async (id: string) => {
    const { error } = await supabase
      .from('widgets')
      .delete()
      .eq('id', id);

    if (error) throw error;
    
    // Update local state
    setWidgets(prev => prev.filter(w => w.id !== id));
  };

  useEffect(() => {
    fetchAllWidgets();
  }, []);

  return {
    widgets,
    loading,
    error,
    fetchAllWidgets,
    fetchWidgetById,
    updateWidgetById,
    deleteWidgetById,
  };
}
