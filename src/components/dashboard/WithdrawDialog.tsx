import React, { useState, lazy, Suspense } from "react";
import { toast } from "sonner";
import { usePayment } from "@/services/payHeroService"; // Updated import
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

// Lazy-loaded success alert component
const SuccessAlert = lazy(() => import("@/components/ui/SuccessAlert"));

interface WithdrawDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  onError?: (error: Error) => void;
  maxAmount?: number;
}

export default function WithdrawDialog({
  isOpen,
  onClose,
  onSuccess,
  onError,
  maxAmount,
}: WithdrawDialogProps) {
  const { user } = useAuth();
  const { initiatePayment, pollTransactionStatus } = usePayment(); // Use hook
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleStatusUpdate = (status: import("@/services/payment").PaymentStatusResponse) => {
    if (!status.success) {
      setCurrentStatus("Error checking status");
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
        setCurrentStatus("Withdrawal completed!");
        setTimeout(() => {
          setIsLoading(false);
          setShowSuccess(false);
          onSuccess?.();
          handleClose();
        }, 2000);
        break;
      case "failed":
        toast.error(status.error || "Withdrawal failed");
        setCurrentStatus("Withdrawal failed");
        setTimeout(() => {
          setIsLoading(false);
          onError?.(new Error(status.error || "Withdrawal failed"));
          handleClose();
        }, 2000);
        break;
      case "canceled":
        toast.error("Withdrawal was canceled");
        setCurrentStatus("Withdrawal canceled");
        setTimeout(() => {
          setIsLoading(false);
          onError?.(new Error("Withdrawal was canceled"));
          handleClose();
        }, 2000);
        break;
      case "pending":
        setCurrentStatus("Processing withdrawal...");
        break;
      case "queued":
        setCurrentStatus("Withdrawal is queued...");
        break;
      default:
        setCurrentStatus(`Status: ${status.status}`);
    }
  };

  const handleWithdraw = async () => {
    if (!user) {
      toast.error("Please sign in to make a withdrawal");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (maxAmount && Number(amount) > maxAmount) {
      toast.error(`Maximum withdrawal amount is ${maxAmount} KES`);
      return;
    }

    if (!phoneNumber || phoneNumber.length < 9) {
      toast.error("Please enter a valid phone number");
      return;
    }

    try {
      setIsLoading(true);
      setCurrentStatus("Initiating withdrawal...");

      const response = await initiatePayment(user, Number(amount), phoneNumber, "withdrawal");

      if (!response.success || !response.reference) {
        throw new Error(response.error || "Failed to initiate withdrawal");
      }

      setCurrentStatus("Withdrawal initiated. Processing...");

      await pollTransactionStatus(response.reference, { onStatusUpdate: handleStatusUpdate });
    } catch (error: any) {
      console.error("Withdrawal error:", error);
      setIsLoading(false);
      setCurrentStatus("");
      toast.error(error.message || "Failed to process withdrawal");
      onError?.(error);
    }
  };

  const handleClose = () => {
    if (isLoading && currentStatus !== "Withdrawal completed!") {
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
    }
  };

  const resetForm = () => {
    setAmount("");
    setPhoneNumber("");
    setCurrentStatus("");
    setIsLoading(false);
    setShowSuccess(false);
    onClose();
  };

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && handleClose()}>
      <DialogContent className="sm:max-w-[425px]">
        <Suspense fallback={<Loader2 className="h-6 w-6 animate-spin mx-auto" />}>
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
              <Suspense fallback={<Loader2 className="h-4 w-4 animate-spin" />}>
                <SuccessAlert message="Withdrawal completed successfully!" />
              </Suspense>
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
        </Suspense>
      </DialogContent>
    </Dialog>
  );
}