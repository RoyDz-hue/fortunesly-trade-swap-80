
import React, { useState } from 'react';
import { useToast } from "@/hooks/use-toast";
import { transferCoins } from '@/services/referralService';
import { ReferralSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, CoinIcon, SendHorizontal, ArrowRight } from 'lucide-react';
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
  const [transferType, setTransferType] = useState<string>('user');
  const [recipientEmail, setRecipientEmail] = useState<string>('');
  const [amount, setAmount] = useState<number | ''>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const { toast } = useToast();

  const calculatedFee = amount !== '' ? Math.round((Number(amount) * settings.transactionFeePercent) / 100) : 0;
  const recipientAmount = amount !== '' ? Number(amount) - calculatedFee : 0;

  const validateAmount = () => {
    if (!amount) return 'Amount is required';
    if (Number(amount) <= 0) return 'Amount must be greater than zero';
    if (Number(amount) > balance) return 'Insufficient balance';
    
    if (transferType === 'user' && Number(amount) < settings.minTransferableBalance) {
      return `Minimum transfer amount is ${settings.minTransferableBalance} coins`;
    }
    
    if (transferType === 'wallet' && Number(amount) < settings.minToCryptoWallet) {
      return `Minimum transfer to crypto wallet is ${settings.minToCryptoWallet} coins`;
    }
    
    return null;
  };

  const handleTransfer = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    
    const amountError = validateAmount();
    if (amountError) {
      setError(amountError);
      return;
    }
    
    if (transferType === 'user' && !recipientEmail) {
      setError('Recipient email is required');
      return;
    }

    setIsLoading(true);
    
    try {
      if (transferType === 'user') {
        const result = await transferCoins(recipientEmail, Number(amount));
        
        if (!result.success) {
          setError(result.error || 'Transfer failed');
          return;
        }
        
        setSuccess(`Successfully transferred ${amount} coins to ${recipientEmail}. Fee: ${calculatedFee} coins.`);
        toast({
          title: "Transfer successful",
          description: `${recipientAmount} coins sent to ${recipientEmail}`,
          variant: "success"
        });
        
        // Reset form
        setAmount('');
        setRecipientEmail('');
        
        // Refresh parent component data
        onTransferComplete();
      } else {
        // Crypto wallet transfer - not implemented yet
        setError('Crypto wallet transfers are not yet available');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'An unknown error occurred');
      toast({
        title: "Transfer failed",
        description: err instanceof Error ? err.message : 'An unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Transfer TRD Coins</CardTitle>
        <CardDescription>
          Send coins to other users or convert to crypto
        </CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="mb-6">
            <SuccessAlert message={success} />
          </div>
        )}
        
        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertCircle className="h-4 w-4 mr-2" />
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}
        
        <form onSubmit={handleTransfer}>
          <div className="grid gap-4">
            <div className="space-y-1">
              <Label htmlFor="transfer-type">Transfer To</Label>
              <Select
                value={transferType}
                onValueChange={setTransferType}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select transfer type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="user">Another User</SelectItem>
                  <SelectItem value="wallet">My Crypto Wallet</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {transferType === 'user' && (
              <div className="space-y-1">
                <Label htmlFor="recipient-email">Recipient Email</Label>
                <Input
                  id="recipient-email"
                  type="email"
                  value={recipientEmail}
                  onChange={(e) => setRecipientEmail(e.target.value)}
                  placeholder="Email address"
                  required
                />
              </div>
            )}
            
            <div className="space-y-1">
              <div className="flex justify-between">
                <Label htmlFor="amount">Amount</Label>
                <span className="text-sm text-gray-400">
                  Balance: <span className="font-medium">{balance}</span>
                </span>
              </div>
              <Input
                id="amount"
                type="number"
                min={1}
                step={1}
                value={amount}
                onChange={(e) => setAmount(e.target.value ? Number(e.target.value) : '')}
                placeholder="Enter amount"
                required
              />
              {transferType === 'user' && amount !== '' && (
                <div className="mt-1">
                  <p className="text-xs text-gray-400">
                    Fee: {calculatedFee} coins ({settings.transactionFeePercent}%)
                  </p>
                  <p className="text-xs text-gray-400">
                    Recipient will receive: {recipientAmount} coins
                  </p>
                </div>
              )}
            </div>
            
            {transferType === 'user' && (
              <div className="bg-gray-800/50 rounded-md p-4 text-sm">
                <h4 className="font-medium mb-1 flex items-center">
                  <CoinIcon className="h-4 w-4 mr-1" /> Transfer Details
                </h4>
                <ul className="space-y-1 text-gray-400">
                  <li>Minimum transfer: {settings.minTransferableBalance} coins</li>
                  <li>Transaction fee: {settings.transactionFeePercent}%</li>
                  <li>The recipient will receive the amount minus the fee</li>
                </ul>
              </div>
            )}
            
            {transferType === 'wallet' && (
              <div className="bg-amber-950/20 border border-amber-500/20 rounded-md p-4 text-sm text-amber-300">
                <h4 className="font-medium mb-1 flex items-center">
                  <AlertCircle className="h-4 w-4 mr-1" /> Coming Soon
                </h4>
                <p className="text-amber-200/70">
                  Crypto wallet transfers will be available in the next update.
                </p>
              </div>
            )}
            
            <Button 
              type="submit" 
              className="mt-2"
              disabled={isLoading || transferType === 'wallet'}
            >
              {isLoading ? (
                "Processing..."
              ) : (
                <>
                  <SendHorizontal className="mr-2 h-4 w-4" /> 
                  Transfer Coins
                </>
              )}
            </Button>
          </div>
        </form>
        
        <Separator className="my-6" />
        
        <div className="bg-gray-900/60 rounded-md p-4">
          <h3 className="font-medium mb-2 flex items-center">
            <ArrowRight className="h-4 w-4 mr-1" /> How to earn more coins
          </h3>
          <p className="text-sm text-gray-400">
            Invite friends to join using your referral code. You'll earn {settings.coinsPerReferral} coins for each new signup.
            You'll also earn {settings.level2RatePercent}% when they refer others!
          </p>
        </div>
      </CardContent>
    </Card>
  );
};

export default ReferralTransferForm;
