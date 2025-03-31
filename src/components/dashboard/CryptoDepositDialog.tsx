
import { useState } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Coin } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface CryptoDepositDialogProps {
  isOpen: boolean;
  onClose: () => void;
  coin: Coin;
  onSuccess?: () => void;
}

const CryptoDepositDialog = ({ isOpen, onClose, coin, onSuccess }: CryptoDepositDialogProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [proofFile, setProofFile] = useState<File | null>(null);
  const [amount, setAmount] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!amount || !proofFile || !user) {
      toast({
        title: "Missing information",
        description: "Please enter the amount and upload a proof of transaction",
        variant: "destructive",
      });
      return;
    }
    
    setIsLoading(true);
    
    try {
      // Step 1: Upload proof image to Supabase Storage
      const fileExt = proofFile.name.split('.').pop();
      const fileName = `${user.id}/${Date.now()}.${fileExt}`;
      const filePath = `transaction-proofs/${fileName}`;
      
      // Create transaction-proofs bucket if it doesn't exist (in production this would be done during initial setup)
      const { error: bucketError } = await supabase.storage.getBucket('transaction-proofs');
      if (bucketError && bucketError.message.includes('does not exist')) {
        await supabase.storage.createBucket('transaction-proofs', { public: false });
      }
      
      // Upload the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('transaction-proofs')
        .upload(filePath, proofFile, {
          cacheControl: '3600',
          upsert: false,
        });
      
      if (uploadError) throw uploadError;
      
      // Get a URL for the uploaded proof
      const { data: urlData } = await supabase.storage
        .from('transaction-proofs')
        .createSignedUrl(filePath, 60 * 60 * 24 * 7); // 7 days expiry
      
      const proofUrl = urlData?.signedUrl || '';
      
      // Step 2: Create transaction record
      const { data: txnData, error: txnError } = await supabase
        .from('transactions')
        .insert({
          user_id: user.id,
          type: 'deposit',
          currency: coin.symbol,
          amount: parseFloat(amount),
          status: 'pending',
          proof: proofUrl
        })
        .select()
        .single();
        
      if (txnError) throw txnError;
      
      toast({
        title: "Deposit request submitted",
        description: `Your ${coin.symbol} deposit request has been submitted for approval.`,
      });
      
      if (onSuccess) {
        onSuccess();
      }
      onClose();
      setAmount("");
      setProofFile(null);
    } catch (error) {
      console.error("Deposit error:", error);
      toast({
        title: "Request failed",
        description: "An error occurred while submitting your deposit request",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
      setUploadProgress(0);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Deposit {coin.symbol}</DialogTitle>
          <DialogDescription>
            Send {coin.symbol} to the address below and upload proof to complete your deposit.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit}>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="depositAddress" className="text-right">
                Address
              </Label>
              <div className="col-span-3">
                <div className="flex items-center">
                  <Input
                    id="depositAddress"
                    value={coin.depositAddress || "Address will be loaded from database"}
                    readOnly
                    className="font-mono text-xs"
                  />
                  <Button 
                    type="button" 
                    variant="outline" 
                    size="sm" 
                    className="ml-2"
                    onClick={() => {
                      if (coin.depositAddress) {
                        navigator.clipboard.writeText(coin.depositAddress);
                        toast({
                          title: "Copied to clipboard",
                          description: "Deposit address copied to clipboard",
                        });
                      }
                    }}
                  >
                    Copy
                  </Button>
                </div>
              </div>
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                min="0.00000001"
                step="0.00000001"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder={`Enter ${coin.symbol} amount`}
                className="col-span-3"
              />
            </div>
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="proof" className="text-right">
                Proof
              </Label>
              <div className="col-span-3">
                <Input
                  id="proof"
                  type="file"
                  accept="image/*"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setProofFile(e.target.files[0]);
                    }
                  }}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a screenshot of your transaction as proof
                </p>
              </div>
            </div>
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="col-span-4">
                <div className="w-full bg-gray-200 rounded-full h-2.5">
                  <div 
                    className="bg-fortunesly-primary h-2.5 rounded-full" 
                    style={{ width: `${uploadProgress}%` }}
                  ></div>
                </div>
                <p className="text-xs text-gray-500 text-center mt-1">
                  Uploading: {uploadProgress}%
                </p>
              </div>
            )}
          </div>
          <DialogFooter>
            <Button type="button" variant="outline" onClick={onClose}>
              Cancel
            </Button>
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Processing..." : "Submit Deposit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CryptoDepositDialog;
