import React, { useState, useCallback, useMemo } from "react";
import { toast } from "sonner";
import { usePayment } from "@/services/payHeroService";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Loader2 } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import type { PaymentStatusResponse } from "@/services/payHeroService";

interface WithdrawDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  maxAmount?: number;
}

// Predefined status messages for consistency
const STATUS_MESSAGES = {
  INITIAL: "",
  INITIATING: "Initiating withdrawal...",
  PROCESSING: "Processing withdrawal...",
  QUEUED: "Withdrawal is queued...",
  COMPLETED: "Withdrawal completed!",
  FAILED: "Withdrawal failed",
  CANCELED: "Withdrawal canceled",
  CHECK_ERROR: "Error checking status",
};

export default function WithdrawDialog({
  isOpen,
  onClose,
  onSuccess,
  onError,
  maxAmount,
}: WithdrawDialogProps) {
  const { user } = useAuth();
  const { initiatePayment, pollTransactionStatus } = usePayment();
  
  // Form state
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>(STATUS_MESSAGES.INITIAL);
  const [showSuccess, setShowSuccess] = useState(false);

  // Memoize validation functions to avoid recreating on each render
  const validators = useMemo(() => ({
    amount: (value: string) => {
      const numValue = Number(value);
      if (!value || numValue <= 0) return "Please enter a valid amount";
      if (maxAmount && numValue > maxAmount) return `Maximum withdrawal amount is ${maxAmount} KES`;
      return null;
    },
    phoneNumber: (value: string) => {
      if (!value || value.length < 9) return "Please enter a valid phone number";
      return null;
    },
    user: () => {
      if (!user) return "Please sign in to make a withdrawal";
      return null;
    }
  }), [maxAmount, user]);

  // Use callback to prevent recreating function on each render
  const handleStatusUpdate = useCallback((status: PaymentStatusResponse) => {
    if (!status.success) {
      setCurrentStatus(STATUS_MESSAGES.CHECK_ERROR);
      toast.error("Error checking withdrawal status");
      return;
    }

    switch (status.status) {
      case "completed":
        setShowSuccess(true);
        toast.success("Withdrawal completed successfully!", {
          description: `Amount: ${status.amount} KES`,
          duration: 5000,
          style: { background: "#22c55e", color: "#fff" },
        });
        setCurrentStatus(STATUS_MESSAGES.COMPLETED);
        
        // Use timeout to allow visual feedback to complete
        setTimeout(() => {
          setIsLoading(false);
          setShowSuccess(false);
          onSuccess?.();
          resetForm();
          onClose();
        }, 2000);
        break;
        
      case "failed":
        const failError = new Error(status.error || STATUS_MESSAGES.FAILED);
        toast.error(status.error || STATUS_MESSAGES.FAILED);
        setCurrentStatus(STATUS_MESSAGES.FAILED);
        
        setTimeout(() => {
          setIsLoading(false);
          onError?.(failError);
          resetForm();
          onClose();
        }, 2000);
        break;
        
      case "canceled":
        const cancelError = new Error("Withdrawal was canceled");
        toast.error("Withdrawal was canceled");
        setCurrentStatus(STATUS_MESSAGES.CANCELED);
        
        setTimeout(() => {
          setIsLoading(false);
          onError?.(cancelError);
          resetForm();
          onClose();
        }, 2000);
        break;
        
      case "pending":
        setCurrentStatus(STATUS_MESSAGES.PROCESSING);
        break;
        
      case "queued":
        setCurrentStatus(STATUS_MESSAGES.QUEUED);
        break;
        
      default:
        setCurrentStatus(`Status: ${status.status}`);
    }
  }, [onSuccess, onError, onClose]);

  const handleWithdraw = async () => {
    // Validate all inputs before proceeding
    const userError = validators.user();
    if (userError) {
      toast.error(userError);
      return;
    }
    
    const amountError = validators.amount(amount);
    if (amountError) {
      toast.error(amountError);
      return;
    }
    
    const phoneError = validators.phoneNumber(phoneNumber);
    if (phoneError) {
      toast.error(phoneError);
      return;
    }

    try {
      setIsLoading(true);
      setCurrentStatus(STATUS_MESSAGES.INITIATING);

      const response = await initiatePayment(user!, Number(amount), phoneNumber, "withdrawal");

      if (!response.success || !response.reference) {
        throw new Error(response.error || "Failed to initiate withdrawal");
      }

      setCurrentStatus(STATUS_MESSAGES.PROCESSING);

      await pollTransactionStatus(response.reference, { onStatusUpdate: handleStatusUpdate });
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      setIsLoading(false);
      setCurrentStatus(STATUS_MESSAGES.INITIAL);
      toast.error(error.message || "Failed to process withdrawal");
      onError?.(error);
    }
  };

  const resetForm = useCallback(() => {
    setAmount("");
    setPhoneNumber("");
    setCurrentStatus(STATUS_MESSAGES.INITIAL);
    setIsLoading(false);
    setShowSuccess(false);
  }, []);

  const handleClose = useCallback(() => {
    if (isLoading && currentStatus !== STATUS_MESSAGES.COMPLETED) {
      toast.promise(
        new Promise((resolve, reject) => {
          if (window.confirm("Are you sure you want to close? The withdrawal might still be processing.")) {
            resolve(resetForm());
          } else {
            reject();
          }
        }),
        {
          loading: 'Checking...',
          success: 'Dialog closed',
          error: 'Closing cancelled',
        }
      );
    } else {
      resetForm();
      onClose();
    }
  }, [isLoading, currentStatus, resetForm, onClose]);

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw Funds</DialogTitle>
        </DialogHeader>
        <div className="grid gap-4 py-4">
          <div className="grid gap-2">
            <Label htmlFor="amount">Amount (KES)</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              disabled={isLoading}
              max={maxAmount}
            />
            {maxAmount && (
              <p className="text-sm text-muted-foreground">
                Maximum: {maxAmount.toLocaleString()} KES
              </p>
            )}
          </div>
          <div className="grid gap-2">
            <Label htmlFor="phone">Phone Number</Label>
            <Input
              id="phone"
              type="tel"
              placeholder="Enter M-Pesa number"
              value={phoneNumber}
              onChange={(e) => setPhoneNumber(e.target.value)}
              disabled={isLoading}
            />
          </div>
          {currentStatus && (
            <div className="text-sm text-muted-foreground">{currentStatus}</div>
          )}
          {showSuccess && (
            <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 rounded">
              <p className="font-bold">Success</p>
              <p>Withdrawal completed successfully!</p>
            </div>
          )}
        </div>
        <Button className="w-full" onClick={handleWithdraw} disabled={isLoading}>
          {isLoading ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Processing...
            </>
          ) : (
            'Withdraw'
          )}
        </Button>
      </DialogContent>
    </Dialog>
  );
}