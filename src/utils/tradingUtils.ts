import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

// Define all possible trade error codes
export enum TradeErrorCode {
    INVALID_INPUT = 'INVALID_INPUT',
    ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
    INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
    INVALID_AMOUNT = 'INVALID_AMOUNT',
    SELF_TRADE = 'SELF_TRADE',
    ORDER_UNAVAILABLE = 'ORDER_UNAVAILABLE',
    SYSTEM_ERROR = 'SYSTEM_ERROR'
}

// Define order statuses and trade types
export type OrderStatus = 'pending' | 'partially_filled' | 'filled' | 'canceled';
export type TradeType = 'buy' | 'sell';

// Error response interface
interface TradeError {
    success: false;
    error_code: TradeErrorCode;
    message: string;
    severity: 'ERROR' | 'WARNING';
    details?: {
        available?: number;
        required?: number;
        currency?: string;
        quote_currency?: string;
    };
}

// Success response interface
interface TradeSuccess {
    success: true;
    message: string;
    order_id: string;
    executed_amount: number;
    remaining_amount: number;
    price: number;
    currency: string;
    quote_currency: string;
    type: TradeType;
    timestamp: string;
}

type TradeResult = TradeError | TradeSuccess;

// Format currency amounts based on currency type
function formatCurrencyAmount(amount: number, currency: string): string {
    const decimals = currency === 'KES' ? 2 : 8;
    return amount.toLocaleString('en-US', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals
    });
}

// Format error messages for display
function formatTradeError(error: TradeError): string {
    const timestamp = format(new Date(), "MMM d, HH:mm:ss");
    let message = `❌ Trade Failed\n\nTime: ${timestamp}\n\n`;

    switch (error.error_code) {
        case TradeErrorCode.INSUFFICIENT_BALANCE:
            const { available, required, currency } = error.details || {};
            message += `Insufficient Balance\n\n`;
            if (available !== undefined && required !== undefined && currency) {
                message += `Available: ${formatCurrencyAmount(available, currency)} ${currency}\n`;
                message += `Required: ${formatCurrencyAmount(required, currency)} ${currency}`;
            } else {
                message += error.message;
            }
            break;

        case TradeErrorCode.INVALID_AMOUNT:
            message += `Invalid Amount\n${error.message}`;
            if (error.details?.available) {
                message += `\nMaximum available: ${formatCurrencyAmount(
                    error.details.available,
                    error.details.currency || 'KES'
                )} ${error.details.currency}`;
            }
            break;

        case TradeErrorCode.SELF_TRADE:
            message += `Self-Trade Not Allowed\nYou cannot execute your own orders.`;
            break;

        case TradeErrorCode.ORDER_UNAVAILABLE:
            message += `Order Unavailable\nThis order cannot be executed at this time.`;
            break;

        case TradeErrorCode.ORDER_NOT_FOUND:
            message += `Order Not Found\nThis order no longer exists or has been filled.`;
            break;

        default:
            message += error.message;
    }

    return message;
}

// Format success messages for display
function formatTradeSuccess(result: TradeSuccess): string {
    const tradeAction = result.type === 'buy' ? 'Sold' : 'Bought';
    const total = result.executed_amount * result.price;

    return [
        `✅ Trade Successful!`,
        ``,
        `${tradeAction}: ${formatCurrencyAmount(result.executed_amount, result.currency)} ${result.currency}`,
        `Price: ${formatCurrencyAmount(result.price, result.quote_currency)} ${result.quote_currency}`,
        `Total: ${formatCurrencyAmount(total, result.quote_currency)} ${result.quote_currency}`,
        `Time: ${format(new Date(result.timestamp), "MMM d, HH:mm:ss")}`
    ].join('\n');
}

// Execute trade through RPC
export async function executeTrade(
    orderId: string,
    executorId: string,
    submittedAmount: number
): Promise<TradeResult> {
    try {
        // Input validation
        if (!orderId || !executorId || !submittedAmount || submittedAmount <= 0) {
            return {
                success: false,
                error_code: TradeErrorCode.INVALID_INPUT,
                message: 'Invalid input parameters',
                severity: 'ERROR'
            };
        }

        // Log trade attempt
        console.log(`Executing trade: Order ${orderId}, Amount: ${submittedAmount}`);

        // Call execute_trade RPC
        const { data, error } = await supabase.rpc('execute_trade', {
            order_id_param: orderId,
            executor_id_param: executorId,
            submitted_amount: submittedAmount
        });

        // Handle RPC error
        if (error) {
            console.error('Trade execution error:', error);
            return {
                success: false,
                error_code: TradeErrorCode.SYSTEM_ERROR,
                message: error.message,
                severity: 'ERROR'
            };
        }

        // Handle unsuccessful trade
        if (!data.success) {
            console.warn('Trade failed:', data);
            return data as TradeError;
        }

        // Log successful trade
        console.log('Trade executed successfully:', data);
        return data as TradeSuccess;

    } catch (error) {
        console.error('Unexpected error in executeTrade:', error);
        return {
            success: false,
            error_code: TradeErrorCode.SYSTEM_ERROR,
            message: error instanceof Error ? error.message : 'An unexpected error occurred',
            severity: 'ERROR'
        };
    }
}

// Handle trade execution with callbacks
export async function handleTradeExecution(
    orderId: string,
    executorId: string,
    amount: number,
    onSuccess?: () => void,
    onError?: (error: TradeError) => void
): Promise<boolean> {
    try {
        // Execute the trade
        const result = await executeTrade(orderId, executorId, amount);

        // Handle failure
        if (!result.success) {
            const errorMessage = formatTradeError(result);
            console.error('Trade failed:', result);
            alert(errorMessage);
            onError?.(result);
            return false;
        }

        // Handle success
        const successMessage = formatTradeSuccess(result);
        console.log('Trade successful:', result);
        alert(successMessage);
        onSuccess?.();
        return true;

    } catch (error) {
        // Handle unexpected errors
        console.error('Error in handleTradeExecution:', error);
        alert('An unexpected error occurred while processing the trade.');
        return false;
    }
}

// Export types and interfaces
export type {
    TradeError,
    TradeSuccess,
    TradeResult
};