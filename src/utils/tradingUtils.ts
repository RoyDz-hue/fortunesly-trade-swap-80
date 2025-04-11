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
    console.log('Executing trade with params:', {
      order_id_param: orderId,
      executor_id_param: traderId,
      submitted_amount: tradeAmount
    });

    // First, let's verify the order exists and check its status
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('id, status, amount, user_id')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Error fetching order:', orderError);
      return { 
        success: false, 
        error: `Order verification failed: ${orderError.message}`
      };
    }

    console.log('Order found:', orderData);
    
    if (!orderData) {
      return {
        success: false,
        error: 'Order not found in database'
      };
    }

    if (!['open', 'partially_filled'].includes(orderData.status)) {
      return {
        success: false,
        error: `Order is not available for trading. Current status: ${orderData.status}`
      };
    }

    // Now call the execute_trade RPC function
    const { data, error } = await supabase.rpc('execute_trade', {
      order_id_param: orderId,
      executor_id_param: traderId,
      submitted_amount: tradeAmount
    });

    if (error) {
      console.error('Error executing trade:', error);
      return { 
        success: false, 
        error: `RPC error: ${error.message}` 
      };
    }

    // Log the returned data from the backend
    console.log('Trade execution result:', data);

    // The backend returns an object with a success flag
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