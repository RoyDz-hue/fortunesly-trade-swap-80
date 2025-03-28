
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { initiateWithdrawal } from "@/services/payHeroService";

interface WithdrawDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  maxAmount: number;
  onSuccess?: () => void;
}

const WithdrawDialog = ({ isOpen, onClose, currency, maxAmount, onSuccess }: WithdrawDialogProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    const parsedAmount = parseFloat(amount);
    
    if (!amount || !phoneNumber || isNaN(parsedAmount)) {
      toast({
        title: "Error",
        description: "Please enter all required fields with valid values",
        variant: "destructive",
      });
      return;
    }
    
    if (parsedAmount < 100) {
      toast({
        title: "Invalid amount",
        description: "Minimum withdrawal amount is KES 100",
        variant: "destructive",
      });
      return;
    }
    
    if (parsedAmount > maxAmount) {
      toast({
        title: "Insufficient balance",
        description: `Maximum available withdrawal is KES ${maxAmount}`,
        variant: "destructive",
      });
      return;
    }

    // Simple phone number validation for Kenya
    let formattedPhone = phoneNumber.trim();
    if (formattedPhone.startsWith('0')) {
      formattedPhone = `254${formattedPhone.substring(1)}`;
    } else if (!formattedPhone.startsWith('254')) {
      formattedPhone = `254${formattedPhone}`;
    }
    
    setIsLoading(true);
    
    try {
      const result = await initiateWithdrawal(
        parsedAmount,
        formattedPhone
      );
      
      if (result.status) {
        toast({
          title: "Withdrawal initiated",
          description: "Your withdrawal request has been processed.",
        });
        
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        toast({
          title: "Withdrawal failed",
          description: "Unable to process withdrawal. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Withdrawal error:", error);
      toast({
        title: "Withdrawal failed",
        description: "An error occurred while processing your withdrawal",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Only show for KES currency
  if (currency !== "KES") {
    return null;
  }

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Withdraw KES</DialogTitle>
          <DialogDescription>
            Enter the amount and phone number to withdraw via M-Pesa.
            Minimum withdrawal: KES 100
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                min="100"
                max={maxAmount}
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="col-span-3"
              />
              <div className="col-span-4 text-xs text-gray-500 text-right">
                Available: KES {maxAmount.toLocaleString()}
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="phone" className="text-right">
                Phone
              </Label>
              <Input
                id="phone"
                type="text"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value)}
                placeholder="e.g. 0712345678"
                className="col-span-3"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : "Withdraw"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default WithdrawDialog;
