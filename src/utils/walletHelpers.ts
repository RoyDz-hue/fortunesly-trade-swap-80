import { User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";
import { Wallet, Coin } from "@/types";

/**
 * Format raw coin data from database into Coin objects
 */
export const formatCoins = (coinsData: any[]): Coin[] => {
    return coinsData.map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        depositAddress: coin.deposit_address,
        image: coin.icon_url || `https://via.placeholder.com/40/6E59A5/ffffff?text=${coin.symbol}`,
        taxRate: 10
    }));
};

/**
 * Create a new user in the database
 */
export const createNewUser = async (user: User) => {
    console.log("Creating new user record");
    const randomPassword = Math.random().toString(36).slice(-10);

    const { data: newUser, error } = await supabase
        .from('users')
        .insert({
            id: user.id,
            email: user.email || '',
            username: user.email?.split('@')[0] || 'user',
            password: randomPassword,
            balance_fiat: 0,
            balance_crypto: {}
        })
        .select()
        .single();

    if (error) {
        console.error('Error creating user record:', error);
        return null;
    }

    console.log("New user created:", newUser);
    return newUser;
};

/**
 * Convert user data into wallet objects
 */
export const fetchUserWallets = (userData: any, formattedCoins: Coin[]): Wallet[] => {
    // Initialize with fiat wallet
    const walletsList: Wallet[] = [{
        id: 'kes-wallet',
        currency: 'KES',
        balance: userData.balance_fiat || 0, 
        type: 'fiat'
    }];

    // Add crypto wallets
    const cryptoBalances = userData.balance_crypto || {};

    formattedCoins.forEach(coin => {
        if (coin.symbol !== 'KES') {
            const balance = (cryptoBalances as Record<string, number>)[coin.symbol] || 0;
            walletsList.push({
                id: `${coin.symbol.toLowerCase()}-wallet`,
                currency: coin.symbol,
                balance: balance,
                type: 'crypto'
            });
        }
    });

    return walletsList;
};

/**
 * Get appropriate color theme for different cryptocurrencies
 */
export const getCoinColorTheme = (currency: string): string => {
    const themes: Record<string, string> = {
        'BTC': 'from-orange-600 to-orange-800',
        'ETH': 'from-blue-700 to-purple-800',
        'USDT': 'from-green-600 to-green-800',
        'BNB': 'from-yellow-600 to-yellow-800',
        'XRP': 'from-blue-600 to-blue-800',
        'ADA': 'from-indigo-600 to-indigo-800',
        'SOL': 'from-purple-600 to-purple-800',
        'DOT': 'from-pink-600 to-pink-800',
        'DOGE': 'from-yellow-500 to-yellow-700',
        'KES': 'from-indigo-800 to-indigo-900',
    };

    return themes[currency] || 'from-gray-800 to-gray-900';
};

/**
 * Format balance with appropriate decimal places based on currency
 */
export const formatBalance = (balance: number, currency: string): string => {
    // Crypto typically shows more decimal places than fiat
    const decimalPlaces = currency === 'KES' ? 2 : 8;
    return balance.toLocaleString(undefined, {
        minimumFractionDigits: 0,
        maximumFractionDigits: decimalPlaces
    });
};
