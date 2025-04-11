import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { executeTrade, formatTradeErrorMessage, TradeErrorCode } from '@/utils/tradingUtils';

// Define TypeScript interface for order
interface Order {
  id: string;
  type: 'buy' | 'sell';
  amount: number;
  original_amount?: number;
  price: number;
  currency: string;
  quote_currency?: string;
  status: string;
  created_at: string;
  users?: {
    id: string;
    username: string;
  };
}

interface TradeExecutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess?: () => void;
}

const TradeExecutionDialog: React.FC<TradeExecutionDialogProps> = ({ 
  isOpen, 
  onClose, 
  order, 
  onSuccess 
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [coinDetails, setCoinDetails] = useState<{name: string, symbol: string, icon_url: string | null} | null>(null);
  const [userBalance, setUserBalance] = useState<number | null>(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [orderExists, setOrderExists] = useState(true);

  useEffect(() => {
    if (order) {
      setAmount(order.amount.toString());
      fetchCoinDetails(order.currency);
      verifyOrderExists(order.id);
    }
  }, [order]);

  useEffect(() => {
    if (user && order) {
      fetchUserBalance();
    }
  }, [user, order]);

  useEffect(() => {
    if (order && amount) {
      const parsedAmount = parseFloat(amount);
      setTotalAmount(isNaN(parsedAmount) ? 0 : parsedAmount * order.price);
    }
  }, [amount, order]);

  const verifyOrderExists = async (orderId: string) => {
    try {
      const { data, error } = await supabase
        .from('orders')
        .select('id, status')
        .eq('id', orderId)
        .single();
      
      if (error || !data) {
        console.error('Order verification error:', error);
        setOrderExists(false);
        
        toast({
          title: "Order Not Found",
          description: "This order no longer exists or has been filled",
          variant: "destructive",
        });
        
        onClose();
        return;
      }
      
      // Check if order status prevents trading
      if (data.status === 'filled' || data.status === 'canceled') {
        setOrderExists(false);
        
        toast({
          title: "Order Not Available",
          description: `This order is ${data.status} and cannot be traded`,
          variant: "destructive",
        });
        
        onClose();
        return;
      }
      
      setOrderExists(true);
    } catch (error) {
      console.error("Error verifying order existence:", error);
      setOrderExists(false);
    }
  };

  const fetchUserBalance = async () => {
    if (!user || !order) return;

    try {
      setBalanceLoading(true);
      
      // Determine which balance to check based on order type
      const balanceToCheck = order.type === 'buy' 
        ? { type: 'crypto', currency: order.currency }
        : { type: 'fiat', currency: order.quote_currency || 'KES' };

      const { data, error } = await supabase
        .from('users')
        .select('balance_crypto, balance_fiat')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user balances:', error);
        setUserBalance(0);
      } else if (data) {
        if (balanceToCheck.type === 'fiat') {
          setUserBalance(data.balance_fiat || 0);
        } else {
          const cryptoBalances = data.balance_crypto || {};
          setUserBalance((cryptoBalances[balanceToCheck.currency] || 0));
        }
      }
    } catch (error) {
      console.error("Exception in balance fetch:", error);
      setUserBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchCoinDetails = async (symbol: string) => {
    try {
      const { data, error } = await supabase
        .from('coins')
        .select('name, symbol, icon_url')
        .eq('symbol', symbol)
        .single();

      setCoinDetails(error ? { name: symbol, symbol, icon_url: null } : data);
    } catch (error) {
      console.error("Error fetching coin details:", error);
      setCoinDetails({ name: symbol, symbol, icon_url: null });
    }
  };

  const getPriceCurrency = (order: Order): string => {
    return order.quote_currency || 'KES';
  };

  const hasEnoughBalance = (): boolean => {
    if (userBalance === null || !order) return false;

    const amountValue = parseFloat(amount || '0');
    
    if (order.type === 'buy') {
      // For buy orders, we need crypto
      return userBalance >= amountValue;
    } else {
      // For sell orders, we need fiat for the total amount
      return userBalance >= (amountValue * order.price);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to execute trades",
        variant: "destructive",
      });
      return;
    }
    
    if (!orderExists || !order) {
      toast({
        title: "Order unavailable",
        description: "This order no longer exists or has been filled",
        variant: "destructive",
      });
      onClose();
      return;
    }

    try {
      setIsLoading(true);
      const parsedAmount = parseFloat(amount);

      if (isNaN(parsedAmount)) {
        toast({ title: "Invalid amount", variant: "destructive" });
        return;
      }

      if (parsedAmount <= 0) {
        toast({ title: "Amount must be greater than zero", variant: "destructive" });
        return;
      }

      if (parsedAmount > order.amount) {
        toast({ title: "Amount exceeds available quantity", variant: "destructive" });
        return;
      }

      if (!hasEnoughBalance()) {
        const currencyNeeded = order.type === 'buy' 
          ? order.currency 
          : order.quote_currency || 'KES';

        toast({ 
          title: "Insufficient balance", 
          description: `You don't have enough ${currencyNeeded} to complete this transaction`,
          variant: "destructive"
        });
        return;
      }

      console.log("Executing trade with parameters:", {
        orderId: order.id,
        executorId: user.id,
        amount: parsedAmount
      });

      // First verify order still exists
      const { data: orderCheck, error: orderCheckError } = await supabase
        .from('orders')
        .select('id, status')
        .eq('id', order.id)
        .single();
        
      if (orderCheckError || !orderCheck || orderCheck.status === 'filled' || orderCheck.status === 'canceled') {
        toast({
          title: "Order not available",
          description: orderCheck 
            ? `This order is ${orderCheck.status} and cannot be traded` 
            : "This order no longer exists",
          variant: "destructive",
        });
        onClose();
        return;
      }

      const result = await executeTrade(
        order.id,
        user.id,
        parsedAmount
      );

      console.log("Trade execution result:", result);

      if (!result.success) {
        // Handle specific error codes
        if (result.error_code === TradeErrorCode.ORDER_NOT_FOUND) {
          toast({
            title: "Order not found",
            description: "This order no longer exists or has been filled",
            variant: "destructive",
          });
          onClose();
          return;
        }
        
        // Format error message for display
        const errorMessage = formatTradeErrorMessage(result);
        toast({
          title: "Trade failed",
          description: errorMessage,
          variant: "destructive",
        });
        return;
      }

      // Refresh user balance after successful trade
      fetchUserBalance();

      const isPartial = parsedAmount < order.amount;
      const tradedCurrency = order.currency;
      const quotedCurrency = order.quote_currency || 'KES';
      const quoteAmount = totalAmount.toFixed(2);

      let successMessage = '';
      if (order.type === 'buy') {
        successMessage = `You sold ${parsedAmount} ${tradedCurrency} for ${quoteAmount} ${quotedCurrency}`;
      } else {
        successMessage = `You bought ${parsedAmount} ${tradedCurrency} for ${quoteAmount} ${quotedCurrency}`;
      }

      if (isPartial) {
        successMessage += " (partial order)";
      }

      toast({
        title: "Trade successful",
        description: successMessage,
      });

      onSuccess?.();
      onClose();
    } catch (error) {
      console.error("Trade error:", error);
      toast({
        title: "Trade failed",
        description: error instanceof Error ? error.message : "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!order) return null;

  const priceCurrency = getPriceCurrency(order);
  const balanceCurrency = order.type === 'buy' ? order.currency : (order.quote_currency || 'KES');

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>
            Execute {order.type === 'buy' ? 'Sell' : 'Buy'} Order
          </DialogTitle>
          <DialogDescription>
            Trade with {order.users?.username || 'Unknown'}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="bg-black p-4 rounded-lg space-y-2 text-white">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Price per unit:</span>
              <span className="font-bold">{priceCurrency} {order.price.toLocaleString()}</span>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Available:</span>
              <div className="flex items-center gap-1">
                <span className="font-bold">{order.amount.toLocaleString()}</span>
                {coinDetails?.icon_url && (
                  <img 
                    src={coinDetails.icon_url}
                    alt={coinDetails.name}
                    className="h-4 w-4"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/20/6E59A5/ffffff?text=${coinDetails.symbol}`;
                      target.onerror = null;
                    }}
                  />
                )}
                <span>{order.currency}</span>
              </div>
            </div>
            {order.original_amount && order.original_amount > order.amount && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Partially Filled
                </Badge>
              </div>
            )}
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Your {balanceCurrency} balance:</span>
              <div className="flex items-center gap-1">
                {balanceLoading ? (
                  <span className="text-gray-400">Loading...</span>
                ) : (
                  <span className={`font-bold ${hasEnoughBalance() ? 'text-green-600' : 'text-red-600'}`}>
                    {typeof userBalance === 'number' ? userBalance.toLocaleString(undefined, { maximumFractionDigits: 8 }) : '0'}
                  </span>
                )}
                <span>{balanceCurrency}</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="amount">
                Amount to {order.type === 'buy' ? 'sell' : 'buy'}
              </Label>
              <div className="flex gap-1">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  onClick={() => setAmount(order.amount.toString())}
                >
                  Max
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => setAmount((order.amount / 2).toString())}
                >
                  Half
                </Button>
              </div>
            </div>
            <div className="flex gap-2">
              <Input
                id="amount"
                type="number"
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                min="0.000001"
                max={order.amount}
                required
              />
              <div className="bg-black px-3 flex items-center rounded-md text-white">
                {order.currency}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Partial orders will keep remaining amount in the market
            </p>
          </div>

          <div className="bg-black p-4 rounded-lg flex justify-between text-white">
            <span className="font-medium">Total:</span>
            <span className="font-bold text-lg">
              {priceCurrency} {totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading || !hasEnoughBalance() || balanceLoading || !orderExists}
              className={order.type === 'buy' ? 'bg-red-600 hover:bg-red-700' : 'bg-green-600 hover:bg-green-700'}
            >
              {isLoading ? 'Processing...' : `${order.type === 'buy' ? 'Sell' : 'Buy'} Now`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TradeExecutionDialog;