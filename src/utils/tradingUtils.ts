import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

// Define error types based on backend error_code
export enum TradeErrorCode {
  INVALID_PARAM = 'INVALID_PARAM',
  INVALID_AMOUNT = 'INVALID_AMOUNT',
  ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
  INVALID_ORDER_STATUS = 'INVALID_ORDER_STATUS',
  AMOUNT_EXCEEDS_AVAILABLE = 'AMOUNT_EXCEEDS_AVAILABLE',
  SELF_EXECUTION = 'SELF_EXECUTION',
  DIVISION_BY_ZERO = 'DIVISION_BY_ZERO',
  NUMERIC_OVERFLOW = 'NUMERIC_OVERFLOW',
  DUPLICATE_ENTRY = 'DUPLICATE_ENTRY',
  REFERENCE_ERROR = 'REFERENCE_ERROR'
}

export interface TradeError {
  success: false;
  error_code: TradeErrorCode;
  message: string;
  field?: string;
  severity: 'ERROR' | 'WARNING';
  detail?: string;
  hint?: string;
  available_amount?: number;
  submitted_amount?: number;
  currency?: string;
  current_status?: string;
  order_id?: string;
}

export interface TradeSuccess {
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

export type TradeResult = TradeError | TradeSuccess;

/**
 * Format error message for UI display based on backend error response
 */
export function formatTradeErrorMessage(error: TradeError): string {
  const timestamp = format(new Date(), "MMM d, HH:mm:ss");
  let message = `❌ Trade Failed\n\nTime: ${timestamp}\n`;

  switch (error.error_code) {
    case TradeErrorCode.INVALID_PARAM:
      message += `Invalid ${error.field}: ${error.message}`;
      break;

    case TradeErrorCode.INVALID_AMOUNT:
      message += `Invalid Amount: The submitted amount must be greater than zero.`;
      break;

    case TradeErrorCode.ORDER_NOT_FOUND:
      message += `Order Not Found: The order you're trying to trade no longer exists.`;
      break;

    case TradeErrorCode.INVALID_ORDER_STATUS:
      message += `Invalid Order Status: This order is ${error.current_status} and cannot be traded.`;
      break;

    case TradeErrorCode.AMOUNT_EXCEEDS_AVAILABLE:
      message += `Insufficient Amount Available\n\n` +
                `Requested: ${error.submitted_amount} ${error.currency}\n` +
                `Available: ${error.available_amount} ${error.currency}\n\n` +
                `Please enter a smaller amount.`;
      break;

    case TradeErrorCode.SELF_EXECUTION:
      message += `Self-Trading Not Allowed: You cannot execute your own order.`;
      break;

    case TradeErrorCode.DIVISION_BY_ZERO:
    case TradeErrorCode.NUMERIC_OVERFLOW:
      message += `Calculation Error: ${error.message}\nPlease try a different amount.`;
      break;

    case TradeErrorCode.DUPLICATE_ENTRY:
      message += `Duplicate Transaction: This trade appears to be a duplicate.\n` +
                `Please wait a moment and try again if necessary.`;
      break;

    case TradeErrorCode.REFERENCE_ERROR:
      message += `Reference Error: Unable to complete trade due to missing or invalid references.\n` +
                `Please refresh and try again.`;
      break;

    default:
      message += `${error.message}\n`;
      if (error.detail) message += `\nDetails: ${error.detail}`;
      if (error.hint) message += `\nSuggestion: ${error.hint}`;
  }

  return message;
}

/**
 * Execute a trade with comprehensive error handling
 */
export async function executeTrade(
  orderId: string,
  executorId: string,
  submittedAmount: number,
  additionalData?: any // Optional parameter to maintain compatibility
): Promise<TradeResult> {
  try {
    // Log parameters for debugging
    console.log('Executing trade with:', { orderId, executorId, submittedAmount });
    
    const { data, error } = await supabase.rpc('execute_trade', {
      order_id_param: orderId,
      executor_id_param: executorId,
      submitted_amount: submittedAmount
    });

    if (error) {
      console.error('Supabase RPC error:', error);
      return {
        success: false,
        error_code: TradeErrorCode.INVALID_PARAM,
        message: error.message,
        severity: 'ERROR'
      };
    }

    // Log the raw data returned from the backend
    console.log('Raw backend response:', data);

    // The backend always returns a JSON object with a success property
    if (!data || data.success === undefined) {
      console.error('Invalid response format from backend:', data);
      return {
        success: false,
        error_code: TradeErrorCode.INVALID_PARAM,
        message: 'Invalid response from server',
        severity: 'ERROR'
      };
    }

    if (!data.success) {
      console.error('Trade execution failed:', data);
      return data as TradeError;
    }

    return data as TradeSuccess;

  } catch (error) {
    console.error('Unexpected error in executeTrade:', error);
    return {
      success: false,
      error_code: TradeErrorCode.INVALID_PARAM,
      message: error instanceof Error ? error.message : 'An unexpected error occurred',
      severity: 'ERROR'
    };
  }
}

// Example usage in your component:
export async function handleTradeExecution(orderId: string, executorId: string, amount: number) {
  const result = await executeTrade(orderId, executorId, amount);

  if (!result.success) {
    // Format and show the error message
    const errorMessage = formatTradeErrorMessage(result);
    alert(errorMessage); // Or use your preferred alert/notification system
    return;
  }

  // Handle successful trade
  alert(`✅ Trade Successful!\n\n` +
        `Amount: ${result.executed_amount} ${result.currency}\n` +
        `Price: ${result.price} ${result.quote_currency}\n` +
        `Status: ${result.new_status}\n` +
        `Time: ${format(new Date(result.timestamp), "MMM d, HH:mm:ss")}`);
}