
export interface User {
  id: string;
  username: string;
  email: string;
  role: 'user' | 'admin';
}

export interface Wallet {
  id: string;
  userId: string;
  currency: string;
  balance: number;
}

export interface Coin {
  id: string;
  name: string;
  symbol: string;
  depositAddress?: string;
  taxRate?: number;
  image?: string;
}

export interface Transaction {
  id: string;
  userId: string;
  type: 'deposit' | 'withdrawal';
  currency: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected' | 'forfeited';
  createdAt: string;
  proof?: string;
  withdrawalAddress?: string;
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
