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
      conversation_participants: {
        Row: {
          conversation_id: string
          id: string
          is_muted: boolean
          joined_at: string
          last_read_at: string | null
          user_id: string
        }
        Insert: {
          conversation_id: string
          id?: string
          is_muted?: boolean
          joined_at?: string
          last_read_at?: string | null
          user_id: string
        }
        Update: {
          conversation_id?: string
          id?: string
          is_muted?: boolean
          joined_at?: string
          last_read_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "conversation_participants_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          created_at: string
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      message_reactions: {
        Row: {
          created_at: string
          emoji: string
          id: string
          message_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          emoji: string
          id?: string
          message_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          emoji?: string
          id?: string
          message_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "message_reactions_message_id_fkey"
            columns: ["message_id"]
            isOneToOne: false
            referencedRelation: "messages"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          content: string
          conversation_id: string
          created_at: string
          id: string
          is_deleted: boolean
          sender_id: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          sender_id: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          id?: string
          is_deleted?: boolean
          sender_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aspirational_school: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string
          display_name: string | null
          email: string | null
          extracurriculars: string[] | null
          grade_or_year: string | null
          id: string
          interests: string[] | null
          is_high_school: boolean | null
          is_premium: boolean
          major: string | null
          onboarding_completed: boolean | null
          referral_source: string | null
          referral_source_other: string | null
          school_name: string | null
          school_type: string | null
          subscription_ends_at: string | null
          updated_at: string
          username: string | null
        }
        Insert: {
          aspirational_school?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          extracurriculars?: string[] | null
          grade_or_year?: string | null
          id: string
          interests?: string[] | null
          is_high_school?: boolean | null
          is_premium?: boolean
          major?: string | null
          onboarding_completed?: boolean | null
          referral_source?: string | null
          referral_source_other?: string | null
          school_name?: string | null
          school_type?: string | null
          subscription_ends_at?: string | null
          updated_at?: string
          username?: string | null
        }
        Update: {
          aspirational_school?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string
          display_name?: string | null
          email?: string | null
          extracurriculars?: string[] | null
          grade_or_year?: string | null
          id?: string
          interests?: string[] | null
          is_high_school?: boolean | null
          is_premium?: boolean
          major?: string | null
          onboarding_completed?: boolean | null
          referral_source?: string | null
          referral_source_other?: string | null
          school_name?: string | null
          school_type?: string | null
          subscription_ends_at?: string | null
          updated_at?: string
          username?: string | null
        }
        Relationships: []
      }
      school_profiles: {
        Row: {
          about_source: string | null
          about_source_url: string | null
          about_text: string | null
          acceptance_rate: number | null
          carnegie_classification: string | null
          chips: string[] | null
          created_at: string
          data_source: string | null
          enrichment_error: string | null
          enrichment_status: string | null
          enrollment: number | null
          founded_year: number | null
          graduation_rate: number | null
          id: string
          ipeds_id: string | null
          last_enrichment_attempt: string | null
          locale: string | null
          nces_id: string | null
          ownership_type: string | null
          programs_count: number | null
          ranking: string | null
          ranking_source: string | null
          religious_affiliation: string | null
          school_id: string
          scorecard_id: number | null
          source_name: string | null
          source_retrieved_at: string | null
          source_url: string | null
          stats: Json | null
          student_faculty_ratio: string | null
          tagline: string | null
          tuition_in_state: number | null
          tuition_out_of_state: number | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          about_source?: string | null
          about_source_url?: string | null
          about_text?: string | null
          acceptance_rate?: number | null
          carnegie_classification?: string | null
          chips?: string[] | null
          created_at?: string
          data_source?: string | null
          enrichment_error?: string | null
          enrichment_status?: string | null
          enrollment?: number | null
          founded_year?: number | null
          graduation_rate?: number | null
          id?: string
          ipeds_id?: string | null
          last_enrichment_attempt?: string | null
          locale?: string | null
          nces_id?: string | null
          ownership_type?: string | null
          programs_count?: number | null
          ranking?: string | null
          ranking_source?: string | null
          religious_affiliation?: string | null
          school_id: string
          scorecard_id?: number | null
          source_name?: string | null
          source_retrieved_at?: string | null
          source_url?: string | null
          stats?: Json | null
          student_faculty_ratio?: string | null
          tagline?: string | null
          tuition_in_state?: number | null
          tuition_out_of_state?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          about_source?: string | null
          about_source_url?: string | null
          about_text?: string | null
          acceptance_rate?: number | null
          carnegie_classification?: string | null
          chips?: string[] | null
          created_at?: string
          data_source?: string | null
          enrichment_error?: string | null
          enrichment_status?: string | null
          enrollment?: number | null
          founded_year?: number | null
          graduation_rate?: number | null
          id?: string
          ipeds_id?: string | null
          last_enrichment_attempt?: string | null
          locale?: string | null
          nces_id?: string | null
          ownership_type?: string | null
          programs_count?: number | null
          ranking?: string | null
          ranking_source?: string | null
          religious_affiliation?: string | null
          school_id?: string
          scorecard_id?: number | null
          source_name?: string | null
          source_retrieved_at?: string | null
          source_url?: string | null
          stats?: Json | null
          student_faculty_ratio?: string | null
          tagline?: string | null
          tuition_in_state?: number | null
          tuition_out_of_state?: number | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "school_profiles_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: true
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      schools: {
        Row: {
          city: string | null
          country: string
          created_at: string
          id: string
          is_notable: boolean
          name: string
          state: string | null
          type: string
        }
        Insert: {
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          is_notable?: boolean
          name: string
          state?: string | null
          type: string
        }
        Update: {
          city?: string | null
          country?: string
          created_at?: string
          id?: string
          is_notable?: boolean
          name?: string
          state?: string | null
          type?: string
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
    }
    Views: {
      public_profiles: {
        Row: {
          aspirational_school: string | null
          avatar_url: string | null
          bio: string | null
          created_at: string | null
          display_name: string | null
          grade_or_year: string | null
          id: string | null
          interests: string[] | null
          is_high_school: boolean | null
          major: string | null
          onboarding_completed: boolean | null
          school_name: string | null
          school_type: string | null
          updated_at: string | null
          username: string | null
        }
        Insert: {
          aspirational_school?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          grade_or_year?: string | null
          id?: string | null
          interests?: string[] | null
          is_high_school?: boolean | null
          major?: string | null
          onboarding_completed?: boolean | null
          school_name?: string | null
          school_type?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Update: {
          aspirational_school?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          display_name?: string | null
          grade_or_year?: string | null
          id?: string | null
          interests?: string[] | null
          is_high_school?: boolean | null
          major?: string | null
          onboarding_completed?: boolean | null
          school_name?: string | null
          school_type?: string | null
          updated_at?: string | null
          username?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      search_schools: {
        Args: {
          country_filter?: string
          result_limit?: number
          school_type?: string
          search_query: string
        }
        Returns: {
          city: string
          country: string
          id: string
          is_notable: boolean
          match_rank: number
          name: string
          state: string
          type: string
        }[]
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
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
    Enums: {
      app_role: ["admin", "moderator", "user"],
    },
  },
} as const
