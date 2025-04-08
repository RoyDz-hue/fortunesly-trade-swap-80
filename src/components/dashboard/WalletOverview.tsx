import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Coin } from "@/types";
import { useAuth } from "@/context/AuthContext";
import DepositDialog from "./DepositDialog";
import WithdrawDialog from "./WithdrawDialog";
import CryptoDepositDialog from "./CryptoDepositDialog";
import CryptoWithdrawDialog from "./CryptoWithdrawDialog";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, ChevronDown } from "lucide-react";
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { WalletCard } from "./WalletCard";
import { fetchUserWallets, createNewUser, formatCoins } from "@/utils/walletHelpers";
import { convertToSupabaseUser } from "@/utils/userUtils";
import styles from "./WalletCard.module.css";

/**
 * Wallet Overview Component
 *
 * Enhanced, redesigned wallet interface with credit card design and swipe gestures
 * 
 * Key Features:
 * - Stacked Credit Card UI: Visually appealing cards stacked in 3D space
 * - Swipe Gestures: Cards can be swiped left/right to reveal cards beneath
 * - Realistic Design: Cards resemble actual credit/debit cards with chips and details
 * - Responsive: Adapts to both desktop and mobile devices
 * - Interactive Elements: Deposit/withdraw buttons on each card
 */

