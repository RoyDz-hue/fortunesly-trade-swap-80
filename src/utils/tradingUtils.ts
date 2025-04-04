
import { supabase } from "@/integrations/supabase/client";

/**
 * Executes a trade between two users
 * @param orderId The ID of the order
 * @param traderId The ID of the trader (person executing the trade)
 * @param tradeAmount The amount to trade
 * @returns Promise with the result
 */
export const executeTrade = async (
  orderId: string,
  traderId: string,
  tradeAmount: number
) => {
  try {
    const { data, error } = await supabase.rpc('execute_market_order', {
      order_id_param: orderId,
      trader_id_param: traderId,
      trade_amount_param: tradeAmount
    });

    if (error) throw error;
    
    return {
      success: true,
      data
    };
  } catch (error: any) {
    console.error('Error executing trade:', error);
    return {
      success: false,
      error: error.message || 'An unknown error occurred'
    };
  }
};

/**
 * Cancels an order
 * @param orderId The ID of the order to cancel
 * @returns Promise with the result
 */
export const cancelOrder = async (orderId: string) => {
  try {
    const { data, error } = await supabase.rpc('cancel_order', {
      order_id_param: orderId
    });

    if (error) throw error;
    
    return {
      success: true,
      data
    };
  } catch (error: any) {
    console.error('Error canceling order:', error);
    return {
      success: false,
      error: error.message || 'An unknown error occurred'
    };
  }
};
