
import { supabase } from '@/integrations/supabase/client';
import { 
  ReferralStats, 
  ReferralNetwork, 
  ReferralSettings,
  ReferralTransaction
} from '@/types';

/**
 * Get current user's referral statistics
 */
export const getUserReferralStats = async (): Promise<ReferralStats> => {
  // Get user's basic referral info
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('referral_code, referral_balance, referral_count')
    .eq('id', (await supabase.auth.getUser()).data.user?.id || '')
    .single();
  
  if (userError) {
    throw new Error(userError.message);
  }

  // Get direct referrals count
  const { count: directCount, error: directError } = await supabase
    .from('users')
    .select('id', { count: 'exact', head: true })
    .eq('referred_by', (await supabase.auth.getUser()).data.user?.id || '');
  
  if (directError) {
    throw new Error(directError.message);
  }
  
  // Get indirect referrals
  // First, get all users directly referred by the current user
  const { data: directReferrals, error: directRefError } = await supabase
    .from('users')
    .select('id')
    .eq('referred_by', (await supabase.auth.getUser()).data.user?.id || '');
  
  if (directRefError) {
    throw new Error(directRefError.message);
  }

  // Then, count all users referred by those direct referrals
  let indirectCount = 0;
  
  if (directReferrals && directReferrals.length > 0) {
    const directIds = directReferrals.map(ref => ref.id);
    
    const { count: indirectCountResult, error: indirectError } = await supabase
      .from('users')
      .select('id', { count: 'exact', head: true })
      .in('referred_by', directIds);
      
    if (indirectError) {
      throw new Error(indirectError.message);
    }
    
    indirectCount = indirectCountResult || 0;
  }
  
  // Get total earned from transactions
  const { data: transactions, error: txError } = await supabase
    .from('referral_transactions')
    .select('*')
    .eq('user_id', (await supabase.auth.getUser()).data.user?.id || '')
    .order('created_at', { ascending: false });
    
  if (txError) {
    throw new Error(txError.message);
  }
  
  const totalEarned = transactions
    ? transactions
        .filter(tx => ['referral_reward', 'referral_reward_l2', 'transfer_in', 'admin_adjustment_add'].includes(tx.transaction_type))
        .reduce((sum, tx) => sum + tx.amount, 0)
    : 0;
    
  // Format and return the stats
  return {
    referralCode: userData?.referral_code || '',
    referralBalance: userData?.referral_balance || 0,
    directReferrals: directCount || 0,
    indirectReferrals: indirectCount || 0,
    totalEarned,
    transferHistory: transactions?.map(tx => ({
      id: tx.id,
      userId: tx.user_id,
      transactionType: tx.transaction_type,
      amount: tx.amount,
      fee: tx.fee,
      recipientId: tx.recipient_id,
      recipientAddress: tx.recipient_address,
      reason: tx.reason,
      createdBy: tx.created_by,
      createdAt: tx.created_at,
      status: tx.status
    })) || []
  };
};

/**
 * Get user's referral network
 */
