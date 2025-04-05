
import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import ImageWithFallback from '@/components/common/ImageWithFallback';
import { executeTrade } from '@/utils/tradingUtils';

const TradeExecutionDialog = ({ isOpen, onClose, order, onSuccess }) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [amount, setAmount] = useState('');
  const [totalAmount, setTotalAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [coinDetails, setCoinDetails] = useState(null);

  useEffect(() => {
    if (order) {
      setAmount(order.amount.toString());
      fetchCoinDetails(order.currency);
    }
  }, [order]);

  useEffect(() => {
    if (order && amount) {
      const parsedAmount = parseFloat(amount);
      setTotalAmount(isNaN(parsedAmount) ? 0 : parsedAmount * order.price);
    }
  }, [amount, order]);

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

      // Use the executeTrade utility function
      const result = await executeTrade(
        order.id,
        user.id,
        parsedAmount
      );

      if (!result.success) {
        throw new Error(result.error);
      }

      toast({
        title: "Trade successful",
        description: `You ${order.type === 'buy' ? 'sold' : 'bought'} ${parsedAmount} ${order.currency}`,
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
              <span className="font-bold">KES {order.price.toLocaleString()}</span>
            </div>

            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Available:</span>
              <div className="flex items-center gap-1">
                <span className="font-bold">{order.amount.toLocaleString()}</span>
                {coinDetails?.icon_url && (
                  <ImageWithFallback 
                    src={coinDetails.icon_url}
                    alt={coinDetails.name}
                    className="h-4 w-4"
                    fallbackSrc="/placeholder.svg"
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
              KES {totalAmount.toLocaleString(undefined, { maximumFractionDigits: 2 })}
            </span>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>
              Cancel
            </Button>
            <Button
              type="submit"
              disabled={isLoading}
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
