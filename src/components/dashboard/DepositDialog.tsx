
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { initiateDeposit } from "@/services/payHeroService";

interface DepositDialogProps {
  isOpen: boolean;
  onClose: () => void;
  currency: string;
  onSuccess?: () => void;
}

const DepositDialog = ({ isOpen, onClose, currency, onSuccess }: DepositDialogProps) => {
  const { toast } = useToast();
  const [amount, setAmount] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !phoneNumber) {
      toast({
        title: "Error",
        description: "Please enter all required fields",
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
      const result = await initiateDeposit(
        parseFloat(amount),
        formattedPhone,
        "Fortunesly User" // In a real app, you'd use the actual user's name
      );
      
      if (result.status) {
        toast({
          title: "Payment initiated",
          description: "Please check your phone to complete the payment",
        });
        
        if (onSuccess) {
          onSuccess();
        }
        onClose();
      } else {
        toast({
          title: "Payment failed",
          description: "Unable to initiate payment. Please try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Deposit error:", error);
      toast({
        title: "Payment failed",
        description: "An error occurred while processing your payment",
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
          <DialogTitle>Deposit KES</DialogTitle>
          <DialogDescription>
            Enter the amount and phone number to deposit via M-Pesa.
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
                min="10"
                step="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="Enter amount"
                className="col-span-3"
              />
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
              {isLoading ? "Processing..." : "Deposit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default DepositDialog;
