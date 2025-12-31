export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      conversation_topics: {
        Row: {
          category: string
          created_at: string
          id: string
          session_id: string
          table_name: string
          topic: string | null
        }
        Insert: {
          category: string
          created_at?: string
          id?: string
          session_id: string
          table_name: string
          topic?: string | null
        }
        Update: {
          category?: string
          created_at?: string
          id?: string
          session_id?: string
          table_name?: string
          topic?: string | null
        }
        Relationships: []
      }
      leads: {
        Row: {
          created_at: string
          email: string | null
          id: string
          session_id: string
          table_name: string
        }
        Insert: {
          created_at?: string
          email?: string | null
          id?: string
          session_id: string
          table_name: string
        }
        Update: {
          created_at?: string
          email?: string | null
          id?: string
          session_id?: string
          table_name?: string
        }
        Relationships: []
      }
      message_limits: {
        Row: {
          created_at: string
          id: string
          monthly_count: number
          monthly_limit: number
          reset_at: string
          table_name: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          monthly_count?: number
          monthly_limit?: number
          reset_at?: string
          table_name: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          monthly_count?: number
          monthly_limit?: number
          reset_at?: string
          table_name?: string
          updated_at?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          chat_history: string | null
          created_at: string
          email: string
          id: number
          message: string
          name: string
          phone: string | null
          priority: string
          responded_at: string | null
          session_id: string
          status: string
          subject: string | null
          table_name: string
          ticket_id: string
          updated_at: string
          widget_id: string | null
        }
        Insert: {
          admin_response?: string | null
          chat_history?: string | null
          created_at?: string
          email: string
          id?: number
          message: string
          name: string
          phone?: string | null
          priority?: string
          responded_at?: string | null
          session_id: string
          status?: string
          subject?: string | null
          table_name: string
          ticket_id: string
          updated_at?: string
          widget_id?: string | null
        }
        Update: {
          admin_response?: string | null
          chat_history?: string | null
          created_at?: string
          email?: string
          id?: number
          message?: string
          name?: string
          phone?: string | null
          priority?: string
          responded_at?: string | null
          session_id?: string
          status?: string
          subject?: string | null
          table_name?: string
          ticket_id?: string
          updated_at?: string
          widget_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "support_tickets_widget_id_fkey"
            columns: ["widget_id"]
            isOneToOne: false
            referencedRelation: "widgets"
            referencedColumns: ["id"]
          },
        ]
      }
      user_bots: {
        Row: {
          api_key: string | null
          billing_period: string
          booking_url: string | null
          bot_name: string | null
          created_at: string
          dark_mode: boolean
          id: string
          plan: string | null
          position: string
          primary_color: string | null
          quick_questions: string[]
          status: string
          user_email: string
          user_id: string
          welcome_message: string | null
        }
        Insert: {
          api_key?: string | null
          billing_period?: string
          booking_url?: string | null
          bot_name?: string | null
          created_at?: string
          dark_mode?: boolean
          id?: string
          plan?: string | null
          position?: string
          primary_color?: string | null
          quick_questions?: string[]
          status?: string
          user_email: string
          user_id: string
          welcome_message?: string | null
        }
        Update: {
          api_key?: string | null
          billing_period?: string
          booking_url?: string | null
          bot_name?: string | null
          created_at?: string
          dark_mode?: boolean
          id?: string
          plan?: string | null
          position?: string
          primary_color?: string | null
          quick_questions?: string[]
          status?: string
          user_email?: string
          user_id?: string
          welcome_message?: string | null
        }
        Relationships: []
      }
      widgets: {
        Row: {
          addons: Json | null
          api_key: string | null
          billing_period: string
          billing_period_start: string | null
          booking_enabled: boolean
          booking_url: string | null
          bot_avatar: string | null
          bot_icon: Json | null
          bot_icon_background: string | null
          bot_icon_color: string | null
          bot_name: string | null
          bubble_text: string | null
          created_at: string
          custom_capacity: number
          edge_trigger_text: string | null
          footer_link_text: string | null
          footer_link_url: string | null
          footer_prefix: string | null
          footer_suffix: string | null
          grace_ends_at: string | null
          header_style: string
          health_check_url: string | null
          home_subtitle_line2: string | null
          home_title: string | null
          id: string
          is_active: boolean
          lead_webhook_url: string | null
          messages_limit: number | null
          mode: string
          plan: string | null
          position: string
          primary_color: string | null
          quick_questions: Json | null
          setup_fee_basic_paid: boolean
          setup_fee_enterprise_paid: boolean
          setup_fee_pro_paid: boolean
          show_bubble: boolean
          show_email_field: boolean
          status: string
          stripe_customer_id: string | null
          stripe_subscription_id: string | null
          subscription_status: string
          support_enabled: boolean
          support_webhook_url: string | null
          table_name: string | null
          trigger_icon: string | null
          trigger_style: string
          updated_at: string
          user_email: string
          user_id: string
          vertical_offset: number
          warning_100_sent: boolean
          warning_80_sent: boolean
          webhook_url: string | null
          website_url: string | null
          welcome_message: string | null
        }
        Insert: {
          addons?: Json | null
          api_key?: string | null
          billing_period?: string
          billing_period_start?: string | null
          booking_enabled?: boolean
          booking_url?: string | null
          bot_avatar?: string | null
          bot_icon?: Json | null
          bot_icon_background?: string | null
          bot_icon_color?: string | null
          bot_name?: string | null
          bubble_text?: string | null
          created_at?: string
          custom_capacity?: number
          edge_trigger_text?: string | null
          footer_link_text?: string | null
          footer_link_url?: string | null
          footer_prefix?: string | null
          footer_suffix?: string | null
          grace_ends_at?: string | null
          header_style?: string
          health_check_url?: string | null
          home_subtitle_line2?: string | null
          home_title?: string | null
          id?: string
          is_active?: boolean
          lead_webhook_url?: string | null
          messages_limit?: number | null
          mode?: string
          plan?: string | null
          position?: string
          primary_color?: string | null
          quick_questions?: Json | null
          setup_fee_basic_paid?: boolean
          setup_fee_enterprise_paid?: boolean
          setup_fee_pro_paid?: boolean
          show_bubble?: boolean
          show_email_field?: boolean
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          support_enabled?: boolean
          support_webhook_url?: string | null
          table_name?: string | null
          trigger_icon?: string | null
          trigger_style?: string
          updated_at?: string
          user_email: string
          user_id: string
          vertical_offset?: number
          warning_100_sent?: boolean
          warning_80_sent?: boolean
          webhook_url?: string | null
          website_url?: string | null
          welcome_message?: string | null
        }
        Update: {
          addons?: Json | null
          api_key?: string | null
          billing_period?: string
          billing_period_start?: string | null
          booking_enabled?: boolean
          booking_url?: string | null
          bot_avatar?: string | null
          bot_icon?: Json | null
          bot_icon_background?: string | null
          bot_icon_color?: string | null
          bot_name?: string | null
          bubble_text?: string | null
          created_at?: string
          custom_capacity?: number
          edge_trigger_text?: string | null
          footer_link_text?: string | null
          footer_link_url?: string | null
          footer_prefix?: string | null
          footer_suffix?: string | null
          grace_ends_at?: string | null
          header_style?: string
          health_check_url?: string | null
          home_subtitle_line2?: string | null
          home_title?: string | null
          id?: string
          is_active?: boolean
          lead_webhook_url?: string | null
          messages_limit?: number | null
          mode?: string
          plan?: string | null
          position?: string
          primary_color?: string | null
          quick_questions?: Json | null
          setup_fee_basic_paid?: boolean
          setup_fee_enterprise_paid?: boolean
          setup_fee_pro_paid?: boolean
          show_bubble?: boolean
          show_email_field?: boolean
          status?: string
          stripe_customer_id?: string | null
          stripe_subscription_id?: string | null
          subscription_status?: string
          support_enabled?: boolean
          support_webhook_url?: string | null
          table_name?: string | null
          trigger_icon?: string | null
          trigger_style?: string
          updated_at?: string
          user_email?: string
          user_id?: string
          vertical_offset?: number
          warning_100_sent?: boolean
          warning_80_sent?: boolean
          webhook_url?: string | null
          website_url?: string | null
          welcome_message?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_activity_heatmap:
        | {
            Args: { p_table_name: string }
            Returns: {
              count: number
              day_of_week: number
              hour: number
            }[]
          }
        | {
            Args: {
              p_end_date?: string
              p_start_date?: string
              p_table_name: string
            }
            Returns: {
              count: number
              day_of_week: number
              hour: number
            }[]
          }
      get_conversation_messages: {
        Args: { p_session_id: string; p_table_name: string }
        Returns: {
          created_at: string
          id: number
          message: string
          session_id: string
        }[]
      }
      get_conversations: {
        Args: { p_limit?: number; p_offset?: number; p_table_name: string }
        Returns: {
          first_answer: string
          first_message_at: string
          first_question: string
          last_message_at: string
          message_count: number
          session_id: string
        }[]
      }
      get_human_messages_count: {
        Args: { p_table_name: string }
        Returns: number
      }
      get_human_messages_count_range: {
        Args: {
          p_end_date?: string
          p_start_date?: string
          p_table_name: string
        }
        Returns: number
      }
      get_messages_by_day:
        | {
            Args: { p_table_name: string }
            Returns: {
              count: number
              day: string
            }[]
          }
        | {
            Args: { p_days?: number; p_table_name: string }
            Returns: {
              count: number
              day: string
            }[]
          }
      get_messages_today: { Args: { p_table_name: string }; Returns: number }
      get_sessions_count: {
        Args: {
          p_end_date?: string
          p_start_date?: string
          p_table_name: string
        }
        Returns: number
      }
      get_sessions_this_month: {
        Args: { p_table_name: string }
        Returns: number
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
