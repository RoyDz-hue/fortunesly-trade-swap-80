import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

interface TradeError {
  success: false;
  error_code: string;
  message: string;
  detail?: string;
  hint?: string;
  context?: string;
  severity: 'ERROR' | 'WARNING';
  currency?: string;
  available_amount?: number;
  submitted_amount?: number;
}

interface TradeSuccess {
  success: true;
  message: string;
  order_id: string;
  new_status: string;
  executed_amount: number;
  remaining_amount: number;
  price: number;
  currency: string;
  quote_currency: string;
  timestamp: string;
}

type TradeResult = TradeError | TradeSuccess;

/**
 * Format error message for UI display
 */
function formatTradeErrorMessage(error: TradeError): string {
  const timestamp = format(new Date(), "MMM d, HH:mm:ss");
  let message = `❌ Trade Failed\n\nTime: ${timestamp}\n\n`;

  // Handle specific database errors
  if (error.message.includes('path element at position 1 is null')) {
    message += 'Invalid Currency Configuration\n' +
               'The order has an invalid or missing currency setting.\n' +
               'Please contact support with error code: INVALID_CURRENCY_CONFIG';
    // Log the error for debugging
    console.error('Currency configuration error:', error);
    return message;
  }

  switch (error.error_code) {
    case 'INVALID_PARAM':
      message += `Invalid parameter: ${error.message}`;
      break;
    case 'INVALID_AMOUNT':
      message += `Invalid amount: ${error.message}`;
      break;
    case 'ORDER_NOT_FOUND':
      message += `Order not found: ${error.message}`;
      break;
    case 'INVALID_ORDER_STATUS':
      message += `Order status error: ${error.message}`;
      break;
    case 'AMOUNT_EXCEEDS_AVAILABLE':
      if (error.currency && error.available_amount !== undefined) {
        message += `Insufficient balance\n\n` +
                  `Available: ${error.available_amount} ${error.currency}\n` +
                  `Required: ${error.submitted_amount} ${error.currency}`;
      } else {
        message += error.message;
      }
      break;
    case 'SELF_EXECUTION':
      message += `Self-trading not allowed: You cannot execute your own order`;
      break;
    default:
      message += `Error: ${error.message}`;
      if (error.detail) {
        message += `\n\nDetails: ${error.detail}`;
      }
      if (error.hint) {
        message += `\n\nSuggestion: ${error.hint}`;
      }
  }

  return message;
}

/**
 * Execute a trade with enhanced error handling
 */
export async function executeTrade(
  orderId: string,
  executorId: string,
  submittedAmount: number
): Promise<TradeResult> {
  try {
    // Input validation
    if (!orderId || !executorId || !submittedAmount) {
      return {
        success: false,
        error_code: 'INVALID_PARAM',
        message: 'Missing required parameters',
        severity: 'ERROR'
      };
    }

    // Execute the trade
    const { data, error } = await supabase.rpc('execute_trade', {
      order_id_param: orderId,
      executor_id_param: executorId,
      submitted_amount: submittedAmount
    });

    // Handle Supabase error
    if (error) {
      console.error('Trade execution error:', error);
      return {
        success: false,
        error_code: 'EXECUTION_ERROR',
        message: error.message,
        detail: error.details,
        severity: 'ERROR'
      };
    }

    // Handle unsuccessful trade
    if (!data.success) {
      console.error('Trade failed:', data);
      return data as TradeError;
    }

    // Handle successful trade
    return data as TradeSuccess;

  } catch (error) {
    console.error('Unexpected error in executeTrade:', error);
    return {
      success: false,
      error_code: 'UNEXPECTED_ERROR',
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      severity: 'ERROR'
    };
  }
}

// Example usage
export async function handleTradeExecution(
  orderId: string,
  executorId: string,
  amount: number
) {
  try {
    const result = await executeTrade(orderId, executorId, amount);

    if (!result.success) {
      const errorMessage = formatTradeErrorMessage(result);
      alert(errorMessage);
      
      // Log the error for debugging
      console.error('Trade execution failed:', result);
      return false;
    }

    // Show success message
    alert(`✅ Trade Successful!\n\n` +
          `Amount: ${result.executed_amount} ${result.currency}\n` +
          `Price: ${result.price} ${result.quote_currency}\n` +
          `Status: ${result.new_status}\n` +
          `Time: ${format(new Date(result.timestamp), "MMM d, HH:mm:ss")}`);
    
    return true;
  } catch (error) {
    console.error('Error in handleTradeExecution:', error);
    alert('An unexpected error occurred while processing the trade.');
    return false;
  }
}