import { useState, useCallback, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/components/ui/use-toast";
import { handleTradeExecution } from "@/utils/tradingUtils";
import { formatCurrencyAmount } from "@/lib/utils";

interface Order {
    id: string;
    user_id: string;
    type: 'buy' | 'sell';
    currency: string;
    quote_currency: string;
    amount: number;
    original_amount: number;
    price: number;
    status: 'open' | 'partially_filled' | 'filled' | 'canceled';
}

interface TradeExecutionDialogProps {
    isOpen: boolean;
    onClose: () => void;
    order: Order;
    executorId: string;
    onSuccess?: () => void;
}

export function TradeExecutionDialog({
    isOpen,
    onClose,
    order,
    executorId,
    onSuccess
}: TradeExecutionDialogProps) {
    const { toast } = useToast();
    const [amount, setAmount] = useState<string>("");
    const [isLoading, setIsLoading] = useState(false);
    const [total, setTotal] = useState<number>(0);

    // Verify order data on mount
    useEffect(() => {
        if (isOpen && order) {
            console.log('Trade dialog opened with order:', order);
            // Make sure order data is valid
            if (!order.id || !order.amount || !order.currency) {
                console.error('Invalid order data:', order);
                toast({
                    title: "Error",
                    description: "Invalid order data. Please try again.",
                    variant: "destructive",
                });
                onClose();
            }
        }
    }, [isOpen, order, toast, onClose]);

    // Reset state when dialog opens/closes
    useEffect(() => {
        if (!isOpen) {
            setAmount("");
            setTotal(0);
            setIsLoading(false);
        }
    }, [isOpen]);

    // Format currency amounts with proper decimals
    const formatAmount = useCallback((value: number, currency: string) => {
        const decimals = currency === 'KES' ? 2 : 8;
        return value.toLocaleString('en-US', {
            minimumFractionDigits: decimals,
            maximumFractionDigits: decimals
        });
    }, []);

    // Handle amount input
    const handleAmountChange = useCallback((inputValue: string) => {
        // Remove non-numeric characters except decimal point
        const cleanValue = inputValue.replace(/[^\d.]/g, '');
        const numValue = parseFloat(cleanValue);

        if (isNaN(numValue) || numValue <= 0) {
            setAmount("");
            setTotal(0);
            return;
        }

        // Apply currency-specific decimal limit
        const decimals = order.currency === 'KES' ? 2 : 8;
        const formattedValue = parseFloat(numValue.toFixed(decimals));

        // Check maximum amount
        if (formattedValue > order.amount) {
            setAmount(order.amount.toString());
            setTotal(order.amount * order.price);
            return;
        }

        setAmount(formattedValue.toString());
        setTotal(formattedValue * order.price);
    }, [order.amount, order.price, order.currency]);

    // Execute trade
    const handleExecute = async () => {
        if (isLoading || !amount || !order || !order.id || !executorId) {
            console.error('Missing required data for trade execution:', {
                isLoading,
                amount,
                orderId: order?.id,
                executorId
            });
            return;
        }

        console.log('Trade execution initiated with:', {
            orderId: order.id,
            executorId,
            amount: parseFloat(amount),
            orderType: order.type,
            orderStatus: order.status
        });

        const numAmount = parseFloat(amount);

        // Validate amount
        if (isNaN(numAmount) || numAmount <= 0 || numAmount > order.amount) {
            toast({
                title: "Invalid Amount",
                description: `Please enter an amount between 0 and ${formatAmount(order.amount, order.currency)} ${order.currency}`,
                variant: "destructive",
            });
            return;
        }

        // Prevent self-trading
        if (executorId === order.user_id) {
            toast({
                title: "Invalid Trade",
                description: "You cannot execute your own order",
                variant: "destructive",
            });
            return;
        }

        setIsLoading(true);
        try {
            toast({
                title: "Processing",
                description: "Executing trade...",
            });
            
            const success = await handleTradeExecution(
                order.id,
                executorId,
                numAmount,
                () => {
                    toast({
                        title: "Trade Successful",
                        description: `Successfully ${order.type === 'sell' ? 'bought' : 'sold'} ${formatAmount(numAmount, order.currency)} ${order.currency}`,
                    });
                    if (onSuccess) {
                        console.log('Calling onSuccess callback');
                        onSuccess();
                    }
                    onClose();
                }
            );

            if (!success) {
                console.error("Trade execution failed in dialog");
                toast({
                    title: "Trade Failed",
                    description: "Unable to complete the trade. Please try again.",
                    variant: "destructive",
                });
            }
        } catch (error) {
            console.error("Error during trade execution:", error);
            toast({
                title: "Error",
                description: "An unexpected error occurred during trade execution.",
                variant: "destructive",
            });
        } finally {
            setIsLoading(false);
        }
    };

    // Safety check - don't render if no order
    if (!order) {
        return null;
    }

    return (
        <Dialog 
            open={isOpen} 
            onOpenChange={(open) => !isLoading && !open && onClose()}
        >
            <DialogContent className="sm:max-w-[425px]">
                <DialogHeader>
                    <DialogTitle>
                        {order.type === 'sell' ? 'Buy' : 'Sell'} {order.currency}
                    </DialogTitle>
                </DialogHeader>

                <div className="grid gap-4 py-4">
                    {/* Order Details */}
                    <div className="grid gap-2 text-sm">
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Available:</span>
                            <span className="font-medium">
                                {formatAmount(order.amount, order.currency)} {order.currency}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Price per {order.currency}:</span>
                            <span className="font-medium">
                                {formatAmount(order.price, order.quote_currency)} {order.quote_currency}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Order Type:</span>
                            <span className="font-medium capitalize">
                                {order.type === 'buy' ? 'Sell your ' + order.currency : 'Buy ' + order.currency}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Order ID:</span>
                            <span className="font-medium text-xs opacity-70">
                                {order.id}
                            </span>
                        </div>
                    </div>

                    {/* Amount Input */}
                    <div className="grid gap-2">
                        <label htmlFor="amount" className="text-sm font-medium">
                            Amount to {order.type === 'buy' ? 'Sell' : 'Buy'}
                        </label>
                        <div className="relative">
                            <Input
                                id="amount"
                                type="number"
                                value={amount}
                                onChange={(e) => handleAmountChange(e.target.value)}
                                placeholder={`Enter amount (max: ${formatAmount(order.amount, order.currency)})`}
                                step={order.currency === 'KES' ? '0.01' : '0.00000001'}
                                min="0"
                                max={order.amount}
                                disabled={isLoading}
                                className="pr-16"
                            />
                            <span className="absolute right-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                                {order.currency}
                            </span>
                        </div>

                        {/* Total Calculation */}
                        {amount && total > 0 && (
                            <div className="text-sm text-muted-foreground">
                                Total: {formatAmount(total, order.quote_currency)} {order.quote_currency}
                            </div>
                        )}
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex justify-end gap-3">
                    <Button
                        variant="outline"
                        onClick={onClose}
                        disabled={isLoading}
                    >
                        Cancel
                    </Button>
                    <Button
                        onClick={handleExecute}
                        disabled={
                            isLoading ||
                            !amount ||
                            parseFloat(amount) <= 0 ||
                            parseFloat(amount) > order.amount
                        }
                    >
                        {isLoading ? (
                            <div className="flex items-center gap-2">
                                <div className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                                Processing...
                            </div>
                        ) : (
                            `Execute Trade`
                        )}
                    </Button>
                </div>
            </DialogContent>
        </Dialog>
    );
}