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

// Define props for the WithdrawDialog component

interface WithdrawDialogProps {

  open: boolean;

  onClose: () => void;

  onSuccess?: (amount: number) => void;

  maxAmount?: number; // Maximum amount user can withdraw

}

// Define possible states for the dialog

type DialogState = 

  'initial' | 

  'processing' | 

  'pending' | 

  'delayed' | 

  'completed' | 

  'failed' | 

  'canceled';

const WithdrawDialog: React.FC<WithdrawDialogProps> = ({ 

  open, 

  onClose, 

  onSuccess,

  maxAmount

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

      

      // Check if amount exceeds maximum allowed

      if (maxAmount !== undefined && parseFloat(amount) > maxAmount) {

        setError(`Withdrawal amount cannot exceed your available balance of ${maxAmount} KES`);

        return;

      }

      

      if (!phoneNumber || phoneNumber.length < 9) {

        setError('Please enter a valid phone number');

        return;

      }

      

      if (!user) {

        setError('You must be logged in to make a withdrawal');

        return;

      }

      

      // Clear error and set state to processing

      setError('');

      setDialogState('processing');

      setStatusMessage('Initiating withdrawal...');

      

      // Initiate withdrawal

      const response = await initiatePayment(

        user,

        parseFloat(amount),

        phoneNumber,

        'withdrawal'

      );

      

      if (!response.success) {

        setError(response.error || 'Failed to initiate withdrawal');

        setDialogState('initial');

        return;

      }

      

      // Store reference for status checks

      setReference(response.reference || '');

      

      // Update dialog state to pending

      setDialogState('pending');

      setStatusMessage('Withdrawal request is being processed. This may take a few minutes.');

      

      // Start polling for status

      startPolling(response.reference || '');

      

      // Set a delayed timer to handle long processing times

      timeouts.current.delayedTimer = setTimeout(() => {

        if (dialogState !== 'completed' && dialogState !== 'failed' && dialogState !== 'canceled') {

          setDialogState('delayed');

          setStatusMessage('Withdrawal is taking longer than expected. Please wait...');

          

          // After 60 seconds total, close dialog with "still processing" message

          timeouts.current.closeTimer = setTimeout(() => {

            setStatusMessage('Withdrawal is still processing. We\'ll notify you when it\'s complete.');

            

            // Close dialog after showing the message for 3 seconds

            timeouts.current.closeTimer = setTimeout(() => {

              onClose();

            }, 3000);

          }, 30000); // 30 more seconds after "delayed" state (total 60 seconds)

        }

      }, 30000); // 30 seconds initial delay

      

    } catch (error) {

      console.error('Withdrawal error:', error);

      setError(error.message || 'An error occurred while processing your withdrawal');

      setDialogState('initial');

    }

  };

  

  // Start polling for withdrawal status

  const startPolling = (ref: string) => {

    // Clear any existing interval

    if (timeouts.current.pollingInterval) {

      clearInterval(timeouts.current.pollingInterval);

    }

    

    // Start polling every 5 seconds

    timeouts.current.pollingInterval = setInterval(async () => {

      try {

        // Check withdrawal status

        const statusResponse = await checkPaymentStatus(ref);

        

        if (!statusResponse.success) {

          console.error('Status check failed:', statusResponse.error);

          return;

        }

        

        // Handle status changes

        if (statusResponse.status === 'completed') {

          handleWithdrawalCompleted(statusResponse.amount || 0);

        } else if (statusResponse.status === 'failed') {

          handleWithdrawalFailed('Withdrawal failed. Please try again.');

        } else if (statusResponse.status === 'canceled') {

          handleWithdrawalFailed('Withdrawal was canceled.');

        }

        

      } catch (error) {

        console.error('Status polling error:', error);

      }

    }, 5000);

  };

  

  // Handle completed withdrawal

  const handleWithdrawalCompleted = (completedAmount: number) => {

    // Clear all timers

    clearAllTimers();

    

    // Update dialog state

    setDialogState('completed');

    setStatusMessage(`Withdrawal of ${completedAmount} KES completed successfully! Funds should arrive in your M-Pesa account shortly.`);

    

    // Notify parent component

    if (onSuccess) {

      onSuccess(completedAmount);

    }

    

    // Close dialog after 3 seconds

    timeouts.current.closeTimer = setTimeout(() => {

      onClose();

    }, 3000);

  };

  

  // Handle failed withdrawal

  const handleWithdrawalFailed = (message: string) => {

    // Clear all timers

    clearAllTimers();

    

    // Update dialog state

    setDialogState('failed');

    setStatusMessage(message);

    

    // Close dialog after 3 seconds

    timeouts.current.closeTimer = setTimeout(() => {

      onClose();

    }, 3000);

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

              helperText={maxAmount !== undefined ? `Available balance: ${maxAmount} KES` : ''}

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

            <Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>

              Withdrawals typically process within minutes but may take longer during peak hours.

            </Typography>

          </>

        );

      

      case 'processing':

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

            Withdraw

          </Button>

        </>

      );

    }

    

    if (dialogState === 'processing' || dialogState === 'pending' || dialogState === 'delayed') {

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

      <DialogTitle>Withdraw Funds</DialogTitle>

      <DialogContent>

        {renderDialogContent()}

      </DialogContent>

      <DialogActions>

        {renderDialogActions()}

      </DialogActions>

    </Dialog>

  );

};

export default WithdrawDialog;