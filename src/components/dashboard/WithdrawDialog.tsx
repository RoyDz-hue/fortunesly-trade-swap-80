import React, { useState, useEffect, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import { initiatePayment, pollTransactionStatus } from '@/services/payHeroService';
import { useAuth } from "@/context/AuthContext";

interface WithdrawDialogProps {
  isOpen: boolean;
  onClose: () => void;
  maxAmount?: number;
  onSuccess?: (amount: number) => void;
}

type DialogState = 'initial' | 'processing' | 'pending' | 'completed' | 'failed' | 'canceled' | 'delayed';

const WithdrawDialog = ({ isOpen, onClose, maxAmount, onSuccess }: WithdrawDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
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

  const handleSubmit = async () => {
    try {
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }

      if (maxAmount && parseFloat(amount) > maxAmount) {
        setError(`Amount cannot exceed ${maxAmount} KES`);
        return;
      }

      if (!phoneNumber || phoneNumber.length < 9) {
        setError('Please enter a valid phone number');
        return;
      }

      setError('');
      setDialogState('processing');
      setStatusMessage('Processing your withdrawal...');

      const response = await initiatePayment(parseFloat(amount), phoneNumber);

      if (!response.success) {
        throw new Error(response.error || 'Failed to process withdrawal');
      }

      setReference(response.reference);
      setDialogState('pending');
      startPolling(response.reference);

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
        const status = await pollTransactionStatus(ref);
        
        if (status.completed) {
          handleSuccess(status.amount);
        } else if (status.failed) {
          handleFailure(status.message);
        }
      } catch (error) {
        console.error('Polling error:', error);
      }
    }, 5000);

    // Add timeout after 60 seconds
    timeouts.current.delayedTimer = setTimeout(() => {
      if (dialogState !== 'completed' && dialogState !== 'failed') {
        setDialogState('delayed');
        setStatusMessage('Taking longer than expected...');
      }
    }, 60000);
  };

  const handleSuccess = (amount: number) => {
    clearAllTimers();
    setDialogState('completed');
    setStatusMessage(`Withdrawal of ${amount} KES successful`);
    if (onSuccess) onSuccess(amount);
    
    timeouts.current.closeTimer = setTimeout(() => {
      onClose();
    }, 2000);
  };

  const handleFailure = (message: string) => {
    clearAllTimers();
    setDialogState('failed');
    setStatusMessage(message || 'Withdrawal failed');
    
    timeouts.current.closeTimer = setTimeout(() => {
      onClose();
    }, 2000);
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Withdraw KES</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {dialogState === 'initial' && (
            <>
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (KES)</Label>
                <Input
                  id="amount"
                  type="number"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                  placeholder="Enter amount"
                  min={1}
                  max={maxAmount}
                />
                {maxAmount && (
                  <p className="text-sm text-gray-500">
                    Available: {maxAmount} KES
                  </p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">M-Pesa Number</Label>
                <Input
                  id="phone"
                  type="tel"
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
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

          {(dialogState === 'processing' || dialogState === 'pending' || dialogState === 'delayed') && (
            <div className="flex flex-col items-center justify-center py-4">
              <Loader2 className="h-8 w-8 animate-spin mb-4" />
              <p className="text-center text-sm text-gray-600">{statusMessage}</p>
            </div>
          )}

          {(dialogState === 'completed' || dialogState === 'failed') && (
            <Alert variant={dialogState === 'completed' ? 'default' : 'destructive'}>
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
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawDialog;