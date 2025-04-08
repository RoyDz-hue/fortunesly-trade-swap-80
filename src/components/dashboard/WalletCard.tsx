import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Wallet, Coin } from "@/types";
import { Button } from "@/components/ui/button";
import { ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface WalletCardProps {
    wallet: Wallet;
    coin?: Coin;
    onDeposit: (wallet: Wallet) => void;
    onWithdraw: (wallet: Wallet) => void;
    isExpanded: boolean;
    onToggleExpand: (walletId: string) => void;
}

// Animation variants for card appearance
const cardVariants = {
    hidden: { opacity: 0, x: 50 },
    visible: { opacity: 1, x: 0, transition: { duration: 0.3, ease: "easeInOut" } },
    exit: { opacity: 0, x: -50, transition: { duration: 0.2 } }
};

// Animation variants for balance display
const balanceVariants = {
    initial: { scale: 1 },
    hover: { scale: 1.05, transition: { duration: 0.2 } }
};

// Get gradient color based on currency type
const getCardGradient = (type: string, currency: string) => {
    if (type === 'fiat') {
        return "bg-gradient-to-br from-indigo-800 to-indigo-900";
    } else if (currency === 'BTC') {
        return "bg-gradient-to-br from-orange-600 to-orange-800";
    } else if (currency === 'ETH') {
        return "bg-gradient-to-br from-blue-700 to-purple-800";
    } else {
        return "bg-gradient-to-br from-gray-800 to-gray-900";
    }
};

export const WalletCard: React.FC<WalletCardProps> = ({
    wallet,
    coin,
    onDeposit,
    onWithdraw,
    isExpanded,
    onToggleExpand
}) => {
    const handleDeposit = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card expansion toggle
        onDeposit(wallet);
    };

    const handleWithdraw = (e: React.MouseEvent) => {
        e.stopPropagation(); // Prevent card expansion toggle
        onWithdraw(wallet);
    };

    return (
        <motion.div
            variants={cardVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            className="w-full"
            layout
        >
            <div
                className={cn(
                    "relative rounded-xl overflow-hidden shadow-lg transition-all duration-300",
                    getCardGradient(wallet.type, wallet.currency),
                    "border border-gray-700",
                    "cursor-pointer",
                    isExpanded ? "mb-6" : "mb-4"
                )}
                onClick={() => onToggleExpand(wallet.id)}
            >
                {/* Card header */}
                <div className="px-4 py-4 relative overflow-hidden">
                    {/* Abstract pattern overlay for visual interest */}
                    <div className="absolute top-0 right-0 opacity-5 pointer-events-none">
                        <svg width="120" height="120" viewBox="0 0 120 120" fill="none" xmlns="http://www.w3.org/2000/svg">
                            <circle cx="60" cy="60" r="50" stroke="white" strokeWidth="2" />
                            <circle cx="60" cy="60" r="40" stroke="white" strokeWidth="2" />
                            <circle cx="60" cy="60" r="30" stroke="white" strokeWidth="2" />
                        </svg>
                    </div>

                    <div className="flex items-center justify-between">
                        <div className="flex items-center">
                            <div className="w-10 h-10 mr-3 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center shadow-md">
                                <img
                                    src={wallet.currency === "KES"
                                        ? "https://bfsodqqylpfotszjlfuk.supabase.co/storage/v1/object/public/apps//kenya.png"
                                        : coin?.image}
                                    alt={wallet.currency}
                                    className="w-full h-full object-cover"
                                    onError={(e) => {
                                        const target = e.target as HTMLImageElement;
                                        target.src = `https://via.placeholder.com/40/6E59A5/ffffff?text=${wallet.currency}`;
                                        target.onerror = null;
                                    }}
                                />
                            </div>
                            <div>
                                <div className="font-semibold text-white">{coin?.name || wallet.currency}</div>
                                <motion.div 
                                    className="text-sm text-gray-200"
                                    variants={balanceVariants}
                                    initial="initial"
                                    whileHover="hover"
                                >
                                    {wallet.balance.toLocaleString()} {wallet.currency}
                                </motion.div>
                            </div>
                        </div>
                        <ChevronRight
                            className={cn(
                                "h-5 w-5 text-gray-300 transition-transform duration-300",
                                isExpanded ? "rotate-90" : "rotate-0"
                            )}
                        />
                    </div>
                </div>

                {/* Expandable actions section */}
                <AnimatePresence>
                    {isExpanded && (
                        <motion.div
                            initial={{ opacity: 0, height: 0 }}
                            animate={{ opacity: 1, height: "auto" }}
                            exit={{ opacity: 0, height: 0 }}
                            transition={{ duration: 0.3, ease: "easeInOut" }}
                            className="px-4 pb-4 space-y-4"
                        >
                            <div className="flex space-x-4">
                                <Button
                                    className="flex-1 bg-green-500/20 text-green-300 hover:bg-green-500/30 hover:text-green-200 font-medium shadow-sm"
                                    onClick={handleDeposit}
                                >
                                    Deposit
                                </Button>
                                <Button
                                    className="flex-1 bg-red-500/20 text-red-300 hover:bg-red-500/30 hover:text-red-200 font-medium shadow-sm"
                                    onClick={handleWithdraw}
                                    disabled={wallet.balance <= 0}
                                >
                                    Withdraw
                                </Button>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </motion.div>
    );
};
