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
      comment_likes: {
        Row: {
          comment_id: string
          created_at: string
          id: string
          user_id: string
        }
        Insert: {
          comment_id: string
          created_at?: string
          id?: string
          user_id: string
        }
        Update: {
          comment_id?: string
          created_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "comment_likes_comment_id_fkey"
            columns: ["comment_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
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
          expiration_seconds: number | null
          id: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          expiration_seconds?: number | null
          id?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          expiration_seconds?: number | null
          id?: string
          updated_at?: string
        }
        Relationships: []
      }
      event_rsvps: {
        Row: {
          created_at: string
          event_id: string
          id: string
          status: Database["public"]["Enums"]["rsvp_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          event_id: string
          id?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          event_id?: string
          id?: string
          status?: Database["public"]["Enums"]["rsvp_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "event_rsvps_event_id_fkey"
            columns: ["event_id"]
            isOneToOne: false
            referencedRelation: "events"
            referencedColumns: ["id"]
          },
        ]
      }
      events: {
        Row: {
          address: string | null
          all_day: boolean
          attendee_count: number
          capacity: number | null
          created_at: string
          creator_id: string
          description: string | null
          ends_at: string | null
          event_type: string | null
          group_id: string | null
          id: string
          image_url: string | null
          is_deleted: boolean
          latitude: number | null
          location_name: string | null
          location_type: Database["public"]["Enums"]["event_location_type"]
          longitude: number | null
          maps_url: string | null
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          school_id: string | null
          school_name: string | null
          starts_at: string
          timezone: string | null
          title: string
          updated_at: string
          virtual_link: string | null
          visibility: Database["public"]["Enums"]["entity_visibility"]
        }
        Insert: {
          address?: string | null
          all_day?: boolean
          attendee_count?: number
          capacity?: number | null
          created_at?: string
          creator_id: string
          description?: string | null
          ends_at?: string | null
          event_type?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          latitude?: number | null
          location_name?: string | null
          location_type?: Database["public"]["Enums"]["event_location_type"]
          longitude?: number | null
          maps_url?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          school_id?: string | null
          school_name?: string | null
          starts_at: string
          timezone?: string | null
          title: string
          updated_at?: string
          virtual_link?: string | null
          visibility?: Database["public"]["Enums"]["entity_visibility"]
        }
        Update: {
          address?: string | null
          all_day?: boolean
          attendee_count?: number
          capacity?: number | null
          created_at?: string
          creator_id?: string
          description?: string | null
          ends_at?: string | null
          event_type?: string | null
          group_id?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          latitude?: number | null
          location_name?: string | null
          location_type?: Database["public"]["Enums"]["event_location_type"]
          longitude?: number | null
          maps_url?: string | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          school_id?: string | null
          school_name?: string | null
          starts_at?: string
          timezone?: string | null
          title?: string
          updated_at?: string
          virtual_link?: string | null
          visibility?: Database["public"]["Enums"]["entity_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "events_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "events_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      feed_posts: {
        Row: {
          author_id: string
          category: Database["public"]["Enums"]["post_category"]
          comment_count: number
          content: string
          created_at: string
          group_id: string | null
          id: string
          is_deleted: boolean
          like_count: number
          school_id: string | null
          title: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["post_visibility"]
        }
        Insert: {
          author_id: string
          category?: Database["public"]["Enums"]["post_category"]
          comment_count?: number
          content: string
          created_at?: string
          group_id?: string | null
          id?: string
          is_deleted?: boolean
          like_count?: number
          school_id?: string | null
          title?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Update: {
          author_id?: string
          category?: Database["public"]["Enums"]["post_category"]
          comment_count?: number
          content?: string
          created_at?: string
          group_id?: string | null
          id?: string
          is_deleted?: boolean
          like_count?: number
          school_id?: string | null
          title?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["post_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "feed_posts_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "feed_posts_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      group_members: {
        Row: {
          group_id: string
          id: string
          joined_at: string
          role: Database["public"]["Enums"]["group_member_role"]
          user_id: string
        }
        Insert: {
          group_id: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["group_member_role"]
          user_id: string
        }
        Update: {
          group_id?: string
          id?: string
          joined_at?: string
          role?: Database["public"]["Enums"]["group_member_role"]
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "group_members_group_id_fkey"
            columns: ["group_id"]
            isOneToOne: false
            referencedRelation: "groups"
            referencedColumns: ["id"]
          },
        ]
      }
      groups: {
        Row: {
          category: Database["public"]["Enums"]["group_category"]
          created_at: string
          creator_id: string
          description: string | null
          id: string
          image_url: string | null
          is_active: boolean
          member_count: number
          name: string
          school_id: string | null
          school_name: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["group_visibility"]
        }
        Insert: {
          category?: Database["public"]["Enums"]["group_category"]
          created_at?: string
          creator_id: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          member_count?: number
          name: string
          school_id?: string | null
          school_name?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["group_visibility"]
        }
        Update: {
          category?: Database["public"]["Enums"]["group_category"]
          created_at?: string
          creator_id?: string
          description?: string | null
          id?: string
          image_url?: string | null
          is_active?: boolean
          member_count?: number
          name?: string
          school_id?: string | null
          school_name?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["group_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "groups_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
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
          expires_at: string | null
          id: string
          is_deleted: boolean
          read_at: string | null
          sender_id: string
          status: string
          updated_at: string
        }
        Insert: {
          content: string
          conversation_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_deleted?: boolean
          read_at?: string | null
          sender_id: string
          status?: string
          updated_at?: string
        }
        Update: {
          content?: string
          conversation_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          is_deleted?: boolean
          read_at?: string | null
          sender_id?: string
          status?: string
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
      moderation_actions: {
        Row: {
          action: Database["public"]["Enums"]["moderation_action_type"]
          created_at: string
          id: string
          metadata: Json | null
          moderator_id: string
          reason: string | null
          report_id: string | null
          target_user_id: string | null
        }
        Insert: {
          action: Database["public"]["Enums"]["moderation_action_type"]
          created_at?: string
          id?: string
          metadata?: Json | null
          moderator_id: string
          reason?: string | null
          report_id?: string | null
          target_user_id?: string | null
        }
        Update: {
          action?: Database["public"]["Enums"]["moderation_action_type"]
          created_at?: string
          id?: string
          metadata?: Json | null
          moderator_id?: string
          reason?: string | null
          report_id?: string | null
          target_user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "moderation_actions_report_id_fkey"
            columns: ["report_id"]
            isOneToOne: false
            referencedRelation: "reports"
            referencedColumns: ["id"]
          },
        ]
      }
      places: {
        Row: {
          address: string | null
          category: string | null
          created_at: string
          creator_id: string
          description: string | null
          google_maps_url: string | null
          id: string
          image_url: string | null
          is_deleted: boolean
          latitude: number | null
          longitude: number | null
          moderation_status: Database["public"]["Enums"]["moderation_status"]
          name: string
          school_id: string | null
          school_name: string | null
          updated_at: string
          visibility: Database["public"]["Enums"]["entity_visibility"]
        }
        Insert: {
          address?: string | null
          category?: string | null
          created_at?: string
          creator_id: string
          description?: string | null
          google_maps_url?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          latitude?: number | null
          longitude?: number | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          name: string
          school_id?: string | null
          school_name?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["entity_visibility"]
        }
        Update: {
          address?: string | null
          category?: string | null
          created_at?: string
          creator_id?: string
          description?: string | null
          google_maps_url?: string | null
          id?: string
          image_url?: string | null
          is_deleted?: boolean
          latitude?: number | null
          longitude?: number | null
          moderation_status?: Database["public"]["Enums"]["moderation_status"]
          name?: string
          school_id?: string | null
          school_name?: string | null
          updated_at?: string
          visibility?: Database["public"]["Enums"]["entity_visibility"]
        }
        Relationships: [
          {
            foreignKeyName: "places_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      post_comments: {
        Row: {
          body: string
          created_at: string
          id: string
          like_count: number
          parent_id: string | null
          post_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          body: string
          created_at?: string
          id?: string
          like_count?: number
          parent_id?: string | null
          post_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          body?: string
          created_at?: string
          id?: string
          like_count?: number
          parent_id?: string | null
          post_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "post_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "post_comments"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          aspirational_school: string | null
          associate_degree_major: string[] | null
          avatar_url: string | null
          bio: string | null
          college_major: string[] | null
          created_at: string
          degree: string | null
          display_name: string | null
          education_status: string | null
          email: string | null
          extracurriculars: string[] | null
          grade_or_year: string | null
          graduation_year: number | null
          guidelines_accepted_at: string | null
          high_school_pursuing_associates: boolean | null
          id: string
          intended_major: string[] | null
          interests: string[] | null
          is_high_school: boolean | null
          is_premium: boolean
          major: string | null
          onboarding_completed: boolean | null
          referral_source: string | null
          referral_source_other: string | null
          school_name: string | null
          school_type: string | null
          student_level: string | null
          subscription_ends_at: string | null
          undergraduate_degree_type: string | null
          updated_at: string
          username: string | null
          verification_status: string
          verified_at: string | null
          verified_email: string | null
          verified_school_id: string | null
        }
        Insert: {
          aspirational_school?: string | null
          associate_degree_major?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          college_major?: string[] | null
          created_at?: string
          degree?: string | null
          display_name?: string | null
          education_status?: string | null
          email?: string | null
          extracurriculars?: string[] | null
          grade_or_year?: string | null
          graduation_year?: number | null
          guidelines_accepted_at?: string | null
          high_school_pursuing_associates?: boolean | null
          id: string
          intended_major?: string[] | null
          interests?: string[] | null
          is_high_school?: boolean | null
          is_premium?: boolean
          major?: string | null
          onboarding_completed?: boolean | null
          referral_source?: string | null
          referral_source_other?: string | null
          school_name?: string | null
          school_type?: string | null
          student_level?: string | null
          subscription_ends_at?: string | null
          undergraduate_degree_type?: string | null
          updated_at?: string
          username?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_email?: string | null
          verified_school_id?: string | null
        }
        Update: {
          aspirational_school?: string | null
          associate_degree_major?: string[] | null
          avatar_url?: string | null
          bio?: string | null
          college_major?: string[] | null
          created_at?: string
          degree?: string | null
          display_name?: string | null
          education_status?: string | null
          email?: string | null
          extracurriculars?: string[] | null
          grade_or_year?: string | null
          graduation_year?: number | null
          guidelines_accepted_at?: string | null
          high_school_pursuing_associates?: boolean | null
          id?: string
          intended_major?: string[] | null
          interests?: string[] | null
          is_high_school?: boolean | null
          is_premium?: boolean
          major?: string | null
          onboarding_completed?: boolean | null
          referral_source?: string | null
          referral_source_other?: string | null
          school_name?: string | null
          school_type?: string | null
          student_level?: string | null
          subscription_ends_at?: string | null
          undergraduate_degree_type?: string | null
          updated_at?: string
          username?: string | null
          verification_status?: string
          verified_at?: string | null
          verified_email?: string | null
          verified_school_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "profiles_verified_school_id_fkey"
            columns: ["verified_school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      reports: {
        Row: {
          created_at: string
          details: string | null
          id: string
          moderator_id: string | null
          moderator_notes: string | null
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          resolved_at: string | null
          status: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_owner_id: string | null
          target_type: Database["public"]["Enums"]["report_target_type"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          details?: string | null
          id?: string
          moderator_id?: string | null
          moderator_notes?: string | null
          reason: Database["public"]["Enums"]["report_reason"]
          reporter_id: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id: string
          target_owner_id?: string | null
          target_type: Database["public"]["Enums"]["report_target_type"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          details?: string | null
          id?: string
          moderator_id?: string | null
          moderator_notes?: string | null
          reason?: Database["public"]["Enums"]["report_reason"]
          reporter_id?: string
          resolved_at?: string | null
          status?: Database["public"]["Enums"]["report_status"]
          target_id?: string
          target_owner_id?: string | null
          target_type?: Database["public"]["Enums"]["report_target_type"]
          updated_at?: string
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
          demographics: Json | null
          description_year: number | null
          enrichment_error: string | null
          enrichment_status: string | null
          enrollment: number | null
          founded_year: number | null
          graduation_rate: number | null
          id: string
          ipeds_id: string | null
          last_enrichment_attempt: string | null
          locale: string | null
          logo_url: string | null
          national_ranking: number | null
          nces_id: string | null
          ownership_type: string | null
          programs_count: number | null
          ranking: string | null
          ranking_source: string | null
          religious_affiliation: string | null
          school_id: string
          school_subtype: string | null
          scorecard_id: number | null
          selectivity_tier: string | null
          source_name: string | null
          source_retrieved_at: string | null
          source_url: string | null
          state_ranking: number | null
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
          demographics?: Json | null
          description_year?: number | null
          enrichment_error?: string | null
          enrichment_status?: string | null
          enrollment?: number | null
          founded_year?: number | null
          graduation_rate?: number | null
          id?: string
          ipeds_id?: string | null
          last_enrichment_attempt?: string | null
          locale?: string | null
          logo_url?: string | null
          national_ranking?: number | null
          nces_id?: string | null
          ownership_type?: string | null
          programs_count?: number | null
          ranking?: string | null
          ranking_source?: string | null
          religious_affiliation?: string | null
          school_id: string
          school_subtype?: string | null
          scorecard_id?: number | null
          selectivity_tier?: string | null
          source_name?: string | null
          source_retrieved_at?: string | null
          source_url?: string | null
          state_ranking?: number | null
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
          demographics?: Json | null
          description_year?: number | null
          enrichment_error?: string | null
          enrichment_status?: string | null
          enrollment?: number | null
          founded_year?: number | null
          graduation_rate?: number | null
          id?: string
          ipeds_id?: string | null
          last_enrichment_attempt?: string | null
          locale?: string | null
          logo_url?: string | null
          national_ranking?: number | null
          nces_id?: string | null
          ownership_type?: string | null
          programs_count?: number | null
          ranking?: string | null
          ranking_source?: string | null
          religious_affiliation?: string | null
          school_id?: string
          school_subtype?: string | null
          scorecard_id?: number | null
          selectivity_tier?: string | null
          source_name?: string | null
          source_retrieved_at?: string | null
          source_url?: string | null
          state_ranking?: number | null
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
          domains: string[] | null
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
          domains?: string[] | null
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
          domains?: string[] | null
          id?: string
          is_notable?: boolean
          name?: string
          state?: string | null
          type?: string
        }
        Relationships: []
      }
      student_verification_codes: {
        Row: {
          attempts: number
          code_hash: string
          consumed_at: string | null
          created_at: string
          email: string
          expires_at: string
          id: string
          school_id: string | null
          user_id: string
        }
        Insert: {
          attempts?: number
          code_hash: string
          consumed_at?: string | null
          created_at?: string
          email: string
          expires_at: string
          id?: string
          school_id?: string | null
          user_id: string
        }
        Update: {
          attempts?: number
          code_hash?: string
          consumed_at?: string | null
          created_at?: string
          email?: string
          expires_at?: string
          id?: string
          school_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "student_verification_codes_school_id_fkey"
            columns: ["school_id"]
            isOneToOne: false
            referencedRelation: "schools"
            referencedColumns: ["id"]
          },
        ]
      }
      user_blocks: {
        Row: {
          blocked_id: string
          blocker_id: string
          created_at: string
          id: string
        }
        Insert: {
          blocked_id: string
          blocker_id: string
          created_at?: string
          id?: string
        }
        Update: {
          blocked_id?: string
          blocker_id?: string
          created_at?: string
          id?: string
        }
        Relationships: []
      }
      user_mutes: {
        Row: {
          created_at: string
          id: string
          muted_id: string
          muter_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          muted_id: string
          muter_id: string
        }
        Update: {
          created_at?: string
          id?: string
          muted_id?: string
          muter_id?: string
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
      user_suspensions: {
        Row: {
          created_at: string
          expires_at: string | null
          id: string
          is_permanent: boolean
          lifted_at: string | null
          lifted_by: string | null
          moderator_id: string
          reason: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_permanent?: boolean
          lifted_at?: string | null
          lifted_by?: string | null
          moderator_id: string
          reason: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          expires_at?: string | null
          id?: string
          is_permanent?: boolean
          lifted_at?: string | null
          lifted_by?: string | null
          moderator_id?: string
          reason?: string
          updated_at?: string
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
          degree: string | null
          display_name: string | null
          grade_or_year: string | null
          graduation_year: number | null
          id: string | null
          interests: string[] | null
          is_high_school: boolean | null
          major: string | null
          onboarding_completed: boolean | null
          school_name: string | null
          school_type: string | null
          student_level: string | null
          updated_at: string | null
          username: string | null
          verification_status: string | null
          verified_at: string | null
        }
        Insert: {
          aspirational_school?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          degree?: string | null
          display_name?: string | null
          grade_or_year?: string | null
          graduation_year?: number | null
          id?: string | null
          interests?: string[] | null
          is_high_school?: boolean | null
          major?: string | null
          onboarding_completed?: boolean | null
          school_name?: string | null
          school_type?: string | null
          student_level?: string | null
          updated_at?: string | null
          username?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Update: {
          aspirational_school?: string | null
          avatar_url?: string | null
          bio?: string | null
          created_at?: string | null
          degree?: string | null
          display_name?: string | null
          grade_or_year?: string | null
          graduation_year?: number | null
          id?: string | null
          interests?: string[] | null
          is_high_school?: boolean | null
          major?: string | null
          onboarding_completed?: boolean | null
          school_name?: string | null
          school_type?: string | null
          student_level?: string | null
          updated_at?: string | null
          username?: string | null
          verification_status?: string | null
          verified_at?: string | null
        }
        Relationships: []
      }
    }
    Functions: {
      create_direct_conversation: {
        Args: { other_user_id: string }
        Returns: string
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_user_suspended: { Args: { _user_id: string }; Returns: boolean }
      mark_conversation_read: {
        Args: { _conversation_id: string }
        Returns: undefined
      }
      purge_expired_messages: { Args: never; Returns: number }
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
      set_conversation_expiration: {
        Args: {
          _apply_to_existing?: boolean
          _conversation_id: string
          _expiration_seconds: number
        }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user"
      entity_visibility: "public" | "school_only" | "private"
      event_location_type: "physical" | "virtual" | "hybrid"
      group_category:
        | "academic"
        | "career"
        | "social"
        | "sports"
        | "arts"
        | "volunteering"
        | "research"
        | "gaming"
        | "entrepreneurship"
        | "other"
      group_member_role: "owner" | "admin" | "member"
      group_visibility: "public" | "school_only" | "invite_only"
      moderation_action_type:
        | "dismiss"
        | "warn"
        | "suspend"
        | "ban"
        | "unban"
        | "unsuspend"
        | "escalate"
        | "note"
      moderation_status: "pending" | "approved" | "flagged" | "removed"
      post_category:
        | "general"
        | "question"
        | "advice"
        | "event"
        | "opportunity"
        | "announcement"
      post_visibility: "public" | "school_only" | "connections"
      report_reason:
        | "harassment"
        | "bullying"
        | "hate_speech"
        | "spam"
        | "impersonation"
        | "threats"
        | "sexual_content"
        | "violence"
        | "illegal_activity"
        | "self_harm"
        | "scam_fraud"
        | "misinformation"
        | "other"
      report_status: "pending" | "under_review" | "action_taken" | "dismissed"
      report_target_type:
        | "post"
        | "thread"
        | "comment"
        | "message"
        | "group_message"
        | "image"
        | "profile"
        | "group"
        | "conversation"
        | "event"
        | "place"
      rsvp_status: "going" | "cancelled" | "waitlist"
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
      entity_visibility: ["public", "school_only", "private"],
      event_location_type: ["physical", "virtual", "hybrid"],
      group_category: [
        "academic",
        "career",
        "social",
        "sports",
        "arts",
        "volunteering",
        "research",
        "gaming",
        "entrepreneurship",
        "other",
      ],
      group_member_role: ["owner", "admin", "member"],
      group_visibility: ["public", "school_only", "invite_only"],
      moderation_action_type: [
        "dismiss",
        "warn",
        "suspend",
        "ban",
        "unban",
        "unsuspend",
        "escalate",
        "note",
      ],
      moderation_status: ["pending", "approved", "flagged", "removed"],
      post_category: [
        "general",
        "question",
        "advice",
        "event",
        "opportunity",
        "announcement",
      ],
      post_visibility: ["public", "school_only", "connections"],
      report_reason: [
        "harassment",
        "bullying",
        "hate_speech",
        "spam",
        "impersonation",
        "threats",
        "sexual_content",
        "violence",
        "illegal_activity",
        "self_harm",
        "scam_fraud",
        "misinformation",
        "other",
      ],
      report_status: ["pending", "under_review", "action_taken", "dismissed"],
      report_target_type: [
        "post",
        "thread",
        "comment",
        "message",
        "group_message",
        "image",
        "profile",
        "group",
        "conversation",
        "event",
        "place",
      ],
      rsvp_status: ["going", "cancelled", "waitlist"],
    },
  },
} as const
