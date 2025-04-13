import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { initiatePayment, checkPaymentStatus } from '@/services/payHeroService';
import { useAuth } from "@/context/AuthContext";

interface WithdrawDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (amount: number) => void;
  currency?: string;
  balance: number;
}

type DialogState = 
  'initial' | 
  'processing' | 
  'stk_sent' | 
  'pending' | 
  'delayed' | 
  'completed' | 
  'failed' | 
  'canceled';

const WithdrawDialog = ({ isOpen, onClose, onSuccess, currency = 'KES', balance }: WithdrawDialogProps) => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [error, setError] = useState("");
  const [dialogState, setDialogState] = useState<DialogState>('initial');
  const [statusMessage, setStatusMessage] = useState("");
  const [reference, setReference] = useState("");

  const timeouts = useRef<{
    delayedTimer?: NodeJS.Timeout;
    pollingInterval?: NodeJS.Timeout;
    closeTimer?: NodeJS.Timeout;
  }>({});

  const clearAllTimers = () => {
    if (timeouts.current.delayedTimer) clearTimeout(timeouts.current.delayedTimer);
    if (timeouts.current.pollingInterval) clearInterval(timeouts.current.pollingInterval);
    if (timeouts.current.closeTimer) clearTimeout(timeouts.current.closeTimer);
  };

  useEffect(() => {
    if (isOpen) {
      setDialogState('initial');
      setError('');
      setReference('');
      setStatusMessage('');
      clearAllTimers();
    }
    return clearAllTimers;
  }, [isOpen]);

  useEffect(() => {
    if (!isAuthenticated) {
      setError('Please log in to make a withdrawal');
    } else {
      setError('');
    }
  }, [isAuthenticated]);

  const handleSubmit = async () => {
    try {
      if (!isAuthenticated || !user) {
        setError('Please log in to make a withdrawal');
        return;
      }

      const withdrawalAmount = parseFloat(amount);

      if (!amount || isNaN(withdrawalAmount) || withdrawalAmount <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (withdrawalAmount > balance) {
        setError('Insufficient balance');
        return;
      }

      if (!phoneNumber || phoneNumber.length < 9) {
        setError('Please enter a valid phone number');
        return;
      }

      setError('');
      setDialogState('processing');
      setStatusMessage('Initiating withdrawal...');

      const response = await initiatePayment(
        user,
        withdrawalAmount,
        phoneNumber,
        'withdrawal'
      );

      if (!response.success) {
        throw new Error(response.error || 'Failed to initiate withdrawal');
      }

      setReference(response.reference || '');
      setDialogState('stk_sent');
      setStatusMessage('Processing your withdrawal. Please wait...');
      
      startPolling(response.reference || '');

      timeouts.current.delayedTimer = setTimeout(() => {
        if (dialogState !== 'completed' && dialogState !== 'failed' && dialogState !== 'canceled') {
          setDialogState('delayed');
          setStatusMessage('Transaction is taking longer than expected...');
        }
      }, 30000);

    } catch (error: any) {
      console.error('Withdrawal error:', error);
      setError(error.message || 'An error occurred');
      setDialogState('initial');
    }
  };

  const startPolling = (ref: string) => {
    if (timeouts.current.pollingInterval) {
      clearInterval(timeouts.current.pollingInterval);
    }

    timeouts.current.pollingInterval = setInterval(async () => {
      try {
        const status = await checkPaymentStatus(ref);
        
        if (status.status === 'completed') {
          handleSuccess(status.amount || 0);
        } else if (status.status === 'failed') {
          handleFailure(status.error || 'Transaction failed');
        } else if (status.status === 'canceled') {
          handleFailure('Transaction was canceled');
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);
  };

  const handleSuccess = (amount: number) => {
    clearAllTimers();
    setDialogState('completed');
    setStatusMessage(`Withdrawal of ${amount} ${currency} successful!`);
    if (onSuccess) onSuccess(amount);
    
    timeouts.current.closeTimer = setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleFailure = (message: string) => {
    clearAllTimers();
    setDialogState('failed');
    setStatusMessage(message);
    
    timeouts.current.closeTimer = setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => {
      if (!open && dialogState !== 'processing') {
        clearAllTimers();
        onClose();
      }
    }}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw {currency}</DialogTitle>
          <DialogDescription>
            Withdraw funds to your M-Pesa account.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {dialogState === 'initial' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount ({currency})</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min={1}
                  max={balance}
                />
                <p className="text-sm text-gray-500">Available balance: {balance} {currency}</p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">M-Pesa Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value.replace(/[^0-9+]/g, ''))}
                  placeholder="e.g., 0712345678"
                />
              </div>

              {error && (
                <Alert variant="destructive">
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}
            </>
          )}

          {(dialogState === 'processing' || dialogState === 'stk_sent' || dialogState === 'pending' || dialogState === 'delayed') && (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-center text-sm text-gray-600">{statusMessage}</p>
            </div>
          )}

          {dialogState === 'completed' && (
            <Alert>
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}

          {(dialogState === 'failed' || dialogState === 'canceled') && (
            <Alert variant="destructive">
              <AlertDescription>{statusMessage}</AlertDescription>
            </Alert>
          )}
        </div>

        {dialogState === 'initial' && (
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button onClick={handleSubmit}>
              Withdraw
            </Button>
          </div>
        )}

        {(dialogState === 'stk_sent' || dialogState === 'pending' || dialogState === 'delayed') && (
          <div className="flex justify-end">
            <Button variant="outline" onClick={onClose}>
              Close
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawDialog;