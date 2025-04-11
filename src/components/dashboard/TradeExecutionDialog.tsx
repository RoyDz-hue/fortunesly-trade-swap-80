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
    status: 'pending' | 'partially_filled' | 'filled' | 'canceled';
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

    // Reset dialog state when opened/closed
    useEffect(() => {
        if (!isOpen) {
            setAmount("");
            setTotal(0);
            setIsLoading(false);
        }
    }, [isOpen]);

    // Handle amount input validation and formatting
    const handleAmountChange = useCallback((inputValue: string) => {
        // Remove any non-numeric characters except decimal point
        const cleanValue = inputValue.replace(/[^\d.]/g, '');
        
        // Parse the cleaned value
        const numValue = parseFloat(cleanValue);
        
        if (isNaN(numValue) || numValue <= 0) {
            setAmount("");
            setTotal(0);
            return;
        }

        // Get correct decimal places based on currency
        const decimals = order.currency === 'KES' ? 2 : 8;
        
        // Format the number with correct decimals
        const formattedValue = parseFloat(numValue.toFixed(decimals));
        
        // Ensure amount doesn't exceed available
        if (formattedValue > order.amount) {
            setAmount(order.amount.toString());
            setTotal(order.amount * order.price);
            return;
        }

        setAmount(formattedValue.toString());
        setTotal(formattedValue * order.price);
    }, [order.amount, order.price, order.currency]);

    // Execute the trade
    const handleExecute = async () => {
        if (isLoading || !amount) return;

        const numAmount = parseFloat(amount);
        
        // Validate amount again before execution
        if (isNaN(numAmount) || numAmount <= 0 || numAmount > order.amount) {
            toast({
                title: "Invalid Amount",
                description: `Please enter an amount between 0 and ${formatCurrencyAmount(order.amount, order.currency)} ${order.currency}`,
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
            const success = await handleTradeExecution(
                order.id,
                executorId,
                numAmount,
                () => {
                    toast({
                        title: "Trade Successful",
                        description: `Successfully ${order.type === 'sell' ? 'bought' : 'sold'} ${formatCurrencyAmount(numAmount, order.currency)} ${order.currency}`,
                    });
                    onSuccess?.();
                    onClose();
                }
            );

            if (!success) {
                console.error("Trade execution failed");
            }
        } finally {
            setIsLoading(false);
        }
    };

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
                                {formatCurrencyAmount(order.amount, order.currency)} {order.currency}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Price per {order.currency}:</span>
                            <span className="font-medium">
                                {formatCurrencyAmount(order.price, order.quote_currency)} {order.quote_currency}
                            </span>
                        </div>
                        <div className="flex justify-between">
                            <span className="text-muted-foreground">Type:</span>
                            <span className="font-medium capitalize">
                                {order.type === 'buy' ? 'Sell your ' + order.currency : 'Buy ' + order.currency}
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
                                placeholder={`Enter amount (max: ${formatCurrencyAmount(order.amount, order.currency)})`}
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

                        {/* Show Total */}
                        {amount && total > 0 && (
                            <div className="text-sm text-muted-foreground">
                                Total: {formatCurrencyAmount(total, order.quote_currency)} {order.quote_currency}
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