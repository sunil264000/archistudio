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
      abandoned_carts: {
        Row: {
          amount: number
          course_slug: string
          course_title: string | null
          created_at: string
          customer_email: string | null
          customer_name: string | null
          email_sent: boolean
          id: string
          recovered: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          course_slug: string
          course_title?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          email_sent?: boolean
          id?: string
          recovered?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          course_slug?: string
          course_title?: string | null
          created_at?: string
          customer_email?: string | null
          customer_name?: string | null
          email_sent?: boolean
          id?: string
          recovered?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      achievements: {
        Row: {
          category: string
          created_at: string
          description: string | null
          icon: string | null
          id: string
          key: string
          points: number
          title: string
        }
        Insert: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          key: string
          points?: number
          title: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string | null
          icon?: string | null
          id?: string
          key?: string
          points?: number
          title?: string
        }
        Relationships: []
      }
      activity_feed: {
        Row: {
          action: string
          created_at: string | null
          id: string
          metadata: Json | null
          target_id: string | null
          target_title: string | null
          target_type: string | null
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_title?: string | null
          target_type?: string | null
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string | null
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_title?: string | null
          target_type?: string | null
          user_id?: string
        }
        Relationships: []
      }
      activity_history: {
        Row: {
          activity_type: string
          course_id: string | null
          created_at: string
          duration_seconds: number | null
          ended_at: string | null
          id: string
          lesson_id: string | null
          metadata: Json | null
          page_url: string | null
          session_id: string | null
          started_at: string
          user_id: string | null
        }
        Insert: {
          activity_type: string
          course_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          lesson_id?: string | null
          metadata?: Json | null
          page_url?: string | null
          session_id?: string | null
          started_at: string
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          course_id?: string | null
          created_at?: string
          duration_seconds?: number | null
          ended_at?: string | null
          id?: string
          lesson_id?: string | null
          metadata?: Json | null
          page_url?: string | null
          session_id?: string | null
          started_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_history_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "activity_history_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      admin_purchase_digest: {
        Row: {
          amount: number
          buyer_email: string
          buyer_name: string | null
          created_at: string
          digest_sent: boolean
          id: string
          item_name: string
          item_type: string
          order_id: string | null
        }
        Insert: {
          amount?: number
          buyer_email: string
          buyer_name?: string | null
          created_at?: string
          digest_sent?: boolean
          id?: string
          item_name: string
          item_type?: string
          order_id?: string | null
        }
        Update: {
          amount?: number
          buyer_email?: string
          buyer_name?: string | null
          created_at?: string
          digest_sent?: boolean
          id?: string
          item_name?: string
          item_type?: string
          order_id?: string | null
        }
        Relationships: []
      }
      ai_chat_history: {
        Row: {
          ai_response: string
          course_id: string | null
          created_at: string | null
          id: string
          user_id: string
          user_message: string
        }
        Insert: {
          ai_response: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          user_id: string
          user_message: string
        }
        Update: {
          ai_response?: string
          course_id?: string | null
          created_at?: string | null
          id?: string
          user_id?: string
          user_message?: string
        }
        Relationships: [
          {
            foreignKeyName: "ai_chat_history_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      analytics_events: {
        Row: {
          created_at: string | null
          event_data: Json | null
          event_type: string
          id: string
          page_url: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          event_data?: Json | null
          event_type: string
          id?: string
          page_url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          event_data?: Json | null
          event_type?: string
          id?: string
          page_url?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: []
      }
      blog_posts: {
        Row: {
          author_id: string | null
          content: string
          created_at: string | null
          excerpt: string | null
          featured_image_url: string | null
          id: string
          is_published: boolean | null
          meta_description: string | null
          meta_title: string | null
          published_at: string | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          author_id?: string | null
          content: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          author_id?: string | null
          content?: string
          created_at?: string | null
          excerpt?: string | null
          featured_image_url?: string | null
          id?: string
          is_published?: boolean | null
          meta_description?: string | null
          meta_title?: string | null
          published_at?: string | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      bookmarks: {
        Row: {
          created_at: string | null
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookmarks_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      case_studies: {
        Row: {
          architect: string
          brief: string
          created_at: string | null
          id: string
          image_url: string | null
          is_published: boolean | null
          location: string
          order_index: number | null
          tags: string[] | null
          title: string
          type: string
          updated_at: string | null
          year: string
        }
        Insert: {
          architect: string
          brief: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location: string
          order_index?: number | null
          tags?: string[] | null
          title: string
          type: string
          updated_at?: string | null
          year: string
        }
        Update: {
          architect?: string
          brief?: string
          created_at?: string | null
          id?: string
          image_url?: string | null
          is_published?: boolean | null
          location?: string
          order_index?: number | null
          tags?: string[] | null
          title?: string
          type?: string
          updated_at?: string | null
          year?: string
        }
        Relationships: []
      }
      cashfree_webhook_events: {
        Row: {
          contract_id: string | null
          event_type: string
          id: string
          order_id: string | null
          processed: boolean
          processing_error: string | null
          raw_payload: Json
          received_at: string
          signature_valid: boolean
        }
        Insert: {
          contract_id?: string | null
          event_type: string
          id?: string
          order_id?: string | null
          processed?: boolean
          processing_error?: string | null
          raw_payload: Json
          received_at?: string
          signature_valid?: boolean
        }
        Update: {
          contract_id?: string | null
          event_type?: string
          id?: string
          order_id?: string | null
          processed?: boolean
          processing_error?: string | null
          raw_payload?: Json
          received_at?: string
          signature_valid?: boolean
        }
        Relationships: []
      }
      certificate_settings: {
        Row: {
          accent_color: string | null
          background_color: string | null
          body_text_color: string | null
          border_style: string | null
          font_family: string | null
          id: string
          institution_name: string | null
          institution_tagline: string | null
          logo_url: string | null
          primary_color: string | null
          show_border: boolean | null
          signature_name: string | null
          signature_title: string | null
          tagline_color: string | null
          title_color: string | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          accent_color?: string | null
          background_color?: string | null
          body_text_color?: string | null
          border_style?: string | null
          font_family?: string | null
          id?: string
          institution_name?: string | null
          institution_tagline?: string | null
          logo_url?: string | null
          primary_color?: string | null
          show_border?: boolean | null
          signature_name?: string | null
          signature_title?: string | null
          tagline_color?: string | null
          title_color?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          accent_color?: string | null
          background_color?: string | null
          body_text_color?: string | null
          border_style?: string | null
          font_family?: string | null
          id?: string
          institution_name?: string | null
          institution_tagline?: string | null
          logo_url?: string | null
          primary_color?: string | null
          show_border?: boolean | null
          signature_name?: string | null
          signature_title?: string | null
          tagline_color?: string | null
          title_color?: string | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      certificates: {
        Row: {
          certificate_number: string
          course_id: string
          id: string
          issued_at: string | null
          pdf_url: string | null
          user_id: string
        }
        Insert: {
          certificate_number: string
          course_id: string
          id?: string
          issued_at?: string | null
          pdf_url?: string | null
          user_id: string
        }
        Update: {
          certificate_number?: string
          course_id?: string
          id?: string
          issued_at?: string | null
          pdf_url?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "certificates_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_submissions: {
        Row: {
          caption: string | null
          challenge_id: string
          created_at: string
          id: string
          image_url: string
          user_id: string
          vote_count: number | null
        }
        Insert: {
          caption?: string | null
          challenge_id: string
          created_at?: string
          id?: string
          image_url: string
          user_id: string
          vote_count?: number | null
        }
        Update: {
          caption?: string | null
          challenge_id?: string
          created_at?: string
          id?: string
          image_url?: string
          user_id?: string
          vote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "challenge_submissions_challenge_id_fkey"
            columns: ["challenge_id"]
            isOneToOne: false
            referencedRelation: "daily_challenges"
            referencedColumns: ["id"]
          },
        ]
      }
      challenge_votes: {
        Row: {
          created_at: string
          id: string
          submission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          submission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          submission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "challenge_votes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "challenge_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      community_feed: {
        Row: {
          action: string
          created_at: string
          id: string
          metadata: Json | null
          target_id: string | null
          target_title: string | null
          target_type: string
          user_id: string
        }
        Insert: {
          action: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_title?: string | null
          target_type: string
          user_id: string
        }
        Update: {
          action?: string
          created_at?: string
          id?: string
          metadata?: Json | null
          target_id?: string | null
          target_title?: string | null
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      competition_submissions: {
        Row: {
          competition_id: string
          created_at: string
          description: string | null
          id: string
          image_url: string
          title: string
          user_id: string
          vote_count: number | null
        }
        Insert: {
          competition_id: string
          created_at?: string
          description?: string | null
          id?: string
          image_url: string
          title: string
          user_id: string
          vote_count?: number | null
        }
        Update: {
          competition_id?: string
          created_at?: string
          description?: string | null
          id?: string
          image_url?: string
          title?: string
          user_id?: string
          vote_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "competition_submissions_competition_id_fkey"
            columns: ["competition_id"]
            isOneToOne: false
            referencedRelation: "competitions"
            referencedColumns: ["id"]
          },
        ]
      }
      competition_votes: {
        Row: {
          created_at: string
          id: string
          submission_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          submission_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          submission_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "competition_votes_submission_id_fkey"
            columns: ["submission_id"]
            isOneToOne: false
            referencedRelation: "competition_submissions"
            referencedColumns: ["id"]
          },
        ]
      }
      competitions: {
        Row: {
          brief: string | null
          cover_image_url: string | null
          created_at: string
          description: string
          end_date: string
          id: string
          is_active: boolean | null
          prize_description: string | null
          start_date: string
          submission_count: number | null
          title: string
        }
        Insert: {
          brief?: string | null
          cover_image_url?: string | null
          created_at?: string
          description: string
          end_date: string
          id?: string
          is_active?: boolean | null
          prize_description?: string | null
          start_date?: string
          submission_count?: number | null
          title: string
        }
        Update: {
          brief?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string
          end_date?: string
          id?: string
          is_active?: boolean | null
          prize_description?: string | null
          start_date?: string
          submission_count?: number | null
          title?: string
        }
        Relationships: []
      }
      contact_messages: {
        Row: {
          created_at: string
          email: string
          id: string
          is_read: boolean
          message: string
          name: string
          phone: string | null
          subject: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          is_read?: boolean
          message: string
          name: string
          phone?: string | null
          subject: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          is_read?: boolean
          message?: string
          name?: string
          phone?: string | null
          subject?: string
        }
        Relationships: []
      }
      coupons: {
        Row: {
          applicable_course_id: string | null
          code: string
          created_at: string | null
          description: string | null
          discount_type: string | null
          discount_value: number
          id: string
          is_active: boolean | null
          max_uses: number | null
          min_purchase_amount: number | null
          used_count: number | null
          valid_from: string | null
          valid_until: string | null
        }
        Insert: {
          applicable_course_id?: string | null
          code: string
          created_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Update: {
          applicable_course_id?: string | null
          code?: string
          created_at?: string | null
          description?: string | null
          discount_type?: string | null
          discount_value?: number
          id?: string
          is_active?: boolean | null
          max_uses?: number | null
          min_purchase_amount?: number | null
          used_count?: number | null
          valid_from?: string | null
          valid_until?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "coupons_applicable_course_id_fkey"
            columns: ["applicable_course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_bundles: {
        Row: {
          created_at: string | null
          description: string | null
          discount_percentage: number | null
          id: string
          is_active: boolean | null
          name: string
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          name: string
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          description?: string | null
          discount_percentage?: number | null
          id?: string
          is_active?: boolean | null
          name?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      course_categories: {
        Row: {
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          name: string
        }
        Insert: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id: string
          name: string
        }
        Update: {
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          name?: string
        }
        Relationships: []
      }
      course_ebook_links: {
        Row: {
          course_id: string
          created_at: string
          created_by: string | null
          ebook_id: string
          id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          created_by?: string | null
          ebook_id: string
          id?: string
        }
        Update: {
          course_id?: string
          created_at?: string
          created_by?: string | null
          ebook_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_ebook_links_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "course_ebook_links_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      course_emi_settings: {
        Row: {
          course_id: string
          created_at: string | null
          early_payment_discount_percent: number | null
          emi_surcharge_percent: number | null
          id: string
          is_emi_enabled: boolean | null
          max_splits: number | null
          min_first_payment_percent: number | null
          payment_tiers: Json | null
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          early_payment_discount_percent?: number | null
          emi_surcharge_percent?: number | null
          id?: string
          is_emi_enabled?: boolean | null
          max_splits?: number | null
          min_first_payment_percent?: number | null
          payment_tiers?: Json | null
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          early_payment_discount_percent?: number | null
          emi_surcharge_percent?: number | null
          id?: string
          is_emi_enabled?: boolean | null
          max_splits?: number | null
          min_first_payment_percent?: number | null
          payment_tiers?: Json | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "course_emi_settings_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      course_questions: {
        Row: {
          answer: string | null
          answered_at: string | null
          answered_by: string | null
          course_id: string
          created_at: string | null
          id: string
          is_public: boolean | null
          question: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          course_id: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          question: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          answer?: string | null
          answered_at?: string | null
          answered_by?: string | null
          course_id?: string
          created_at?: string | null
          id?: string
          is_public?: boolean | null
          question?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "course_questions_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      courses: {
        Row: {
          bundle_id: string | null
          category_id: string | null
          created_at: string | null
          description: string | null
          duration_hours: number | null
          id: string
          is_featured: boolean | null
          is_highlighted: boolean | null
          is_published: boolean | null
          is_subscription_only: boolean | null
          level: string | null
          order_index: number | null
          preview_video_url: string | null
          price_inr: number | null
          price_usd: number | null
          short_description: string | null
          slug: string
          subcategory: string | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          total_lessons: number | null
          updated_at: string | null
        }
        Insert: {
          bundle_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_featured?: boolean | null
          is_highlighted?: boolean | null
          is_published?: boolean | null
          is_subscription_only?: boolean | null
          level?: string | null
          order_index?: number | null
          preview_video_url?: string | null
          price_inr?: number | null
          price_usd?: number | null
          short_description?: string | null
          slug: string
          subcategory?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          total_lessons?: number | null
          updated_at?: string | null
        }
        Update: {
          bundle_id?: string | null
          category_id?: string | null
          created_at?: string | null
          description?: string | null
          duration_hours?: number | null
          id?: string
          is_featured?: boolean | null
          is_highlighted?: boolean | null
          is_published?: boolean | null
          is_subscription_only?: boolean | null
          level?: string | null
          order_index?: number | null
          preview_video_url?: string | null
          price_inr?: number | null
          price_usd?: number | null
          short_description?: string | null
          slug?: string
          subcategory?: string | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          total_lessons?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "courses_bundle_id_fkey"
            columns: ["bundle_id"]
            isOneToOne: false
            referencedRelation: "course_bundles"
            referencedColumns: ["id"]
          },
        ]
      }
      daily_challenges: {
        Row: {
          active_date: string
          brief: string
          category: string | null
          created_at: string
          created_by: string | null
          difficulty: string | null
          id: string
          is_active: boolean | null
          submission_count: number | null
          title: string
        }
        Insert: {
          active_date?: string
          brief: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          submission_count?: number | null
          title: string
        }
        Update: {
          active_date?: string
          brief?: string
          category?: string | null
          created_at?: string
          created_by?: string | null
          difficulty?: string | null
          id?: string
          is_active?: boolean | null
          submission_count?: number | null
          title?: string
        }
        Relationships: []
      }
      download_requests: {
        Row: {
          admin_note: string | null
          created_at: string
          download_granted: boolean | null
          ebook_id: string
          id: string
          payment_order_id: string | null
          payment_verified: boolean | null
          price_set: number | null
          reason: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          admin_note?: string | null
          created_at?: string
          download_granted?: boolean | null
          ebook_id: string
          id?: string
          payment_order_id?: string | null
          payment_verified?: boolean | null
          price_set?: number | null
          reason: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          admin_note?: string | null
          created_at?: string
          download_granted?: boolean | null
          ebook_id?: string
          id?: string
          payment_order_id?: string | null
          payment_verified?: boolean | null
          price_set?: number | null
          reason?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "download_requests_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      ebook_pricing_settings: {
        Row: {
          full_bundle_price: number
          id: string
          tier_1_max_books: number
          tier_1_price: number
          tier_2_max_books: number
          tier_2_price: number
          tier_3_max_books: number
          tier_3_price: number
          tier_4_price: number
          updated_at: string
          updated_by: string | null
        }
        Insert: {
          full_bundle_price?: number
          id?: string
          tier_1_max_books?: number
          tier_1_price?: number
          tier_2_max_books?: number
          tier_2_price?: number
          tier_3_max_books?: number
          tier_3_price?: number
          tier_4_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Update: {
          full_bundle_price?: number
          id?: string
          tier_1_max_books?: number
          tier_1_price?: number
          tier_2_max_books?: number
          tier_2_price?: number
          tier_3_max_books?: number
          tier_3_price?: number
          tier_4_price?: number
          updated_at?: string
          updated_by?: string | null
        }
        Relationships: []
      }
      ebook_purchases: {
        Row: {
          created_at: string
          discount_applied: number | null
          ebook_ids: string[]
          id: string
          is_full_bundle: boolean | null
          payment_id: string | null
          status: string | null
          total_amount: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          discount_applied?: number | null
          ebook_ids: string[]
          id?: string
          is_full_bundle?: boolean | null
          payment_id?: string | null
          status?: string | null
          total_amount: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          discount_applied?: number | null
          ebook_ids?: string[]
          id?: string
          is_full_bundle?: boolean | null
          payment_id?: string | null
          status?: string | null
          total_amount?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      ebooks: {
        Row: {
          category: string
          cover_image_url: string | null
          created_at: string
          description: string | null
          drive_file_id: string | null
          drive_folder_url: string | null
          file_url: string | null
          id: string
          is_published: boolean | null
          order_index: number | null
          preview_generated_at: string | null
          preview_url: string | null
          price_single: number
          title: string
          updated_at: string
        }
        Insert: {
          category: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          drive_file_id?: string | null
          drive_folder_url?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          preview_generated_at?: string | null
          preview_url?: string | null
          price_single?: number
          title: string
          updated_at?: string
        }
        Update: {
          category?: string
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          drive_file_id?: string | null
          drive_folder_url?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          preview_generated_at?: string | null
          preview_url?: string | null
          price_single?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      email_logs: {
        Row: {
          created_at: string
          email_type: string
          error_message: string | null
          id: string
          metadata: Json | null
          recipient_email: string
          recipient_name: string | null
          sent_at: string
          status: string
          subject: string
        }
        Insert: {
          created_at?: string
          email_type: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string
          status?: string
          subject: string
        }
        Update: {
          created_at?: string
          email_type?: string
          error_message?: string | null
          id?: string
          metadata?: Json | null
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string
          status?: string
          subject?: string
        }
        Relationships: []
      }
      emi_payments: {
        Row: {
          amount_paid: number
          course_id: string
          created_at: string | null
          due_date: string | null
          early_discount_applied: number | null
          gateway_order_id: string | null
          id: string
          installment_number: number
          paid_at: string | null
          payment_id: string | null
          remaining_amount: number
          status: string | null
          total_course_price: number
          total_installments: number
          unlocked_percent: number
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount_paid: number
          course_id: string
          created_at?: string | null
          due_date?: string | null
          early_discount_applied?: number | null
          gateway_order_id?: string | null
          id?: string
          installment_number: number
          paid_at?: string | null
          payment_id?: string | null
          remaining_amount: number
          status?: string | null
          total_course_price: number
          total_installments: number
          unlocked_percent: number
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount_paid?: number
          course_id?: string
          created_at?: string | null
          due_date?: string | null
          early_discount_applied?: number | null
          gateway_order_id?: string | null
          id?: string
          installment_number?: number
          paid_at?: string | null
          payment_id?: string | null
          remaining_amount?: number
          status?: string | null
          total_course_price?: number
          total_installments?: number
          unlocked_percent?: number
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "emi_payments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      enrollments: {
        Row: {
          course_id: string
          enrolled_at: string | null
          expires_at: string | null
          granted_at: string | null
          granted_by: string | null
          id: string
          is_manual: boolean | null
          payment_id: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          course_id: string
          enrolled_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_manual?: boolean | null
          payment_id?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          course_id?: string
          enrolled_at?: string | null
          expires_at?: string | null
          granted_at?: string | null
          granted_by?: string | null
          id?: string
          is_manual?: boolean | null
          payment_id?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "enrollments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      feature_flags: {
        Row: {
          description: string | null
          enabled: boolean | null
          flag_key: string
          id: string
          rollout_percentage: number | null
          updated_at: string | null
          updated_by: string | null
        }
        Insert: {
          description?: string | null
          enabled?: boolean | null
          flag_key: string
          id?: string
          rollout_percentage?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Update: {
          description?: string | null
          enabled?: boolean | null
          flag_key?: string
          id?: string
          rollout_percentage?: number | null
          updated_at?: string | null
          updated_by?: string | null
        }
        Relationships: []
      }
      forum_answers: {
        Row: {
          content: string
          created_at: string
          id: string
          is_best_answer: boolean | null
          parent_id: string | null
          topic_id: string
          updated_at: string
          upvote_count: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_best_answer?: boolean | null
          parent_id?: string | null
          topic_id: string
          updated_at?: string
          upvote_count?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_best_answer?: boolean | null
          parent_id?: string | null
          topic_id?: string
          updated_at?: string
          upvote_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "forum_answers_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "forum_answers"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "forum_answers_topic_id_fkey"
            columns: ["topic_id"]
            isOneToOne: false
            referencedRelation: "forum_topics"
            referencedColumns: ["id"]
          },
        ]
      }
      forum_topics: {
        Row: {
          answer_count: number | null
          best_answer_id: string | null
          category: string
          content: string
          created_at: string
          id: string
          is_pinned: boolean | null
          is_resolved: boolean | null
          tags: string[] | null
          title: string
          updated_at: string
          upvote_count: number | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          answer_count?: number | null
          best_answer_id?: string | null
          category?: string
          content: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          tags?: string[] | null
          title: string
          updated_at?: string
          upvote_count?: number | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          answer_count?: number | null
          best_answer_id?: string | null
          category?: string
          content?: string
          created_at?: string
          id?: string
          is_pinned?: boolean | null
          is_resolved?: boolean | null
          tags?: string[] | null
          title?: string
          updated_at?: string
          upvote_count?: number | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: []
      }
      forum_votes: {
        Row: {
          created_at: string
          id: string
          target_id: string
          target_type: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          target_id: string
          target_type: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          target_id?: string
          target_type?: string
          user_id?: string
        }
        Relationships: []
      }
      import_activity_log: {
        Row: {
          action: string
          course_id: string | null
          course_title: string
          created_at: string
          error_message: string | null
          folder_id: string
          folder_name: string
          id: string
          lessons_count: number | null
          modules_count: number | null
          performed_by: string | null
          resources_count: number | null
          status: string | null
        }
        Insert: {
          action?: string
          course_id?: string | null
          course_title: string
          created_at?: string
          error_message?: string | null
          folder_id: string
          folder_name: string
          id?: string
          lessons_count?: number | null
          modules_count?: number | null
          performed_by?: string | null
          resources_count?: number | null
          status?: string | null
        }
        Update: {
          action?: string
          course_id?: string | null
          course_title?: string
          created_at?: string
          error_message?: string | null
          folder_id?: string
          folder_name?: string
          id?: string
          lessons_count?: number | null
          modules_count?: number | null
          performed_by?: string | null
          resources_count?: number | null
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "import_activity_log_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      internship_applications: {
        Row: {
          cover_note: string | null
          created_at: string
          id: string
          internship_id: string
          portfolio_url: string | null
          status: string | null
          user_id: string
        }
        Insert: {
          cover_note?: string | null
          created_at?: string
          id?: string
          internship_id: string
          portfolio_url?: string | null
          status?: string | null
          user_id: string
        }
        Update: {
          cover_note?: string | null
          created_at?: string
          id?: string
          internship_id?: string
          portfolio_url?: string | null
          status?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "internship_applications_internship_id_fkey"
            columns: ["internship_id"]
            isOneToOne: false
            referencedRelation: "internships"
            referencedColumns: ["id"]
          },
        ]
      }
      internships: {
        Row: {
          application_count: number | null
          city: string
          company_name: string
          contact_email: string | null
          created_at: string
          deadline: string | null
          description: string
          id: string
          is_approved: boolean | null
          posted_by: string | null
          requirements: string | null
          role_type: string | null
          stipend: string | null
          title: string
          updated_at: string
          website_url: string | null
        }
        Insert: {
          application_count?: number | null
          city: string
          company_name: string
          contact_email?: string | null
          created_at?: string
          deadline?: string | null
          description: string
          id?: string
          is_approved?: boolean | null
          posted_by?: string | null
          requirements?: string | null
          role_type?: string | null
          stipend?: string | null
          title: string
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          application_count?: number | null
          city?: string
          company_name?: string
          contact_email?: string | null
          created_at?: string
          deadline?: string | null
          description?: string
          id?: string
          is_approved?: boolean | null
          posted_by?: string | null
          requirements?: string | null
          role_type?: string | null
          stipend?: string | null
          title?: string
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      job_proposals: {
        Row: {
          attachments: string[]
          bid_amount: number
          cover_message: string
          created_at: string
          delivery_days: number
          id: string
          job_id: string
          status: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          attachments?: string[]
          bid_amount: number
          cover_message: string
          created_at?: string
          delivery_days: number
          id?: string
          job_id: string
          status?: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          attachments?: string[]
          bid_amount?: number
          cover_message?: string
          created_at?: string
          delivery_days?: number
          id?: string
          job_id?: string
          status?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "job_proposals_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
        ]
      }
      job_queue: {
        Row: {
          attempts: number | null
          completed_at: string | null
          created_at: string | null
          error_message: string | null
          id: string
          job_type: string
          max_attempts: number | null
          payload: Json | null
          priority: number | null
          scheduled_for: string | null
          started_at: string | null
          status: string | null
        }
        Insert: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type: string
          max_attempts?: number | null
          payload?: Json | null
          priority?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string | null
        }
        Update: {
          attempts?: number | null
          completed_at?: string | null
          created_at?: string | null
          error_message?: string | null
          id?: string
          job_type?: string
          max_attempts?: number | null
          payload?: Json | null
          priority?: number | null
          scheduled_for?: string | null
          started_at?: string | null
          status?: string | null
        }
        Relationships: []
      }
      launch_free_courses: {
        Row: {
          auto_enroll_all: boolean | null
          course_id: string
          created_at: string | null
          end_at: string | null
          id: string
          is_active: boolean | null
          name: string | null
          start_at: string
          updated_at: string | null
        }
        Insert: {
          auto_enroll_all?: boolean | null
          course_id: string
          created_at?: string | null
          end_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          start_at: string
          updated_at?: string | null
        }
        Update: {
          auto_enroll_all?: boolean | null
          course_id?: string
          created_at?: string | null
          end_at?: string | null
          id?: string
          is_active?: boolean | null
          name?: string | null
          start_at?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "launch_free_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: true
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_path_courses: {
        Row: {
          course_id: string
          id: string
          order_index: number | null
          path_id: string
        }
        Insert: {
          course_id: string
          id?: string
          order_index?: number | null
          path_id: string
        }
        Update: {
          course_id?: string
          id?: string
          order_index?: number | null
          path_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_path_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_path_courses_path_id_fkey"
            columns: ["path_id"]
            isOneToOne: false
            referencedRelation: "learning_paths"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_paths: {
        Row: {
          color: string | null
          created_at: string | null
          description: string | null
          icon: string | null
          id: string
          is_published: boolean | null
          order_index: number | null
          slug: string
          title: string
          updated_at: string | null
        }
        Insert: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          slug: string
          title: string
          updated_at?: string | null
        }
        Update: {
          color?: string | null
          created_at?: string | null
          description?: string | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          slug?: string
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      learning_track_courses: {
        Row: {
          course_id: string
          id: string
          is_required: boolean | null
          order_index: number | null
          track_id: string
        }
        Insert: {
          course_id: string
          id?: string
          is_required?: boolean | null
          order_index?: number | null
          track_id: string
        }
        Update: {
          course_id?: string
          id?: string
          is_required?: boolean | null
          order_index?: number | null
          track_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "learning_track_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "learning_track_courses_track_id_fkey"
            columns: ["track_id"]
            isOneToOne: false
            referencedRelation: "learning_tracks"
            referencedColumns: ["id"]
          },
        ]
      }
      learning_tracks: {
        Row: {
          color: string | null
          created_at: string
          description: string | null
          estimated_hours: number | null
          icon: string | null
          id: string
          is_published: boolean | null
          order_index: number | null
          slug: string
          title: string
          updated_at: string
        }
        Insert: {
          color?: string | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          slug: string
          title: string
          updated_at?: string
        }
        Update: {
          color?: string | null
          created_at?: string
          description?: string | null
          estimated_hours?: number | null
          icon?: string | null
          id?: string
          is_published?: boolean | null
          order_index?: number | null
          slug?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      lesson_resources: {
        Row: {
          created_at: string | null
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          lesson_id: string
          title: string
        }
        Insert: {
          created_at?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          lesson_id: string
          title: string
        }
        Update: {
          created_at?: string | null
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          lesson_id?: string
          title?: string
        }
        Relationships: [
          {
            foreignKeyName: "lesson_resources_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      lessons: {
        Row: {
          content: string | null
          created_at: string | null
          description: string | null
          duration_minutes: number | null
          id: string
          is_free_preview: boolean | null
          module_id: string
          order_index: number | null
          title: string
          updated_at: string | null
          video_url: string | null
        }
        Insert: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free_preview?: boolean | null
          module_id: string
          order_index?: number | null
          title: string
          updated_at?: string | null
          video_url?: string | null
        }
        Update: {
          content?: string | null
          created_at?: string | null
          description?: string | null
          duration_minutes?: number | null
          id?: string
          is_free_preview?: boolean | null
          module_id?: string
          order_index?: number | null
          title?: string
          updated_at?: string | null
          video_url?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "lessons_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      live_activity: {
        Row: {
          activity_type: string
          course_id: string | null
          created_at: string
          ended_at: string | null
          id: string
          last_ping: string
          lesson_id: string | null
          metadata: Json | null
          page_url: string | null
          session_id: string
          started_at: string
          user_id: string | null
        }
        Insert: {
          activity_type: string
          course_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          last_ping?: string
          lesson_id?: string | null
          metadata?: Json | null
          page_url?: string | null
          session_id: string
          started_at?: string
          user_id?: string | null
        }
        Update: {
          activity_type?: string
          course_id?: string | null
          created_at?: string
          ended_at?: string | null
          id?: string
          last_ping?: string
          lesson_id?: string | null
          metadata?: Json | null
          page_url?: string | null
          session_id?: string
          started_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "live_activity_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "live_activity_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      login_gift_campaign_courses: {
        Row: {
          campaign_id: string
          course_id: string
          created_at: string | null
          id: string
        }
        Insert: {
          campaign_id: string
          course_id: string
          created_at?: string | null
          id?: string
        }
        Update: {
          campaign_id?: string
          course_id?: string
          created_at?: string | null
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_gift_campaign_courses_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "login_gift_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "login_gift_campaign_courses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      login_gift_campaign_ebooks: {
        Row: {
          campaign_id: string
          created_at: string | null
          ebook_id: string
          id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string | null
          ebook_id: string
          id?: string
        }
        Update: {
          campaign_id?: string
          created_at?: string | null
          ebook_id?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_gift_campaign_ebooks_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "login_gift_campaigns"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "login_gift_campaign_ebooks_ebook_id_fkey"
            columns: ["ebook_id"]
            isOneToOne: false
            referencedRelation: "ebooks"
            referencedColumns: ["id"]
          },
        ]
      }
      login_gift_campaigns: {
        Row: {
          access_duration_hours: number | null
          coupon_code: string | null
          created_at: string | null
          cta_text: string | null
          custom_messages: Json | null
          eligible_users: string | null
          end_at: string
          id: string
          is_active: boolean | null
          is_welcome_promotion: boolean | null
          name: string
          random_percent: number | null
          start_at: string
          updated_at: string | null
        }
        Insert: {
          access_duration_hours?: number | null
          coupon_code?: string | null
          created_at?: string | null
          cta_text?: string | null
          custom_messages?: Json | null
          eligible_users?: string | null
          end_at: string
          id?: string
          is_active?: boolean | null
          is_welcome_promotion?: boolean | null
          name: string
          random_percent?: number | null
          start_at: string
          updated_at?: string | null
        }
        Update: {
          access_duration_hours?: number | null
          coupon_code?: string | null
          created_at?: string | null
          cta_text?: string | null
          custom_messages?: Json | null
          eligible_users?: string | null
          end_at?: string
          id?: string
          is_active?: boolean | null
          is_welcome_promotion?: boolean | null
          name?: string
          random_percent?: number | null
          start_at?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      login_gift_claims: {
        Row: {
          campaign_id: string
          claimed_at: string | null
          expires_at: string | null
          id: string
          shown_message: string | null
          user_id: string
        }
        Insert: {
          campaign_id: string
          claimed_at?: string | null
          expires_at?: string | null
          id?: string
          shown_message?: string | null
          user_id: string
        }
        Update: {
          campaign_id?: string
          claimed_at?: string | null
          expires_at?: string | null
          id?: string
          shown_message?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "login_gift_claims_campaign_id_fkey"
            columns: ["campaign_id"]
            isOneToOne: false
            referencedRelation: "login_gift_campaigns"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_contracts: {
        Row: {
          admin_approved_at: string | null
          admin_approved_by: string | null
          admin_notes: string | null
          agreed_amount: number
          cancelled_at: string | null
          client_files: string[]
          client_id: string
          completed_at: string | null
          created_at: string
          currency: string
          delivered_at: string | null
          delivery_days: number
          due_date: string | null
          escrow_total_funded: number
          escrow_total_released: number
          id: string
          job_id: string
          payment_reference: string | null
          payment_status: string
          payout_reference: string | null
          payout_released_at: string | null
          platform_fee_amount: number
          platform_fee_percent: number
          proposal_id: string
          released_to_client_at: string | null
          status: string
          submitted_at: string | null
          updated_at: string
          worker_id: string
          worker_payout: number
          worker_submission: Json | null
        }
        Insert: {
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          admin_notes?: string | null
          agreed_amount: number
          cancelled_at?: string | null
          client_files?: string[]
          client_id: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          delivery_days: number
          due_date?: string | null
          escrow_total_funded?: number
          escrow_total_released?: number
          id?: string
          job_id: string
          payment_reference?: string | null
          payment_status?: string
          payout_reference?: string | null
          payout_released_at?: string | null
          platform_fee_amount: number
          platform_fee_percent?: number
          proposal_id: string
          released_to_client_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          worker_id: string
          worker_payout: number
          worker_submission?: Json | null
        }
        Update: {
          admin_approved_at?: string | null
          admin_approved_by?: string | null
          admin_notes?: string | null
          agreed_amount?: number
          cancelled_at?: string | null
          client_files?: string[]
          client_id?: string
          completed_at?: string | null
          created_at?: string
          currency?: string
          delivered_at?: string | null
          delivery_days?: number
          due_date?: string | null
          escrow_total_funded?: number
          escrow_total_released?: number
          id?: string
          job_id?: string
          payment_reference?: string | null
          payment_status?: string
          payout_reference?: string | null
          payout_released_at?: string | null
          platform_fee_amount?: number
          platform_fee_percent?: number
          proposal_id?: string
          released_to_client_at?: string | null
          status?: string
          submitted_at?: string | null
          updated_at?: string
          worker_id?: string
          worker_payout?: number
          worker_submission?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_contracts_job_id_fkey"
            columns: ["job_id"]
            isOneToOne: false
            referencedRelation: "marketplace_jobs"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_contracts_proposal_id_fkey"
            columns: ["proposal_id"]
            isOneToOne: false
            referencedRelation: "job_proposals"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_deliverables: {
        Row: {
          admin_notes: string | null
          contract_id: string
          created_at: string
          file_urls: string[]
          id: string
          milestone_id: string | null
          notes: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
          updated_at: string
          version: number
          worker_id: string
        }
        Insert: {
          admin_notes?: string | null
          contract_id: string
          created_at?: string
          file_urls?: string[]
          id?: string
          milestone_id?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
          updated_at?: string
          version?: number
          worker_id: string
        }
        Update: {
          admin_notes?: string | null
          contract_id?: string
          created_at?: string
          file_urls?: string[]
          id?: string
          milestone_id?: string | null
          notes?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
          updated_at?: string
          version?: number
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_deliverables_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "marketplace_contracts"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_deliverables_milestone_id_fkey"
            columns: ["milestone_id"]
            isOneToOne: false
            referencedRelation: "marketplace_milestones"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_disputes: {
        Row: {
          contract_id: string
          created_at: string
          description: string | null
          evidence_urls: string[]
          id: string
          opened_by: string
          reason: string
          resolution_notes: string | null
          resolved_at: string | null
          resolved_by: string | null
          status: string
          updated_at: string
        }
        Insert: {
          contract_id: string
          created_at?: string
          description?: string | null
          evidence_urls?: string[]
          id?: string
          opened_by: string
          reason: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Update: {
          contract_id?: string
          created_at?: string
          description?: string | null
          evidence_urls?: string[]
          id?: string
          opened_by?: string
          reason?: string
          resolution_notes?: string | null
          resolved_at?: string | null
          resolved_by?: string | null
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_disputes_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "marketplace_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_jobs: {
        Row: {
          attachments: string[]
          awarded_proposal_id: string | null
          budget_max: number | null
          budget_min: number | null
          budget_type: string
          category: string
          client_id: string
          created_at: string
          currency: string
          deadline: string | null
          description: string
          id: string
          is_demo: boolean
          proposals_count: number
          skills_required: string[]
          status: string
          title: string
          updated_at: string
          views_count: number
          visibility: string
        }
        Insert: {
          attachments?: string[]
          awarded_proposal_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: string
          category: string
          client_id: string
          created_at?: string
          currency?: string
          deadline?: string | null
          description: string
          id?: string
          is_demo?: boolean
          proposals_count?: number
          skills_required?: string[]
          status?: string
          title: string
          updated_at?: string
          views_count?: number
          visibility?: string
        }
        Update: {
          attachments?: string[]
          awarded_proposal_id?: string | null
          budget_max?: number | null
          budget_min?: number | null
          budget_type?: string
          category?: string
          client_id?: string
          created_at?: string
          currency?: string
          deadline?: string | null
          description?: string
          id?: string
          is_demo?: boolean
          proposals_count?: number
          skills_required?: string[]
          status?: string
          title?: string
          updated_at?: string
          views_count?: number
          visibility?: string
        }
        Relationships: []
      }
      marketplace_message_reads: {
        Row: {
          contract_id: string
          id: string
          last_read_at: string
          user_id: string
        }
        Insert: {
          contract_id: string
          id?: string
          last_read_at?: string
          user_id: string
        }
        Update: {
          contract_id?: string
          id?: string
          last_read_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_message_reads_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "marketplace_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_messages: {
        Row: {
          attachments: string[]
          body: string
          contract_id: string
          created_at: string
          id: string
          read_at: string | null
          sender_id: string
        }
        Insert: {
          attachments?: string[]
          body: string
          contract_id: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id: string
        }
        Update: {
          attachments?: string[]
          body?: string
          contract_id?: string
          created_at?: string
          id?: string
          read_at?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_messages_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "marketplace_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_milestones: {
        Row: {
          amount: number
          contract_id: string
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          payout_reference: string | null
          released_amount: number
          released_at: string | null
          released_by: string | null
          sequence: number
          status: string
          title: string
          updated_at: string
        }
        Insert: {
          amount: number
          contract_id: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          payout_reference?: string | null
          released_amount?: number
          released_at?: string | null
          released_by?: string | null
          sequence: number
          status?: string
          title: string
          updated_at?: string
        }
        Update: {
          amount?: number
          contract_id?: string
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          payout_reference?: string | null
          released_amount?: number
          released_at?: string | null
          released_by?: string | null
          sequence?: number
          status?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_milestones_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "marketplace_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_reviews: {
        Row: {
          comment: string | null
          contract_id: string | null
          created_at: string
          direction: string
          id: string
          is_demo: boolean
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Insert: {
          comment?: string | null
          contract_id?: string | null
          created_at?: string
          direction: string
          id?: string
          is_demo?: boolean
          rating: number
          reviewee_id: string
          reviewer_id: string
        }
        Update: {
          comment?: string | null
          contract_id?: string | null
          created_at?: string
          direction?: string
          id?: string
          is_demo?: boolean
          rating?: number
          reviewee_id?: string
          reviewer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_reviews_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "marketplace_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_typing_indicators: {
        Row: {
          contract_id: string
          is_typing: boolean
          updated_at: string
          user_id: string
        }
        Insert: {
          contract_id: string
          is_typing?: boolean
          updated_at?: string
          user_id: string
        }
        Update: {
          contract_id?: string
          is_typing?: boolean
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_typing_indicators_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "marketplace_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      moderation_queue: {
        Row: {
          action_taken: string | null
          content_id: string
          content_preview: string | null
          content_type: string
          created_at: string | null
          id: string
          reason: string | null
          reported_by: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
        }
        Insert: {
          action_taken?: string | null
          content_id: string
          content_preview?: string | null
          content_type: string
          created_at?: string | null
          id?: string
          reason?: string | null
          reported_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Update: {
          action_taken?: string | null
          content_id?: string
          content_preview?: string | null
          content_type?: string
          created_at?: string | null
          id?: string
          reason?: string | null
          reported_by?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
        }
        Relationships: []
      }
      modules: {
        Row: {
          course_id: string
          created_at: string | null
          description: string | null
          id: string
          order_index: number | null
          title: string
          updated_at: string | null
        }
        Insert: {
          course_id: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          title: string
          updated_at?: string | null
        }
        Update: {
          course_id?: string
          created_at?: string | null
          description?: string | null
          id?: string
          order_index?: number | null
          title?: string
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "modules_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      notes: {
        Row: {
          content: string
          created_at: string | null
          id: string
          lesson_id: string
          timestamp_seconds: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string | null
          id?: string
          lesson_id: string
          timestamp_seconds?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string | null
          id?: string
          lesson_id?: string
          timestamp_seconds?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notes_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      notification_templates: {
        Row: {
          body_template: string
          channels: string[] | null
          created_at: string | null
          id: string
          is_active: boolean | null
          template_key: string
          title_template: string
        }
        Insert: {
          body_template: string
          channels?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          template_key: string
          title_template: string
        }
        Update: {
          body_template?: string
          channels?: string[] | null
          created_at?: string | null
          id?: string
          is_active?: boolean | null
          template_key?: string
          title_template?: string
        }
        Relationships: []
      }
      notifications: {
        Row: {
          action_url: string | null
          blog_post_id: string | null
          created_at: string | null
          id: string
          is_global: boolean | null
          message: string
          read: boolean | null
          title: string
          type: string | null
          user_id: string
        }
        Insert: {
          action_url?: string | null
          blog_post_id?: string | null
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          message: string
          read?: boolean | null
          title: string
          type?: string | null
          user_id: string
        }
        Update: {
          action_url?: string | null
          blog_post_id?: string | null
          created_at?: string | null
          id?: string
          is_global?: boolean | null
          message?: string
          read?: boolean | null
          title?: string
          type?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "notifications_blog_post_id_fkey"
            columns: ["blog_post_id"]
            isOneToOne: false
            referencedRelation: "blog_posts"
            referencedColumns: ["id"]
          },
        ]
      }
      payments: {
        Row: {
          amount: number
          course_id: string | null
          created_at: string | null
          currency: string | null
          gateway_order_id: string | null
          gateway_payment_id: string | null
          id: string
          metadata: Json | null
          payment_gateway: string | null
          payment_method: string | null
          status: string | null
          subscription_id: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          course_id?: string | null
          created_at?: string | null
          currency?: string | null
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          id?: string
          metadata?: Json | null
          payment_gateway?: string | null
          payment_method?: string | null
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          course_id?: string | null
          created_at?: string | null
          currency?: string | null
          gateway_order_id?: string | null
          gateway_payment_id?: string | null
          id?: string
          metadata?: Json | null
          payment_gateway?: string | null
          payment_method?: string | null
          status?: string | null
          subscription_id?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "payments_subscription_id_fkey"
            columns: ["subscription_id"]
            isOneToOne: false
            referencedRelation: "subscriptions"
            referencedColumns: ["id"]
          },
        ]
      }
      platform_events: {
        Row: {
          actor_id: string | null
          created_at: string | null
          event_type: string
          id: string
          payload: Json | null
          processed: boolean | null
        }
        Insert: {
          actor_id?: string | null
          created_at?: string | null
          event_type: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
        }
        Update: {
          actor_id?: string | null
          created_at?: string | null
          event_type?: string
          id?: string
          payload?: Json | null
          processed?: boolean | null
        }
        Relationships: []
      }
      point_transactions: {
        Row: {
          created_at: string | null
          id: string
          metadata: Json | null
          points: number
          reason: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points: number
          reason: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          metadata?: Json | null
          points?: number
          reason?: string
          user_id?: string
        }
        Relationships: []
      }
      portfolio_pages: {
        Row: {
          created_at: string
          description: string | null
          id: string
          order_index: number | null
          portfolio_id: string
          title: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          portfolio_id: string
          title: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          portfolio_id?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_pages_portfolio_id_fkey"
            columns: ["portfolio_id"]
            isOneToOne: false
            referencedRelation: "portfolios"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_sections: {
        Row: {
          caption: string | null
          content: string | null
          created_at: string
          id: string
          image_url: string | null
          layout: string | null
          order_index: number | null
          page_id: string
          section_type: string
        }
        Insert: {
          caption?: string | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          layout?: string | null
          order_index?: number | null
          page_id: string
          section_type?: string
        }
        Update: {
          caption?: string | null
          content?: string | null
          created_at?: string
          id?: string
          image_url?: string | null
          layout?: string | null
          order_index?: number | null
          page_id?: string
          section_type?: string
        }
        Relationships: [
          {
            foreignKeyName: "portfolio_sections_page_id_fkey"
            columns: ["page_id"]
            isOneToOne: false
            referencedRelation: "portfolio_pages"
            referencedColumns: ["id"]
          },
        ]
      }
      portfolio_views: {
        Row: {
          created_at: string | null
          id: string
          page_viewed: string | null
          portfolio_id: string
          referrer: string | null
          time_spent_seconds: number | null
          viewer_id: string | null
          viewer_ip: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          page_viewed?: string | null
          portfolio_id: string
          referrer?: string | null
          time_spent_seconds?: number | null
          viewer_id?: string | null
          viewer_ip?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          page_viewed?: string | null
          portfolio_id?: string
          referrer?: string | null
          time_spent_seconds?: number | null
          viewer_id?: string | null
          viewer_ip?: string | null
        }
        Relationships: []
      }
      portfolios: {
        Row: {
          accent_color: string | null
          bio: string | null
          contact_email: string | null
          created_at: string
          id: string
          is_public: boolean | null
          slug: string
          subtitle: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          accent_color?: string | null
          bio?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          slug: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          accent_color?: string | null
          bio?: string | null
          contact_email?: string | null
          created_at?: string
          id?: string
          is_public?: boolean | null
          slug?: string
          subtitle?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profile_completion_tasks: {
        Row: {
          description: string | null
          icon: string | null
          id: string
          key: string
          order_index: number
          points: number
          title: string
        }
        Insert: {
          description?: string | null
          icon?: string | null
          id?: string
          key: string
          order_index?: number
          points?: number
          title: string
        }
        Update: {
          description?: string | null
          icon?: string | null
          id?: string
          key?: string
          order_index?: number
          points?: number
          title?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          ai_queries_reset_at: string | null
          ai_queries_used_today: number | null
          avatar_url: string | null
          bio: string | null
          city: string | null
          college: string | null
          created_at: string | null
          email: string | null
          email_verified: boolean | null
          full_name: string | null
          id: string
          phone: string | null
          phone_verified: boolean | null
          reputation_title: string | null
          role: string | null
          skills: string[] | null
          social_links: Json | null
          two_factor_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_queries_reset_at?: string | null
          ai_queries_used_today?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          college?: string | null
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_verified?: boolean | null
          reputation_title?: string | null
          role?: string | null
          skills?: string[] | null
          social_links?: Json | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_queries_reset_at?: string | null
          ai_queries_used_today?: number | null
          avatar_url?: string | null
          bio?: string | null
          city?: string | null
          college?: string | null
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_verified?: boolean | null
          reputation_title?: string | null
          role?: string | null
          skills?: string[] | null
          social_links?: Json | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      progress: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string | null
          id: string
          last_position_seconds: number | null
          lesson_id: string
          updated_at: string | null
          user_id: string
          watch_time_seconds: number | null
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_position_seconds?: number | null
          lesson_id: string
          updated_at?: string | null
          user_id: string
          watch_time_seconds?: number | null
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string | null
          id?: string
          last_position_seconds?: number | null
          lesson_id?: string
          updated_at?: string | null
          user_id?: string
          watch_time_seconds?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "progress_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      purchase_attempts: {
        Row: {
          amount: number | null
          course_id: string | null
          created_at: string
          id: string
          metadata: Json | null
          session_id: string | null
          status: string
          updated_at: string
          user_id: string | null
        }
        Insert: {
          amount?: number | null
          course_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Update: {
          amount?: number | null
          course_id?: string | null
          created_at?: string
          id?: string
          metadata?: Json | null
          session_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "purchase_attempts_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      rate_limit_buckets: {
        Row: {
          bucket_key: string
          created_at: string | null
          id: string
          identifier: string
          request_count: number | null
          window_start: string | null
        }
        Insert: {
          bucket_key: string
          created_at?: string | null
          id?: string
          identifier: string
          request_count?: number | null
          window_start?: string | null
        }
        Update: {
          bucket_key?: string
          created_at?: string | null
          id?: string
          identifier?: string
          request_count?: number | null
          window_start?: string | null
        }
        Relationships: []
      }
      recommendation_logs: {
        Row: {
          ai_generated: boolean | null
          created_at: string | null
          id: string
          reason: string | null
          recommended_course_ids: string[] | null
          user_id: string
        }
        Insert: {
          ai_generated?: boolean | null
          created_at?: string | null
          id?: string
          reason?: string | null
          recommended_course_ids?: string[] | null
          user_id: string
        }
        Update: {
          ai_generated?: boolean | null
          created_at?: string | null
          id?: string
          reason?: string | null
          recommended_course_ids?: string[] | null
          user_id?: string
        }
        Relationships: []
      }
      referral_uses: {
        Row: {
          course_id: string | null
          created_at: string | null
          discount_applied: number | null
          id: string
          referral_id: string
          referred_user_id: string
          referrer_reward: number | null
        }
        Insert: {
          course_id?: string | null
          created_at?: string | null
          discount_applied?: number | null
          id?: string
          referral_id: string
          referred_user_id: string
          referrer_reward?: number | null
        }
        Update: {
          course_id?: string | null
          created_at?: string | null
          discount_applied?: number | null
          id?: string
          referral_id?: string
          referred_user_id?: string
          referrer_reward?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "referral_uses_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_uses_referral_id_fkey"
            columns: ["referral_id"]
            isOneToOne: false
            referencedRelation: "referrals"
            referencedColumns: ["id"]
          },
        ]
      }
      referrals: {
        Row: {
          created_at: string | null
          id: string
          referral_code: string
          referrer_id: string
          total_earned_discount: number | null
          total_referrals: number | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          referral_code: string
          referrer_id: string
          total_earned_discount?: number | null
          total_referrals?: number | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          referral_code?: string
          referrer_id?: string
          total_earned_discount?: number | null
          total_referrals?: number | null
          updated_at?: string | null
        }
        Relationships: []
      }
      resource_bookmarks: {
        Row: {
          created_at: string | null
          id: string
          resource_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          resource_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          resource_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "resource_bookmarks_resource_id_fkey"
            columns: ["resource_id"]
            isOneToOne: false
            referencedRelation: "resources"
            referencedColumns: ["id"]
          },
        ]
      }
      resources: {
        Row: {
          category: string
          created_at: string | null
          created_by: string | null
          description: string | null
          download_count: number | null
          external_url: string | null
          file_type: string | null
          file_url: string | null
          id: string
          is_published: boolean | null
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string | null
        }
        Insert: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          download_count?: number | null
          external_url?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string | null
        }
        Update: {
          category?: string
          created_at?: string | null
          created_by?: string | null
          description?: string | null
          download_count?: number | null
          external_url?: string | null
          file_type?: string | null
          file_url?: string | null
          id?: string
          is_published?: boolean | null
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          course_id: string
          created_at: string
          id: string
          rating: number
          review: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          course_id: string
          created_at?: string
          id?: string
          rating: number
          review?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          course_id?: string
          created_at?: string
          id?: string
          rating?: number
          review?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
        ]
      }
      server_cache: {
        Row: {
          cache_key: string
          cache_value: Json
          created_at: string | null
          expires_at: string
        }
        Insert: {
          cache_key: string
          cache_value: Json
          created_at?: string | null
          expires_at: string
        }
        Update: {
          cache_key?: string
          cache_value?: Json
          created_at?: string | null
          expires_at?: string
        }
        Relationships: []
      }
      sheet_annotations: {
        Row: {
          created_at: string | null
          id: string
          is_resolved: boolean | null
          message: string
          parent_id: string | null
          sheet_id: string
          updated_at: string | null
          user_id: string
          x_percent: number
          y_percent: number
        }
        Insert: {
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          message: string
          parent_id?: string | null
          sheet_id: string
          updated_at?: string | null
          user_id: string
          x_percent: number
          y_percent: number
        }
        Update: {
          created_at?: string | null
          id?: string
          is_resolved?: boolean | null
          message?: string
          parent_id?: string | null
          sheet_id?: string
          updated_at?: string | null
          user_id?: string
          x_percent?: number
          y_percent?: number
        }
        Relationships: [
          {
            foreignKeyName: "sheet_annotations_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "sheet_annotations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheet_annotations_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "sheet_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_critique_upvotes: {
        Row: {
          created_at: string
          critique_id: string
          id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          critique_id: string
          id?: string
          user_id: string
        }
        Update: {
          created_at?: string
          critique_id?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheet_critique_upvotes_critique_id_fkey"
            columns: ["critique_id"]
            isOneToOne: false
            referencedRelation: "sheet_critiques"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_critiques: {
        Row: {
          content: string
          created_at: string
          id: string
          is_best_answer: boolean | null
          parent_id: string | null
          sheet_id: string
          updated_at: string
          upvote_count: number | null
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_best_answer?: boolean | null
          parent_id?: string | null
          sheet_id: string
          updated_at?: string
          upvote_count?: number | null
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_best_answer?: boolean | null
          parent_id?: string | null
          sheet_id?: string
          updated_at?: string
          upvote_count?: number | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "sheet_critiques_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "sheet_critiques"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sheet_critiques_sheet_id_fkey"
            columns: ["sheet_id"]
            isOneToOne: false
            referencedRelation: "sheet_reviews"
            referencedColumns: ["id"]
          },
        ]
      }
      sheet_reviews: {
        Row: {
          created_at: string
          critique_count: number | null
          description: string | null
          id: string
          is_featured: boolean | null
          sheet_url: string
          status: string
          tags: string[] | null
          thumbnail_url: string | null
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          critique_count?: number | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          sheet_url: string
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          critique_count?: number | null
          description?: string | null
          id?: string
          is_featured?: boolean | null
          sheet_url?: string
          status?: string
          tags?: string[] | null
          thumbnail_url?: string | null
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      site_settings: {
        Row: {
          description: string | null
          id: string
          key: string
          updated_at: string | null
          updated_by: string | null
          value: string | null
        }
        Insert: {
          description?: string | null
          id?: string
          key: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Update: {
          description?: string | null
          id?: string
          key?: string
          updated_at?: string | null
          updated_by?: string | null
          value?: string | null
        }
        Relationships: []
      }
      studio_hub_deliverables: {
        Row: {
          admin_notes: string | null
          client_id: string
          contract_id: string
          created_at: string
          description: string | null
          file_urls: string[]
          id: string
          released_at: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string
          title: string
          updated_at: string
          version: number
          worker_id: string
        }
        Insert: {
          admin_notes?: string | null
          client_id: string
          contract_id: string
          created_at?: string
          description?: string | null
          file_urls?: string[]
          id?: string
          released_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title: string
          updated_at?: string
          version?: number
          worker_id: string
        }
        Update: {
          admin_notes?: string | null
          client_id?: string
          contract_id?: string
          created_at?: string
          description?: string | null
          file_urls?: string[]
          id?: string
          released_at?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string
          title?: string
          updated_at?: string
          version?: number
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_hub_deliverables_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "marketplace_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_hub_payouts: {
        Row: {
          admin_notes: string | null
          amount: number
          contract_id: string
          created_at: string
          created_by: string | null
          currency: string
          fee_amount: number
          id: string
          method: string
          paid_at: string | null
          reference: string | null
          status: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          admin_notes?: string | null
          amount: number
          contract_id: string
          created_at?: string
          created_by?: string | null
          currency?: string
          fee_amount?: number
          id?: string
          method?: string
          paid_at?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          admin_notes?: string | null
          amount?: number
          contract_id?: string
          created_at?: string
          created_by?: string | null
          currency?: string
          fee_amount?: number
          id?: string
          method?: string
          paid_at?: string | null
          reference?: string | null
          status?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_hub_payouts_contract_id_fkey"
            columns: ["contract_id"]
            isOneToOne: false
            referencedRelation: "marketplace_contracts"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_project_comments: {
        Row: {
          content: string
          created_at: string
          id: string
          parent_id: string | null
          project_id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          parent_id?: string | null
          project_id: string
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          parent_id?: string | null
          project_id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_project_comments_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "studio_project_comments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_project_comments_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_project_files: {
        Row: {
          caption: string | null
          category: string
          created_at: string
          file_name: string
          file_size_bytes: number | null
          file_type: string | null
          file_url: string
          id: string
          order_index: number | null
          project_id: string
          user_id: string
        }
        Insert: {
          caption?: string | null
          category?: string
          created_at?: string
          file_name: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url: string
          id?: string
          order_index?: number | null
          project_id: string
          user_id: string
        }
        Update: {
          caption?: string | null
          category?: string
          created_at?: string
          file_name?: string
          file_size_bytes?: number | null
          file_type?: string | null
          file_url?: string
          id?: string
          order_index?: number | null
          project_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_project_files_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_project_milestones: {
        Row: {
          completed: boolean | null
          completed_at: string | null
          created_at: string
          description: string | null
          id: string
          order_index: number | null
          project_id: string
          target_date: string | null
          title: string
          user_id: string
        }
        Insert: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          project_id: string
          target_date?: string | null
          title: string
          user_id: string
        }
        Update: {
          completed?: boolean | null
          completed_at?: string | null
          created_at?: string
          description?: string | null
          id?: string
          order_index?: number | null
          project_id?: string
          target_date?: string | null
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_project_milestones_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_project_notes: {
        Row: {
          content: string
          created_at: string
          id: string
          project_id: string
          title: string | null
          updated_at: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          project_id: string
          title?: string | null
          updated_at?: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          project_id?: string
          title?: string | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_project_notes_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_project_tasks: {
        Row: {
          completed_at: string | null
          created_at: string
          description: string | null
          due_date: string | null
          id: string
          order_index: number | null
          priority: string | null
          project_id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number | null
          priority?: string | null
          project_id: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          completed_at?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          id?: string
          order_index?: number | null
          priority?: string | null
          project_id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_project_tasks_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_project_timeline: {
        Row: {
          created_at: string
          description: string | null
          entry_type: string
          id: string
          image_url: string | null
          project_id: string
          title: string
          user_id: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          entry_type?: string
          id?: string
          image_url?: string | null
          project_id: string
          title: string
          user_id: string
        }
        Update: {
          created_at?: string
          description?: string | null
          entry_type?: string
          id?: string
          image_url?: string | null
          project_id?: string
          title?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_project_timeline_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "studio_projects"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_projects: {
        Row: {
          cover_image_url: string | null
          created_at: string
          description: string | null
          id: string
          status: string
          tags: string[] | null
          title: string
          updated_at: string
          user_id: string
          visibility: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          tags?: string[] | null
          title: string
          updated_at?: string
          user_id: string
          visibility?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          id?: string
          status?: string
          tags?: string[] | null
          title?: string
          updated_at?: string
          user_id?: string
          visibility?: string
        }
        Relationships: []
      }
      studio_room_members: {
        Row: {
          id: string
          joined_at: string
          role: string
          room_id: string
          user_id: string
        }
        Insert: {
          id?: string
          joined_at?: string
          role?: string
          room_id: string
          user_id: string
        }
        Update: {
          id?: string
          joined_at?: string
          role?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_room_members_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "studio_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_room_reviews: {
        Row: {
          content: string
          created_at: string
          id: string
          image_url: string | null
          parent_id: string | null
          review_type: string
          room_id: string
          user_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          image_url?: string | null
          parent_id?: string | null
          review_type?: string
          room_id: string
          user_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          image_url?: string | null
          parent_id?: string | null
          review_type?: string
          room_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "studio_room_reviews_parent_id_fkey"
            columns: ["parent_id"]
            isOneToOne: false
            referencedRelation: "studio_room_reviews"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "studio_room_reviews_room_id_fkey"
            columns: ["room_id"]
            isOneToOne: false
            referencedRelation: "studio_rooms"
            referencedColumns: ["id"]
          },
        ]
      }
      studio_rooms: {
        Row: {
          cover_image_url: string | null
          created_at: string
          created_by: string
          deadline: string | null
          description: string | null
          id: string
          is_active: boolean | null
          max_members: number | null
          mentor_id: string | null
          mentor_name: string | null
          theme: string
          title: string
          updated_at: string
        }
        Insert: {
          cover_image_url?: string | null
          created_at?: string
          created_by: string
          deadline?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_members?: number | null
          mentor_id?: string | null
          mentor_name?: string | null
          theme?: string
          title: string
          updated_at?: string
        }
        Update: {
          cover_image_url?: string | null
          created_at?: string
          created_by?: string
          deadline?: string | null
          description?: string | null
          id?: string
          is_active?: boolean | null
          max_members?: number | null
          mentor_id?: string | null
          mentor_name?: string | null
          theme?: string
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      subscriptions: {
        Row: {
          cancel_at_period_end: boolean | null
          created_at: string | null
          current_period_end: string | null
          current_period_start: string | null
          gateway_subscription_id: string | null
          id: string
          payment_gateway: string | null
          plan_type: string | null
          status: string | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          gateway_subscription_id?: string | null
          id?: string
          payment_gateway?: string | null
          plan_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          cancel_at_period_end?: boolean | null
          created_at?: string | null
          current_period_end?: string | null
          current_period_start?: string | null
          gateway_subscription_id?: string | null
          id?: string
          payment_gateway?: string | null
          plan_type?: string | null
          status?: string | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      support_tickets: {
        Row: {
          admin_response: string | null
          ai_response: string | null
          created_at: string | null
          escalated: boolean | null
          id: string
          message: string
          priority: string | null
          responded_by: string | null
          status: string | null
          subject: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          admin_response?: string | null
          ai_response?: string | null
          created_at?: string | null
          escalated?: boolean | null
          id?: string
          message: string
          priority?: string | null
          responded_by?: string | null
          status?: string | null
          subject: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          admin_response?: string | null
          ai_response?: string | null
          created_at?: string | null
          escalated?: boolean | null
          id?: string
          message?: string
          priority?: string | null
          responded_by?: string | null
          status?: string | null
          subject?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      system_errors: {
        Row: {
          attempts: number | null
          auto_fix_attempted: boolean | null
          created_at: string | null
          error_type: string
          id: string
          payload: Json | null
          resolution_note: string | null
          resolved: boolean | null
          resolved_at: string | null
          service: string
        }
        Insert: {
          attempts?: number | null
          auto_fix_attempted?: boolean | null
          created_at?: string | null
          error_type: string
          id?: string
          payload?: Json | null
          resolution_note?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          service: string
        }
        Update: {
          attempts?: number | null
          auto_fix_attempted?: boolean | null
          created_at?: string | null
          error_type?: string
          id?: string
          payload?: Json | null
          resolution_note?: string | null
          resolved?: boolean | null
          resolved_at?: string | null
          service?: string
        }
        Relationships: []
      }
      system_metrics: {
        Row: {
          id: string
          metric_name: string
          metric_value: number
          recorded_at: string | null
          tags: Json | null
        }
        Insert: {
          id?: string
          metric_name: string
          metric_value: number
          recorded_at?: string | null
          tags?: Json | null
        }
        Update: {
          id?: string
          metric_name?: string
          metric_value?: number
          recorded_at?: string | null
          tags?: Json | null
        }
        Relationships: []
      }
      user_achievements: {
        Row: {
          achievement_id: string
          earned_at: string
          id: string
          user_id: string
        }
        Insert: {
          achievement_id: string
          earned_at?: string
          id?: string
          user_id: string
        }
        Update: {
          achievement_id?: string
          earned_at?: string
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_achievements_achievement_id_fkey"
            columns: ["achievement_id"]
            isOneToOne: false
            referencedRelation: "achievements"
            referencedColumns: ["id"]
          },
        ]
      }
      user_badges: {
        Row: {
          badge_description: string | null
          badge_icon: string | null
          badge_key: string
          badge_name: string
          earned_at: string | null
          id: string
          user_id: string
        }
        Insert: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_key: string
          badge_name: string
          earned_at?: string | null
          id?: string
          user_id: string
        }
        Update: {
          badge_description?: string | null
          badge_icon?: string | null
          badge_key?: string
          badge_name?: string
          earned_at?: string | null
          id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_completed_tasks: {
        Row: {
          completed_at: string
          id: string
          task_key: string
          user_id: string
        }
        Insert: {
          completed_at?: string
          id?: string
          task_key: string
          user_id: string
        }
        Update: {
          completed_at?: string
          id?: string
          task_key?: string
          user_id?: string
        }
        Relationships: []
      }
      user_discount_timers: {
        Row: {
          activated_at: string
          created_at: string
          discount_percent: number
          expired: boolean
          extended: boolean
          extended_at: string | null
          extension_duration_seconds: number
          id: string
          initial_duration_seconds: number
          user_id: string
        }
        Insert: {
          activated_at?: string
          created_at?: string
          discount_percent?: number
          expired?: boolean
          extended?: boolean
          extended_at?: string | null
          extension_duration_seconds?: number
          id?: string
          initial_duration_seconds?: number
          user_id: string
        }
        Update: {
          activated_at?: string
          created_at?: string
          discount_percent?: number
          expired?: boolean
          extended?: boolean
          extended_at?: string | null
          extension_duration_seconds?: number
          id?: string
          initial_duration_seconds?: number
          user_id?: string
        }
        Relationships: []
      }
      user_follows: {
        Row: {
          created_at: string
          follower_id: string
          following_id: string
          id: string
        }
        Insert: {
          created_at?: string
          follower_id: string
          following_id: string
          id?: string
        }
        Update: {
          created_at?: string
          follower_id?: string
          following_id?: string
          id?: string
        }
        Relationships: []
      }
      user_lesson_access: {
        Row: {
          access_type: string | null
          course_id: string
          created_at: string | null
          emi_payment_id: string | null
          expires_at: string | null
          gift_claim_id: string | null
          granted_at: string | null
          id: string
          lesson_id: string
          user_id: string
        }
        Insert: {
          access_type?: string | null
          course_id: string
          created_at?: string | null
          emi_payment_id?: string | null
          expires_at?: string | null
          gift_claim_id?: string | null
          granted_at?: string | null
          id?: string
          lesson_id: string
          user_id: string
        }
        Update: {
          access_type?: string | null
          course_id?: string
          created_at?: string | null
          emi_payment_id?: string | null
          expires_at?: string | null
          gift_claim_id?: string | null
          granted_at?: string | null
          id?: string
          lesson_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_lesson_access_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_access_emi_payment_id_fkey"
            columns: ["emi_payment_id"]
            isOneToOne: false
            referencedRelation: "emi_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_access_gift_claim_id_fkey"
            columns: ["gift_claim_id"]
            isOneToOne: false
            referencedRelation: "login_gift_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_lesson_access_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      user_module_access: {
        Row: {
          access_type: string | null
          course_id: string
          created_at: string | null
          emi_payment_id: string | null
          expires_at: string | null
          gift_claim_id: string | null
          granted_at: string | null
          id: string
          lesson_id: string | null
          module_id: string
          user_id: string
        }
        Insert: {
          access_type?: string | null
          course_id: string
          created_at?: string | null
          emi_payment_id?: string | null
          expires_at?: string | null
          gift_claim_id?: string | null
          granted_at?: string | null
          id?: string
          lesson_id?: string | null
          module_id: string
          user_id: string
        }
        Update: {
          access_type?: string | null
          course_id?: string
          created_at?: string | null
          emi_payment_id?: string | null
          expires_at?: string | null
          gift_claim_id?: string | null
          granted_at?: string | null
          id?: string
          lesson_id?: string | null
          module_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "user_module_access_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_module_access_emi_payment_id_fkey"
            columns: ["emi_payment_id"]
            isOneToOne: false
            referencedRelation: "emi_payments"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_module_access_gift_claim_id_fkey"
            columns: ["gift_claim_id"]
            isOneToOne: false
            referencedRelation: "login_gift_claims"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_module_access_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "user_module_access_module_id_fkey"
            columns: ["module_id"]
            isOneToOne: false
            referencedRelation: "modules"
            referencedColumns: ["id"]
          },
        ]
      }
      user_onboarding_intake: {
        Row: {
          age: number | null
          created_at: string
          discovery_source: string
          full_name: string | null
          id: string
          notes: string | null
          primary_challenge: string
          role_track: string
          updated_at: string
          user_id: string
        }
        Insert: {
          age?: number | null
          created_at?: string
          discovery_source: string
          full_name?: string | null
          id?: string
          notes?: string | null
          primary_challenge: string
          role_track: string
          updated_at?: string
          user_id: string
        }
        Update: {
          age?: number | null
          created_at?: string
          discovery_source?: string
          full_name?: string | null
          id?: string
          notes?: string | null
          primary_challenge?: string
          role_track?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      user_points: {
        Row: {
          created_at: string | null
          id: string
          level: number | null
          points: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          level?: number | null
          points?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          level?: number | null
          points?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_rate_limits: {
        Row: {
          action_type: string
          count: number | null
          id: string
          user_id: string
          window_start: string | null
        }
        Insert: {
          action_type: string
          count?: number | null
          id?: string
          user_id: string
          window_start?: string | null
        }
        Update: {
          action_type?: string
          count?: number | null
          id?: string
          user_id?: string
          window_start?: string | null
        }
        Relationships: []
      }
      user_roles: {
        Row: {
          created_at: string | null
          id: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          role: Database["public"]["Enums"]["app_role"]
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          role?: Database["public"]["Enums"]["app_role"]
          user_id?: string
        }
        Relationships: []
      }
      user_sessions: {
        Row: {
          browser: string | null
          device_info: string | null
          id: string
          ip_address: string | null
          is_active: boolean
          last_active_at: string
          logged_in_at: string
          logged_out_at: string | null
          logout_reason: string | null
          os: string | null
          session_token: string
          user_id: string
        }
        Insert: {
          browser?: string | null
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_active_at?: string
          logged_in_at?: string
          logged_out_at?: string | null
          logout_reason?: string | null
          os?: string | null
          session_token: string
          user_id: string
        }
        Update: {
          browser?: string | null
          device_info?: string | null
          id?: string
          ip_address?: string | null
          is_active?: boolean
          last_active_at?: string
          logged_in_at?: string
          logged_out_at?: string | null
          logout_reason?: string | null
          os?: string | null
          session_token?: string
          user_id?: string
        }
        Relationships: []
      }
      user_streaks: {
        Row: {
          current_streak: number | null
          id: string
          last_active_date: string | null
          longest_streak: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          current_streak?: number | null
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          current_streak?: number | null
          id?: string
          last_active_date?: string | null
          longest_streak?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      usernames: {
        Row: {
          created_at: string
          id: string
          updated_at: string
          user_id: string
          username: string
        }
        Insert: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id: string
          username: string
        }
        Update: {
          created_at?: string
          id?: string
          updated_at?: string
          user_id?: string
          username?: string
        }
        Relationships: []
      }
      video_migrations: {
        Row: {
          course_id: string | null
          created_at: string
          error_message: string | null
          id: string
          lesson_id: string | null
          lulustream_embed_url: string | null
          lulustream_file_code: string | null
          original_url: string
          status: string
          updated_at: string
        }
        Insert: {
          course_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          lesson_id?: string | null
          lulustream_embed_url?: string | null
          lulustream_file_code?: string | null
          original_url: string
          status?: string
          updated_at?: string
        }
        Update: {
          course_id?: string | null
          created_at?: string
          error_message?: string | null
          id?: string
          lesson_id?: string | null
          lulustream_embed_url?: string | null
          lulustream_file_code?: string | null
          original_url?: string
          status?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "video_migrations_course_id_fkey"
            columns: ["course_id"]
            isOneToOne: false
            referencedRelation: "courses"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "video_migrations_lesson_id_fkey"
            columns: ["lesson_id"]
            isOneToOne: false
            referencedRelation: "lessons"
            referencedColumns: ["id"]
          },
        ]
      }
      visitor_sessions: {
        Row: {
          browser: string | null
          country: string | null
          created_at: string
          device_type: string
          ended_at: string | null
          id: string
          is_bounce: boolean | null
          landing_page: string | null
          last_ping: string
          os: string | null
          pages_viewed: number | null
          referrer: string | null
          screen_height: number | null
          screen_width: number | null
          session_id: string
          started_at: string
          timezone: string | null
          total_duration_seconds: number | null
          user_id: string | null
          utm_campaign: string | null
          utm_medium: string | null
          utm_source: string | null
        }
        Insert: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string
          ended_at?: string | null
          id?: string
          is_bounce?: boolean | null
          landing_page?: string | null
          last_ping?: string
          os?: string | null
          pages_viewed?: number | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id: string
          started_at?: string
          timezone?: string | null
          total_duration_seconds?: number | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Update: {
          browser?: string | null
          country?: string | null
          created_at?: string
          device_type?: string
          ended_at?: string | null
          id?: string
          is_bounce?: boolean | null
          landing_page?: string | null
          last_ping?: string
          os?: string | null
          pages_viewed?: number | null
          referrer?: string | null
          screen_height?: number | null
          screen_width?: number | null
          session_id?: string
          started_at?: string
          timezone?: string | null
          total_duration_seconds?: number | null
          user_id?: string | null
          utm_campaign?: string | null
          utm_medium?: string | null
          utm_source?: string | null
        }
        Relationships: []
      }
      worker_portfolio_items: {
        Row: {
          category: string | null
          cover_image_url: string | null
          created_at: string
          description: string | null
          display_order: number
          external_link: string | null
          file_urls: string[]
          id: string
          skills: string[]
          title: string
          updated_at: string
          worker_id: string
        }
        Insert: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          external_link?: string | null
          file_urls?: string[]
          id?: string
          skills?: string[]
          title: string
          updated_at?: string
          worker_id: string
        }
        Update: {
          category?: string | null
          cover_image_url?: string | null
          created_at?: string
          description?: string | null
          display_order?: number
          external_link?: string | null
          file_urls?: string[]
          id?: string
          skills?: string[]
          title?: string
          updated_at?: string
          worker_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "worker_portfolio_items_worker_id_fkey"
            columns: ["worker_id"]
            isOneToOne: false
            referencedRelation: "worker_profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      worker_profiles: {
        Row: {
          availability: string | null
          avatar_url: string | null
          average_rating: number
          bio: string | null
          cover_url: string | null
          created_at: string
          display_name: string | null
          experience_level: string
          featured_titles: string[]
          headline: string | null
          hourly_rate: number | null
          id: string
          is_active: boolean
          is_demo: boolean
          languages: string[] | null
          location: string | null
          portfolio_count: number
          response_hours: number | null
          skills: string[]
          tagline: string | null
          tools: string[]
          total_earnings: number
          total_jobs_completed: number
          total_reviews: number
          updated_at: string
          user_id: string
          years_experience: number | null
        }
        Insert: {
          availability?: string | null
          avatar_url?: string | null
          average_rating?: number
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          experience_level?: string
          featured_titles?: string[]
          headline?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          languages?: string[] | null
          location?: string | null
          portfolio_count?: number
          response_hours?: number | null
          skills?: string[]
          tagline?: string | null
          tools?: string[]
          total_earnings?: number
          total_jobs_completed?: number
          total_reviews?: number
          updated_at?: string
          user_id: string
          years_experience?: number | null
        }
        Update: {
          availability?: string | null
          avatar_url?: string | null
          average_rating?: number
          bio?: string | null
          cover_url?: string | null
          created_at?: string
          display_name?: string | null
          experience_level?: string
          featured_titles?: string[]
          headline?: string | null
          hourly_rate?: number | null
          id?: string
          is_active?: boolean
          is_demo?: boolean
          languages?: string[] | null
          location?: string | null
          portfolio_count?: number
          response_hours?: number | null
          skills?: string[]
          tagline?: string | null
          tools?: string[]
          total_earnings?: number
          total_jobs_completed?: number
          total_reviews?: number
          updated_at?: string
          user_id?: string
          years_experience?: number | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      check_rate_limit: {
        Args: {
          p_bucket_key: string
          p_identifier: string
          p_max_requests: number
          p_window_seconds: number
        }
        Returns: Json
      }
      cleanup_expired_cache: { Args: never; Returns: undefined }
      get_project_attachments: { Args: { p_job_id: string }; Returns: string[] }
      get_referral_by_code: {
        Args: { code: string }
        Returns: {
          id: string
          referral_code: string
          referrer_id: string
        }[]
      }
      global_search: {
        Args: { result_limit?: number; search_query: string }
        Returns: {
          description: string
          relevance: number
          result_id: string
          result_type: string
          slug: string
          title: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      upsert_cache: {
        Args: { p_key: string; p_ttl_seconds?: number; p_value: Json }
        Returns: undefined
      }
    }
    Enums: {
      app_role: "admin" | "moderator" | "user" | "manager" | "uploader"
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
      app_role: ["admin", "moderator", "user", "manager", "uploader"],
    },
  },
} as const
