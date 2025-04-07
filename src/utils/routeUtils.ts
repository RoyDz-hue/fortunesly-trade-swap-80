
/**
 * Route utility functions for consistent path handling
 */

// Base routes
export const ROUTES = {
  HOME: '/',
  LOGIN: '/login',
  REGISTER: '/register',
  FORGOT: '/forgot-passward',
  
  // User dashboard
  DASHBOARD: '/dashboard',
  DASHBOARD_HOME: '/dashboard',
  DASHBOARD_WALLET: '/dashboard/wallet',
  DASHBOARD_SETTINGS: '/dashboard/settings',
  DASHBOARD_TRANSACTIONS: '/dashboard/transactions',
  DASHBOARD_WITHDRAWALS: '/dashboard/withdrawals',
  DASHBOARD_ORDERS: '/dashboard/orders',     // Added dashboard orders route
  DASHBOARD_TRADE: '/dashboard/trade',       // Added dashboard trade route
  
  // Trading
  ORDERS: '/orders',
  MARKET: '/market',
  MARKET_ORDERS: '/market/orders',
  TRADE: '/trade', // Base path
  TRADE_BY_ID: (id: string) => `/trade/${id}`,
  
  // Admin
  ADMIN: '/admin',
  ADMIN_HOME: '/admin',
  ADMIN_USERS: '/admin/users',
  ADMIN_COINS: '/admin/coins',
  ADMIN_TRADING_PAIRS: '/admin/trading-pairs',
  ADMIN_SETTINGS: '/admin/settings',
  ADMIN_WITHDRAWALS: '/admin/withdrawals',
  ADMIN_DEPOSITS: '/admin/deposits',
  ADMIN_TRANSACTIONS: '/admin/transactions',
};

/**
 * Generate a trade route for a specific coin
 * @param coinId The ID of the coin to trade
 * @returns The route path for trading the specified coin
 */
export const getTradeRoute = (coinId: string): string => {
  return ROUTES.TRADE_BY_ID(coinId);
};

/**
 * Check if a given path is a valid route in our application
 * @param path The path to check
 * @returns True if the path is valid, false otherwise
 */
export const isValidRoute = (path: string): boolean => {
  // Get all route values
  const routeValues = Object.values(ROUTES)
    .filter(route => typeof route === 'string') as string[];
  
  // Check if the path is in the list of route values
  return routeValues.includes(path) || path.startsWith('/trade/');
};
