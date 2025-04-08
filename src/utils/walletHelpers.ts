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

/**
 * Calculate swipe direction and velocity from gesture event
 */
export const calculateSwipeDetails = (
    startX: number, 
    endX: number, 
    duration: number
): { direction: 'left' | 'right' | null, velocity: number } => {
    const threshold = 50; // Minimum distance to be considered a swipe
    const distance = endX - startX;
    const velocity = Math.abs(distance) / duration; // pixels per ms
    
    if (Math.abs(distance) < threshold) {
        return { direction: null, velocity };
    }
    
    return {
        direction: distance > 0 ? 'right' : 'left',
        velocity
    };
};

/**
 * Get card animation properties based on swipe direction
 */
export const getSwipeAnimationProps = (
    direction: 'left' | 'right' | null,
    velocity: number = 1
): { x: number, rotate: number, opacity: number } => {
    if (!direction) {
        return { x: 0, rotate: 0, opacity: 1 };
    }
    
    const baseDistance = 1500; // How far the card flies off
    const distance = baseDistance * Math.min(Math.max(velocity, 0.5), 2);
    
    return {
        x: direction === 'left' ? -distance : distance,
        rotate: direction === 'left' ? -30 : 30,
        opacity: 0.5
    };
};

/**
 * Get gradient colors for different currency types
 */
export const getCurrencyCardTheme = (currency: string): {
    gradient: string,
    textColor: string,
    chipColor: string
} => {
    const themes: Record<string, any> = {
        'BTC': {
            gradient: 'linear-gradient(135deg, #F7931A 0%, #9C591B 100%)',
            textColor: 'text-white',
            chipColor: 'bg-yellow-500'
        },
        'ETH': {
            gradient: 'linear-gradient(135deg, #627EEA 0%, #364485 100%)',
            textColor: 'text-white',
            chipColor: 'bg-blue-500'
        },
        'USDT': {
            gradient: 'linear-gradient(135deg, #26A17B 0%, #1A7865 100%)',
            textColor: 'text-white',
            chipColor: 'bg-green-500'
        },
        'BNB': {
            gradient: 'linear-gradient(135deg, #F3BA2F 0%, #AF8319 100%)',
            textColor: 'text-gray-900',
            chipColor: 'bg-yellow-400'
        },
        'XRP': {
            gradient: 'linear-gradient(135deg, #23292F 0%, #101418 100%)',
            textColor: 'text-white',
            chipColor: 'bg-gray-600'
        },
        'ADA': {
            gradient: 'linear-gradient(135deg, #0033AD 0%, #001F68 100%)',
            textColor: 'text-white',
            chipColor: 'bg-blue-700'
        },
        'SOL': {
            gradient: 'linear-gradient(135deg, #9945FF 0%, #6A30B0 100%)',
            textColor: 'text-white',
            chipColor: 'bg-purple-600'
        },
        'DOT': {
            gradient: 'linear-gradient(135deg, #E6007A 0%, #9C0054 100%)',
            textColor: 'text-white',
            chipColor: 'bg-pink-600'
        },
        'DOGE': {
            gradient: 'linear-gradient(135deg, #C3A634 0%, #8A7522 100%)',
            textColor: 'text-white',
            chipColor: 'bg-yellow-600'
        },
        'KES': {
            gradient: 'linear-gradient(135deg, #43326B 0%, #6E59A5 100%)',
            textColor: 'text-white',
            chipColor: 'bg-indigo-600'
        }
    };
    
    return themes[currency] || {
        gradient: 'linear-gradient(135deg, #2C3E50 0%, #1A2530 100%)',
        textColor: 'text-white',
        chipColor: 'bg-gray-500'
    };
};