import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { initiatePayment, pollTransactionStatus } from '@/services/payHeroService';
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Format phone number to include country code if missing
  const formatPhoneNumber = (phone: string): string => {
    if (!phone) return '';
    
    // Remove any spaces or non-digit characters
    const cleaned = phone.replace(/\D/g, '');
    
    // If it starts with 0, replace with 254
    if (cleaned.startsWith('0')) {
      return `254${cleaned.substring(1)}`;
    }
    
    // If it doesn't have country code, add it
    if (!cleaned.startsWith('254')) {
      return `254${cleaned}`;
    }
    
    return cleaned;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    
    if (!amount || parseFloat(amount) <= 0) {
      setErrorMessage("Please enter a valid amount greater than 0");
      return;
    }
    
    if (!phoneNumber) {
      setErrorMessage("Please enter your M-Pesa phone number");
      return;
    }
    
    setIsLoading(true);
    setTransactionStatus('initiating');

    try {
      const formattedPhone = formatPhoneNumber(phoneNumber);
      
      const result = await initiatePayment({
        amount: parseFloat(amount),
        phoneNumber: formattedPhone,
        type: 'deposit'
      });
      
      setTransactionReference(result.reference);
      setTransactionStatus('processing');
      
      toast({
        title: "Payment initiated",
        description: "Please check your phone to complete the payment"
      });
      
      pollTransactionStatus(result.reference, (transaction) => {
        setTransactionStatus(transaction.status);
        
        if (transaction.status === 'completed') {
          toast({
            title: "Deposit successful",
            description: `${currency} ${amount} has been added to your account`
          });
          
          if (onSuccess) {
            setTimeout(() => {
              onSuccess();
              onClose();
            }, 2000); // Give user time to see success message
          }
        } else if (transaction.status === 'failed') {
          setErrorMessage("The transaction was not completed. Please try again.");
        } else if (transaction.status === 'timeout') {
          setErrorMessage("The transaction status check timed out. Please check your account balance or try again.");
        }
      }, 20, 3000); // 20 attempts, 3 second interval (total 1 minute)
      
    } catch (error: any) {
      console.error("Deposit error:", error);
      setErrorMessage(error.message || "An unexpected error occurred");
      setTransactionStatus('failed');
    } finally {
      setIsLoading(false);
    }
  };

  const renderTransactionStatus = () => {
    if (!transactionStatus || !transactionReference) return null;
    
    let statusMessage = '';
    let icon = null;
    let statusClass = '';
    
    switch (transactionStatus) {
      case 'initiating':
        statusMessage = 'Initiating payment...';
        icon = <Loader2 className="h-4 w-4 animate-spin" />;
        statusClass = 'bg-yellow-50 text-yellow-800 border-yellow-200';
        break;
      case 'pending':
      case 'processing':
        statusMessage = 'Processing payment. Check your phone for the M-Pesa prompt.';
        icon = <Loader2 className="h-4 w-4 animate-spin" />;
        statusClass = 'bg-blue-50 text-blue-800 border-blue-200';
        break;
      case 'completed':
        statusMessage = 'Payment completed successfully!';
        icon = <CheckCircle2 className="h-4 w-4" />;
        statusClass = 'bg-green-50 text-green-800 border-green-200';
        break;
      case 'failed':
        statusMessage = 'Payment failed. Please try again.';
        icon = <AlertCircle className="h-4 w-4" />;
        statusClass = 'bg-red-50 text-red-800 border-red-200';
        break;
      default:
        statusMessage = `Status: ${transactionStatus}`;
        statusClass = 'bg-gray-50 text-gray-800 border-gray-200';
    }
    
    return (
      <div className={`mt-4 p-3 border rounded flex items-start ${statusClass}`}>
        <div className="mr-2 mt-0.5">{icon}</div>
        <div>
          <p className="font-medium">{statusMessage}</p>
          <p className="text-sm mt-1">Reference: {transactionReference}</p>
        </div>
      </div>
    );
  };

  // Clear status when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setTransactionReference(null);
      setTransactionStatus(null);
      setErrorMessage(null);
      setAmount('');
      setPhoneNumber('');
    }
  }, [isOpen]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Deposit {currency}</DialogTitle>
        </DialogHeader>
        
        {errorMessage && (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>{errorMessage}</AlertDescription>
          </Alert>
        )}
        
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
              disabled={isLoading || transactionStatus === 'processing' || transactionStatus === 'completed'}
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