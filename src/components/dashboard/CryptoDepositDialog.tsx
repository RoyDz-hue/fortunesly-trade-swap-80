
import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Coin } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

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
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);

  // Clean up preview URL when dialog closes or component unmounts
  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  // Reset state when dialog opens
  useEffect(() => {
    if (isOpen) {
      setProofFile(null);
      setAmount("");
      setUploadProgress(0);
      setUploadError(null);
      setPreviewUrl(null);
    }
  }, [isOpen]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      setProofFile(file);
      
      // Generate a preview for the image
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
      
      // Clear any previous upload errors
      setUploadError(null);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setUploadError(null);
    
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
      
      console.log("Starting file upload to path:", filePath);
      
      // Upload the file
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('transaction-proofs')
        .upload(filePath, proofFile, {
          cacheControl: '3600',
          upsert: true, // Changed to true to overwrite if needed
        });
      
      if (uploadError) {
        console.error("Upload error:", uploadError);
        setUploadError(`Failed to upload proof: ${uploadError.message}`);
        return;
      }
      
      console.log("File uploaded successfully:", uploadData);
      setUploadProgress(50);
      
      // First, make the file publicly accessible
      const { data: updateData, error: updateError } = await supabase.storage
        .from('transaction-proofs')
        .update(filePath, proofFile, {
          cacheControl: '3600',
          upsert: true,
        });
        
      if (updateError) {
        console.error("File update error:", updateError);
        setUploadError(`Failed to update file permissions: ${updateError.message}`);
        return;
      }
      
      // Get a public URL for the file
      const { data: publicUrlData } = supabase.storage
        .from('transaction-proofs')
        .getPublicUrl(filePath);
        
      const proofUrl = publicUrlData?.publicUrl || '';
      console.log("Generated public URL:", proofUrl);
      
      setUploadProgress(75);
      
      // Step 2: Create transaction record using the public URL
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
        
      if (txnError) {
        console.error("Transaction creation error:", txnError);
        setUploadError(`Failed to create transaction: ${txnError.message}`);
        return;
      }
      
      console.log("Transaction created successfully:", txnData);
      setUploadProgress(100);
      
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
      setUploadError(
        typeof error === 'object' && error !== null && 'message' in error 
          ? `Error: ${(error as Error).message}` 
          : "An unexpected error occurred while submitting your deposit request"
      );
    } finally {
      setIsLoading(false);
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
                  onChange={handleFileChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Upload a screenshot of your transaction as proof
                </p>
              </div>
            </div>
            
            {/* Preview of uploaded image */}
            {previewUrl && (
              <div className="col-span-4">
                <div className="mt-2 border rounded overflow-hidden max-h-48">
                  <img 
                    src={previewUrl} 
                    alt="Proof preview" 
                    className="w-full object-contain"
                  />
                </div>
              </div>
            )}
            
            {uploadError && (
              <div className="col-span-4">
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{uploadError}</AlertDescription>
                </Alert>
              </div>
            )}
            
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
