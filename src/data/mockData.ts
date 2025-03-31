
import { Coin, Wallet, Transaction, Order, Trade } from '@/types';

export const mockCoins: Coin[] = [
  {
    id: '1',
    name: 'Kenyan Shilling',
    symbol: 'KES',
    image: 'https://upload.wikimedia.org/wikipedia/commons/4/49/Flag_of_Kenya.svg',
  },
  {
    id: '2',
    name: 'Tether',
    symbol: 'USDT',
    depositAddress: '0x1234567890abcdef1234567890abcdef12345678',
    taxRate: 10,
    image: 'https://cryptologos.cc/logos/tether-usdt-logo.png',
  },
  {
    id: '3',
    name: 'Hercules',
    symbol: 'HRC',
    depositAddress: '0xabcdef1234567890abcdef1234567890abcdef12',
    taxRate: 10,
    image: 'https://via.placeholder.com/150/5e48e8/ffffff?text=HRC',
  },
  {
    id: '4',
    name: 'Litecoin',
    symbol: 'LTC',
    depositAddress: 'LTC1234567890abcdef1234567890abcdef1234567',
    taxRate: 10,
    image: 'https://cryptologos.cc/logos/litecoin-ltc-logo.png',
  },
  {
    id: '5',
    name: 'PrivacyCoin',
    symbol: 'PVC',
    depositAddress: 'PVC1234567890abcdef1234567890abcdef1234567',
    taxRate: 10,
    image: 'https://via.placeholder.com/150/22c55e/ffffff?text=PVC',
  },
];

export const generateWallets = (userId: string): Wallet[] => {
  return mockCoins.map((coin) => ({
    id: `wallet-${coin.id}-${userId}`,
    userId,
    currency: coin.symbol,
    balance: coin.symbol === 'KES' ? 10000 : coin.symbol === 'USDT' ? 100 : Math.floor(Math.random() * 1000),
    type: coin.symbol === 'KES' ? 'fiat' : 'crypto'
  }));
};

export const generateTransactions = (userId: string): Transaction[] => {
  const transactions: Transaction[] = [];
  
  // Generate deposits
  mockCoins.forEach((coin) => {
    transactions.push({
      id: `deposit-${coin.id}-${userId}-1`,
      userId,
      type: 'deposit',
      currency: coin.symbol,
      amount: coin.symbol === 'KES' ? 5000 : coin.symbol === 'USDT' ? 50 : Math.floor(Math.random() * 500),
      status: 'approved',
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      proof: 'https://via.placeholder.com/300x200',
    });
  });
  
  // Generate pending deposit
  transactions.push({
    id: `deposit-pending-${userId}`,
    userId,
    type: 'deposit',
    currency: 'PVC',
    amount: 1000,
    status: 'pending',
    createdAt: new Date().toISOString(),
    proof: 'https://via.placeholder.com/300x200',
  });
  
  // Generate withdrawals
  mockCoins.slice(1).forEach((coin) => {
    transactions.push({
      id: `withdrawal-${coin.id}-${userId}-1`,
      userId,
      type: 'withdrawal',
      currency: coin.symbol,
      amount: coin.symbol === 'USDT' ? 25 : Math.floor(Math.random() * 200),
      status: Math.random() > 0.7 ? 'pending' : 'approved',
      createdAt: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
      withdrawalAddress: `${coin.symbol}Address${Math.random().toString(36).substring(2, 15)}`,
    });
  });
  
  return transactions;
};

export const generateOrders = (): Order[] => {
  const orders: Order[] = [];
  
  // Generate buy orders
  orders.push(
    {
      id: 'order-1',
      userId: 'user-123',
      type: 'buy',
      fromCurrency: 'KES',
      toCurrency: 'PVC',
      amount: 5000,
      price: 3,
      filled: 0,
      status: 'open',
      createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'order-2',
      userId: 'user-456',
      type: 'buy',
      fromCurrency: 'USDT',
      toCurrency: 'HRC',
      amount: 200,
      price: 0.5,
      filled: 50,
      status: 'partially_filled',
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
    }
  );
  
  // Generate sell orders
  orders.push(
    {
      id: 'order-3',
      userId: 'user-789',
      type: 'sell',
      fromCurrency: 'PVC',
      toCurrency: 'KES',
      amount: 2000,
      price: 3.5,
      filled: 0,
      status: 'open',
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'order-4',
      userId: 'user-101',
      type: 'sell',
      fromCurrency: 'LTC',
      toCurrency: 'USDT',
      amount: 5,
      price: 80,
      filled: 2,
      status: 'partially_filled',
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
    }
  );
  
  return orders;
};

export const generateTrades = (): Trade[] => {
  return [
    {
      id: 'trade-1',
      orderId: 'order-2',
      buyerId: 'user-456',
      sellerId: 'user-567',
      fromCurrency: 'USDT',
      toCurrency: 'HRC',
      amount: 50,
      price: 0.5,
      total: 25,
      createdAt: new Date(Date.now() - 2.5 * 24 * 60 * 60 * 1000).toISOString(),
    },
    {
      id: 'trade-2',
      orderId: 'order-4',
      buyerId: 'user-202',
      sellerId: 'user-101',
      fromCurrency: 'USDT',
      toCurrency: 'LTC',
      amount: 2,
      price: 80,
      total: 160,
      createdAt: new Date(Date.now() - 4 * 24 * 60 * 60 * 1000).toISOString(),
    },
  ];
};
