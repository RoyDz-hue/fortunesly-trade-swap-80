import { supabase } from "@/integrations/supabase/client";

/**
 * Updates a user's crypto balance
 * @param userId The user ID
 * @param currency The currency to update
 * @param amount The amount to add or subtract (positive for add, negative for subtract)
 * @returns The success state and updated balance
 */
export const updateUserCryptoBalance = async (
  userId: string, 
  currency: string, 
  amount: number
) => {
  try {
    // First get the current balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance_crypto')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Parse and update the balance
    const balances = userData.balance_crypto || {};
    const currentBalance = parseFloat(String(balances[currency])) || 0;
    const newBalance = currentBalance + amount;
    
    // Create updated balance object
    const updatedBalance = {
      ...(typeof balances === 'object' ? balances : {}),
      [currency]: newBalance
    };

    // Update the user's balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        balance_crypto: updatedBalance 
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return { 
      success: true, 
      balance: newBalance,
      error: null
    };
  } catch (error: any) {
    console.error(`Error updating ${currency} balance for user ${userId}:`, error);
    return { 
      success: false, 
      balance: null,
      error: error.message || "Failed to update balance"
    };
  }
};

/**
 * Updates a user's fiat (KES) balance
 * @param userId The user ID
 * @param amount The amount to add or subtract (positive for add, negative for subtract)
 * @returns The success state and updated balance
 */
export const updateUserFiatBalance = async (userId: string, amount: number) => {
  try {
    // First get the current balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance_fiat')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Calculate the new balance
    const currentBalance = userData.balance_fiat || 0;
    const newBalance = currentBalance + amount;
    
    // Update the user's balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        balance_fiat: newBalance 
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return { 
      success: true, 
      balance: newBalance,
      error: null
    };
  } catch (error: any) {
    console.error(`Error updating fiat balance for user ${userId}:`, error);
    return { 
      success: false, 
      balance: null,
      error: error.message || "Failed to update balance"
    };
  }
};

/**
 * Gets a user's crypto balance for a specific currency
 * @param userId The user ID
 * @param currency The currency to check
 * @returns The balance or null if error
 */
export const getUserCryptoBalance = async (userId: string, currency: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('balance_crypto')
      .eq('id', userId)
      .single();

    if (error) throw error;

    const balances = data.balance_crypto || {};
    return parseFloat(String(balances[currency])) || 0;
  } catch (error) {
    console.error(`Error getting ${currency} balance for user ${userId}:`, error);
    return null;
  }
};

/**
 * Gets a user's fiat (KES) balance
 * @param userId The user ID
 * @returns The balance or null if error
 */
export const getUserFiatBalance = async (userId: string) => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('balance_fiat')
      .eq('id', userId)
      .single();

    if (error) throw error;

    return data.balance_fiat || 0;
  } catch (error) {
    console.error(`Error getting fiat balance for user ${userId}:`, error);
    return null;
  }
};