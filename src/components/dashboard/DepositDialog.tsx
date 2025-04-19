import React, { useState, Suspense, useCallback, useMemo } from "react";
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

interface DepositDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
}

export default function DepositDialog({
  isOpen,
  onClose,
  onSuccess,
  onError,
}: DepositDialogProps) {
  const { user } = useAuth();
  const { initiatePayment, pollTransactionStatus } = usePayment();
  
  // Form state
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  
  // UI state
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Status handler with stable reference (won't change on re-renders)
  const handleStatusUpdate = useCallback((status: PaymentStatusResponse) => {
    if (!status.success) {
      setCurrentStatus("Error checking status");
      toast.error("Error checking deposit status");
      return;
    }

    // Use a map object for cleaner status handling
    const statusHandlers: Record<string, () => void> = {
      completed: () => {
        setShowSuccess(true);
        toast.success("Deposit completed successfully!", {
          description: `Amount: ${status.amount} KES`,
          duration: 5000,
          style: { background: "#22c55e", color: "#fff" },
        });
        setCurrentStatus("Deposit completed!");
        setTimeout(() => {
          setIsLoading(false);
          setShowSuccess(false);
          onSuccess?.();
          resetForm();
          onClose();
        }, 2000);
      },
      failed: () => {
        toast.error(status.error || "Deposit failed");
        setCurrentStatus("Deposit failed");
        setTimeout(() => {
          setIsLoading(false);
          onError?.(new Error(status.error || "Deposit failed"));
          resetForm();
          onClose();
        }, 2000);
      },
      canceled: () => {
        toast.error("Deposit was canceled");
        setCurrentStatus("Deposit canceled");
        setTimeout(() => {
          setIsLoading(false);
          onError?.(new Error("Deposit was canceled"));
          resetForm();
          onClose();
        }, 2000);
      },
      pending: () => setCurrentStatus("Processing deposit..."),
      queued: () => setCurrentStatus("Deposit is queued..."),
    };

    // Execute the handler if it exists, or set generic status
    const handler = statusHandlers[status.status || ""];
    if (handler) {
      handler();
    } else {
      setCurrentStatus(`Status: ${status.status}`);
    }
  }, [onSuccess, onError, onClose]);

  // Form reset function
  const resetForm = useCallback(() => {
    setAmount("");
    setPhoneNumber("");
    setCurrentStatus("");
    setIsLoading(false);
    setShowSuccess(false);
  }, []);

  // Form validation
  const isFormValid = useMemo(() => 
    !!amount && 
    Number(amount) > 0 && 
    !!phoneNumber && 
    phoneNumber.length >= 9, 
  [amount, phoneNumber]);

  // Handle deposit action
  const handleDeposit = useCallback(async () => {
    if (!user) {
      toast.error("Please sign in to make a deposit");
      return;
    }

    if (!isFormValid) {
      if (!amount || Number(amount) <= 0) {
        toast.error("Please enter a valid amount");
      } else {
        toast.error("Please enter a valid phone number");
      }
      return;
    }

    try {
      setIsLoading(true);
      setCurrentStatus("Initiating deposit...");

      const response = await initiatePayment(user, Number(amount), phoneNumber, "deposit");

      if (!response.success || !response.reference) {
        throw new Error(response.error || "Failed to initiate deposit");
      }

      setCurrentStatus("Deposit initiated. Processing...");

      await pollTransactionStatus(response.reference, { 
        onStatusUpdate: handleStatusUpdate 
      });
    } catch (error: any) {
      console.error("Deposit error:", error);
      setIsLoading(false);
      setCurrentStatus("");
      toast.error(error.message || "Failed to process deposit");
      onError?.(error);
    }
  }, [user, isFormValid, amount, phoneNumber, initiatePayment, pollTransactionStatus, handleStatusUpdate, onError]);

  // Handle dialog close
  const handleClose = useCallback(() => {
    if (isLoading && currentStatus !== "Deposit completed!") {
      toast.promise(
        new Promise<void>((resolve, reject) => {
          if (window.confirm("Are you sure you want to close? The deposit might still be processing.")) {
            resetForm();
            resolve();
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
        <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin mx-auto" />}>
          <DialogHeader>
            <DialogTitle>Deposit Funds</DialogTitle>
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
              />
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
                <p>Deposit completed successfully!</p>
              </div>
            )}
          </div>
          <Button className="w-full" onClick={handleDeposit} disabled={isLoading}>
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Processing...
              </>
            ) : (
              'Deposit'
            )}
          </Button>
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}