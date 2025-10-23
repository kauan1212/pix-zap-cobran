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
    PostgrestVersion: "12.2.3 (519615d)"
  }
  public: {
    Tables: {
      amortization_applications: {
        Row: {
          amortization_id: string
          amount_applied: number
          billing_id: string
          billing_remaining: number
          created_at: string
          id: string
        }
        Insert: {
          amortization_id: string
          amount_applied: number
          billing_id: string
          billing_remaining: number
          created_at?: string
          id?: string
        }
        Update: {
          amortization_id?: string
          amount_applied?: number
          billing_id?: string
          billing_remaining?: number
          created_at?: string
          id?: string
        }
        Relationships: [
          {
            foreignKeyName: "amortization_applications_amortization_id_fkey"
            columns: ["amortization_id"]
            isOneToOne: false
            referencedRelation: "payment_amortizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "amortization_applications_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "billings"
            referencedColumns: ["id"]
          },
        ]
      }
      amortization_logs: {
        Row: {
          action: string
          amortization_id: string | null
          created_at: string
          details: Json | null
          id: string
          user_id: string
        }
        Insert: {
          action: string
          amortization_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          user_id: string
        }
        Update: {
          action?: string
          amortization_id?: string | null
          created_at?: string
          details?: Json | null
          id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "amortization_logs_amortization_id_fkey"
            columns: ["amortization_id"]
            isOneToOne: false
            referencedRelation: "payment_amortizations"
            referencedColumns: ["id"]
          },
        ]
      }
      auto_billing_plans: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          description: string
          end_date: string
          frequency: string
          id: string
          is_active: boolean
          name: string
          start_date: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          description: string
          end_date: string
          frequency: string
          id?: string
          is_active?: boolean
          name: string
          start_date: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          description?: string
          end_date?: string
          frequency?: string
          id?: string
          is_active?: boolean
          name?: string
          start_date?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "auto_billing_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      automatic_billing_config: {
        Row: {
          created_at: string
          daily_send_time: string
          id: string
          is_active: boolean
          message_template: string
          updated_at: string
          user_id: string
          whatsapp_number: string
        }
        Insert: {
          created_at?: string
          daily_send_time?: string
          id?: string
          is_active?: boolean
          message_template?: string
          updated_at?: string
          user_id: string
          whatsapp_number: string
        }
        Update: {
          created_at?: string
          daily_send_time?: string
          id?: string
          is_active?: boolean
          message_template?: string
          updated_at?: string
          user_id?: string
          whatsapp_number?: string
        }
        Relationships: []
      }
      automatic_billing_logs: {
        Row: {
          billing_id: string
          client_id: string
          created_at: string
          id: string
          message_content: string
          message_sent_at: string
          status: string
          user_id: string
        }
        Insert: {
          billing_id: string
          client_id: string
          created_at?: string
          id?: string
          message_content: string
          message_sent_at?: string
          status?: string
          user_id: string
        }
        Update: {
          billing_id?: string
          client_id?: string
          created_at?: string
          id?: string
          message_content?: string
          message_sent_at?: string
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "automatic_billing_logs_billing_id_fkey"
            columns: ["billing_id"]
            isOneToOne: false
            referencedRelation: "billings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "automatic_billing_logs_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      billings: {
        Row: {
          amortized_amount: number
          amount: number
          auto_billing_enabled: boolean
          auto_billing_plan_id: string | null
          client_id: string
          created_at: string
          description: string
          due_date: string
          id: string
          interest: number | null
          payment_date: string | null
          penalty: number | null
          receipt_confirmed_at: string | null
          receipt_submitted_at: string | null
          receipt_url: string | null
          recurring_plan_id: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          amortized_amount?: number
          amount: number
          auto_billing_enabled?: boolean
          auto_billing_plan_id?: string | null
          client_id: string
          created_at?: string
          description: string
          due_date: string
          id?: string
          interest?: number | null
          payment_date?: string | null
          penalty?: number | null
          receipt_confirmed_at?: string | null
          receipt_submitted_at?: string | null
          receipt_url?: string | null
          recurring_plan_id?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          amortized_amount?: number
          amount?: number
          auto_billing_enabled?: boolean
          auto_billing_plan_id?: string | null
          client_id?: string
          created_at?: string
          description?: string
          due_date?: string
          id?: string
          interest?: number | null
          payment_date?: string | null
          penalty?: number | null
          receipt_confirmed_at?: string | null
          receipt_submitted_at?: string | null
          receipt_url?: string | null
          recurring_plan_id?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "billings_auto_billing_plan_id_fkey"
            columns: ["auto_billing_plan_id"]
            isOneToOne: false
            referencedRelation: "auto_billing_plans"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billings_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "billings_recurring_plan_id_fkey"
            columns: ["recurring_plan_id"]
            isOneToOne: false
            referencedRelation: "recurring_plans"
            referencedColumns: ["id"]
          },
        ]
      }
      checklist_photos: {
        Row: {
          checklist_id: string
          created_at: string | null
          id: string
          photo_name: string | null
          photo_url: string
        }
        Insert: {
          checklist_id: string
          created_at?: string | null
          id?: string
          photo_name?: string | null
          photo_url: string
        }
        Update: {
          checklist_id?: string
          created_at?: string | null
          id?: string
          photo_name?: string | null
          photo_url?: string
        }
        Relationships: []
      }
      checklists: {
        Row: {
          brakes_observation: string | null
          brakes_status: string | null
          cleaning_observation: string | null
          cleaning_status: string | null
          completed_at: string | null
          condominium_id: string | null
          coolant_observation: string | null
          coolant_status: string | null
          created_at: string | null
          damages: string | null
          electrical_observation: string | null
          electrical_status: string | null
          engine_oil_observation: string | null
          engine_oil_status: string | null
          face_photo: string | null
          fuel_level: number | null
          fuel_photos: string[] | null
          general_observations: string | null
          id: string
          km_photos: string[] | null
          leaks_observation: string | null
          leaks_status: string | null
          lights_observation: string | null
          lights_status: string | null
          motorcycle_id: string | null
          motorcycle_km: string | null
          motorcycle_photos: string[] | null
          motorcycle_plate: string
          signature: string | null
          status: string | null
          suspension_observation: string | null
          suspension_status: string | null
          tires_observation: string | null
          tires_status: string | null
          type: string
          vigilante_id: string | null
          vigilante_name: string
        }
        Insert: {
          brakes_observation?: string | null
          brakes_status?: string | null
          cleaning_observation?: string | null
          cleaning_status?: string | null
          completed_at?: string | null
          condominium_id?: string | null
          coolant_observation?: string | null
          coolant_status?: string | null
          created_at?: string | null
          damages?: string | null
          electrical_observation?: string | null
          electrical_status?: string | null
          engine_oil_observation?: string | null
          engine_oil_status?: string | null
          face_photo?: string | null
          fuel_level?: number | null
          fuel_photos?: string[] | null
          general_observations?: string | null
          id?: string
          km_photos?: string[] | null
          leaks_observation?: string | null
          leaks_status?: string | null
          lights_observation?: string | null
          lights_status?: string | null
          motorcycle_id?: string | null
          motorcycle_km?: string | null
          motorcycle_photos?: string[] | null
          motorcycle_plate: string
          signature?: string | null
          status?: string | null
          suspension_observation?: string | null
          suspension_status?: string | null
          tires_observation?: string | null
          tires_status?: string | null
          type: string
          vigilante_id?: string | null
          vigilante_name: string
        }
        Update: {
          brakes_observation?: string | null
          brakes_status?: string | null
          cleaning_observation?: string | null
          cleaning_status?: string | null
          completed_at?: string | null
          condominium_id?: string | null
          coolant_observation?: string | null
          coolant_status?: string | null
          created_at?: string | null
          damages?: string | null
          electrical_observation?: string | null
          electrical_status?: string | null
          engine_oil_observation?: string | null
          engine_oil_status?: string | null
          face_photo?: string | null
          fuel_level?: number | null
          fuel_photos?: string[] | null
          general_observations?: string | null
          id?: string
          km_photos?: string[] | null
          leaks_observation?: string | null
          leaks_status?: string | null
          lights_observation?: string | null
          lights_status?: string | null
          motorcycle_id?: string | null
          motorcycle_km?: string | null
          motorcycle_photos?: string[] | null
          motorcycle_plate?: string
          signature?: string | null
          status?: string | null
          suspension_observation?: string | null
          suspension_status?: string | null
          tires_observation?: string | null
          tires_status?: string | null
          type?: string
          vigilante_id?: string | null
          vigilante_name?: string
        }
        Relationships: [
          {
            foreignKeyName: "checklists_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_motorcycle_id_fkey"
            columns: ["motorcycle_id"]
            isOneToOne: false
            referencedRelation: "motorcycles"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "checklists_vigilante_id_fkey"
            columns: ["vigilante_id"]
            isOneToOne: false
            referencedRelation: "vigilantes"
            referencedColumns: ["id"]
          },
        ]
      }
      client_access_tokens: {
        Row: {
          client_id: string
          created_at: string | null
          expires_at: string
          id: string
          token: string
        }
        Insert: {
          client_id: string
          created_at?: string | null
          expires_at: string
          id?: string
          token: string
        }
        Update: {
          client_id?: string
          created_at?: string | null
          expires_at?: string
          id?: string
          token?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_access_tokens_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      client_credits: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          expires_at: string | null
          id: string
          source: string
          status: string
          used_amount: number
          user_id: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          expires_at?: string | null
          id?: string
          source?: string
          status?: string
          used_amount?: number
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          expires_at?: string | null
          id?: string
          source?: string
          status?: string
          used_amount?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "client_credits_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      clients: {
        Row: {
          address: string | null
          cpf_cnpj: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          show_total_pending: boolean | null
          updated_at: string
          user_id: string
        }
        Insert: {
          address?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          show_total_pending?: boolean | null
          updated_at?: string
          user_id: string
        }
        Update: {
          address?: string | null
          cpf_cnpj?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          show_total_pending?: boolean | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      condominiums: {
        Row: {
          address: string | null
          created_at: string
          email: string | null
          id: string
          name: string
          phone: string | null
          updated_at: string
        }
        Insert: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name: string
          phone?: string | null
          updated_at?: string
        }
        Update: {
          address?: string | null
          created_at?: string
          email?: string | null
          id?: string
          name?: string
          phone?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      extra_services: {
        Row: {
          amount: number
          client_id: string
          created_at: string | null
          description: string
          id: string
          paid_at: string | null
          status: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string | null
          description: string
          id?: string
          paid_at?: string | null
          status?: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string | null
          description?: string
          id?: string
          paid_at?: string | null
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "extra_services_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      matches: {
        Row: {
          created_at: string
          id: string
          is_mutual: boolean | null
          user1_id: string
          user1_liked: boolean | null
          user2_id: string
          user2_liked: boolean | null
        }
        Insert: {
          created_at?: string
          id?: string
          is_mutual?: boolean | null
          user1_id: string
          user1_liked?: boolean | null
          user2_id: string
          user2_liked?: boolean | null
        }
        Update: {
          created_at?: string
          id?: string
          is_mutual?: boolean | null
          user1_id?: string
          user1_liked?: boolean | null
          user2_id?: string
          user2_liked?: boolean | null
        }
        Relationships: []
      }
      messages: {
        Row: {
          content: string
          created_at: string
          id: string
          is_read: boolean | null
          match_id: string
          message_type: string | null
          sender_id: string
        }
        Insert: {
          content: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          match_id: string
          message_type?: string | null
          sender_id: string
        }
        Update: {
          content?: string
          created_at?: string
          id?: string
          is_read?: boolean | null
          match_id?: string
          message_type?: string | null
          sender_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "messages_match_id_fkey"
            columns: ["match_id"]
            isOneToOne: false
            referencedRelation: "matches"
            referencedColumns: ["id"]
          },
        ]
      }
      motorcycles: {
        Row: {
          brand: string
          color: string
          condominium_id: string | null
          created_at: string | null
          id: string
          model: string
          plate: string
          status: string | null
          updated_at: string | null
          year: number
        }
        Insert: {
          brand: string
          color: string
          condominium_id?: string | null
          created_at?: string | null
          id?: string
          model: string
          plate: string
          status?: string | null
          updated_at?: string | null
          year: number
        }
        Update: {
          brand?: string
          color?: string
          condominium_id?: string | null
          created_at?: string | null
          id?: string
          model?: string
          plate?: string
          status?: string | null
          updated_at?: string | null
          year?: number
        }
        Relationships: [
          {
            foreignKeyName: "motorcycles_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      payment_amortizations: {
        Row: {
          client_id: string
          created_at: string
          discount_applied: number
          id: string
          payment_amount: number
          payment_code: string
          processed_at: string | null
          processed_by: string | null
          status: string
          total_credit: number
          user_id: string
        }
        Insert: {
          client_id: string
          created_at?: string
          discount_applied?: number
          id?: string
          payment_amount: number
          payment_code: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          total_credit: number
          user_id: string
        }
        Update: {
          client_id?: string
          created_at?: string
          discount_applied?: number
          id?: string
          payment_amount?: number
          payment_code?: string
          processed_at?: string | null
          processed_by?: string | null
          status?: string
          total_credit?: number
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payment_amortizations_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      personal_trainers: {
        Row: {
          available_hours: string[] | null
          average_rating: number | null
          bio: string | null
          certifications: string[] | null
          created_at: string
          experience_years: number | null
          full_name: string
          hourly_rate: number | null
          id: string
          is_verified: boolean | null
          profile_photos: string[] | null
          specialties: string[] | null
          total_reviews: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          available_hours?: string[] | null
          average_rating?: number | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          experience_years?: number | null
          full_name: string
          hourly_rate?: number | null
          id?: string
          is_verified?: boolean | null
          profile_photos?: string[] | null
          specialties?: string[] | null
          total_reviews?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          available_hours?: string[] | null
          average_rating?: number | null
          bio?: string | null
          certifications?: string[] | null
          created_at?: string
          experience_years?: number | null
          full_name?: string
          hourly_rate?: number | null
          id?: string
          is_verified?: boolean | null
          profile_photos?: string[] | null
          specialties?: string[] | null
          total_reviews?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          access_granted: boolean | null
          account_frozen: boolean | null
          company: string | null
          created_at: string | null
          email: string | null
          frozen_reason: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          pix_key: string | null
          updated_at: string | null
          whatsapp: string | null
        }
        Insert: {
          access_granted?: boolean | null
          account_frozen?: boolean | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          frozen_reason?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          pix_key?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Update: {
          access_granted?: boolean | null
          account_frozen?: boolean | null
          company?: string | null
          created_at?: string | null
          email?: string | null
          frozen_reason?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          pix_key?: string | null
          updated_at?: string | null
          whatsapp?: string | null
        }
        Relationships: []
      }
      push_subscriptions: {
        Row: {
          auth: string
          client_id: string | null
          created_at: string | null
          endpoint: string
          id: string
          is_admin: boolean | null
          p256dh: string
        }
        Insert: {
          auth: string
          client_id?: string | null
          created_at?: string | null
          endpoint: string
          id?: string
          is_admin?: boolean | null
          p256dh: string
        }
        Update: {
          auth?: string
          client_id?: string | null
          created_at?: string | null
          endpoint?: string
          id?: string
          is_admin?: boolean | null
          p256dh?: string
        }
        Relationships: [
          {
            foreignKeyName: "push_subscriptions_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      recurring_plans: {
        Row: {
          amount: number
          client_id: string
          created_at: string
          description: string
          frequency: string
          id: string
          interest: number | null
          is_active: boolean
          name: string
          next_billing_date: string
          penalty: number | null
          updated_at: string
          user_id: string
        }
        Insert: {
          amount: number
          client_id: string
          created_at?: string
          description: string
          frequency: string
          id?: string
          interest?: number | null
          is_active?: boolean
          name: string
          next_billing_date: string
          penalty?: number | null
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          client_id?: string
          created_at?: string
          description?: string
          frequency?: string
          id?: string
          interest?: number | null
          is_active?: boolean
          name?: string
          next_billing_date?: string
          penalty?: number | null
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recurring_plans_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
        ]
      }
      renters: {
        Row: {
          created_at: string | null
          id: string
          name: string
          rg: string
        }
        Insert: {
          created_at?: string | null
          id?: string
          name: string
          rg: string
        }
        Update: {
          created_at?: string | null
          id?: string
          name?: string
          rg?: string
        }
        Relationships: []
      }
      swipes: {
        Row: {
          created_at: string
          id: string
          liked: boolean
          swiped_id: string
          swiper_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          liked: boolean
          swiped_id: string
          swiper_id: string
        }
        Update: {
          created_at?: string
          id?: string
          liked?: boolean
          swiped_id?: string
          swiper_id?: string
        }
        Relationships: []
      }
      trainer_bookings: {
        Row: {
          booking_date: string
          booking_time: string
          client_id: string
          created_at: string
          duration_minutes: number | null
          id: string
          notes: string | null
          payment_status: string | null
          status: string | null
          total_amount: number
          trainer_id: string
          updated_at: string
        }
        Insert: {
          booking_date: string
          booking_time: string
          client_id: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          status?: string | null
          total_amount: number
          trainer_id: string
          updated_at?: string
        }
        Update: {
          booking_date?: string
          booking_time?: string
          client_id?: string
          created_at?: string
          duration_minutes?: number | null
          id?: string
          notes?: string | null
          payment_status?: string | null
          status?: string | null
          total_amount?: number
          trainer_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_bookings_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "personal_trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      trainer_reviews: {
        Row: {
          booking_id: string
          client_id: string
          created_at: string
          id: string
          rating: number
          review_text: string | null
          trainer_id: string
        }
        Insert: {
          booking_id: string
          client_id: string
          created_at?: string
          id?: string
          rating: number
          review_text?: string | null
          trainer_id: string
        }
        Update: {
          booking_id?: string
          client_id?: string
          created_at?: string
          id?: string
          rating?: number
          review_text?: string | null
          trainer_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trainer_reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: true
            referencedRelation: "trainer_bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trainer_reviews_trainer_id_fkey"
            columns: ["trainer_id"]
            isOneToOne: false
            referencedRelation: "personal_trainers"
            referencedColumns: ["id"]
          },
        ]
      }
      user_profiles: {
        Row: {
          audio_intro_url: string | null
          available_hours: string[] | null
          bio: string | null
          birth_date: string | null
          city: string | null
          created_at: string
          extra_photos_urls: string[] | null
          full_name: string
          id: string
          instagram_url: string | null
          intention: string | null
          is_verified: boolean | null
          main_photo_url: string | null
          neighborhood: string | null
          primary_gym: string | null
          training_goals: string[] | null
          updated_at: string
          user_id: string
          whatsapp: string | null
        }
        Insert: {
          audio_intro_url?: string | null
          available_hours?: string[] | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          created_at?: string
          extra_photos_urls?: string[] | null
          full_name: string
          id?: string
          instagram_url?: string | null
          intention?: string | null
          is_verified?: boolean | null
          main_photo_url?: string | null
          neighborhood?: string | null
          primary_gym?: string | null
          training_goals?: string[] | null
          updated_at?: string
          user_id: string
          whatsapp?: string | null
        }
        Update: {
          audio_intro_url?: string | null
          available_hours?: string[] | null
          bio?: string | null
          birth_date?: string | null
          city?: string | null
          created_at?: string
          extra_photos_urls?: string[] | null
          full_name?: string
          id?: string
          instagram_url?: string | null
          intention?: string | null
          is_verified?: boolean | null
          main_photo_url?: string | null
          neighborhood?: string | null
          primary_gym?: string | null
          training_goals?: string[] | null
          updated_at?: string
          user_id?: string
          whatsapp?: string | null
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
          role?: Database["public"]["Enums"]["app_role"]
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
      vehicle_expenses: {
        Row: {
          amount: number
          created_at: string | null
          description: string
          expense_date: string
          id: string
          service_type: string | null
          vehicle_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          description: string
          expense_date: string
          id?: string
          service_type?: string | null
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          description?: string
          expense_date?: string
          id?: string
          service_type?: string | null
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_expenses_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicle_revenues: {
        Row: {
          amount: number
          client_id: string | null
          created_at: string | null
          description: string | null
          id: string
          payment_date: string
          vehicle_id: string | null
        }
        Insert: {
          amount: number
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_date: string
          vehicle_id?: string | null
        }
        Update: {
          amount?: number
          client_id?: string | null
          created_at?: string | null
          description?: string | null
          id?: string
          payment_date?: string
          vehicle_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vehicle_revenues_client_id_fkey"
            columns: ["client_id"]
            isOneToOne: false
            referencedRelation: "clients"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "vehicle_revenues_vehicle_id_fkey"
            columns: ["vehicle_id"]
            isOneToOne: false
            referencedRelation: "vehicles"
            referencedColumns: ["id"]
          },
        ]
      }
      vehicles: {
        Row: {
          acquisition_cost: number
          acquisition_date: string
          created_at: string | null
          id: string
          model: string
          plate: string
          updated_at: string | null
          user_id: string | null
          year: number
        }
        Insert: {
          acquisition_cost: number
          acquisition_date: string
          created_at?: string | null
          id?: string
          model: string
          plate: string
          updated_at?: string | null
          user_id?: string | null
          year: number
        }
        Update: {
          acquisition_cost?: number
          acquisition_date?: string
          created_at?: string | null
          id?: string
          model?: string
          plate?: string
          updated_at?: string | null
          user_id?: string | null
          year?: number
        }
        Relationships: []
      }
      vigilantes: {
        Row: {
          condominium_id: string | null
          created_at: string | null
          email: string
          id: string
          name: string
          registration: string
          status: string | null
          updated_at: string | null
        }
        Insert: {
          condominium_id?: string | null
          created_at?: string | null
          email: string
          id?: string
          name: string
          registration: string
          status?: string | null
          updated_at?: string | null
        }
        Update: {
          condominium_id?: string | null
          created_at?: string | null
          email?: string
          id?: string
          name?: string
          registration?: string
          status?: string | null
          updated_at?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "vigilantes_condominium_id_fkey"
            columns: ["condominium_id"]
            isOneToOne: false
            referencedRelation: "condominiums"
            referencedColumns: ["id"]
          },
        ]
      }
      workout_sessions: {
        Row: {
          created_at: string
          feedback_organizer: string | null
          feedback_partner: string | null
          gym_name: string
          id: string
          organizer_confirmed: boolean | null
          organizer_id: string
          partner_confirmed: boolean | null
          partner_id: string
          rating_organizer: number | null
          rating_partner: number | null
          status: string | null
          updated_at: string
          workout_date: string
          workout_time: string
          workout_type: string | null
        }
        Insert: {
          created_at?: string
          feedback_organizer?: string | null
          feedback_partner?: string | null
          gym_name: string
          id?: string
          organizer_confirmed?: boolean | null
          organizer_id: string
          partner_confirmed?: boolean | null
          partner_id: string
          rating_organizer?: number | null
          rating_partner?: number | null
          status?: string | null
          updated_at?: string
          workout_date: string
          workout_time: string
          workout_type?: string | null
        }
        Update: {
          created_at?: string
          feedback_organizer?: string | null
          feedback_partner?: string | null
          gym_name?: string
          id?: string
          organizer_confirmed?: boolean | null
          organizer_id?: string
          partner_confirmed?: boolean | null
          partner_id?: string
          rating_organizer?: number | null
          rating_partner?: number | null
          status?: string | null
          updated_at?: string
          workout_date?: string
          workout_time?: string
          workout_type?: string | null
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      create_user_with_profile: {
        Args: {
          user_company: string
          user_email: string
          user_full_name: string
          user_password: string
        }
        Returns: Json
      }
      delete_user_complete: { Args: { user_email: string }; Returns: string }
      generate_client_token: { Args: never; Returns: string }
      generate_payment_code: { Args: never; Returns: string }
      get_all_profiles: {
        Args: never
        Returns: {
          access_granted: boolean
          account_frozen: boolean
          company: string
          created_at: string
          email: string
          frozen_reason: string
          full_name: string
          id: string
          is_admin: boolean
          pix_key: string
          updated_at: string
          whatsapp: string
        }[]
      }
      get_all_profiles_simple: {
        Args: never
        Returns: {
          access_granted: boolean
          account_frozen: boolean
          created_at: string
          email: string
          frozen_reason: string
          full_name: string
          id: string
          is_admin: boolean
          pix_key: string
          updated_at: string
          whatsapp: string
        }[]
      }
      has_role: {
        Args: {
          _role: Database["public"]["Enums"]["app_role"]
          _user_id: string
        }
        Returns: boolean
      }
      is_current_user_admin: { Args: never; Returns: boolean }
    }
    Enums: {
      app_role: "admin" | "user"
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
      app_role: ["admin", "user"],
    },
  },
} as const