export const getUserReferralNetwork = async (): Promise<ReferralNetwork> => {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  if (!userId) {
    throw new Error('User not authenticated');
  }
  
  // Get current user info
  const { data: userData, error: userError } = await supabase
    .from('users')
    .select('id, email, referral_code')
    .eq('id', userId)
    .single();
  
  if (userError || !userData) {
    throw new Error(userError?.message || 'User not found');
  }
  
  // Get direct referrals
  const { data: directReferrals, error: directError } = await supabase
    .from('users')
    .select('id, email, username, created_at')
    .eq('referred_by', userId);
  
  if (directError) {
    throw new Error(directError.message);
  }
  
  // Format direct referrals with earned coins
  const formattedDirectReferrals = await Promise.all((directReferrals || []).map(async (ref) => {
    // Get reward amount for this referral
    const { data: txData } = await supabase
      .from('referral_transactions')
      .select('amount')
      .eq('user_id', userId)
      .eq('transaction_type', 'referral_reward')
      .eq('reason', 'Direct referral reward for new user')
      .single();
      
    return {
      id: ref.id,
      email: ref.email,
      username: ref.username,
      joinDate: ref.created_at,
      coinsEarned: txData?.amount || 0
    };
  }));
  
  // Get all indirect referrals (level 2)
  let indirectReferrals: ReferralNetwork['indirectReferrals'] = [];
  
  if (directReferrals && directReferrals.length > 0) {
    const directIds = directReferrals.map(ref => ref.id);
    
    // Get users referred by direct referrals
    const { data: indirectUsers, error: indirectError } = await supabase
      .from('users')
      .select('id, email, username, referred_by, created_at')
      .in('referred_by', directIds);
    
    if (indirectError) {
      throw new Error(indirectError.message);
    }
    
    // Format indirect referrals
    indirectReferrals = await Promise.all((indirectUsers || []).map(async (ref) => {
      // Get reward amount for this indirect referral
      const { data: txData } = await supabase
        .from('referral_transactions')
        .select('amount')
        .eq('user_id', userId)
        .eq('transaction_type', 'referral_reward_l2')
        .eq('reason', 'Indirect referral reward (level 2)')
        .single();
        
      return {
        id: ref.id,
        email: ref.email,
        username: ref.username,
        referredBy: ref.referred_by,
        joinDate: ref.created_at,
        coinsEarned: txData?.amount || 0
      };
    }));
  }
  
  return {
    user: {
      id: userData.id,
      email: userData.email,
      referralCode: userData.referral_code
    },
    directReferrals: formattedDirectReferrals,
    indirectReferrals
  };
};

/**
 * Get user's referral settings
 */
export const getReferralSettings = async (): Promise<ReferralSettings> => {
  const { data, error } = await supabase
    .from('referral_settings')
    .select('*')
    .order('id', { ascending: false })
    .limit(1)
    .single();
    
  if (error) {
    throw new Error(error.message);
  }
  
  return {
    id: data.id,
    coinsPerReferral: data.coins_per_referral,
    level2RatePercent: data.level2_rate_percent,
    transactionFeePercent: data.transaction_fee_percent,
    minTransferableBalance: data.min_transferable_balance,
    minToCryptoWallet: data.min_to_crypto_wallet,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

/**
 * Transfer coins to another user via email
 */
export const transferCoins = async (recipientEmail: string, amount: number): Promise<any> => {
  const userId = (await supabase.auth.getUser()).data.user?.id;
  
  if (!userId) {
    throw new Error('User not authenticated');
  }
  
  const { data, error } = await supabase.rpc('transfer_referral_coins', {
    sender_id: userId,
    recipient_email: recipientEmail,
    amount: amount
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};

/**
 * Update referral settings (admin only)
 */
export const updateReferralSettings = async (settings: Partial<ReferralSettings>): Promise<ReferralSettings> => {
  const { data, error } = await supabase
    .from('referral_settings')
    .update({
      coins_per_referral: settings.coinsPerReferral,
      level2_rate_percent: settings.level2RatePercent,
      transaction_fee_percent: settings.transactionFeePercent,
      min_transferable_balance: settings.minTransferableBalance,
      min_to_crypto_wallet: settings.minToCryptoWallet,
      updated_at: new Date().toISOString()
    })
    .eq('id', settings.id)
    .select()
    .single();
    
  if (error) {
    throw new Error(error.message);
  }
  
  return {
    id: data.id,
    coinsPerReferral: data.coins_per_referral,
    level2RatePercent: data.level2_rate_percent,
    transactionFeePercent: data.transaction_fee_percent,
    minTransferableBalance: data.min_transferable_balance,
    minToCryptoWallet: data.min_to_crypto_wallet,
    createdAt: data.created_at,
    updatedAt: data.updated_at
  };
};

/**
 * Admin function to adjust a user's referral balance
 */
export const adminAdjustBalance = async (
  targetUserId: string, 
  amount: number, 
  reason: string
): Promise<any> => {
  const adminId = (await supabase.auth.getUser()).data.user?.id;
  
  if (!adminId) {
    throw new Error('Admin not authenticated');
  }
  
  const { data, error } = await supabase.rpc('admin_adjust_referral_balance', {
    target_user_id: targetUserId,
    adjustment_amount: amount,
    adjustment_reason: reason,
    admin_id: adminId
  });
  
  if (error) {
    throw new Error(error.message);
  }
  
  return data;
};
