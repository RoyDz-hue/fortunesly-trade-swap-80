import React, { useState, useRef } from "react";
import { motion, PanInfo } from "framer-motion";
import { Wallet, Coin } from "@/types";
import { Button } from "@/components/ui/button";
import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import styles from "./WalletCard.module.css";

interface WalletCardProps {
    wallet: Wallet;
    coin?: Coin;
    index: number;
    onDeposit: (wallet: Wallet) => void;
    onWithdraw: (wallet: Wallet) => void;
    swipedCards: string[];
    onSwipe: (walletId: string) => void;
}

// Get gradient color based on currency type
const getCardGradient = (type: string, currency: string) => {
    const gradients: Record<string, string> = {
        'KES': 'linear-gradient(135deg, #43326B 0%, #6E59A5 100%)',
        'BTC': 'linear-gradient(135deg, #F7931A 0%, #9C591B 100%)',
        'ETH': 'linear-gradient(135deg, #627EEA 0%, #364485 100%)',
        'USDT': 'linear-gradient(135deg, #26A17B 0%, #1A7865 100%)',
        'BNB': 'linear-gradient(135deg, #F3BA2F 0%, #AF8319 100%)',
        'XRP': 'linear-gradient(135deg, #23292F 0%, #101418 100%)',
        'ADA': 'linear-gradient(135deg, #0033AD 0%, #001F68 100%)',
        'SOL': 'linear-gradient(135deg, #9945FF 0%, #6A30B0 100%)',
        'DOT': 'linear-gradient(135deg, #E6007A 0%, #9C0054 100%)',
        'DOGE': 'linear-gradient(135deg, #C3A634 0%, #8A7522 100%)',
    };

    return gradients[currency] || 'linear-gradient(135deg, #2C3E50 0%, #1A2530 100%)';
};

// Format card number from currency
const formatCardNumber = (currency: string) => {
    // Generate a pseudo-random number sequence based on currency
    const hash = Array.from(currency).reduce((acc, char) => acc + char.charCodeAt(0), 0);
    const base = hash % 10000;
    
    return [
        String(base).padStart(4, '0'),
        String((base + 1234) % 10000).padStart(4, '0'),
        String((base + 5678) % 10000).padStart(4, '0'),
        String((base + 9012) % 10000).padStart(4, '0')
    ];
};

export const WalletCard: React.FC<WalletCardProps> = ({
    wallet,
    coin,
    index,
    onDeposit,
    onWithdraw,
    swipedCards,
    onSwipe
}) => {
    const cardRef = useRef<HTMLDivElement>(null);
    const [dragDirection, setDragDirection] = useState<'left' | 'right' | null>(null);
    
    // Format a masked card number based on the currency
    const cardNumberGroups = formatCardNumber(wallet.currency);
    
    // Determine if this card is swiped away
    const isSwiped = swipedCards.includes(wallet.id);
    
    // Card becomes visible if all cards above it are swiped
    const isRevealed = index === 0 || swipedCards.includes(wallet.id);
    
    // Determine if this card is the top visible card
    const isTopCard = !isSwiped && (index === 0 || swipedCards.length >= index);
    
    // Handle drag end for swipe detection
    const handleDragEnd = (event: MouseEvent | TouchEvent | PointerEvent, info: PanInfo) => {
        const threshold = 100; // Minimum distance to trigger a swipe
        
        if (Math.abs(info.offset.x) > threshold) {
            // Determine swipe direction
            const direction = info.offset.x > 0 ? 'right' : 'left';
            setDragDirection(direction);
            
            // Notify parent about the swipe
            onSwipe(wallet.id);
        }
    };
    
    // Handle deposit/withdraw button clicks
    const handleDeposit = (e: React.MouseEvent) => {
        e.stopPropagation();
        onDeposit(wallet);
    };
    
    const handleWithdraw = (e: React.MouseEvent) => {
        e.stopPropagation();
        onWithdraw(wallet);
    };
    
    // Get appropriate classes for card positioning
    const getCardClasses = () => {
        let classes = styles.creditCard;
        
        if (isSwiped) {
            if (dragDirection === 'left') {
                classes = cn(classes, styles.swipedLeft);
            } else {
                classes = cn(classes, styles.swipedRight);
            }
        }
        
        return classes;
    };
    
    return (
        <motion.div
            ref={cardRef}
            className={getCardClasses()}
            style={{
                background: getCardGradient(wallet.type, wallet.currency),
                zIndex: 10 - index,
            }}
            drag={isTopCard ? "x" : false}
            dragConstraints={{ left: 0, right: 0 }}
            dragElastic={0.7}
            onDragEnd={handleDragEnd}
            animate={{
                translateY: isSwiped ? 0 : `${index * 20}px`,
                translateZ: isSwiped ? 0 : `${-index * 10}px`,
                filter: `brightness(${1 - (index * 0.1)})`,
            }}
            transition={{
                duration: 0.5,
                ease: [0.19, 1, 0.22, 1]
            }}
            initial={false}
        >
            <div className={styles.cardInner}>
                <div className={styles.cardHeader}>
                    <div className={styles.currencyLogo}>
                        <img
                            src={wallet.currency === "KES"
                                ? "https://bfsodqqylpfotszjlfuk.supabase.co/storage/v1/object/public/apps//kenya.png"
                                : coin?.image}
                            alt={wallet.currency}
                            onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://via.placeholder.com/40/ffffff?text=${wallet.currency}`;
                                target.onerror = null;
                            }}
                        />
                    </div>
                    <div className={styles.cardChip}></div>
                </div>

                <div className={styles.cardMiddle}>
                    <div className={styles.cardNumber}>
                        {cardNumberGroups.map((group, idx) => (
                            <span key={idx} className={styles.numberGroup}>
                                {group}
                            </span>
                        ))}
                    </div>
                    <div className={styles.balanceLabel}>Available Balance</div>
                    <div className={styles.balanceAmount}>
                        {wallet.balance.toLocaleString()} {wallet.currency}
                    </div>
                </div>

                <div className={styles.cardFooter}>
                    <div className={styles.cardActions}>
                        <button
                            className={cn(styles.actionButton, styles.depositButton)}
                            onClick={handleDeposit}
                        >
                            <ArrowDownCircle className="h-4 w-4" />
                            Deposit
                        </button>
                        <button
                            className={cn(styles.actionButton, styles.withdrawButton)}
                            onClick={handleWithdraw}
                            disabled={wallet.balance <= 0}
                        >
                            <ArrowUpCircle className="h-4 w-4" />
                            Withdraw
                        </button>
                    </div>
                    
                    <div className={styles.cardBrand}>
                        {wallet.type === 'crypto' ? (
                            <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <path d="M20 20L30 10L40 20L30 30L20 20Z" fill="white" fillOpacity="0.8" />
                                <path d="M10 20L30 0L50 20L30 40L10 20Z" stroke="white" strokeOpacity="0.5" strokeWidth="2" />
                            </svg>
                        ) : (
                            <svg width="60" height="40" viewBox="0 0 60 40" fill="none" xmlns="http://www.w3.org/2000/svg">
                                <circle cx="22" cy="20" r="12" fill="white" fillOpacity="0.8" />
                                <circle cx="38" cy="20" r="12" fill="white" fillOpacity="0.5" />
                            </svg>
                        )}
                    </div>
                </div>
            </div>
            
            <div className={styles.cardPattern}></div>
            
            {isTopCard && (
                <div className={styles.swipeIndicator}>
                    Swipe
                    <span className={styles.swipeIcon}>→</span>
                </div>
            )}
        </motion.div>
    );
};
