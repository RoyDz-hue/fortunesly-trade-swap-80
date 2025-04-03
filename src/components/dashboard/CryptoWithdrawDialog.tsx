
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Coin } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface CryptoWithdrawDialogProps {
  isOpen: boolean;
  onClose: () => void;
  coin: Coin;
  maxAmount: number;
  onSuccess?: () => void;
}

const CryptoWithdrawDialog = ({ isOpen, onClose, coin, maxAmount, onSuccess }: CryptoWithdrawDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [amount, setAmount] = useState("");
  const [withdrawalAddress, setWithdrawalAddress] = useState("");
  const [taxAmount, setTaxAmount] = useState(0);
  const [netAmount, setNetAmount] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  
  const taxRate = coin.taxRate || 10; // Default 10% if not specified
  
  useEffect(() => {
    if (amount && !isNaN(parseFloat(amount))) {
      const amountValue = parseFloat(amount);
      const calculatedTax = (amountValue * taxRate) / 100;
      const calculatedNet = amountValue - calculatedTax;
      
      setTaxAmount(calculatedTax);
      setNetAmount(calculatedNet);
    } else {
      setTaxAmount(0);
      setNetAmount(0);
    }
  }, [amount, taxRate]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to withdraw funds",
        variant: "destructive",
      });
      return;
    }
    
    const parsedAmount = parseFloat(amount);
    
    if (!amount || !withdrawalAddress || isNaN(parsedAmount)) {
      toast({
        title: "Missing information",
        description: "Please enter the amount and withdrawal address",
        variant: "destructive",
      });
      return;
    }
    
    if (parsedAmount <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than zero",
        variant: "destructive",
      });
      return;
    }
    
    if (parsedAmount > maxAmount) {
      toast({
        title: "Insufficient balance",
        description: `Maximum available withdrawal is ${maxAmount} ${coin.symbol}`,
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      console.log(`Initiating withdrawal of ${parsedAmount} ${coin.symbol} to address ${withdrawalAddress}`);
      
      // 1. Get current user crypto balance
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('balance_crypto')
        .eq('id', user.id)
        .single();
        
      if (userError) {
        console.error("Error fetching user data:", userError);
        throw userError;
      }
      
      const cryptoBalances = userData.balance_crypto || {};
      
      if (!cryptoBalances[coin.symbol] || cryptoBalances[coin.symbol] < parsedAmount) {
        throw new Error("Insufficient balance");
      }
      
      // Calculate new balance
      cryptoBalances[coin.symbol] -= parsedAmount;
      
      // Update user balance
      const { error: updateError } = await supabase
        .from('users')
        .update({ balance_crypto: cryptoBalances })
        .eq('id', user.id);
        
      if (updateError) {
        console.error("Error updating user balance:", updateError);
        throw updateError;
      }
      
      // 2. Create withdrawal record
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawals')
        .insert({
          user_id: user.id,
          currency: coin.symbol,
          amount: netAmount,
          user_address: withdrawalAddress,
          status: 'pending'
        })
        .select();
        
      if (withdrawalError) {
        console.error("Error creating withdrawal record:", withdrawalError);
        throw withdrawalError;
      }
      
      console.log("Created withdrawal record:", withdrawalData);
      
      // 3. Create transaction record for tracking
      const { data: txnData, error: txnError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'withdrawal',
          currency: coin.symbol,
          amount: parsedAmount,
          status: 'pending',
          withdrawal_address: withdrawalAddress
        })
        .select();
        
      if (txnError) {
        console.error("Error creating transaction record:", txnError);
        throw txnError;
      }
      
      console.log("Created transaction record:", txnData);
      
      toast({
        title: "Withdrawal request submitted",
        description: `Your ${netAmount.toFixed(8)} ${coin.symbol} withdrawal request has been submitted for approval.`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      setAmount("");
      setWithdrawalAddress("");
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      toast({
        title: "Request failed",
        description: error.message || "An error occurred while submitting your withdrawal request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw {coin.symbol}</DialogTitle>
          <DialogDescription>
            Enter the address and amount to withdraw. A {taxRate}% fee will be applied.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="withdrawalAddress" className="text-right">
                Address
              </Label>
              <Input
                id="withdrawalAddress"
                value={withdrawalAddress}
                onChange={(e) => setWithdrawalAddress(e.target.value)}
                placeholder={`Enter ${coin.symbol} address`}
                className="col-span-3 font-mono text-xs"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                min="0.00000001"
                max={maxAmount}
                step="0.00000001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Enter ${coin.symbol} amount`}
                className="col-span-3"
              />
              <div className="col-span-4 text-xs text-gray-500 text-right">
                Available: {maxAmount.toFixed(8)} {coin.symbol}
              </div>
            </div>
            
            {parseFloat(amount) > 0 && (
              <div className="col-span-4 border rounded-md p-3 bg-gray-50">
                <div className="flex justify-between text-sm mb-1">
                  <span>Amount:</span>
                  <span>{parseFloat(amount).toFixed(8)} {coin.symbol}</span>
                </div>
                <div className="flex justify-between text-sm mb-1">
                  <span>Fee ({taxRate}%):</span>
                  <span>{taxAmount.toFixed(8)} {coin.symbol}</span>
                </div>
                <div className="flex justify-between text-sm font-medium">
                  <span>You will receive:</span>
                  <span>{netAmount.toFixed(8)} {coin.symbol}</span>
                </div>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : "Withdraw"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CryptoWithdrawDialog;
