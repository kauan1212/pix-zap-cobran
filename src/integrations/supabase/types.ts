export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  public: {
    Tables: {
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
        Relationships: [
          {
            foreignKeyName: "checklist_photos_checklist_id_fkey"
            columns: ["checklist_id"]
            isOneToOne: false
            referencedRelation: "checklists"
            referencedColumns: ["id"]
          },
        ]
      }
      checklists: {
        Row: {
          brakes_condition: string | null
          created_at: string | null
          documentation_condition: string | null
          general_observations: string | null
          id: string
          inspector_signature: string | null
          lights_condition: string | null
          oils_condition: string | null
          renter_signature: string | null
          tires_condition: string | null
          updated_at: string | null
          user_id: string
          vehicle_brand: string
          vehicle_km: string
          vehicle_model: string
          vehicle_plate: string
          vehicle_year: string
        }
        Insert: {
          brakes_condition?: string | null
          created_at?: string | null
          documentation_condition?: string | null
          general_observations?: string | null
          id?: string
          inspector_signature?: string | null
          lights_condition?: string | null
          oils_condition?: string | null
          renter_signature?: string | null
          tires_condition?: string | null
          updated_at?: string | null
          user_id: string
          vehicle_brand: string
          vehicle_km: string
          vehicle_model: string
          vehicle_plate: string
          vehicle_year: string
        }
        Update: {
          brakes_condition?: string | null
          created_at?: string | null
          documentation_condition?: string | null
          general_observations?: string | null
          id?: string
          inspector_signature?: string | null
          lights_condition?: string | null
          oils_condition?: string | null
          renter_signature?: string | null
          tires_condition?: string | null
          updated_at?: string | null
          user_id?: string
          vehicle_brand?: string
          vehicle_km?: string
          vehicle_model?: string
          vehicle_plate?: string
          vehicle_year?: string
        }
        Relationships: []
      }
      motorcycles: {
        Row: {
          chassis: string
          color: string
          created_at: string | null
          engine: string
          id: string
          model: string
          plate: string
          renavam: string
        }
        Insert: {
          chassis: string
          color: string
          created_at?: string | null
          engine: string
          id?: string
          model: string
          plate: string
          renavam: string
        }
        Update: {
          chassis?: string
          color?: string
          created_at?: string | null
          engine?: string
          id?: string
          model?: string
          plate?: string
          renavam?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          created_at: string | null
          email: string | null
          full_name: string | null
          id: string
          is_admin: boolean | null
          updated_at: string | null
        }
        Insert: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id: string
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Update: {
          created_at?: string | null
          email?: string | null
          full_name?: string | null
          id?: string
          is_admin?: boolean | null
          updated_at?: string | null
        }
        Relationships: []
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
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DefaultSchema = Database[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? (Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      Database[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
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
    | { schema: keyof Database },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends { schema: keyof Database }
  ? Database[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof Database },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof Database
  }
    ? keyof Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends { schema: keyof Database }
  ? Database[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
