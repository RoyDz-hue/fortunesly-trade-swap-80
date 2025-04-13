// src/components/DepositDialog.tsx
import React, { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/components/ui/use-toast";
import { initiatePayment, pollTransactionStatus } from '@/services/payHeroService';
import { Loader2, AlertCircle, CheckCircle2 } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { initiatePayment, checkPaymentStatus } from '@/services/PayHeroService';

// Define props for the DepositDialog component
interface DepositDialogProps {
  open: boolean;
  onClose: () => void;
  onSuccess?: (amount: number) => void;
  type: 'deposit' | 'withdrawal';
}

// Define possible states for the dialog
type DialogState = 
  'initial' | 
  'processing' | 
  'stk_sent' | 
  'pending' | 
  'delayed' | 
  'completed' | 
  'failed' | 
  'canceled';

const DepositDialog: React.FC<DepositDialogProps> = ({ 
  open, 
  onClose, 
  onSuccess,
  type 
}) => {
  // Get current user 
  const user = useUser();
  
  // State variables
  const [amount, setAmount] = useState<string>('');
  const [phoneNumber, setPhoneNumber] = useState<string>('');
  const [error, setError] = useState<string>('');
  const [dialogState, setDialogState] = useState<DialogState>('initial');
  const [reference, setReference] = useState<string>('');
  const [statusMessage, setStatusMessage] = useState<string>('');
  
  // Ref for timeouts and intervals
  const timeouts = useRef<{
    delayedTimer?: number,
    pollingInterval?: number,
    closeTimer?: number
  }>({});
  
  // Determine title and button text based on type
  const dialogTitle = type === 'deposit' ? 'Deposit Funds' : 'Withdraw Funds';
  const buttonText = type === 'deposit' ? 'Deposit' : 'Withdraw';
  
  // Clean up intervals and timeouts on unmount
  useEffect(() => {
    return () => {
      clearAllTimers();
    };
  }, []);
  
  // Helper to clear all timers
  const clearAllTimers = () => {
    if (timeouts.current.delayedTimer) clearTimeout(timeouts.current.delayedTimer);
    if (timeouts.current.pollingInterval) clearInterval(timeouts.current.pollingInterval);
    if (timeouts.current.closeTimer) clearTimeout(timeouts.current.closeTimer);
  };
  
  // Reset dialog state when opened
  useEffect(() => {
    if (open) {
      setDialogState('initial');
      setError('');
      setReference('');
      setStatusMessage('');
      clearAllTimers();
    }
  }, [open]);
  
  
    // Handle amount input change
  const handleAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and a single decimal point
    const value = e.target.value.replace(/[^0-9.]/g, '');
    if (value === '' || /^\d+(\.\d{0,2})?$/.test(value)) {
      setAmount(value);
    }
  };
  
  // Handle phone number input change
  const handlePhoneNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    // Only allow numbers and plus sign
    const value = e.target.value.replace(/[^0-9+]/g, '');
    setPhoneNumber(value);
  };
  
  // Handle form submission
  const handleSubmit = async () => {
    try {
      // Validate input
      if (!amount || isNaN(parseFloat(amount)) || parseFloat(amount) <= 0) {
        setError('Please enter a valid amount');
        return;
      }
      
      if (!phoneNumber || phoneNumber.length < 9) {
        setError('Please enter a valid phone number');
        return;
      }
      
      if (!user) {
        setError('You must be logged in to make a payment');
        return;
      }
      
      // Clear error and set state to processing
      setError('');
      setDialogState('processing');
      setStatusMessage(`Initiating ${type}...`);
      
      // Initiate payment
      const response = await initiatePayment(
        user,
        parseFloat(amount),
        phoneNumber,
        type
      );
      
      if (!response.success) {
        setError(response.error || `Failed to initiate ${type}`);
        setDialogState('initial');
        return;
      }
      
      // Store reference for status checks
      setReference(response.reference || '');
      
      // Update dialog state to STK sent
      setDialogState('stk_sent');
      setStatusMessage(`${type === 'deposit' ? 'STK Push' : 'Withdrawal'} initiated. Please check your phone and enter your PIN.`);
      
      // Start polling for status
      startPolling(response.reference || '');
      
      // Set a delayed timer to handle long processing times
      timeouts.current.delayedTimer = setTimeout(() => {
        if (dialogState !== 'completed' && dialogState !== 'failed' && dialogState !== 'canceled') {
          setDialogState('delayed');
          setStatusMessage(`${type} is taking longer than expected. Please wait...`);
          
          // After 60 seconds total, close dialog with "still processing" message
          timeouts.current.closeTimer = setTimeout(() => {
            setStatusMessage(`${type} is still processing. We'll notify you when it's complete.`);
            
            // Close dialog after showing the message for 3 seconds
            timeouts.current.closeTimer = setTimeout(() => {
              onClose();
            }, 3000);
          }, 30000); // 30 more seconds after "delayed" state (total 60 seconds)
        }
      }, 30000); // 30 seconds initial delay
      
    } catch (error) {
      console.error(`${type} error:`, error);
      setError(error.message || `An error occurred while processing your ${type}`);
      setDialogState('initial');
    }
  };
  
  // Start polling for payment status
  const startPolling = (ref: string) => {
    // Clear any existing interval
    if (timeouts.current.pollingInterval) {
      clearInterval(timeouts.current.pollingInterval);
    }
    
    // Start polling every 5 seconds
    timeouts.current.pollingInterval = setInterval(async () => {
      try {
        // Check payment status
        const statusResponse = await checkPaymentStatus(ref);
        
        if (!statusResponse.success) {
          console.error('Status check failed:', statusResponse.error);
          return;
        }
        
        // Handle status changes
        if (statusResponse.status === 'completed') {
          handlePaymentCompleted(statusResponse.amount || 0);
        } else if (statusResponse.status === 'failed') {
          handlePaymentFailed('Payment failed. Please try again.');
        } else if (statusResponse.status === 'canceled') {
          handlePaymentFailed('Payment was canceled.');
        }
        
      } catch (error) {
        console.error('Status polling error:', error);
      }
    }, 5000);
  };
  
  // Handle completed payment
  const handlePaymentCompleted = (completedAmount: number) => {
    // Clear all timers
    clearAllTimers();
    
    // Update dialog state
    setDialogState('completed');
    setStatusMessage(`${type === 'deposit' ? 'Deposit' : 'Withdrawal'} of ${completedAmount} KES completed successfully!`);
    
    // Notify parent component
    if (onSuccess) {
      onSuccess(completedAmount);
    }
    
    // Close dialog after 2 seconds
    timeouts.current.closeTimer = setTimeout(() => {
      onClose();
    }, 2000);
  };
  
  // Handle failed payment
  const handlePaymentFailed = (message: string) => {
    // Clear all timers
    clearAllTimers();
    
    // Update dialog state
    setDialogState('failed');
    setStatusMessage(message);
    
    // Close dialog after 2 seconds
    timeouts.current.closeTimer = setTimeout(() => {
      onClose();
    }, 2000);
  };
  
  // Render dialog content based on state
  const renderDialogContent = () => {
    switch (dialogState) {
      case 'initial':
        return (
          <>
            <TextField
              autoFocus
              margin="dense"
              id="amount"
              label="Amount (KES)"
              type="text"
              fullWidth
              variant="outlined"
              value={amount}
              onChange={handleAmountChange}
              disabled={dialogState !== 'initial'}
            />
            <TextField
              margin="dense"
              id="phoneNumber"
              label="Phone Number (M-Pesa)"
              type="text"
              fullWidth
              variant="outlined"
              value={phoneNumber}
              onChange={handlePhoneNumberChange}
              placeholder="e.g., 07XXXXXXXX"
              disabled={dialogState !== 'initial'}
            />
            {error && (
              <Alert severity="error" sx={{ mt: 2 }}>
                {error}
              </Alert>
            )}
          </>
        );
      
      case 'processing':
      case 'stk_sent':
      case 'pending':
      case 'delayed':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
            <CircularProgress size={60} sx={{ mb: 2 }} />
            <Typography variant="body1" align="center">
              {statusMessage}
            </Typography>
          </Box>
        );
      
      case 'completed':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
            <Alert severity="success" sx={{ width: '100%', mb: 2 }}>
              {statusMessage}
            </Alert>
          </Box>
        );
      
      case 'failed':
      case 'canceled':
        return (
          <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', py: 3 }}>
            <Alert severity="error" sx={{ width: '100%', mb: 2 }}>
              {statusMessage}
            </Alert>
          </Box>
        );
      
      default:
        return null;
    }
  };
  
  // Render dialog actions based on state
  const renderDialogActions = () => {
    if (dialogState === 'initial') {
      return (
        <>
          <Button onClick={onClose} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleSubmit} color="primary" variant="contained">
            {buttonText}
          </Button>
        </>
      );
    }
    
    if (dialogState === 'processing' || dialogState === 'stk_sent' || dialogState === 'pending' || dialogState === 'delayed') {
      return (
        <Button onClick={onClose} color="inherit" disabled={dialogState === 'processing'}>
          Close
        </Button>
      );
    }
    
    return null;
  };
  
  return (
    <Dialog
      open={open}
      onClose={(_, reason) => {
        // Prevent closing by backdrop or escape key during processing
        if (dialogState !== 'processing' && reason !== 'backdropClick') {
          clearAllTimers();
          onClose();
        }
      }}
      fullWidth
      maxWidth="sm"
    >
      <DialogTitle>{dialogTitle}</DialogTitle>
      <DialogContent>
        {renderDialogContent()}
      </DialogContent>
      <DialogActions>
        {renderDialogActions()}
      </DialogActions>
    </Dialog>
  );
};

export default DepositDialog;

  
  