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
      admin_settings: {
        Row: {
          id: number
          payhero_channel_id: string | null
          tax_percentage: number | null
        }
        Insert: {
          id?: number
          payhero_channel_id?: string | null
          tax_percentage?: number | null
        }
        Update: {
          id?: number
          payhero_channel_id?: string | null
          tax_percentage?: number | null
        }
        Relationships: []
      }
      coins: {
        Row: {
          deposit_address: string
          icon_url: string | null
          id: string
          image: string | null
          name: string
          symbol: string
        }
        Insert: {
          deposit_address: string
          icon_url?: string | null
          id?: string
          image?: string | null
          name: string
          symbol: string
        }
        Update: {
          deposit_address?: string
          icon_url?: string | null
          id?: string
          image?: string | null
          name?: string
          symbol?: string
        }
        Relationships: []
      }
      orders: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          original_amount: number | null
          price: number
          quote_currency: string | null
          status: string | null
          type: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          id?: string
          original_amount?: number | null
          price: number
          quote_currency?: string | null
          status?: string | null
          type: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          original_amount?: number | null
          price?: number
          quote_currency?: string | null
          status?: string | null
          type?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "orders_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      trades: {
        Row: {
          amount: number
          counterparty_id: string
          created_at: string | null
          currency: string
          id: string
          order_id: string
          price: number
          status: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          counterparty_id: string
          created_at?: string | null
          currency: string
          id?: string
          order_id: string
          price: number
          status?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          counterparty_id?: string
          created_at?: string | null
          currency?: string
          id?: string
          order_id?: string
          price?: number
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "trades_counterparty_id_fkey"
            columns: ["counterparty_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_order_id_fkey"
            columns: ["order_id"]
            isOneToOne: false
            referencedRelation: "orders"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "trades_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      transactions: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          description: string | null
          id: string
          price: number | null
          proof: string | null
          secondary_amount: number | null
          secondary_currency: string | null
          status: string | null
          type: string
          user_id: string | null
          withdrawal_address: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          description?: string | null
          id?: string
          price?: number | null
          proof?: string | null
          secondary_amount?: number | null
          secondary_currency?: string | null
          status?: string | null
          type: string
          user_id?: string | null
          withdrawal_address?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          description?: string | null
          id?: string
          price?: number | null
          proof?: string | null
          secondary_amount?: number | null
          secondary_currency?: string | null
          status?: string | null
          type?: string
          user_id?: string | null
          withdrawal_address?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "transactions_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
      users: {
        Row: {
          balance_crypto: Json | null
          balance_fiat: number | null
          email: string
          id: string
          password: string
          username: string
        }
        Insert: {
          balance_crypto?: Json | null
          balance_fiat?: number | null
          email: string
          id?: string
          password: string
          username: string
        }
        Update: {
          balance_crypto?: Json | null
          balance_fiat?: number | null
          email?: string
          id?: string
          password?: string
          username?: string
        }
        Relationships: []
      }
      withdrawals: {
        Row: {
          amount: number
          created_at: string | null
          currency: string
          id: string
          status: Database["public"]["Enums"]["withdrawal_status"] | null
          user_address: string
          user_id: string | null
        }
        Insert: {
          amount: number
          created_at?: string | null
          currency: string
          id?: string
          status?: Database["public"]["Enums"]["withdrawal_status"] | null
          user_address: string
          user_id?: string | null
        }
        Update: {
          amount?: number
          created_at?: string | null
          currency?: string
          id?: string
          status?: Database["public"]["Enums"]["withdrawal_status"] | null
          user_address?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "withdrawals_user_id_fkey"
            columns: ["user_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      approve_crypto_deposit: {
        Args: { transaction_id_param: string }
        Returns: Json
      }
      begin_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      cancel_order: {
        Args: { order_id_param: string }
        Returns: Json
      }
      commit_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      create_order: {
        Args:
          | {
              user_id_param: string
              order_type_param: string
              currency_param: string
              amount_param: number
              price_param: number
            }
          | {
              user_id_param: string
              order_type_param: string
              currency_param: string
              amount_param: number
              price_param: number
              original_amount_param: number
            }
          | {
              user_id_param: string
              order_type_param: string
              currency_param: string
              quote_currency_param: string
              amount_param: number
              price_param: number
              original_amount_param: number
            }
        Returns: string
      }
      execute_trade: {
        Args: {
          order_id_param: string
          executor_id_param: string
          submitted_amount: number
        }
        Returns: Json
      }
      insert_or_update_transaction: {
        Args: {
          executing_user_id: string
          order_owner_id: string
          order_type: string
          amount: number
          currency: string
        }
        Returns: undefined
      }
      rollback_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
    }
    Enums: {
      withdrawal_status: "pending" | "approved" | "rejected" | "forfeited"
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
    Enums: {
      withdrawal_status: ["pending", "approved", "rejected", "forfeited"],
    },
  },
} as const