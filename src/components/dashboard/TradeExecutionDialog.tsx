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

  const isPartialFill = parsedAmount < order.amount;  
    
  const { data: transaction, error: transactionError } = await supabase.rpc('begin_transaction');  
    
  if (transactionError) throw transactionError;  
    
  try {  
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
      
    if (isPartialFill) {  
      const remainingAmount = order.amount - parsedAmount;  
        
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
      
    const { error: commitError } = await supabase.rpc('commit_transaction');  
    if (commitError) throw commitError;  
      
    toast({  
      title: "Trade executed successfully",  
      description: `You have ${order.type === 'buy' ? 'sold' : 'bought'} ${parsedAmount} ${order.currency}`,  
    });  

    if (onSuccess) onSuccess();  
    onClose();  
      
  } catch (innerError) {  
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

return (
<Dialog open={isOpen} onOpenChange={onClose}>
<DialogContent className="sm:max-w-[425px]">
<DialogHeader>
<DialogTitle>Execute {order.type === 'buy' ? 'Sell' : 'Buy'} Order</DialogTitle>
</DialogHeader>
</DialogContent>
</Dialog>
);
};

export default TradeExecutionDialog;
