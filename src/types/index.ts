
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
  createdAt?: string;
  updatedAt?: string;
  status?: 'active' | 'suspended';
  avatarUrl?: string;
  referralCode?: string;
  referralBalance?: number;
  referralCount?: number;
}

export interface Wallet {
  id: string;
  userId?: string;
  currency: string;
  balance: number;
  updatedAt?: string;
  type: 'fiat' | 'crypto';
}

export interface Coin {
  id: string;
  name: string;
  symbol: string;
  depositAddress?: string;
  deposit_address?: string; // Adding for compatibility with Supabase
  taxRate?: number;
  image?: string;
  icon_url?: string; // Adding for compatibility with Supabase
  status?: 'active' | 'inactive';
  createdAt?: string;
  updatedAt?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal' | 'purchase' | 'sale';
  currency: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'forfeited';
  createdAt: string;
  updatedAt?: string;
  proof?: string;
  withdrawalAddress?: string;
  secondaryCurrency?: string;
  secondaryAmount?: number;
  description?: string;
}

export interface Order {
  id: string;
  userId: string;
  type: 'buy' | 'sell';
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  price: number;
  filled: number;
  status: 'open' | 'partially_filled' | 'filled' | 'cancelled';
  createdAt: string;
  updatedAt?: string;
}

export interface Trade {
  id: string;
  orderId: string;
  buyerId: string;
  sellerId: string;
  fromCurrency: string;
  toCurrency: string;
  amount: number;
  price: number;
  total: number;
  createdAt: string;
}

// PayHero API Types
export interface PayHeroCredentials {
  apiUsername: string;
  apiPassword: string;
}

export interface PayHeroStkPushRequest {
  amount: number;
  phone_number: string;
  channel_id: number; 
  provider: string;
  external_reference: string;
  customer_name: string;
  callback_url: string;
}

export interface PayHeroWithdrawRequest {
  external_reference: string;
  amount: number;
  phone_number: string;
  network_code: string;
  callback_url: string;
  channel: string;
  channel_id: number;
  payment_service: string;
}

export interface PayHeroTransactionStatus {
  status: boolean;
  transaction: {
    Amount: number;
    Reference: string;
    MerchantRequestID: string;
    Phone: string;
    RecipientAccountNumber?: string;
    MpesaReceiptNumber?: string;
    TransactionID: string;
    CheckoutRequestID: string;
    Provider: string;
    TransactionDate: string;
    ResultCode: number;
    ResultDesc: string;
    Status: "QUEUED" | "SUCCESS" | "FAILED";
  };
  possible_status: {
    QUEUED: string;
    SUCCESS: string;
    FAILED: string;
  };
}

// Database-ready interfaces for future Supabase migration
export interface TradingPair {
  id: string;
  baseCurrency: string;  // e.g., "BTC" in BTC/KES
  quoteCurrency: string; // e.g., "KES" in BTC/KES
  minOrderSize: number;
  maxOrderSize: number;
  isActive: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export interface UserSettings {
  userId: string;
  emailNotifications: boolean;
  twoFactorEnabled?: boolean;
  lastLoginAt?: string;
  updatedAt?: string;
}

export interface CryptoDepositRequest {
  id: string;
  userId: string;
  coinId: string;
  amount: number;
  proofImageUrl: string;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  updatedAt?: string;
  transactionId?: string;
}

export interface CryptoWithdrawalRequest {
  id: string;
  userId: string;
  coinId: string;
  amount: number;
  withdrawalAddress: string;
  taxAmount: number;
  netAmount: number;
  status: 'pending' | 'approved' | 'rejected' | 'forfeited';
  createdAt: string;
  updatedAt?: string;
  transactionId?: string;
}

export interface ReferralSettings {
  id: number;
  coinsPerReferral: number;
  level2RatePercent: number;
  transactionFeePercent: number;
  minTransferableBalance: number;
  minToCryptoWallet: number;
  createdAt?: string;
  updatedAt?: string;
}

export interface ReferralTransaction {
  id: string;
  userId: string;
  transactionType: string;
  amount: number;
  fee?: number;
  recipientId?: string;
  recipientAddress?: string;
  reason?: string;
  createdBy?: string;
  createdAt: string;
  status: string;
}

export interface ReferralNetwork {
  user: {
    id: string;
    email: string;
    referralCode: string;
  };
  directReferrals: ReferralUser[];
  indirectReferrals: ReferralUser[];
}

export interface ReferralUser {
  id: string;
  email: string;
  joinDate: string;
  coinsEarned: number;
  referredBy?: string;
  username?: string;
}

export interface ReferralStats {
  referralCode: string;
  referralBalance: number;
  directReferrals: number;
  indirectReferrals: number;
  totalEarned: number;
  transferHistory: ReferralTransaction[];
}