const WalletOverview: React.FC = () => {
    const [wallets, setWallets] = useState<Wallet[]>([]);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const { user } = useAuth();
    const { toast } = useToast();

    // Dialog states
    const [isDepositOpen, setIsDepositOpen] = useState(false);
    const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
    const [isCryptoDepositOpen, setIsCryptoDepositOpen] = useState(false);
    const [isCryptoWithdrawOpen, setIsCryptoWithdrawOpen] = useState(false);

    // Selected wallet/coin states
    const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
    const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
    const [availableCoins, setAvailableCoins] = useState<Coin[]>([]);
    
    // Track which cards have been swiped away
    const [swipedCards, setSwipedCards] = useState<string[]>([]);

    // Handle card swipe
    const handleCardSwipe = (walletId: string) => {
        setSwipedCards(prev => [...prev, walletId]);
        
        // Optional: Add haptic feedback for mobile devices
        if (navigator.vibrate) {
            navigator.vibrate(50);
        }
    };

    // Reset all swiped cards to bring them back
    const resetCards = () => {
        setSwipedCards([]);
    };

    useEffect(() => {
        const loadWalletData = async () => {
            if (!user) return;

            setIsLoading(true);
            setError(null);

            try {
                // Fetch coins data
                const { data: coinsData, error: coinsError } = await supabase
                    .from('coins')
                    .select('*')
                    .order('symbol');

                if (coinsError) {
                    console.error('Error fetching coins:', coinsError);
                    throw coinsError;
                }

                const formattedCoins = formatCoins(coinsData || []);
                setAvailableCoins(formattedCoins);

                // Convert App User to Supabase User and get user wallet data
                const supabaseUser = convertToSupabaseUser(user);
                const { data: userData, error: userError } = await supabase
                    .from('users')
                    .select('balance_crypto, balance_fiat')
                    .eq('id', supabaseUser.id)
                    .single();

                if (userError) {
                    if (userError.code === 'PGRST116') {
                        // User not found, create new user
                        const newUser = await createNewUser(user);
                        if (newUser) {
                            const walletsList = fetchUserWallets(newUser, formattedCoins);
                            setWallets(walletsList);
                        } else {
                            throw new Error("Failed to create user");
                        }
                    } else {
                        throw userError;
                    }
                } else if (userData) {
                    const walletsList = fetchUserWallets(userData, formattedCoins);
                    setWallets(walletsList);
                }
            } catch (error) {
                console.error('Error fetching data:', error);
                setError("Failed to load wallet data. Please try again.");
                toast({
                    title: "Error",
                    description: "Failed to load wallet data",
                    variant: "destructive"
                });
            } finally {
                setIsLoading(false);
            }
        };

        loadWalletData();
    }, [user, toast]);

    const handleDepositClick = (wallet: Wallet) => {
        setSelectedWallet(wallet);
        if (wallet.type === 'fiat') {
            setIsDepositOpen(true);
        } else {
            const coinData = availableCoins.find(coin => coin.symbol === wallet.currency);
            if (coinData) {
                setSelectedCoin(coinData);
                setIsCryptoDepositOpen(true);
            } else {
                toast({
                    title: "Error",
                    description: "Coin information not found",
                    variant: "destructive"
                });
            }
        }
    };

    const handleWithdrawClick = (wallet: Wallet) => {
        setSelectedWallet(wallet);
        if (wallet.type === 'fiat') {
            setIsWithdrawOpen(true);
        } else {
            const coinData = availableCoins.find(coin => coin.symbol === wallet.currency);
            if (coinData) {
                setSelectedCoin(coinData);
                setIsCryptoWithdrawOpen(true);
            } else {
                toast({
                    title: "Error",
                    description: "Coin information not found",
                    variant: "destructive"
                });
            }
        }
    };

    const handleTransactionSuccess = () => {
        if (!user) return;

        setIsLoading(true);
        supabase
            .from('users')
            .select('balance_crypto, balance_fiat')
            .eq('id', user.id)
            .single()
            .then(({ data, error }) => {
                if (error) {
                    console.error('Error refreshing balances:', error);
                } else if (data) {
                    const updatedWallets = wallets.map(wallet => {
                        if (wallet.currency === 'KES') {
                            return { ...wallet, balance: data.balance_fiat || 0 };
                        } else {
                            const cryptoBalances = data.balance_crypto || {};
                            return {
                                ...wallet,
                                balance: (cryptoBalances as Record<string, number>)[wallet.currency] || 0
                            };
                        }
                    });

                    setWallets(updatedWallets);
                }
                setIsLoading(false);
            });
    };

    // Skeleton loading state
    if (isLoading) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Wallet</h2>
                <div className="flex justify-end space-x-2 mb-4">
                    <Skeleton className="h-10 w-24" />
                    <Skeleton className="h-10 w-24" />
                </div>
                
                <div className={styles.walletStack}>
                    {[1, 2, 3].map((i) => (
                        <div 
                            key={i} 
                            className={styles.creditCard}
                            style={{
                                transform: `translateZ(${-10 * (i-1)}px) translateY(${20 * (i-1)}px)`,
                                background: `linear-gradient(135deg, #2C3E50 0%, #1A2530 100%)`,
                                filter: `brightness(${1 - (i-1) * 0.1})`,
                                zIndex: 10 - (i-1)
                            }}
                        >
                            <div className={styles.cardInner}>
                                <div className={styles.cardHeader}>
                                    <Skeleton className="w-12 h-12 rounded-lg" />
                                    <Skeleton className="w-12 h-10 rounded-md" />
                                </div>
                                
                                <div className={styles.cardMiddle}>
                                    <div className="flex gap-2 mb-3">
                                        <Skeleton className="w-12 h-5" />
                                        <Skeleton className="w-12 h-5" />
                                        <Skeleton className="w-12 h-5" />
                                        <Skeleton className="w-12 h-5" />
                                    </div>
                                    <Skeleton className="w-20 h-3 mb-2" />
                                    <Skeleton className="w-32 h-6" />
                                </div>
                                
                                <div className={styles.cardFooter}>
                                    <div className="flex gap-2">
                                        <Skeleton className="w-20 h-8 rounded-full" />
                                        <Skeleton className="w-20 h-8 rounded-full" />
                                    </div>
                                    <Skeleton className="w-16 h-10" />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>
        );
    }

    // Error state
    if (error) {
        return (
            <div className="space-y-4">
                <h2 className="text-xl font-bold text-gray-900">Wallet</h2>
                <Alert variant="destructive">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>{error}</AlertDescription>
                </Alert>
                <Button 
                    className="px-4 py-2 bg-fortunesly-primary text-white rounded-md hover:bg-fortunesly-primary/90"
                    onClick={() => window.location.reload()}
                >
                    Retry
                </Button>
            </div>
        );
    }

    return (
        <div className="space-y-4">
            {/* Header with dropdown menus */}
            <div className="flex items-center justify-between">
                <h2 className="text-xl font-bold text-gray-900">Wallet</h2>
                <div className="flex space-x-2">
                    {/* Deposit Dropdown */}
                    <DropdownMenu>
                                            <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                className="flex items-center px-3 py-2 text-sm font-medium text-white bg-fortunesly-primary rounded-md hover:bg-fortunesly-primary/90 transition-colors"
                            >
                                <ArrowDownCircle className="h-4 w-4 mr-1" />
                                Deposit
                                <ChevronDown className="h-4 w-4 ml-1" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            {wallets.map((wallet) => (
                                <DropdownMenuItem
                                    key={`deposit-${wallet.id}`}
                                    className="cursor-pointer"
                                    onClick={() => handleDepositClick(wallet)}
                                >
                                    <div className="flex items-center w-full">
                                        <div className="w-5 h-5 mr-2 rounded-full overflow-hidden flex-shrink-0">
                                            <img
                                                src={wallet.currency === "KES"
                                                    ? "https://bfsodqqylpfotszjlfuk.supabase.co/storage/v1/object/public/apps//kenya.png"
                                                    : availableCoins.find(c => c.symbol === wallet.currency)?.image}
                                                alt={wallet.currency}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = `https://via.placeholder.com/20/6E59A5/ffffff?text=${wallet.currency}`;
                                                    target.onerror = null;
                                                }}
                                            />
                                        </div>
                                        <span>{wallet.currency}</span>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>

                    {/* Withdraw Dropdown */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button 
                                variant="outline"
                                className="flex items-center px-3 py-2 text-sm font-medium text-fortunesly-primary bg-white border border-fortunesly-primary rounded-md hover:bg-gray-50 transition-colors"
                            >
                                <ArrowUpCircle className="h-4 w-4 mr-1" />
                                Withdraw
                                <ChevronDown className="h-4 w-4 ml-1" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            {wallets.map((wallet) => (
                                <DropdownMenuItem
                                    key={`withdraw-${wallet.id}`}
                                    className="cursor-pointer"
                                    onClick={() => handleWithdrawClick(wallet)}
                                >
                                    <div className="flex items-center w-full">
                                        <div className="w-5 h-5 mr-2 rounded-full overflow-hidden flex-shrink-0">
                                            <img
                                                src={wallet.currency === "KES"
                                                    ? "https://bfsodqqylpfotszjlfuk.supabase.co/storage/v1/object/public/apps//kenya.png"
                                                    : availableCoins.find(c => c.symbol === wallet.currency)?.image}
                                                alt={wallet.currency}
                                                className="w-full h-full object-cover"
                                                onError={(e) => {
                                                    const target = e.target as HTMLImageElement;
                                                    target.src = `https://via.placeholder.com/20/6E59A5/ffffff?text=${wallet.currency}`;
                                                    target.onerror = null;
                                                }}
                                            />
                                        </div>
                                        <span>{wallet.currency}</span>
                                    </div>
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>
            </div>

            {/* Wallet Cards */}
            {wallets.length === 0 ? (
                <Alert>
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription>No wallets found. Please contact support if you believe this is an error.</AlertDescription>
                </Alert>
            ) : (
                <div className="mb-8">
                    {/* Credit Card Stack */}
                    <div className={styles.walletStack}>
                        {wallets.map((wallet, index) => {
                            const coin = availableCoins.find(c => c.symbol === wallet.currency);
                            return (
                                <WalletCard
                                    key={wallet.id}
                                    wallet={wallet}
                                    coin={coin}
                                    index={index}
                                    onDeposit={handleDepositClick}
                                    onWithdraw={handleWithdrawClick}
                                    swipedCards={swipedCards}
                                    onSwipe={handleCardSwipe}
                                />
                            );
                        })}
                    </div>
                    
                    {/* Reset button that appears when cards are swiped */}
                    {swipedCards.length > 0 && (
                        <div className="mt-6 text-center">
                            <Button
                                variant="outline"
                                className="px-4 py-2 bg-white border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors"
                                onClick={resetCards}
                            >
                                Reset Cards
                            </Button>
                        </div>
                    )}
                </div>
            )}

            {/* Dialogs */}
            {selectedWallet?.type === 'fiat' && (
                <>
                    <DepositDialog
                        isOpen={isDepositOpen}
                        onClose={() => setIsDepositOpen(false)}
                        currency={selectedWallet.currency}
                        onSuccess={handleTransactionSuccess}
                    />
                    <WithdrawDialog
                        isOpen={isWithdrawOpen}
                        onClose={() => setIsWithdrawOpen(false)}
                        currency={selectedWallet.currency}
                        maxAmount={selectedWallet.balance}
                        onSuccess={handleTransactionSuccess}
                    />
                </>
            )}

            {selectedCoin && (
                <>
                    <CryptoDepositDialog
                        isOpen={isCryptoDepositOpen}
                        onClose={() => setIsCryptoDepositOpen(false)}
                        coin={selectedCoin}
                        onSuccess={handleTransactionSuccess}
                    />
                    <CryptoWithdrawDialog
                        isOpen={isCryptoWithdrawOpen}
                        onClose={() => setIsCryptoWithdrawOpen(false)}
                        coin={selectedCoin}
                        maxAmount={selectedWallet?.balance || 0}
                        onSuccess={handleTransactionSuccess}
                    />
                </>
            )}
        </div>
    );
};

export default WalletOverview;
