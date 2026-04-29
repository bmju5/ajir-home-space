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
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      bookings: {
        Row: {
          check_in: string
          check_out: string
          created_at: string
          guest_id: string
          guests: number
          id: string
          property_id: string
          status: Database["public"]["Enums"]["booking_status"]
          total_price: number
          updated_at: string
        }
        Insert: {
          check_in: string
          check_out: string
          created_at?: string
          guest_id: string
          guests?: number
          id?: string
          property_id: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
        }
        Update: {
          check_in?: string
          check_out?: string
          created_at?: string
          guest_id?: string
          guests?: number
          id?: string
          property_id?: string
          status?: Database["public"]["Enums"]["booking_status"]
          total_price?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "bookings_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      coupons: {
        Row: {
          code: string
          created_at: string
          created_by: string | null
          discount_type: Database["public"]["Enums"]["discount_type"]
          discount_value: number
          expires_at: string | null
          id: string
          is_active: boolean
          max_uses: number | null
          min_spend: number
          scope: Database["public"]["Enums"]["coupon_scope"]
          starts_at: string
          title: string
          updated_at: string
          used_count: number
        }
        Insert: {
          code: string
          created_at?: string
          created_by?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_spend?: number
          scope?: Database["public"]["Enums"]["coupon_scope"]
          starts_at?: string
          title: string
          updated_at?: string
          used_count?: number
        }
        Update: {
          code?: string
          created_at?: string
          created_by?: string | null
          discount_type?: Database["public"]["Enums"]["discount_type"]
          discount_value?: number
          expires_at?: string | null
          id?: string
          is_active?: boolean
          max_uses?: number | null
          min_spend?: number
          scope?: Database["public"]["Enums"]["coupon_scope"]
          starts_at?: string
          title?: string
          updated_at?: string
          used_count?: number
        }
        Relationships: []
      }
      experience_bookings: {
        Row: {
          booking_date: string
          coupon_code: string | null
          created_at: string
          discount_amount: number
          experience_id: string
          final_price: number
          guests: number
          id: string
          status: Database["public"]["Enums"]["ajir_order_status"]
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_date: string
          coupon_code?: string | null
          created_at?: string
          discount_amount?: number
          experience_id: string
          final_price?: number
          guests?: number
          id?: string
          status?: Database["public"]["Enums"]["ajir_order_status"]
          total_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_date?: string
          coupon_code?: string | null
          created_at?: string
          discount_amount?: number
          experience_id?: string
          final_price?: number
          guests?: number
          id?: string
          status?: Database["public"]["Enums"]["ajir_order_status"]
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "experience_bookings_experience_id_fkey"
            columns: ["experience_id"]
            isOneToOne: false
            referencedRelation: "experiences"
            referencedColumns: ["id"]
          },
        ]
      }
      experiences: {
        Row: {
          available_dates: string[]
          created_at: string
          currency: string
          description: string
          duration_hours: number
          id: string
          is_active: boolean
          location: string
          max_guests: number
          price: number
          title: string
          updated_at: string
        }
        Insert: {
          available_dates?: string[]
          created_at?: string
          currency?: string
          description?: string
          duration_hours?: number
          id?: string
          is_active?: boolean
          location: string
          max_guests?: number
          price?: number
          title: string
          updated_at?: string
        }
        Update: {
          available_dates?: string[]
          created_at?: string
          currency?: string
          description?: string
          duration_hours?: number
          id?: string
          is_active?: boolean
          location?: string
          max_guests?: number
          price?: number
          title?: string
          updated_at?: string
        }
        Relationships: []
      }
      favorites: {
        Row: {
          created_at: string
          id: string
          property_id: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          property_id: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          property_id?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "favorites_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      gift_cards: {
        Row: {
          amount: number
          balance: number
          code: string
          created_at: string
          id: string
          message: string | null
          purchaser_id: string
          recipient_email: string
          recipient_name: string | null
          sent_at: string
          status: string
          updated_at: string
        }
        Insert: {
          amount?: number
          balance?: number
          code: string
          created_at?: string
          id?: string
          message?: string | null
          purchaser_id: string
          recipient_email: string
          recipient_name?: string | null
          sent_at?: string
          status?: string
          updated_at?: string
        }
        Update: {
          amount?: number
          balance?: number
          code?: string
          created_at?: string
          id?: string
          message?: string | null
          purchaser_id?: string
          recipient_email?: string
          recipient_name?: string | null
          sent_at?: string
          status?: string
          updated_at?: string
        }
        Relationships: []
      }
      payments: {
        Row: {
          amount: number
          booking_id: string
          created_at: string
          currency: string
          id: string
          provider_payment_id: string | null
          status: Database["public"]["Enums"]["payment_status"]
          updated_at: string
          user_id: string
        }
        Insert: {
          amount?: number
          booking_id: string
          created_at?: string
          currency?: string
          id?: string
          provider_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id: string
        }
        Update: {
          amount?: number
          booking_id?: string
          created_at?: string
          currency?: string
          id?: string
          provider_payment_id?: string | null
          status?: Database["public"]["Enums"]["payment_status"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "payments_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          id: string
          name: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          id?: string
          name?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      properties: {
        Row: {
          address: string
          amenities: string[]
          bathrooms: number
          bedrooms: number
          city: string
          country: string
          created_at: string
          currency: string
          description: string
          host_id: string
          id: string
          images: string[]
          latitude: number | null
          longitude: number | null
          max_guests: number
          price: number
          property_type: Database["public"]["Enums"]["property_type"]
          state: string | null
          status: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at: string
          zip_code: string | null
        }
        Insert: {
          address?: string
          amenities?: string[]
          bathrooms?: number
          bedrooms?: number
          city: string
          country?: string
          created_at?: string
          currency?: string
          description?: string
          host_id: string
          id?: string
          images?: string[]
          latitude?: number | null
          longitude?: number | null
          max_guests?: number
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          state?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          title: string
          updated_at?: string
          zip_code?: string | null
        }
        Update: {
          address?: string
          amenities?: string[]
          bathrooms?: number
          bedrooms?: number
          city?: string
          country?: string
          created_at?: string
          currency?: string
          description?: string
          host_id?: string
          id?: string
          images?: string[]
          latitude?: number | null
          longitude?: number | null
          max_guests?: number
          price?: number
          property_type?: Database["public"]["Enums"]["property_type"]
          state?: string | null
          status?: Database["public"]["Enums"]["property_status"]
          title?: string
          updated_at?: string
          zip_code?: string | null
        }
        Relationships: []
      }
      reviews: {
        Row: {
          booking_id: string | null
          comment: string | null
          created_at: string
          id: string
          property_id: string
          rating: number
          updated_at: string
          user_id: string
        }
        Insert: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          property_id: string
          rating: number
          updated_at?: string
          user_id: string
        }
        Update: {
          booking_id?: string | null
          comment?: string | null
          created_at?: string
          id?: string
          property_id?: string
          rating?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "reviews_booking_id_fkey"
            columns: ["booking_id"]
            isOneToOne: false
            referencedRelation: "bookings"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "reviews_property_id_fkey"
            columns: ["property_id"]
            isOneToOne: false
            referencedRelation: "properties"
            referencedColumns: ["id"]
          },
        ]
      }
      service_orders: {
        Row: {
          coupon_code: string | null
          created_at: string
          discount_amount: number
          final_price: number
          id: string
          quantity: number
          service_date: string
          service_id: string
          service_time: string
          status: Database["public"]["Enums"]["ajir_order_status"]
          total_price: number
          updated_at: string
          user_id: string
        }
        Insert: {
          coupon_code?: string | null
          created_at?: string
          discount_amount?: number
          final_price?: number
          id?: string
          quantity?: number
          service_date: string
          service_id: string
          service_time: string
          status?: Database["public"]["Enums"]["ajir_order_status"]
          total_price?: number
          updated_at?: string
          user_id: string
        }
        Update: {
          coupon_code?: string | null
          created_at?: string
          discount_amount?: number
          final_price?: number
          id?: string
          quantity?: number
          service_date?: string
          service_id?: string
          service_time?: string
          status?: Database["public"]["Enums"]["ajir_order_status"]
          total_price?: number
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "service_orders_service_id_fkey"
            columns: ["service_id"]
            isOneToOne: false
            referencedRelation: "services"
            referencedColumns: ["id"]
          },
        ]
      }
      services: {
        Row: {
          available_times: string[]
          category: string
          created_at: string
          currency: string
          description: string
          duration_minutes: number
          id: string
          is_active: boolean
          location: string
          price: number
          title: string
          updated_at: string
        }
        Insert: {
          available_times?: string[]
          category?: string
          created_at?: string
          currency?: string
          description?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          location: string
          price?: number
          title: string
          updated_at?: string
        }
        Update: {
          available_times?: string[]
          category?: string
          created_at?: string
          currency?: string
          description?: string
          duration_minutes?: number
          id?: string
          is_active?: boolean
          location?: string
          price?: number
          title?: string
          updated_at?: string
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
          role?: Database["public"]["Enums"]["app_role"]
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
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      ajir_order_status: "pending" | "confirmed" | "completed" | "cancelled"
      app_role: "admin" | "host" | "guest"
      booking_status: "pending" | "confirmed" | "cancelled" | "completed"
      coupon_scope: "stays" | "services" | "experiences" | "all"
      discount_type: "percent" | "fixed"
      payment_status:
        | "pending"
        | "processing"
        | "succeeded"
        | "failed"
        | "refunded"
      property_status: "draft" | "published" | "archived"
      property_type:
        | "apartment"
        | "house"
        | "villa"
        | "condo"
        | "studio"
        | "cabin"
        | "riad"
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
      ajir_order_status: ["pending", "confirmed", "completed", "cancelled"],
      app_role: ["admin", "host", "guest"],
      booking_status: ["pending", "confirmed", "cancelled", "completed"],
      coupon_scope: ["stays", "services", "experiences", "all"],
      discount_type: ["percent", "fixed"],
      payment_status: [
        "pending",
        "processing",
        "succeeded",
        "failed",
        "refunded",
      ],
      property_status: ["draft", "published", "archived"],
      property_type: [
        "apartment",
        "house",
        "villa",
        "condo",
        "studio",
        "cabin",
        "riad",
      ],
    },
  },
} as const
