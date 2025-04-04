
import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import { Label } from '@/components/ui/label';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/integrations/supabase/client';
import { Loader2 } from 'lucide-react';

export interface TradeExecutionDialogProps {
  isOpen: boolean;
  onClose: () => void;
  order: any; // The order to be executed
  onSuccess?: () => void;
}

const TradeExecutionDialog = ({ isOpen, onClose, order, onSuccess }: TradeExecutionDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [executionType, setExecutionType] = useState('full');
  const [customAmount, setCustomAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  
  const orderType = order?.type === 'buy' ? 'Sell' : 'Buy';
  const orderAction = order?.type === 'buy' ? 'sell' : 'buy';
  
  const handleExecute = async () => {
    if (!user || !order) {
      toast({
        title: "Error",
        description: "Missing user or order information",
        variant: "destructive",
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      let tradeAmount = 0;
      
      if (executionType === 'full') {
        tradeAmount = order.amount;
      } else if (executionType === 'half') {
        tradeAmount = order.amount / 2;
      } else if (executionType === 'custom') {
        const parsedAmount = parseFloat(customAmount);
        if (isNaN(parsedAmount) || parsedAmount <= 0 || parsedAmount > order.amount) {
          toast({
            title: "Invalid amount",
            description: `Please enter an amount between 0 and ${order.amount}`,
            variant: "destructive",
          });
          setIsProcessing(false);
          return;
        }
        tradeAmount = parsedAmount;
      }
      
      // Execute the market order using the database function
      const { data, error } = await supabase.rpc(
        'execute_market_order',
        {
          order_id_param: order.id,
          trader_id_param: user.id,
          trade_amount_param: tradeAmount
        }
      );
      
      if (error) {
        throw error;
      }
      
      toast({
        title: "Trade successful",
        description: `Successfully ${orderAction}ed ${tradeAmount} ${order.currency}`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
    } catch (error: any) {
      console.error("Trade execution error:", error);
      toast({
        title: "Trade failed",
        description: error.message || "There was an error executing the trade",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  if (!order) return null;
  
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>{orderType} Order</DialogTitle>
          <DialogDescription>
            Execute {orderAction} order for {order.currency} at {order.price} KES per unit.
          </DialogDescription>
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Amount</Label>
            <div className="col-span-3">
              <RadioGroup value={executionType} onValueChange={setExecutionType}>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="full" id="full" />
                  <Label htmlFor="full">Full amount ({order.amount} {order.currency})</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="half" id="half" />
                  <Label htmlFor="half">Half amount ({order.amount / 2} {order.currency})</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="custom" id="custom" />
                  <Label htmlFor="custom">Custom amount</Label>
                </div>
                {executionType === 'custom' && (
                  <div className="mt-2 pl-6">
                    <Input
                      type="number"
                      placeholder={`Enter amount (max ${order.amount})`}
                      value={customAmount}
                      onChange={(e) => setCustomAmount(e.target.value)}
                      min="0.00000001"
                      max={order.amount}
                      step="0.00000001"
                    />
                  </div>
                )}
              </RadioGroup>
            </div>
          </div>
          
          <div className="grid grid-cols-4 items-center gap-4">
            <Label className="text-right">Details</Label>
            <div className="col-span-3 border rounded-md p-3 bg-gray-50 space-y-1">
              <div className="flex justify-between text-sm">
                <span>Price:</span>
                <span>{order.price} KES</span>
              </div>
              <div className="flex justify-between text-sm">
                <span>Total Cost:</span>
                <span>
                  {executionType === 'full' ? (order.amount * order.price).toFixed(2) : 
                   executionType === 'half' ? ((order.amount / 2) * order.price).toFixed(2) :
                   executionType === 'custom' && !isNaN(parseFloat(customAmount)) ? 
                     (parseFloat(customAmount) * order.price).toFixed(2) : '0.00'} KES
                </span>
              </div>
            </div>
          </div>
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isProcessing}>
            Cancel
          </Button>
          <Button onClick={handleExecute} disabled={isProcessing}>
            {isProcessing ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
            Execute Trade
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};

export default TradeExecutionDialog;
