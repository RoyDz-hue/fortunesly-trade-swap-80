import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

// Define specific error types
export enum TradeErrorType {
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  INVALID_STATUS = 'INVALID_STATUS',
  INSUFFICIENT_AMOUNT = 'INSUFFICIENT_AMOUNT',
  NETWORK_ERROR = 'NETWORK_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// Enhanced trade result interface
export interface TradeResult {
  success: boolean;
  message?: string;
  error?: string;
  errorType?: TradeErrorType;
  details?: {
    orderId?: string;
    submittedAmount?: number;
    timestamp?: string;
    orderStatus?: string;
  };
}

/**
 * Parse error message from backend and determine error type
 */
function parseTradeError(error: string): { type: TradeErrorType; message: string } {
  const lowerError = error.toLowerCase();
  
  if (lowerError.includes('not found')) {
    return {
      type: TradeErrorType.ORDER_NOT_FOUND,
      message: 'The order could not be found. It may have been cancelled or filled.'
    };
  }
  if (lowerError.includes('status') || lowerError.includes('filled') || lowerError.includes('canceled')) {
    return {
      type: TradeErrorType.INVALID_STATUS,
      message: 'This order is no longer available for trading. It may have been filled or cancelled.'
    };
  }
  if (lowerError.includes('exceeds') || lowerError.includes('amount')) {
    return {
      type: TradeErrorType.INSUFFICIENT_AMOUNT,
      message: 'The requested trade amount exceeds the available order amount.'
    };
  }
  if (lowerError.includes('network') || lowerError.includes('timeout')) {
    return {
      type: TradeErrorType.NETWORK_ERROR,
      message: 'Network error occurred. Please check your connection and try again.'
    };
  }
  return {
    type: TradeErrorType.UNKNOWN_ERROR,
    message: 'An unexpected error occurred while processing the trade.'
  };
}

/**
 * Format error message for UI display
 */
export function formatTradeError(result: TradeResult): string {
  const timestamp = format(new Date(), "MMM d, HH:mm:ss");
  let errorMessage = "Trade Failed";

  if (result.errorType) {
    switch (result.errorType) {
      case TradeErrorType.ORDER_NOT_FOUND:
        errorMessage = `❌ Order Not Found\n\nDetails:\n- Order ID: ${result.details?.orderId}\n- Time: ${timestamp}\n\nThis order may have been cancelled or already filled. Please refresh the order list and try again.`;
        break;
      case TradeErrorType.INVALID_STATUS:
        errorMessage = `❌ Invalid Order Status\n\nDetails:\n- Order ID: ${result.details?.orderId}\n- Current Status: ${result.details?.orderStatus}\n- Time: ${timestamp}\n\nThis order is no longer available for trading. It may have been filled or cancelled by another user.`;
        break;
      case TradeErrorType.INSUFFICIENT_AMOUNT:
        errorMessage = `❌ Invalid Amount\n\nDetails:\n- Requested Amount: ${result.details?.submittedAmount}\n- Time: ${timestamp}\n\nThe amount you're trying to trade exceeds the available order amount. Please enter a smaller amount.`;
        break;
      case TradeErrorType.NETWORK_ERROR:
        errorMessage = `❌ Network Error\n\nDetails:\n- Time: ${timestamp}\n\nPlease check your internet connection and try again. If the problem persists, the server may be experiencing issues.`;
        break;
      default:
        errorMessage = `❌ Trade Error\n\nDetails:\n- Error: ${result.message || 'Unknown error'}\n- Time: ${timestamp}\n\nAn unexpected error occurred. Please try again or contact support if the problem persists.`;
    }
  } else if (result.message) {
    errorMessage = `❌ Trade Failed\n\nDetails:\n- Error: ${result.message}\n- Time: ${timestamp}`;
  }

  return errorMessage;
}

/**
 * Execute a trade for a given order with enhanced error handling
 */
export async function executeTrade(
  orderId: string,
  executorId: string,
  submittedAmount: number
): Promise<TradeResult> {
  try {
    const { data, error } = await supabase.rpc('execute_trade', {
      order_id_param: orderId,
      executor_id_param: executorId,
      submitted_amount: submittedAmount
    });

    if (error) {
      console.error('Error executing trade:', error);
      const { type, message } = parseTradeError(error.message);
      return { 
        success: false,
        error: error.message,
        errorType: type,
        message: message,
        details: {
          orderId,
          submittedAmount,
          timestamp: format(new Date(), "yyyy-MM-dd HH:mm:ss")
        }
      };
    }

    if (!data.success) {
      const { type, message } = parseTradeError(data.message);
      return {
        success: false,
        message: data.message,
        errorType: type,
        details: {
          orderId,
          submittedAmount,
          timestamp: format(new Date(), "yyyy-MM-dd HH:mm:ss")
        }
      };
    }

    return {
      success: true,
      message: data.message
    };
  } catch (error) {
    console.error('Error in executeTrade:', error);
    return { 
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error occurred',
      errorType: TradeErrorType.UNKNOWN_ERROR,
      details: {
        orderId,
        submittedAmount,
        timestamp: format(new Date(), "yyyy-MM-dd HH:mm:ss")
      }
    };
  }
}