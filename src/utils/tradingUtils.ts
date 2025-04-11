import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

/**
 * Execute a trade for a given order
 * 
 * @param orderId - The ID of the order being executed
 * @param traderId - The ID of the user executing the trade
 * @param tradeAmount - The amount to trade
 * @param additionalData - Additional data (not used for the RPC call)
 * @returns Object with success status and data or error message
 */
export async function executeTrade(
  orderId: string,
  traderId: string,
  tradeAmount: number,
  additionalData: any
) {
  try {
    // Call the execute_trade RPC function with the exact parameters needed
    const { data, error } = await supabase.rpc('execute_trade', {
      order_id_param: orderId,
      executor_id_param: traderId,
      submitted_amount: tradeAmount
    });

    if (error) {
      console.error('Error executing trade:', error);
      return { success: false, error: error.message };
    }

    // Check if the returned data indicates success or failure
    if (data && data.success === false) {
      return { 
        success: false, 
        error: data.message || 'Trade execution failed'
      };
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