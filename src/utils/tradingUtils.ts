import { supabase } from "@/integrations/supabase/client";

/**
 * Executes a trade between two users
 * @param orderId The ID of the order
 * @param traderId The ID of the trader (person executing the trade)
 * @param tradeAmount The amount to trade
 * @param transactionData Additional data needed for transaction records
 * @returns Promise with the result
 */
export const executeTrade = async (
  orderId: string,
  traderId: string,
  tradeAmount: number,
  transactionData: {
    executing_user_id: string;
    order_owner_id: string;
    order_type: string;
    amount: number;
    currency: string;
  }
) => {
  try {
    console.log(`Executing trade: Order ${orderId}, Trader ${traderId}, Amount ${tradeAmount}`);

    // First, get the current order data to check if this is the first partial execution
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', orderId)
      .single();

    if (orderError) {
      console.error('Error fetching order data:', orderError);
      throw orderError;
    }

    // If this is the first partial execution, store the original amount
    if (!orderData.original_amount) {
      const { error: updateError } = await supabase
        .from('orders')
        .update({ original_amount: orderData.amount })
        .eq('id', orderId);

      if (updateError) {
        console.error('Error updating original amount:', updateError);
        throw updateError;
      }
    }

    // Execute the trade through RPC with the additional transaction data parameters
    const { data, error } = await supabase.rpc('execute_market_order', {
      order_id_param: orderId,
      trader_id_param: traderId,
      trade_amount_param: tradeAmount,
      order_owner_id_param: transactionData.order_owner_id,
      order_type_param: transactionData.order_type
    });

    if (error) {
      console.error('Trade execution error:', error);
      throw error;
    }

    // Update order status based on partial or complete execution
    if (orderData.amount === tradeAmount) {
      // Full execution - mark as filled
      const { error: statusError } = await supabase
        .from('orders')
        .update({ status: 'filled' })
        .eq('id', orderId);

      if (statusError) {
        console.error('Error updating order status:', statusError);
        throw statusError;
      }
    } else {
      // Partial execution - mark as partially-filled
      const { error: statusError } = await supabase
        .from('orders')
        .update({ 
          status: 'partially-filled',
          amount: orderData.amount - tradeAmount  // Update remaining amount
        })
        .eq('id', orderId);

      if (statusError) {
        console.error('Error updating order status:', statusError);
        throw statusError;
      }
    }

    // Create transaction records for both parties if needed
    // This might be handled by the RPC function, but we can add additional logic here if needed
    
    console.log("Trade execution result:", data);

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
    console.log(`Cancelling order: ${orderId}`);

    const { data, error } = await supabase.rpc('cancel_order', {
      order_id_param: orderId
    });

    if (error) {
      console.error('Cancel order error:', error);
      throw error;
    }

    console.log("Cancel order result:", data);

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

/**
 * Gets transaction history for a user with additional filtering options
 * @param userId The ID of the user
 * @param filter Optional filter by transaction type
 * @param limit Optional limit of results to return
 * @returns Promise with the transaction data
 */
export const getTransactionHistory = async (
  userId: string,
  filter?: 'all' | 'deposit' | 'withdrawal' | 'purchase' | 'sale' | 'trade',
  limit = 10
) => {
  try {
    console.log(`Getting transaction history for user ${userId}, filter: ${filter}, limit: ${limit}`);

    let query = supabase
      .from('transactions')
      .select('*')
      .eq('user_id', userId)
      .order('created_at', { ascending: false });

    if (filter && filter !== 'all') {
      if (filter === 'trade') {
        // Trade includes both purchase and sale
        query = query.in('type', ['purchase', 'sale']);
      } else {
        query = query.eq('type', filter);
      }
    }

    if (limit) {
      query = query.limit(limit);
    }

    const { data, error } = await query;

    if (error) {
      console.error('Transaction history error:', error);
      throw error;
    }

    console.log(`Retrieved ${data?.length || 0} transactions`);

    return {
      success: true,
      data
    };
  } catch (error: any) {
    console.error('Error fetching transaction history:', error);
    return {
      success: false,
      error: error.message || 'An unexpected error occurred'
    };
  }
};