import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import ImageWithFallback from '@/components/common/ImageWithFallback';

interface Order {
  id: string;
  user_id: string;
  users?: {
    username: string;
  };
  username?: string;
  type: 'buy' | 'sell';
  currency: string;
  amount: number;
  price: number;
  original_amount?: number;
}

interface CoinDetails {
  name: string;
  symbol: string;
  icon_url: string | null;
}

interface TradeExecutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess?: () => void;
}

const TradeExecutionDialog = ({ isOpen, onClose, order, onSuccess }: TradeExecutionDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [amount, setAmount] = useState<string>('');
  const [totalAmount, setTotalAmount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [coinDetails, setCoinDetails] = useState<CoinDetails | null>(null);

  useEffect(() => {
    if (order) {
      setAmount(order.amount.toString());
      fetchCoinDetails(order.currency);
    }
  }, [order]);

  useEffect(() => {
    if (order && amount) {
      const parsedAmount = parseFloat(amount);
      if (!isNaN(parsedAmount)) {
        setTotalAmount(parsedAmount * order.price);
      } else {
        setTotalAmount(0);
      }
    }
  }, [amount, order]);

  const fetchCoinDetails = async (symbol: string) => {
    try {
      const { data, error } = await supabase
        .from('coins')
        .select('name, symbol, icon_url')
        .eq('symbol', symbol)
        .single();

      if (error) throw error;
      setCoinDetails(data);
    } catch (error) {
      console.error("Error fetching coin details:", error);
      setCoinDetails({ name: symbol, symbol, icon_url: null });
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

    if (!order) return;

    try {
      setIsLoading(true);
      const parsedAmount = parseFloat(amount);
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid positive number",
          variant: "destructive",
        });
        return;
      }

      if (parsedAmount > order.amount) {
        toast({
          title: "Invalid amount",
          description: "Amount exceeds available order quantity",
          variant: "destructive",
        });
        return;
      }

      // Check if this is a partial fill
      const isPartialFill = parsedAmount < order.amount;
      
      // Start a database transaction
      const { data: trade, error: tradeError } = await supabase
        .rpc('execute_trade', {
          p_order_id: order.id,
          p_user_id: user.id,
          p_amount: parsedAmount,
          p_price: order.price,
          p_is_partial: isPartialFill,
          p_currency: order.currency,
          p_type: order.type === 'buy' ? 'sell' : 'buy' // Opposite of order type
        });

      if (tradeError) throw tradeError;

      toast({
        title: "Trade executed successfully",
        description: `You have ${order.type === 'buy' ? 'sold' : 'bought'} ${parsedAmount} ${order.currency}`,
      });

      if (onSuccess) onSuccess();
      onClose();
    } catch (error: any) {
      console.error("Error executing trade:", error);
      toast({
        title: "Trade failed",
        description: error.message || "An error occurred while executing the trade",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  if (!order) return null;

  const handleMaxAmount = () => {
    setAmount(order.amount.toString());
  };

  const handleHalfAmount = () => {
    setAmount((parseFloat(order.amount) / 2).toString());
  };

  const handleCustomAmount = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const isBuy = order.type === 'sell'; // If order type is 'sell', user is buying

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{isBuy ? 'Buy' : 'Sell'} {order.currency}</DialogTitle>
          <DialogDescription>
            Trade with {order.users?.username || order.username || 'Unknown'}
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6 py-4">
          <div className="bg-gray-50 p-4 rounded-lg space-y-2">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Price per unit:</span>
              <span className="font-bold">KES {order.price.toLocaleString()}</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium">Available amount:</span>
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
                <span className="text-sm font-medium">Order status:</span>
                <Badge variant="outline" className="bg-blue-50 text-blue-700">
                  Partially filled
                </Badge>
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex justify-between">
              <Label htmlFor="amount">Amount to {isBuy ? 'buy' : 'sell'}</Label>
              <div className="flex gap-1">
                <Button 
                  type="button" 
                  variant="outline" 
                  size="sm" 
                  className="text-xs h-6"
                  onClick={handleMaxAmount}
                >
                  Max
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="text-xs h-6"
                  onClick={handleHalfAmount}
                >
                  Half
                </Button>
              </div>
            </div>
            
            <div className="flex gap-2">
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={handleCustomAmount}
                required
                min="0.000001"
                max={order.amount.toString()}
              />
              <div className="bg-gray-100 px-3 flex items-center rounded-md text-sm font-medium">
                {order.currency}
              </div>
            </div>
            
            <p className="text-xs text-gray-500">
              You can execute a partial order. The remaining amount will stay in the market.
            </p>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg flex justify-between items-center">
            <span className="font-medium">Total amount:</span>
            <span className="font-bold text-lg">KES {totalAmount.toLocaleString(undefined, {maximumFractionDigits: 2})}</span>
          </div>

          <DialogFooter>
            <Button variant="outline" type="button" onClick={onClose}>Cancel</Button>
            <Button 
              type="submit" 
              disabled={isLoading} 
              className={isBuy ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}
            >
              {isLoading ? 'Processing...' : `${isBuy ? 'Buy' : 'Sell'} Now`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TradeExecutionDialog;