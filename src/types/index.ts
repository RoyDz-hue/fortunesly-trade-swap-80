
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
