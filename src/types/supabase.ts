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
      appointments: {
        Row: {
          appointment_type: string | null
          buyer_id: string
          buyer_notes: string | null
          cancellation_reason: string | null
          cancelled_at: string | null
          completed_at: string | null
          confirmed_at: string | null
          created_at: string | null
          dealer_id: string
          dealer_notes: string | null
          duration_minutes: number | null
          id: string
          listing_id: string
          scheduled_at: string
          status: Database["public"]["Enums"]["appointment_status"] | null
          updated_at: string | null
        }
        Insert: {
          appointment_type?: string | null
          buyer_id: string
          buyer_notes?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          dealer_id: string
          dealer_notes?: string | null
          duration_minutes?: number | null
          id?: string
          listing_id: string
          scheduled_at: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string | null
        }
        Update: {
          appointment_type?: string | null
          buyer_id?: string
          buyer_notes?: string | null
          cancellation_reason?: string | null
          cancelled_at?: string | null
          completed_at?: string | null
          confirmed_at?: string | null
          created_at?: string | null
          dealer_id?: string
          dealer_notes?: string | null
          duration_minutes?: number | null
          id?: string
          listing_id?: string
          scheduled_at?: string
          status?: Database["public"]["Enums"]["appointment_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "appointments_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "appointments_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      buyer_engagement_scores: {
        Row: {
          created_at: string | null
          engagement_score: number | null
          has_inquired: boolean | null
          has_saved: boolean | null
          id: string
          last_activity_at: string | null
          listing_id: string
          updated_at: string | null
          user_id: string
          view_count: number | null
        }
        Insert: {
          created_at?: string | null
          engagement_score?: number | null
          has_inquired?: boolean | null
          has_saved?: boolean | null
          id?: string
          last_activity_at?: string | null
          listing_id: string
          updated_at?: string | null
          user_id: string
          view_count?: number | null
        }
        Update: {
          created_at?: string | null
          engagement_score?: number | null
          has_inquired?: boolean | null
          has_saved?: boolean | null
          id?: string
          last_activity_at?: string | null
          listing_id?: string
          updated_at?: string | null
          user_id?: string
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "buyer_engagement_scores_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_engagement_scores_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "buyer_engagement_scores_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      conversations: {
        Row: {
          archived_by_buyer: boolean | null
          archived_by_dealer: boolean | null
          buyer_id: string
          created_at: string | null
          dealer_id: string
          id: string
          last_message_at: string | null
          last_message_preview: string | null
          listing_id: string | null
          unread_count_buyer: number | null
          unread_count_dealer: number | null
          updated_at: string | null
        }
        Insert: {
          archived_by_buyer?: boolean | null
          archived_by_dealer?: boolean | null
          buyer_id: string
          created_at?: string | null
          dealer_id: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          listing_id?: string | null
          unread_count_buyer?: number | null
          unread_count_dealer?: number | null
          updated_at?: string | null
        }
        Update: {
          archived_by_buyer?: boolean | null
          archived_by_dealer?: boolean | null
          buyer_id?: string
          created_at?: string | null
          dealer_id?: string
          id?: string
          last_message_at?: string | null
          last_message_preview?: string | null
          listing_id?: string | null
          unread_count_buyer?: number | null
          unread_count_dealer?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "conversations_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_dealer_id_fkey"
            columns: ["dealer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "conversations_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      dealership_analytics_daily: {
        Row: {
          active_listings_count: number | null
          created_at: string | null
          date: string
          dealership_id: string
          id: string
          new_listings_count: number | null
          sold_listings_count: number | null
          total_inquiries: number | null
          total_saves: number | null
          total_shares: number | null
          total_views: number | null
          updated_at: string | null
        }
        Insert: {
          active_listings_count?: number | null
          created_at?: string | null
          date: string
          dealership_id: string
          id?: string
          new_listings_count?: number | null
          sold_listings_count?: number | null
          total_inquiries?: number | null
          total_saves?: number | null
          total_shares?: number | null
          total_views?: number | null
          updated_at?: string | null
        }
        Update: {
          active_listings_count?: number | null
          created_at?: string | null
          date?: string
          dealership_id?: string
          id?: string
          new_listings_count?: number | null
          sold_listings_count?: number | null
          total_inquiries?: number | null
          total_saves?: number | null
          total_shares?: number | null
          total_views?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "dealership_analytics_daily_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      dealerships: {
        Row: {
          activated_at: string | null
          additional_info: string | null
          address: Json | null
          approved_at: string | null
          branding: Json | null
          business_hours: Json | null
          city: string | null
          contact_email: string
          contact_name: string
          contact_phone: string | null
          country: string | null
          created_at: string
          dealership_type: string | null
          description: string | null
          id: string
          legal_name: string
          license_number: string | null
          lifecycle_status: Database["public"]["Enums"]["dealership_lifecycle_status"]
          operational_status: Database["public"]["Enums"]["dealership_operational_status"]
          payout_details: Json | null
          region: string | null
          rejection_reason: string | null
          reviewed_at: string | null
          reviewed_by: string | null
          social_links: Json | null
          special_notes: string | null
          timezone: string | null
          trade_name: string | null
          updated_at: string
          website_url: string | null
        }
        Insert: {
          activated_at?: string | null
          additional_info?: string | null
          address?: Json | null
          approved_at?: string | null
          branding?: Json | null
          business_hours?: Json | null
          city?: string | null
          contact_email: string
          contact_name: string
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          dealership_type?: string | null
          description?: string | null
          id?: string
          legal_name: string
          license_number?: string | null
          lifecycle_status?: Database["public"]["Enums"]["dealership_lifecycle_status"]
          operational_status?: Database["public"]["Enums"]["dealership_operational_status"]
          payout_details?: Json | null
          region?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_links?: Json | null
          special_notes?: string | null
          timezone?: string | null
          trade_name?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Update: {
          activated_at?: string | null
          additional_info?: string | null
          address?: Json | null
          approved_at?: string | null
          branding?: Json | null
          business_hours?: Json | null
          city?: string | null
          contact_email?: string
          contact_name?: string
          contact_phone?: string | null
          country?: string | null
          created_at?: string
          dealership_type?: string | null
          description?: string | null
          id?: string
          legal_name?: string
          license_number?: string | null
          lifecycle_status?: Database["public"]["Enums"]["dealership_lifecycle_status"]
          operational_status?: Database["public"]["Enums"]["dealership_operational_status"]
          payout_details?: Json | null
          region?: string | null
          rejection_reason?: string | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          social_links?: Json | null
          special_notes?: string | null
          timezone?: string | null
          trade_name?: string | null
          updated_at?: string
          website_url?: string | null
        }
        Relationships: []
      }
      inquiries: {
        Row: {
          buyer_id: string
          buyer_message_count: number | null
          closed_at: string | null
          closed_by: string | null
          created_at: string | null
          dealer_first_reply_at: string | null
          dealer_message_count: number | null
          dealership_id: string
          first_message_at: string | null
          id: string
          last_message_at: string | null
          listing_id: string
          message_count: number | null
          priority: string | null
          response_time_minutes: number | null
          status: string
          subject: string | null
          updated_at: string | null
        }
        Insert: {
          buyer_id: string
          buyer_message_count?: number | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          dealer_first_reply_at?: string | null
          dealer_message_count?: number | null
          dealership_id: string
          first_message_at?: string | null
          id?: string
          last_message_at?: string | null
          listing_id: string
          message_count?: number | null
          priority?: string | null
          response_time_minutes?: number | null
          status?: string
          subject?: string | null
          updated_at?: string | null
        }
        Update: {
          buyer_id?: string
          buyer_message_count?: number | null
          closed_at?: string | null
          closed_by?: string | null
          created_at?: string | null
          dealer_first_reply_at?: string | null
          dealer_message_count?: number | null
          dealership_id?: string
          first_message_at?: string | null
          id?: string
          last_message_at?: string | null
          listing_id?: string
          message_count?: number | null
          priority?: string | null
          response_time_minutes?: number | null
          status?: string
          subject?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiries_buyer_id_fkey"
            columns: ["buyer_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_closed_by_fkey"
            columns: ["closed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiries_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_messages: {
        Row: {
          attachments: Json | null
          created_at: string | null
          id: string
          inquiry_id: string
          is_internal_note: boolean | null
          message: string
          read_at: string | null
          sender_id: string
          sender_role: string
        }
        Insert: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          inquiry_id: string
          is_internal_note?: boolean | null
          message: string
          read_at?: string | null
          sender_id: string
          sender_role: string
        }
        Update: {
          attachments?: Json | null
          created_at?: string | null
          id?: string
          inquiry_id?: string
          is_internal_note?: boolean | null
          message?: string
          read_at?: string | null
          sender_id?: string
          sender_role?: string
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_messages_inquiry_id_fkey"
            columns: ["inquiry_id"]
            isOneToOne: false
            referencedRelation: "inquiries"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "inquiry_messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      inquiry_sla_metrics_daily: {
        Row: {
          avg_response_time_minutes: number | null
          closed_inquiries: number | null
          created_at: string | null
          date: string
          dealership_id: string
          id: string
          replied_inquiries: number | null
          response_rate: number | null
          total_inquiries: number | null
          updated_at: string | null
        }
        Insert: {
          avg_response_time_minutes?: number | null
          closed_inquiries?: number | null
          created_at?: string | null
          date: string
          dealership_id: string
          id?: string
          replied_inquiries?: number | null
          response_rate?: number | null
          total_inquiries?: number | null
          updated_at?: string | null
        }
        Update: {
          avg_response_time_minutes?: number | null
          closed_inquiries?: number | null
          created_at?: string | null
          date?: string
          dealership_id?: string
          id?: string
          replied_inquiries?: number | null
          response_rate?: number | null
          total_inquiries?: number | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "inquiry_sla_metrics_daily_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_analytics_daily: {
        Row: {
          contact_click_count: number | null
          created_at: string | null
          date: string
          dealership_id: string
          id: string
          inquiry_count: number | null
          listing_id: string
          phone_click_count: number | null
          save_count: number | null
          share_count: number | null
          updated_at: string | null
          view_count: number | null
        }
        Insert: {
          contact_click_count?: number | null
          created_at?: string | null
          date: string
          dealership_id: string
          id?: string
          inquiry_count?: number | null
          listing_id: string
          phone_click_count?: number | null
          save_count?: number | null
          share_count?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Update: {
          contact_click_count?: number | null
          created_at?: string | null
          date?: string
          dealership_id?: string
          id?: string
          inquiry_count?: number | null
          listing_id?: string
          phone_click_count?: number | null
          save_count?: number | null
          share_count?: number | null
          updated_at?: string | null
          view_count?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_analytics_daily_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_analytics_daily_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_analytics_daily_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_analytics_events: {
        Row: {
          created_at: string | null
          dealership_id: string
          event_type: string
          id: string
          ip_address: unknown
          listing_id: string
          referrer: string | null
          session_id: string | null
          user_agent: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          dealership_id: string
          event_type: string
          id?: string
          ip_address?: unknown
          listing_id: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          dealership_id?: string
          event_type?: string
          id?: string
          ip_address?: unknown
          listing_id?: string
          referrer?: string | null
          session_id?: string | null
          user_agent?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_analytics_events_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_analytics_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_analytics_events_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_analytics_events_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listing_views: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          session_id: string | null
          user_id: string | null
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          session_id?: string | null
          user_id?: string | null
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          session_id?: string | null
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "listing_views_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_views_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "listing_views_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      listings: {
        Row: {
          assigned_market_lane: string | null
          assigned_marketplace_mode:
            | Database["public"]["Enums"]["marketplace_mode"]
            | null
          assigned_road_readiness_state:
            | Database["public"]["Enums"]["road_readiness_state"]
            | null
          body_style: string | null
          canonical_url: string | null
          carly_listing_id: string | null
          condition: string | null
          created_at: string | null
          dealership_id: string
          description: string | null
          disclosure_acknowledged: boolean | null
          estimated_fixes: string[] | null
          features: string[] | null
          id: string
          images: Json | null
          inquiry_count: number | null
          inspection_file_url: string | null
          inspection_uploaded: boolean | null
          intended_use: string[] | null
          issue_severity:
            | Database["public"]["Enums"]["disclosure_severity"]
            | null
          legacy_listing_id: string | null
          location_city: string | null
          location_country: string | null
          location_region: string | null
          make: string | null
          market_lane: string | null
          marketplace_mode:
            | Database["public"]["Enums"]["marketplace_mode"]
            | null
          mileage: number | null
          mileage_unit: string | null
          model: string | null
          original_price: number | null
          price: number | null
          primary_image_url: string | null
          published_at: string | null
          road_readiness_state:
            | Database["public"]["Enums"]["road_readiness_state"]
            | null
          running: boolean | null
          sold_at: string | null
          status: Database["public"]["Enums"]["vehicle_state"] | null
          title: string | null
          trim: string | null
          updated_at: string | null
          view_count: number | null
          vin: string | null
          year: number | null
        }
        Insert: {
          assigned_market_lane?: string | null
          assigned_marketplace_mode?:
            | Database["public"]["Enums"]["marketplace_mode"]
            | null
          assigned_road_readiness_state?:
            | Database["public"]["Enums"]["road_readiness_state"]
            | null
          body_style?: string | null
          canonical_url?: string | null
          carly_listing_id?: string | null
          condition?: string | null
          created_at?: string | null
          dealership_id: string
          description?: string | null
          disclosure_acknowledged?: boolean | null
          estimated_fixes?: string[] | null
          features?: string[] | null
          id?: string
          images?: Json | null
          inquiry_count?: number | null
          inspection_file_url?: string | null
          inspection_uploaded?: boolean | null
          intended_use?: string[] | null
          issue_severity?:
            | Database["public"]["Enums"]["disclosure_severity"]
            | null
          legacy_listing_id?: string | null
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          make?: string | null
          market_lane?: string | null
          marketplace_mode?:
            | Database["public"]["Enums"]["marketplace_mode"]
            | null
          mileage?: number | null
          mileage_unit?: string | null
          model?: string | null
          original_price?: number | null
          price?: number | null
          primary_image_url?: string | null
          published_at?: string | null
          road_readiness_state?:
            | Database["public"]["Enums"]["road_readiness_state"]
            | null
          running?: boolean | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["vehicle_state"] | null
          title?: string | null
          trim?: string | null
          updated_at?: string | null
          view_count?: number | null
          vin?: string | null
          year?: number | null
        }
        Update: {
          assigned_market_lane?: string | null
          assigned_marketplace_mode?:
            | Database["public"]["Enums"]["marketplace_mode"]
            | null
          assigned_road_readiness_state?:
            | Database["public"]["Enums"]["road_readiness_state"]
            | null
          body_style?: string | null
          canonical_url?: string | null
          carly_listing_id?: string | null
          condition?: string | null
          created_at?: string | null
          dealership_id?: string
          description?: string | null
          disclosure_acknowledged?: boolean | null
          estimated_fixes?: string[] | null
          features?: string[] | null
          id?: string
          images?: Json | null
          inquiry_count?: number | null
          inspection_file_url?: string | null
          inspection_uploaded?: boolean | null
          intended_use?: string[] | null
          issue_severity?:
            | Database["public"]["Enums"]["disclosure_severity"]
            | null
          legacy_listing_id?: string | null
          location_city?: string | null
          location_country?: string | null
          location_region?: string | null
          make?: string | null
          market_lane?: string | null
          marketplace_mode?:
            | Database["public"]["Enums"]["marketplace_mode"]
            | null
          mileage?: number | null
          mileage_unit?: string | null
          model?: string | null
          original_price?: number | null
          price?: number | null
          primary_image_url?: string | null
          published_at?: string | null
          road_readiness_state?:
            | Database["public"]["Enums"]["road_readiness_state"]
            | null
          running?: boolean | null
          sold_at?: string | null
          status?: Database["public"]["Enums"]["vehicle_state"] | null
          title?: string | null
          trim?: string | null
          updated_at?: string | null
          view_count?: number | null
          vin?: string | null
          year?: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      marketplace_mode_change_requests: {
        Row: {
          current_mode: Database["public"]["Enums"]["marketplace_mode"] | null
          id: string
          listing_id: string | null
          reason: string | null
          requested_at: string | null
          requested_by: string | null
          requested_mode: Database["public"]["Enums"]["marketplace_mode"] | null
          reviewed_at: string | null
          reviewed_by: string | null
          status: string | null
          supporting_documentation: Json | null
        }
        Insert: {
          current_mode?: Database["public"]["Enums"]["marketplace_mode"] | null
          id?: string
          listing_id?: string | null
          reason?: string | null
          requested_at?: string | null
          requested_by?: string | null
          requested_mode?:
            | Database["public"]["Enums"]["marketplace_mode"]
            | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          supporting_documentation?: Json | null
        }
        Update: {
          current_mode?: Database["public"]["Enums"]["marketplace_mode"] | null
          id?: string
          listing_id?: string | null
          reason?: string | null
          requested_at?: string | null
          requested_by?: string | null
          requested_mode?:
            | Database["public"]["Enums"]["marketplace_mode"]
            | null
          reviewed_at?: string | null
          reviewed_by?: string | null
          status?: string | null
          supporting_documentation?: Json | null
        }
        Relationships: [
          {
            foreignKeyName: "marketplace_mode_change_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_mode_change_requests_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_mode_change_requests_requested_by_fkey"
            columns: ["requested_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "marketplace_mode_change_requests_reviewed_by_fkey"
            columns: ["reviewed_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      messages: {
        Row: {
          attachments: Json | null
          content: string
          conversation_id: string
          created_at: string | null
          id: string
          read_at: string | null
          sender_id: string
          status: Database["public"]["Enums"]["message_status"] | null
          updated_at: string | null
        }
        Insert: {
          attachments?: Json | null
          content: string
          conversation_id: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id: string
          status?: Database["public"]["Enums"]["message_status"] | null
          updated_at?: string | null
        }
        Update: {
          attachments?: Json | null
          content?: string
          conversation_id?: string
          created_at?: string | null
          id?: string
          read_at?: string | null
          sender_id?: string
          status?: Database["public"]["Enums"]["message_status"] | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "messages_conversation_id_fkey"
            columns: ["conversation_id"]
            isOneToOne: false
            referencedRelation: "conversations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "messages_sender_id_fkey"
            columns: ["sender_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          city: string | null
          created_at: string | null
          dealership_id: string | null
          email: string
          id: string
          name: string | null
          phone: string | null
          region: string | null
          role: Database["public"]["Enums"]["user_role"]
          updated_at: string | null
          verified: boolean | null
        }
        Insert: {
          city?: string | null
          created_at?: string | null
          dealership_id?: string | null
          email: string
          id: string
          name?: string | null
          phone?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          verified?: boolean | null
        }
        Update: {
          city?: string | null
          created_at?: string | null
          dealership_id?: string | null
          email?: string
          id?: string
          name?: string | null
          phone?: string | null
          region?: string | null
          role?: Database["public"]["Enums"]["user_role"]
          updated_at?: string | null
          verified?: boolean | null
        }
        Relationships: [
          {
            foreignKeyName: "fk_dealership"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      saved_listings: {
        Row: {
          created_at: string | null
          id: string
          listing_id: string
          notes: string | null
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          listing_id: string
          notes?: string | null
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          listing_id?: string
          notes?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_listings_listing_id_fkey"
            columns: ["listing_id"]
            isOneToOne: false
            referencedRelation: "public_listings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "saved_listings_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
        ]
      }
      team_invitations: {
        Row: {
          accepted_at: string | null
          created_at: string
          dealership_id: string
          email: string
          expires_at: string
          id: string
          invitation_token: string
          invited_by: string
          role: string
          status: string
        }
        Insert: {
          accepted_at?: string | null
          created_at?: string
          dealership_id: string
          email: string
          expires_at: string
          id?: string
          invitation_token: string
          invited_by: string
          role: string
          status?: string
        }
        Update: {
          accepted_at?: string | null
          created_at?: string
          dealership_id?: string
          email?: string
          expires_at?: string
          id?: string
          invitation_token?: string
          invited_by?: string
          role?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_invited_by"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_invitations_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      team_members: {
        Row: {
          created_at: string
          dealership_id: string
          id: string
          invited_at: string | null
          invited_by: string | null
          joined_at: string | null
          role: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          dealership_id: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          dealership_id?: string
          id?: string
          invited_at?: string | null
          invited_by?: string | null
          joined_at?: string | null
          role?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "fk_invited_by_member"
            columns: ["invited_by"]
            isOneToOne: false
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "fk_user"
            columns: ["user_id"]
            isOneToOne: true
            referencedRelation: "profiles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "team_members_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
      user_hidden_patterns: {
        Row: {
          body_type: string | null
          fuel_type: string | null
          id: string
          make: string | null
          penalty_weight: number | null
          updated_at: string | null
          user_id: string
        }
        Insert: {
          body_type?: string | null
          fuel_type?: string | null
          id?: string
          make?: string | null
          penalty_weight?: number | null
          updated_at?: string | null
          user_id: string
        }
        Update: {
          body_type?: string | null
          fuel_type?: string | null
          id?: string
          make?: string | null
          penalty_weight?: number | null
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      user_interactions: {
        Row: {
          created_at: string | null
          id: string
          interaction_type: string
          listing_id: string
          user_id: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          interaction_type: string
          listing_id: string
          user_id: string
        }
        Update: {
          created_at?: string | null
          id?: string
          interaction_type?: string
          listing_id?: string
          user_id?: string
        }
        Relationships: []
      }
      user_preferences: {
        Row: {
          budget_max: number | null
          budget_min: number | null
          mileage_tolerance: string | null
          preferred_body_types: string[] | null
          preferred_fuel_types: string[] | null
          preferred_makes: string[] | null
          updated_at: string | null
          user_id: string
          vehicle_age_preference: string | null
        }
        Insert: {
          budget_max?: number | null
          budget_min?: number | null
          mileage_tolerance?: string | null
          preferred_body_types?: string[] | null
          preferred_fuel_types?: string[] | null
          preferred_makes?: string[] | null
          updated_at?: string | null
          user_id: string
          vehicle_age_preference?: string | null
        }
        Update: {
          budget_max?: number | null
          budget_min?: number | null
          mileage_tolerance?: string | null
          preferred_body_types?: string[] | null
          preferred_fuel_types?: string[] | null
          preferred_makes?: string[] | null
          updated_at?: string | null
          user_id?: string
          vehicle_age_preference?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      public_listings: {
        Row: {
          carly_listing_id: string | null
          created_at: string | null
          dealership_city: string | null
          dealership_id: string | null
          dealership_name: string | null
          dealership_region: string | null
          dealership_trade_name: string | null
          id: string | null
          images: Json | null
          inquiry_count: number | null
          make: string | null
          marketplace_mode:
            | Database["public"]["Enums"]["marketplace_mode"]
            | null
          mileage: number | null
          model: string | null
          price: number | null
          primary_image_url: string | null
          published_at: string | null
          road_readiness_state:
            | Database["public"]["Enums"]["road_readiness_state"]
            | null
          trim: string | null
          view_count: number | null
          vin: string | null
          year: number | null
        }
        Relationships: [
          {
            foreignKeyName: "listings_dealership_id_fkey"
            columns: ["dealership_id"]
            isOneToOne: false
            referencedRelation: "dealerships"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Functions: {
      aggregate_dealership_analytics_daily: { Args: never; Returns: undefined }
      aggregate_inquiry_sla_metrics_daily: { Args: never; Returns: undefined }
      aggregate_listing_analytics_daily: { Args: never; Returns: undefined }
      calculate_engagement_score: {
        Args: {
          p_has_inquired: boolean
          p_has_saved: boolean
          p_view_count: number
        }
        Returns: number
      }
      can_dealership_publish: {
        Args: { dealership_uuid: string }
        Returns: boolean
      }
      generate_listing_canonical_url: {
        Args: {
          p_city: string
          p_listing_id: string
          p_make: string
          p_model: string
          p_year: number
        }
        Returns: string
      }
    }
    Enums: {
      appointment_status:
        | "scheduled"
        | "confirmed"
        | "completed"
        | "cancelled"
        | "no_show"
      dealership_lifecycle_status:
        | "pending"
        | "approved"
        | "active"
        | "rejected"
      dealership_operational_status: "enabled" | "disabled"
      disclosure_severity: "minor" | "moderate" | "major" | "critical"
      marketplace_mode: "carly_verified" | "the_hub" | "builders_market"
      message_status: "sent" | "delivered" | "read"
      road_readiness_state:
        | "ready_to_go"
        | "needs_attention"
        | "major_repairs"
        | "as_is"
      user_role: "buyer" | "dealer" | "admin"
      vehicle_state:
        | "draft"
        | "active"
        | "sold"
        | "deleted"
        | "new_inventory"
        | "pending_approval"
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
      appointment_status: [
        "scheduled",
        "confirmed",
        "completed",
        "cancelled",
        "no_show",
      ],
      dealership_lifecycle_status: [
        "pending",
        "approved",
        "active",
        "rejected",
      ],
      dealership_operational_status: ["enabled", "disabled"],
      disclosure_severity: ["minor", "moderate", "major", "critical"],
      marketplace_mode: ["carly_verified", "the_hub", "builders_market"],
      message_status: ["sent", "delivered", "read"],
      road_readiness_state: [
        "ready_to_go",
        "needs_attention",
        "major_repairs",
        "as_is",
      ],
      user_role: ["buyer", "dealer", "admin"],
      vehicle_state: [
        "draft",
        "active",
        "sold",
        "deleted",
        "new_inventory",
        "pending_approval",
      ],
    },
  },
} as const
