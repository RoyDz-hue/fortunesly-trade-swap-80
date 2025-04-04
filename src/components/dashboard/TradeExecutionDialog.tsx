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
      if (!isNaN(parsedAmount)) {
        setTotalAmount(parsedAmount * order.price);
      } else {
        setTotalAmount(0);
      }
    }
  }, [amount, order]);

  const fetchCoinDetails = async (symbol) => {
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
      const { data: transaction, error: transactionError } = await supabase.rpc('begin_transaction');
      
      if (transactionError) throw transactionError;
      
      try {
        // 1. Insert the trade record
        const { data: trade, error: tradeError } = await supabase
          .from('trades')
          .insert([{
            order_id: order.id,
            user_id: user.id,
            counterparty_id: order.user_id,
            amount: parsedAmount,
            price: order.price,
            currency: order.currency,
            type: order.type === 'buy' ? 'sell' : 'buy',
            status: 'completed'
          }])
          .select()
          .single();
          
        if (tradeError) throw tradeError;
        
        // 2. Update the order based on partial fill status
        if (isPartialFill) {
          const remainingAmount = order.amount - parsedAmount;
          
          // For first partial fill, store the original amount
          if (!order.original_amount) {
            const { error: updateError } = await supabase
              .from('orders')
              .update({
                amount: remainingAmount,
                original_amount: order.amount,
                updated_at: new Date().toISOString()
              })
              .eq('id', order.id);
              
            if (updateError) throw updateError;
          } else {
            // For subsequent partial fills
            const { error: updateError } = await supabase
              .from('orders')
              .update({
                amount: remainingAmount,
                updated_at: new Date().toISOString()
              })
              .eq('id', order.id);
              
            if (updateError) throw updateError;
          }
        } else {
          // Complete order fill
          const { error: updateError } = await supabase
            .from('orders')
            .update({
              status: 'completed',
              amount: 0,
              updated_at: new Date().toISOString()
            })
            .eq('id', order.id);
            
          if (updateError) throw updateError;
        }
        
        // 3. Commit the transaction
        const { error: commitError } = await supabase.rpc('commit_transaction');
        if (commitError) throw commitError;
        
        toast({
          title: "Trade executed successfully",
          description: `You have ${order.type === 'buy' ? 'sold' : 'bought'} ${parsedAmount} ${order.currency}`,
        });

        if (onSuccess) onSuccess();
        onClose();
        
      } catch (innerError) {
        // Rollback on error
        await supabase.rpc('rollback_transaction');
        throw innerError;
      }
    } catch (error) {
      console.error("Error executing trade:", error);
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

  const handleMaxAmount = () => {
    setAmount(order.amount.toString());
  };

  const handleCustomAmount = (e) => {
    setAmount(e.target.value);
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Execute {order.type === 'buy' ? 'Sell' : 'Buy'} Order</DialogTitle>
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
              <Label htmlFor="amount">Amount to {order.type === 'buy' ? 'sell' : 'buy'}</Label>
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
                  onClick={() => setAmount((parseFloat(order.amount) / 2).toString())}
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
                onChange={handleCustomAmount}
                required
                min="0.000001"
                max={order.amount}
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
            <Button type="submit" disabled={isLoading} className={order.type === 'buy' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}>
              {isLoading ? 'Processing...' : `${order.type === 'buy' ? 'Buy' : 'Sell'} Now`}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default TradeExecutionDialog;