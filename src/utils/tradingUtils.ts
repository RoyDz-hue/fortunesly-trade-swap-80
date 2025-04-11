import { supabase } from "@/integrations/supabase/client";
import { format } from "date-fns";

export enum TradeErrorCode {
    INVALID_INPUT = 'INVALID_INPUT',
    ORDER_NOT_FOUND = 'ORDER_NOT_FOUND',
    INSUFFICIENT_BALANCE = 'INSUFFICIENT_BALANCE',
    SYSTEM_ERROR = 'SYSTEM_ERROR'
}

export type OrderStatus = 'pending' | 'partially_filled' | 'filled' | 'canceled';
export type TradeType = 'buy' | 'sell';

interface TradeError {
    success: false;
    error_code: TradeErrorCode;
    message: string;
    severity: 'ERROR' | 'WARNING';
    available?: number;
    required?: number;
    currency?: string;
}

interface TradeSuccess {
    success: true;
    message: string;
    order_id: string;
    new_status: OrderStatus;
    executed_amount: number;
    remaining_amount: number;
    price: number;
    currency: string;
    quote_currency: string;
    timestamp: string;
}

type TradeResult = TradeError | TradeSuccess;

function formatAmount(amount: number, currency: string): string {
    return currency === 'KES' ? 
        amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) :
        amount.toLocaleString('en-US', { minimumFractionDigits: 8, maximumFractionDigits: 8 });
}

function formatTradeError(error: TradeError): string {
    const timestamp = format(new Date(), "MMM d, HH:mm:ss");
    let message = `❌ Trade Failed\n\nTime: ${timestamp}\n\n`;

    switch (error.error_code) {
        case TradeErrorCode.INSUFFICIENT_BALANCE:
            message += `Insufficient Balance\n\n`;
            if (error.available !== undefined && error.required !== undefined) {
                message += `Available: ${formatAmount(error.available, error.currency || 'KES')} ${error.currency}\n`;
                message += `Required: ${formatAmount(error.required, error.currency || 'KES')} ${error.currency}`;
            } else {
                message += error.message;
            }
            break;

        case TradeErrorCode.INVALID_INPUT:
            message += `Invalid Input\n${error.message}`;
            break;

        case TradeErrorCode.ORDER_NOT_FOUND:
            message += `Order Not Found\nThe order may have been filled or cancelled.`;
            break;

        default:
            message += error.message;
    }

    return message;
}

function formatTradeSuccess(result: TradeSuccess): string {
    return `✅ Trade Successful!\n\n` +
           `Amount: ${formatAmount(result.executed_amount, result.currency)} ${result.currency}\n` +
           `Price: ${formatAmount(result.price, result.quote_currency)} ${result.quote_currency}\n` +
           `Total: ${formatAmount(result.executed_amount * result.price, result.quote_currency)} ${result.quote_currency}\n` +
           `Status: ${result.new_status}\n` +
           `Time: ${format(new Date(result.timestamp), "MMM d, HH:mm:ss")}`;
}

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

        // Execute trade
        const { data, error } = await supabase.rpc('execute_trade', {
            order_id_param: orderId,
            executor_id_param: executorId,
            submitted_amount: submittedAmount
        });

        if (error) {
            console.error('Trade execution error:', error);
            return {
                success: false,
                error_code: TradeErrorCode.SYSTEM_ERROR,
                message: error.message,
                severity: 'ERROR'
            };
        }

        if (!data.success) {
            return data as TradeError;
        }

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

export async function handleTradeExecution(
    orderId: string,
    executorId: string,
    amount: number,
    onSuccess?: () => void,
    onError?: (error: TradeError) => void
): Promise<boolean> {
    try {
        const result = await executeTrade(orderId, executorId, amount);

        if (!result.success) {
            const errorMessage = formatTradeError(result);
            alert(errorMessage);
            onError?.(result);
            return false;
        }

        const successMessage = formatTradeSuccess(result);
        alert(successMessage);
        onSuccess?.();
        return true;

    } catch (error) {
        console.error('Error in handleTradeExecution:', error);
        alert('An unexpected error occurred while processing the trade.');
        return false;
    }
}