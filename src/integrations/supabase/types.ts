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
      callback_logs: {
        Row: {
          data: Json | null
          id: number
          received_at: string | null
        }
        Insert: {
          data?: Json | null
          id?: number
          received_at?: string | null
        }
        Update: {
          data?: Json | null
          id?: number
          received_at?: string | null
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
          last_updated_at: string | null
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
          last_updated_at?: string | null
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
          last_updated_at?: string | null
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
      payment_requests: {
        Row: {
          amount: number
          callback_data: Json | null
          checkout_request_id: string | null
          created_at: string | null
          id: string
          phone_number: string
          provider_reference: string | null
          reference: string
          status: string
          type: string
          updated_at: string | null
          user_id: string
        }
        Insert: {
          amount: number
          callback_data?: Json | null
          checkout_request_id?: string | null
          created_at?: string | null
          id?: string
          phone_number: string
          provider_reference?: string | null
          reference: string
          status?: string
          type: string
          updated_at?: string | null
          user_id: string
        }
        Update: {
          amount?: number
          callback_data?: Json | null
          checkout_request_id?: string | null
          created_at?: string | null
          id?: string
          phone_number?: string
          provider_reference?: string | null
          reference?: string
          status?: string
          type?: string
          updated_at?: string | null
          user_id?: string
        }
        Relationships: []
      }
      referral_settings: {
        Row: {
          coins_per_referral: number
          created_at: string
          id: number
          level2_rate_percent: number
          min_to_crypto_wallet: number
          min_transferable_balance: number
          transaction_fee_percent: number
          updated_at: string
        }
        Insert: {
          coins_per_referral?: number
          created_at?: string
          id?: number
          level2_rate_percent?: number
          min_to_crypto_wallet?: number
          min_transferable_balance?: number
          transaction_fee_percent?: number
          updated_at?: string
        }
        Update: {
          coins_per_referral?: number
          created_at?: string
          id?: number
          level2_rate_percent?: number
          min_to_crypto_wallet?: number
          min_transferable_balance?: number
          transaction_fee_percent?: number
          updated_at?: string
        }
        Relationships: []
      }
      referral_transactions: {
        Row: {
          amount: number
          created_at: string
          created_by: string | null
          fee: number | null
          id: string
          reason: string | null
          recipient_address: string | null
          recipient_id: string | null
          status: string
          transaction_type: string
          user_id: string
        }
        Insert: {
          amount: number
          created_at?: string
          created_by?: string | null
          fee?: number | null
          id?: string
          reason?: string | null
          recipient_address?: string | null
          recipient_id?: string | null
          status?: string
          transaction_type: string
          user_id: string
        }
        Update: {
          amount?: number
          created_at?: string
          created_by?: string | null
          fee?: number | null
          id?: string
          reason?: string | null
          recipient_address?: string | null
          recipient_id?: string | null
          status?: string
          transaction_type?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "referral_transactions_created_by_fkey"
            columns: ["created_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_transactions_recipient_id_fkey"
            columns: ["recipient_id"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "referral_transactions_user_id_fkey"
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
          referral_balance: number
          referral_code: string | null
          referral_count: number
          referred_by: string | null
          username: string
        }
        Insert: {
          balance_crypto?: Json | null
          balance_fiat?: number | null
          email: string
          id?: string
          password: string
          referral_balance?: number
          referral_code?: string | null
          referral_count?: number
          referred_by?: string | null
          username: string
        }
        Update: {
          balance_crypto?: Json | null
          balance_fiat?: number | null
          email?: string
          id?: string
          password?: string
          referral_balance?: number
          referral_code?: string | null
          referral_count?: number
          referred_by?: string | null
          username?: string
        }
        Relationships: [
          {
            foreignKeyName: "users_referred_by_fkey"
            columns: ["referred_by"]
            isOneToOne: false
            referencedRelation: "users"
            referencedColumns: ["id"]
          },
        ]
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
      admin_adjust_referral_balance: {
        Args: {
          target_user_id: string
          adjustment_amount: number
          adjustment_reason: string
          admin_id: string
        }
        Returns: Json
      }
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
        Returns: undefined
      }
      execute_market_order: {
        Args:
          | {
              order_id_param: string
              trader_id_param: string
              trade_amount_param: number
            }
          | {
              order_id_param: string
              trader_id_param: string
              trade_amount_param: number
              order_owner_id_param: string
              order_type_param: string
            }
          | {
              trader_id_param: string
              order_owner_id: string
              order_type: string
              trade_amount_param: number
              currency: string
              price: number
              amount: number
            }
          | {
              trader_id_param: string
              order_owner_id: string
              order_type: string
              trade_amount_param: number
              currency: string
              price: number
              total_amount: number
            }
          | {
              trader_id_param: string
              order_owner_id: string
              order_type: string
              trade_amount_param: number
              currency: string
              quote_currency: string
              price: number
              amount: number
            }
        Returns: undefined
      }
      execute_trade: {
        Args: {
          order_id_param: string
          executor_id_param: string
          submitted_amount: number
        }
        Returns: Json
      }
      generate_referral_code: {
        Args: Record<PropertyKey, never>
        Returns: string
      }
      get_payment_status: {
        Args: { payment_reference: string }
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
      log_payment_request: {
        Args: {
          user_id: string
          request_type: string
          request_amount: number
          request_phone: string
          prefix?: string
        }
        Returns: Json
      }
      process_referral: {
        Args: { user_id: string; referrer_id: string }
        Returns: Json
      }
      rollback_transaction: {
        Args: Record<PropertyKey, never>
        Returns: undefined
      }
      transfer_referral_coins: {
        Args: { sender_id: string; recipient_email: string; amount: number }
        Returns: Json
      }
      update_payment_status: {
        Args: {
          p_reference: string
          p_status: string
          p_provider_reference?: string
          p_checkout_request_id?: string
          p_callback_data?: Json
        }
        Returns: Json
      }
    }
    Enums: {
      order_status: "pending" | "partially_filled" | "filled" | "canceled"
      payment_status_type: "pending" | "processing" | "completed" | "failed"
      transaction_type: "buy" | "sell"
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
      order_status: ["pending", "partially_filled", "filled", "canceled"],
      payment_status_type: ["pending", "processing", "completed", "failed"],
      transaction_type: ["buy", "sell"],
      withdrawal_status: ["pending", "approved", "rejected", "forfeited"],
    },
  },
} as const
