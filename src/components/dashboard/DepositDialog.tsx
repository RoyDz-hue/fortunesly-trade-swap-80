import React, { useState, Suspense } from "react";
import { toast } from "sonner";
import { usePayment } from "@/services/payHeroService"; // Updated to payHeroService
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
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [showSuccess, setShowSuccess] = useState(false);

  const handleStatusUpdate = (status: import("@/services/payHeroService").PaymentStatusResponse) => {
    if (!status.success) {
      setCurrentStatus("Error checking status");
      toast.error("Error checking deposit status");
      return;
    }

    switch (status.status) {
      case "completed":
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
          handleClose();
        }, 2000);
        break;
      case "failed":
        toast.error(status.error || "Deposit failed");
        setCurrentStatus("Deposit failed");
        setTimeout(() => {
          setIsLoading(false);
          onError?.(new Error(status.error || "Deposit failed"));
          handleClose();
        }, 2000);
        break;
      case "canceled":
        toast.error("Deposit was canceled");
        setCurrentStatus("Deposit canceled");
        setTimeout(() => {
          setIsLoading(false);
          onError?.(new Error("Deposit was canceled"));
          handleClose();
        }, 2000);
        break;
      case "pending":
        setCurrentStatus("Processing deposit...");
        break;
      case "queued":
        setCurrentStatus("Deposit is queued...");
        break;
      default:
        setCurrentStatus(`Status: ${status.status}`);
    }
  };

  const handleDeposit = async () => {
    if (!user) {
      toast.error("Please sign in to make a deposit");
      return;
    }

    if (!amount || Number(amount) <= 0) {
      toast.error("Please enter a valid amount");
      return;
    }

    if (!phoneNumber || phoneNumber.length < 9) {
      toast.error("Please enter a valid phone number");
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

      await pollTransactionStatus(response.reference, { onStatusUpdate: handleStatusUpdate });
    } catch (error: any) {
      console.error("Deposit error:", error);
      setIsLoading(false);
      setCurrentStatus("");
      toast.error(error.message || "Failed to process deposit");
      onError?.(error);
    }
  };

  const handleClose = () => {
    if (isLoading && currentStatus !== "Deposit completed!") {
      toast.promise(
        new Promise((resolve, reject) => {
          if (window.confirm("Are you sure you want to close? The deposit might still be processing.")) {
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