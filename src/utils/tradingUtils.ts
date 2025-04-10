import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

/**
 * Execute a market order with the given parameters
 */
export async function executeMarketOrder(params: {
  trader_id_param: string;
  order_owner_id: string;
  order_type: string;
  trade_amount_param: number;
  currency: string;
  quote_currency: string;  // Added quote_currency
  price: number;
  amount: number;
}) {
  try {
    const { data, error } = await supabase.rpc('execute_market_order', {
      trader_id_param: params.trader_id_param,
      order_owner_id: params.order_owner_id,
      order_type: params.order_type,
      trade_amount_param: params.trade_amount_param,
      currency: params.currency,
      quote_currency: params.quote_currency,  // Pass quote_currency
      price: params.price,
      amount: params.amount
    });

    if (error) {
      console.error('Error executing market order:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Failed to execute market order:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Execute a trade for a given order
 */
export async function executeTrade(
  orderId: string,
  traderId: string,
  tradeAmount: number,
  additionalData: {
    order_owner_id: string;
    order_type: string;
    currency: string;
    quote_currency: string;  // Added quote_currency
    price: number;
    amount: number;
  }
) {
  try {
    const { data, error } = await supabase.rpc('execute_market_order', {
      trader_id_param: traderId,
      order_owner_id: additionalData.order_owner_id,
      order_type: additionalData.order_type,
      trade_amount_param: tradeAmount,
      currency: additionalData.currency,
      quote_currency: additionalData.quote_currency,  // Pass quote_currency
      price: additionalData.price,
      amount: additionalData.amount
    });

    if (error) {
      console.error('Error executing trade:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in executeTrade:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}

/**
 * Execute trade with direct order ID
 */
export async function executeTradeWithOrderId(
  orderIdParam: string,
  traderIdParam: string,
  tradeAmountParam: number,
  currency: string,         // Added currency
  quote_currency: string    // Added quote_currency
) {
  try {
    const { data, error } = await supabase.rpc('execute_market_order', {
      order_id_param: orderIdParam,
      trader_id_param: traderIdParam,
      trade_amount_param: tradeAmountParam,
      currency: currency,                // Pass currency
      quote_currency: quote_currency     // Pass quote_currency
    });

    if (error) {
      console.error('Error executing trade with order ID:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in executeTradeWithOrderId:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred'
    };
  }
}

/**
 * Format a transaction timestamp to a user-friendly format
 */
export function formatTransactionTime(timestamp: string): string {
  if (!timestamp) return 'Unknown';
  
  try {
    const date = new Date(timestamp);
    return format(date, "MMM d, HH:mm");
  } catch (error) {
    console.error('Error formatting transaction time:', error);
    return 'Invalid date';
  }
}

// Updated type definitions
export type MarketOrderParams = {
  trader_id_param: string;
  order_owner_id: string;
  order_type: string;
  trade_amount_param: number;
  currency: string;
  quote_currency: string;  // Added quote_currency
  price: number;
  amount: number;
};

export type OrderIdTradeParams = {
  order_id_param: string;
  trader_id_param: string;
  trade_amount_param: number;
  currency: string;         // Added currency
  quote_currency: string;   // Added quote_currency
};