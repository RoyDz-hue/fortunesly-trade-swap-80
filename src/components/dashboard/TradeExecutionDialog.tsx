import React, { useState, useEffect, useCallback } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { executeTrade, formatTradeErrorMessage } from '@/utils/tradingUtils';

const TradeExecutionDialog = ({ isOpen, onClose, order, onSuccess }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [coinDetails, setCoinDetails] = useState(null);
  const [userBalance, setUserBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);
  const [orderStatus, setOrderStatus] = useState(null);
  const [orderStatusLoading, setOrderStatusLoading] = useState(false);

  // Fetch the latest order status to ensure it hasn't been filled or canceled
  const fetchLatestOrderStatus = useCallback(async () => {
    if (!order) return;
    
    try {
      setOrderStatusLoading(true);
      const { data, error } = await supabase
        .from('orders')
        .select('status, amount')
        .eq('id', order.id)
        .single();
      
      if (error) {
        console.error('Error fetching order status:', error);
        toast({
          title: "Order Unavailable",
          description: "Could not verify order status. Please try again.",
          variant: "destructive",
        });
        onClose();
        return;
      }
      
      setOrderStatus(data);
      
      // If the order is no longer available, close the dialog
      if (data.status === 'filled' || data.status === 'canceled') {
        toast({
          title: "Order Unavailable",
          description: `This order has been ${data.status}. It is no longer available.`,
          variant: "destructive",
        });
        onClose();
        return;
      }
      
      // Update amount if it has changed
      if (data.amount !== order.amount) {
        setAmount(data.amount.toString());
      }
      
    } catch (error) {
      console.error("Error in fetchLatestOrderStatus:", error);
    } finally {
      setOrderStatusLoading(false);
    }
  }, [order, toast, onClose]);

  useEffect(() => {
    if (isOpen && order) {
      fetchLatestOrderStatus();
    }
  }, [isOpen, order, fetchLatestOrderStatus]);

  useEffect(() => {
    if (order) {
      setAmount(order.amount.toString());
      fetchCoinDetails(order.currency);
    }
  }, [order]);

  useEffect(() => {
    if (user && isOpen) {
      fetchUserBalance();
    }
  }, [user, order, isOpen]);

  useEffect(() => {
    if (order && amount) {
      const parsedAmount = parseFloat(amount);
      setTotalAmount(isNaN(parsedAmount) ? 0 : parsedAmount * order.price);
    }
  }, [amount, order]);

  const fetchUserBalance = async () => {
    if (!user || !order) return;

    try {
      setBalanceLoading(true);
      const currencyToCheck = order.type === 'buy' 
        ? order.quote_currency || 'KES'
        : order.currency;

      const { data, error } = await supabase
        .from('users')
        .select('balance_crypto, balance_fiat')
        .eq('id', user.id)
        .single();

      if (error) {
        console.error('Error fetching user balances:', error);
        setUserBalance(0);
      } else if (data) {
        if (currencyToCheck === 'KES') {
          setUserBalance(data.balance_fiat || 0);
        } else {
          const cryptoBalances = data.balance_crypto || {};
          setUserBalance((cryptoBalances[currencyToCheck] || 0));
        }
      }
    } catch (error) {
      console.error("Exception in balance fetch:", error);
      setUserBalance(0);
    } finally {
      setBalanceLoading(false);
    }
  };

  const fetchCoinDetails = async (symbol) => {
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

  const getPriceCurrency = (order) => {
    if (order.quote_currency) {
      return order.quote_currency;
    }
    return 'KES';
  };

  const hasEnoughBalance = () => {
    if (userBalance === null) return false;
    
    const parsedAmount = parseFloat(amount || '0');
    if (isNaN(parsedAmount)) return false;

    if (order.type === 'sell') { // If order type is sell, we are buying
      return userBalance >= totalAmount;
    } else { // If order type is buy, we are selling
      return userBalance >= parsedAmount;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to execute trades",
        variant: "destructive",
      });
      return;
    }

    // Check order status once more before executing
    try {
      setIsLoading(true);
      
      const { data: latestOrder, error: latestOrderError } = await supabase
        .from('orders')
        .select('status, amount')
        .eq('id', order.id)
        .single();
        
      if (latestOrderError || !latestOrder) {
        toast({
          title: "Order not found",
          description: "This order may have been removed or is no longer available.",
          variant: "destructive",
        });
        onClose();
        return;
      }
      
      if (latestOrder.status === 'filled' || latestOrder.status === 'canceled') {
        toast({
          title: "Order unavailable",
          description: `This order has been ${latestOrder.status} and is no longer available.`,
          variant: "destructive",
        });
        onClose();
        return;
      }

      const parsedAmount = parseFloat(amount);

      if (isNaN(parsedAmount)) {
        toast({ title: "Invalid amount", variant: "destructive" });
        return;
      }

      if (parsedAmount > latestOrder.amount) {
        toast({ 
          title: "Amount exceeds available quantity", 
          description: `The available amount is now ${latestOrder.amount} ${order.currency}`,
          variant: "destructive" 
        });
        setAmount(latestOrder.amount.toString());
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

      const result = await executeTrade(
        order.id,
        user.id,
        parsedAmount
      );

      console.log("Trade execution result:", result);

      if (!result.success) {
        // Format error message for display
        const formattedError = formatTradeErrorMessage(result);
        toast({
          title: "Trade failed",
          description: formattedError,
          variant: "destructive",
        });
        return;
      }

      // Refresh user balance after successful trade
      fetchUserBalance();

      const isPartial = parsedAmount < latestOrder.amount;
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
        description: error.message || "An unexpected error occurred",
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
                {orderStatusLoading ? (
                  <span className="text-gray-400">Loading...</span>
                ) : (
                  <span className="font-bold">
                    {orderStatus ? orderStatus.amount.toLocaleString() : order.amount.toLocaleString()}
                  </span>
                )}
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
                  onClick={() => {
                    const maxAmount = orderStatus ? orderStatus.amount : order.amount;
                    setAmount(maxAmount.toString());
                  }}
                >
                  Max
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => {
                    const halfAmount = orderStatus ? 
                      (orderStatus.amount / 2) : (order.amount / 2);
                    setAmount(halfAmount.toString());
                  }}
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
                max={orderStatus ? orderStatus.amount : order.amount}
                required
                disabled={orderStatusLoading}
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
              disabled={isLoading || !hasEnoughBalance() || balanceLoading || orderStatusLoading}
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