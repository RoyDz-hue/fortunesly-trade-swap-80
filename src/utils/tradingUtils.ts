import { supabase } from "@/integrations/supabase/client";

export async function executeMarketOrder(params: {
  trader_id_param: string;
  order_owner_id: string;
  order_type: string;
  trade_amount_param: number;
  currency: string;
  price: number;
  total_amount: number;
}) {
  try {
    const { data, error } = await supabase.rpc('execute_market_order', {
      trader_id_param: params.trader_id_param,
      order_owner_id_param: params.order_owner_id, // Corrected property name
      order_type_param: params.order_type,
      trade_amount_param: params.trade_amount_param,
      currency_param: params.currency,
      price_param: params.price,
      total_amount_param: params.total_amount
    });

    if (error) {
      console.error('Error executing market order:', error);
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Failed to execute market order:', error);
    throw error;
  }
}
