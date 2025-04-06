import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { executeTrade } from '@/utils/tradingUtils';

const TradeExecutionDialog = ({ isOpen, onClose, order, onSuccess }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [coinDetails, setCoinDetails] = useState(null);
  const [userBalance, setUserBalance] = useState(null);
  const [balanceLoading, setBalanceLoading] = useState(false);

  useEffect(() => {
    if (order) {
      setAmount(order.amount.toString());
      fetchCoinDetails(order.currency);
    }
  }, [order]);

  useEffect(() => {
    if (user) {
      fetchUserBalance();
    }
  }, [user, order]);

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
      // Determine the currency to check based on order type
      const currencyToCheck = order.type === 'buy' 
        ? order.currency  // For buy orders, check if user has enough of the currency being sold
        : order.quote_currency || 'KES';  // For sell orders, check if user has enough of the quoted currency

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
          // Handle fiat currency (KES)
          setUserBalance(data.balance_fiat || 0);
        } else {
          // Handle crypto currency
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

  // Function to get price currency display based on quote_currency field
  const getPriceCurrency = (order) => {
    // If quote_currency exists and is not empty, use it
    if (order.quote_currency) {
      return order.quote_currency;
    }
    // Otherwise fall back to KES
    return 'KES';
  };

  const hasEnoughBalance = () => {
    if (userBalance === null) return false;

    if (order.type === 'buy') {
      // If user is selling to a buy order, check if they have enough of the currency
      return userBalance >= parseFloat(amount || 0);
    } else {
      // If user is buying from a sell order, check if they have enough of the quoted currency
      return userBalance >= totalAmount;
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

    try {
      setIsLoading(true);
      const parsedAmount = parseFloat(amount);

      if (isNaN(parsedAmount)) {
        toast({ title: "Invalid amount", variant: "destructive" });
        return;
      }

      if (parsedAmount > order.amount) {
        toast({ title: "Amount exceeds available quantity", variant: "destructive" });
        return;
      }

      // Validate user has enough balance for the transaction
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

      // Execute the trade with proper transaction details
      const tradeDetails = {
        orderId: order.id,
        buyerId: order.type === 'buy' ? order.user_id : user.id,
        sellerId: order.type === 'buy' ? user.id : order.user_id,
        amount: parsedAmount,
        price: order.price,
        currency: order.currency,
        quoteCurrency: order.quote_currency || 'KES'
      };

      // Use the executeTrade utility function with both user IDs to record for both parties
      const result = await executeTrade(
        order.id,
        user.id,
        parsedAmount,
        order.user_id, // Include the order creator's ID to record transaction for them too
        order.type === 'buy' ? 'sell' : 'buy', // Pass transaction type from the user's perspective
        tradeDetails // Pass additional trade details for better transaction recording
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      // Refresh the user's balance after successful trade
      fetchUserBalance();

      // Determine if this was a partial or complete order execution
      const isPartial = parsedAmount < order.amount;

      // Construct appropriate success message with currency amounts
      const tradedCurrency = order.currency;
      const quotedCurrency = order.quote_currency || 'KES';
      const quoteAmount = totalAmount.toFixed(2);

      let successMessage = '';
      if (order.type === 'buy') {
        // User is selling to a buy order
        successMessage = `You sold ${parsedAmount} ${tradedCurrency} for ${quoteAmount} ${quotedCurrency}`;
      } else {
        // User is buying from a sell order
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
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!order) return null;

  // Get the correct currency for price display
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
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
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
                      const target = e.target;
                      target.src = `https://via.placeholder.com/20/6E59A5/ffffff?text=${coinDetails.symbol}`;
                      target.onerror = null;
                    }}
                  />
                )}
                <span>{order.currency}</span>
              </div>
            </div>
            {/* Display status badge for partially-filled orders */}
            {order.original_amount && order.original_amount > order.amount && (
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Status:</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Partially Filled
                </Badge>
              </div>
            )}
            {/* Display user's balance */}
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
              <div className="bg-gray-100 px-3 flex items-center rounded-md">
                {order.currency}
              </div>
            </div>
            <p className="text-xs text-gray-500">
              Partial orders will keep remaining amount in the market
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg flex justify-between">
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
              disabled={isLoading || !hasEnoughBalance() || balanceLoading}
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