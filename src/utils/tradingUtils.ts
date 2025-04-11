import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

/**
 * Execute a trade for a given order
 * @param orderId - The ID of the order being executed
 * @param traderId - The ID of the user executing the trade
 * @param tradeAmount - The amount to trade
 * @returns Object with success status and data or error message
 */
export async function executeTrade(
  orderId: string,
  traderId: string,
  tradeAmount: number
) {
  try {
    console.log('Executing trade with params:', {
      order_id_param: orderId,
      executor_id_param: traderId,
      submitted_amount: tradeAmount
    });

    // Verify session for debugging
    const { data: sessionData, error: sessionError } = await supabase.auth.getSession();
    console.log('Current session:', sessionError ? 'No session' : sessionData.session?.user.id);

    const { data, error } = await supabase.rpc('execute_trade', {
      order_id_param: orderId,
      executor_id_param: traderId,
      submitted_amount: tradeAmount
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return { success: false, error: error.message, code: error.code };
    }

    console.log('Trade execution result:', data);

    // Handle backend error responses
    if (data && typeof data === 'object' && data.success === false) {
      console.warn('Backend error response:', data);
      return { 
        success: false, 
        error: data.message || 'Trade execution failed', 
        code: data.error_code 
      };
    }

    return { success: true, data };
  } catch (error) {
    console.error('Error in executeTrade:', error);
    return { 
      success: false, 
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      code: 'UNKNOWN'
    };
  }
}

/**
 * Format a transaction timestamp to a user-friendly format
 * @param timestamp - The timestamp string to format
 * @returns Formatted date string
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