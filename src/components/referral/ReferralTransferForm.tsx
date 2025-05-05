
import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { transferCoins } from '@/services/referralService';
import { ReferralSettings } from '@/types';
import SuccessAlert from '@/components/ui/SuccessAlert';

interface ReferralTransferFormProps {
  balance: number;
  settings: ReferralSettings;
  onTransferComplete: () => void;
}

const ReferralTransferForm: React.FC<ReferralTransferFormProps> = ({ 
  balance, 
  settings,
  onTransferComplete
}) => {
  const [transferType, setTransferType] = useState<'user' | 'wallet'>('user');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [amount, setAmount] = useState<number>(settings.minTransferableBalance);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(false);
  const [success, setSuccess] = useState<boolean>(false);
  const { toast } = useToast();
  
  const minAmount = transferType === 'user' ? 
    settings.minTransferableBalance : 
    settings.minToCryptoWallet;
  
  const fee = transferType === 'user' ? 
    Math.round((amount * settings.transactionFeePercent) / 100) : 
    0;
  
  const totalAmount = amount;
  const recipientReceives = amount - fee;
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(false);
    
    // Validation
    if (amount < minAmount) {
      setError(`Minimum transfer amount is ${minAmount} coins`);
      return;
    }
    
    if (amount > balance) {
      setError(`You don't have enough coins. Your balance: ${balance}`);
      return;
    }
    
    if (transferType === 'user' && !recipientEmail) {
      setError('Please enter recipient email');
      return;
    }
    
    setLoading(true);
    
    try {
      if (transferType === 'user') {
        const result = await transferCoins(recipientEmail, amount);
        setSuccess(true);
        toast({
          title: "Transfer successful!",
          description: `${recipientReceives} coins transferred to ${recipientEmail}`,
        });
        setRecipientEmail('');
        setAmount(minAmount);
        onTransferComplete();
      } else {
        // TODO: Implement crypto wallet transfer
        setError('Crypto wallet transfers are not yet implemented');
      }
    } catch (err) {
      console.error('Transfer error:', err);
      setError(err instanceof Error ? err.message : 'Transfer failed');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer TRD Coins</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-900/30 p-4 rounded-md flex items-start space-x-2 border border-red-800 mb-4">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}
        
        {success && (
          <SuccessAlert message="Transfer completed successfully!" />
        )}
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label className="text-base">Transfer Type</Label>
            <RadioGroup
              value={transferType}
              onValueChange={(value) => setTransferType(value as 'user' | 'wallet')}
              className="flex space-x-4 mt-2"
            >
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="user" id="user" />
                <Label htmlFor="user">To Another User</Label>
              </div>
              <div className="flex items-center space-x-2">
                <RadioGroupItem value="wallet" id="wallet" disabled />
                <Label htmlFor="wallet" className="text-muted-foreground">
                  To Crypto Wallet (Coming Soon)
                </Label>
              </div>
            </RadioGroup>
          </div>
          
          {transferType === 'user' && (
            <div>
              <Label htmlFor="recipient-email">Recipient Email</Label>
              <Input
                id="recipient-email"
                type="email"
                value={recipientEmail}
                onChange={(e) => setRecipientEmail(e.target.value)}
                placeholder="email@example.com"
                required
              />
            </div>
          )}
          
          <div>
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              min={minAmount}
              max={balance}
              value={amount}
              onChange={(e) => setAmount(Number(e.target.value))}
              required
            />
            <p className="text-xs text-gray-400 mt-1">
              Minimum: {minAmount} coins.&nbsp;
              Your balance: {balance} coins.
            </p>
          </div>
          
          {transferType === 'user' && (
            <div className="rounded-md bg-gray-800 p-3">
              <Label className="text-sm">Transfer Summary</Label>
              <div className="grid grid-cols-2 gap-1 mt-2 text-sm">
                <span className="text-gray-400">You send:</span>
                <span>{totalAmount} TRD</span>
                <span className="text-gray-400">Fee ({settings.transactionFeePercent}%):</span>
                <span>{fee} TRD</span>
                <span className="text-gray-400">Recipient gets:</span>
                <span>{recipientReceives} TRD</span>
              </div>
            </div>
          )}
          
          <Button 
            type="submit" 
            className="w-full"
            disabled={loading || balance < minAmount}
          >
            {loading ? 'Processing...' : 'Transfer Coins'}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReferralTransferForm;
