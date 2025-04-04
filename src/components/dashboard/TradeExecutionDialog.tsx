
import { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";

interface Order {
  id: string;
  user_id: string;
  username?: string;
  type: 'buy' | 'sell';
  currency: string;
  amount: number;
  price: number;
}

interface TradeExecutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: Order | null;
  onSuccess?: () => void;
}

const TradeExecutionDialog = ({ isOpen, onClose, order, onSuccess }: TradeExecutionDialogProps) => {
  const [amount, setAmount] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();
  const { user } = useAuth();
  
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Only allow numbers and decimals
    if (/^\d*\.?\d*$/.test(value)) {
      setAmount(value);
    }
  };

  const handleMaxAmount = () => {
    if (order) {
      setAmount(String(order.amount));
    }
  };

  const calculateTotal = () => {
    if (!order || !amount || isNaN(parseFloat(amount))) return 0;
    return parseFloat(amount) * order.price;
  };

  const handleSubmit = async () => {
    if (!order || !user) return;
    
    const amountValue = parseFloat(amount);
    
    if (isNaN(amountValue) || amountValue <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than zero",
        variant: "destructive",
      });
      return;
    }
    
    if (amountValue > order.amount) {
      toast({
        title: "Amount too large",
        description: `The maximum available amount is ${order.amount} ${order.currency}`,
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Call the database function to execute the order
      const { data, error } = await supabase
        .rpc('execute_market_order', {
          order_id_param: order.id,
          trader_id_param: user.id,
          trade_amount_param: amountValue
        });
      
      if (error) throw error;
      
      toast({
        title: "Trade executed successfully",
        description: `You have ${order.type === 'buy' ? 'sold' : 'bought'} ${amountValue} ${order.currency}`,
      });
      
      // Ensure transactions are updated
      if (onSuccess) {
        onSuccess();
      }
      
      onClose();
      setAmount('');
    } catch (error: any) {
      console.error('Error executing trade:', error);
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
  
  const total = calculateTotal();
  const isBuy = order.type === 'sell'; // If order type is 'sell', user is buying
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-center">
            {isBuy ? 'Buy' : 'Sell'} {order.currency}
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4 py-4">
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="text-muted-foreground">Price</div>
            <div className="font-medium text-right">KES {order.price.toLocaleString()}</div>
            
            <div className="text-muted-foreground">Available</div>
            <div className="font-medium text-right">{order.amount} {order.currency}</div>
            
            <div className="text-muted-foreground">Trader</div>
            <div className="font-medium text-right">{order.username || 'Anonymous'}</div>
          </div>
          
          <div className="space-y-2">
            <div className="flex justify-between items-center">
              <label htmlFor="amount" className="text-sm font-medium">
                Amount to {isBuy ? 'buy' : 'sell'}
              </label>
              <button
                type="button"
                onClick={handleMaxAmount}
                className="text-xs text-blue-600 hover:underline"
              >
                Max
              </button>
            </div>
            <div className="relative">
              <Input
                id="amount"
                type="text"
                value={amount}
                onChange={handleAmountChange}
                placeholder={`Enter amount in ${order.currency}`}
                className="pr-16"
              />
              <div className="absolute inset-y-0 right-3 flex items-center text-sm font-medium text-gray-500">
                {order.currency}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center px-1">
            <span className="text-sm font-medium">Total</span>
            <span className="text-sm font-semibold">
              KES {total.toLocaleString()}
            </span>
          </div>
          
          <div className="flex justify-end space-x-2 pt-2">
            <Button variant="outline" onClick={onClose} disabled={isLoading}>
              Cancel
            </Button>
            <Button 
              onClick={handleSubmit} 
              disabled={isLoading || !amount || parseFloat(amount) <= 0}
              className={isBuy ? "bg-green-600 hover:bg-green-700" : "bg-red-600 hover:bg-red-700"}
            >
              {isLoading ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </span>
              ) : (
                `${isBuy ? 'Buy' : 'Sell'} ${order.currency}`
              )}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default TradeExecutionDialog;
