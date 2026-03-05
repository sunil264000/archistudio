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
          created_at: string
          id: string
          ebook_id: string
        }
        Insert: {
          campaign_id: string
          created_at?: string
          id?: string
          ebook_id: string
        }
        Update: {
          campaign_id?: string
          created_at?: string
          id?: string
          ebook_id?: string
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
      profiles: {
        Row: {
          ai_queries_reset_at: string | null
          ai_queries_used_today: number | null
          avatar_url: string | null
          created_at: string | null
          email: string | null
          email_verified: boolean | null
          full_name: string | null
          id: string
          phone: string | null
          phone_verified: boolean | null
          role: string | null
          two_factor_enabled: boolean | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          ai_queries_reset_at?: string | null
          ai_queries_used_today?: number | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_verified?: boolean | null
          role?: string | null
          two_factor_enabled?: boolean | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          ai_queries_reset_at?: string | null
          ai_queries_used_today?: number | null
          avatar_url?: string | null
          created_at?: string | null
          email?: string | null
          email_verified?: boolean | null
          full_name?: string | null
          id?: string
          phone?: string | null
          phone_verified?: boolean | null
          role?: string | null
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_referral_by_code: {
        Args: { code: string }
        Returns: {
          id: string
          referral_code: string
          referrer_id: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
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
