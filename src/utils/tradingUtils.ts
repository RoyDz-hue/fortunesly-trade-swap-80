import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

/**
 * Execute a trade for a given order
 * @param orderId - UUID of the order
 * @param executorId - UUID of the user executing the trade
 * @param submittedAmount - Amount of the trade
 * @returns Promise with the trade execution result
 */
export async function executeTrade(
  orderId: string,
  executorId: string,
  submittedAmount: number
): Promise<{
  success: boolean;
  message?: string;
  error?: string;
}> {
  try {
    const { data, error } = await supabase.rpc('execute_trade', {
      order_id_param: orderId,
      executor_id_param: executorId,
      submitted_amount: submittedAmount
    });

    if (error) {
      console.error('Error executing trade:', error);
      return { 
        success: false, 
        error: error.message 
      };
    }

    // The backend returns { success: boolean, message: string }
    return {
      success: data.success,
      message: data.message
    };
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

// Type definitions
export interface TradeResult {
  success: boolean;
  message?: string;
  error?: string;
}

export interface TradeParams {
  order_id_param: string;    // UUID
  executor_id_param: string; // UUID
  submitted_amount: number;
}