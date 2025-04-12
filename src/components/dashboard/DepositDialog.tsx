import React, { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { initiatePayment, pollTransactionStatus } from '@/services/payHeroService';
import { Loader2 } from "lucide-react";

interface DepositDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  onSuccess?: () => void;
}

const DepositDialog = ({ 
  isOpen, 
  onClose, 
  currency, 
  onSuccess 
}: DepositDialogProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [transactionReference, setTransactionReference] = useState<string | null>(null);
  const [transactionStatus, setTransactionStatus] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || parseFloat(amount) <= 0) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive"
      });
      return;
    }
    
    if (!phoneNumber) {
      toast({
        title: "Missing phone number",
        description: "Please enter your M-Pesa phone number",
        variant: "destructive"
      });
      return;
    }
    
    setIsLoading(true);
    setTransactionStatus('initiating');

    try {
      const result = await initiatePayment({
        amount: parseFloat(amount),
        phoneNumber: phoneNumber,
        type: 'deposit'
      });
      
      setTransactionReference(result.reference);
      setTransactionStatus('processing');
      
      toast({
        title: "Payment initiated",
        description: "Please check your phone to complete the payment"
      });
      
      // Start polling for status
      pollTransactionStatus(result.reference, (transaction) => {
        setTransactionStatus(transaction.status);
        
        if (transaction.status === 'completed') {
          toast({
            title: "Deposit successful",
            description: `${currency} ${amount} has been added to your account`
          });
          
          if (onSuccess) {
            onSuccess();
            onClose();
          }
        } else if (transaction.status === 'failed') {
          toast({
            title: "Deposit failed",
            description: "The transaction was not completed",
            variant: "destructive"
          });
        }
      });
      
    } catch (error) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive"
      });
      setTransactionStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTransactionStatus = () => {
    if (!transactionStatus || !transactionReference) return null;
    
    let statusMessage = '';
    let color = '';
    
    switch (transactionStatus) {
      case 'initiating':
        statusMessage = 'Initiating payment...';
        color = 'text-yellow-500';
        break;
      case 'processing':
        statusMessage = 'Processing payment. Check your phone for the M-Pesa prompt.';
        color = 'text-blue-500';
        break;
      case 'completed':
        statusMessage = 'Payment completed successfully!';
        color = 'text-green-500';
        break;
      case 'failed':
        statusMessage = 'Payment failed. Please try again.';
        color = 'text-red-500';
        break;
      default:
        statusMessage = `Status: ${transactionStatus}`;
        color = 'text-gray-500';
    }
    
    return (
      <div className={`mt-4 p-3 border rounded ${color}`}>
        <p className="font-medium">{statusMessage}</p>
        <p className="text-sm mt-1">Reference: {transactionReference}</p>
      </div>
    );
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Deposit {currency}</DialogTitle>
        </DialogHeader>
        
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="amount">Amount ({currency})</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              required
              min="1"
              step="any"
              disabled={isLoading || transactionStatus === 'processing'}
            />
          </div>
          
          <div className="space-y-2">
            <Label htmlFor="phone">M-Pesa Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="e.g., 07XXXXXXXX"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              required
              disabled={isLoading || transactionStatus === 'processing'}
            />
            <p className="text-sm text-gray-500">Must be registered with M-Pesa</p>
          </div>
          
          {renderTransactionStatus()}
          
          <div className="flex justify-end space-x-2">
            <Button 
              type="button" 
              variant="outline" 
              onClick={onClose}
              disabled={isLoading || transactionStatus === 'processing'}
            >
              Cancel
            </Button>
            <Button 
              type="submit" 
              disabled={isLoading || transactionStatus === 'processing'}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing
                </>
              ) : 'Deposit'}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DepositDialog;