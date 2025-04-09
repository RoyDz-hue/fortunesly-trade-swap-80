import { useState, useEffect } from "react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { Coin } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { AlertCircle, Clock } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";

interface CryptoDepositDialogProps {
  isOpen: boolean;
  onClose: () => void;
  coin: Coin;
  onSuccess?: () => void;
}

// Function to get trusted time from server or cache
async function getTrustedTime() {
  let cacheKey = "serverTimeCache"; // Unique key
  let lastFetchKey = "lastFetchTime";

  let cachedTime = localStorage.getItem(cacheKey);
  let lastFetch = localStorage.getItem(lastFetchKey);

  if (cachedTime && lastFetch) {
    let browserTimeNow = Date.now();
    let timeDiff = Math.abs(browserTimeNow - parseInt(cachedTime));

    // If time drift is reasonable (less than 5 min), trust cache
    if (timeDiff < 5 * 60 * 1000) {
      console.log("Using cached trusted time:", new Date(parseInt(cachedTime)));
      return new Date(parseInt(cachedTime));
    }
  }

  // Fetch new time from API if cache is unreliable
  try {
    let response = await fetch('http://worldtimeapi.org/api/ip');
    let data = await response.json();
    let serverTime = new Date(data.utc_datetime).getTime();

    // Store new time in localStorage
    localStorage.setItem(cacheKey, serverTime.toString());
    localStorage.setItem(lastFetchKey, Date.now().toString());

    console.log("Fetched new trusted time:", new Date(serverTime));
    return new Date(serverTime);
  } catch (error) {
    console.error("Error fetching time:", error);
    return new Date(); // Fallback to system time if API fails
  }
}

// Function to check if current time is within deposit window (7 AM to 10 PM)
function isWithinDepositHours(date: Date): boolean {
  const hours = date.getHours();
  return hours >= 7 && hours < 22; // 7 AM to 10 PM (22:00)
}

// Function to get next deposit window time
function getNextDepositWindowTime(currentDate: Date): Date {
  const nextWindow = new Date(currentDate);
  const currentHours = currentDate.getHours();
  
  if (currentHours >= 22) {
    // If it's past 10 PM, next window is at 7 AM tomorrow
    nextWindow.setDate(nextWindow.getDate() + 1);
    nextWindow.setHours(7, 0, 0, 0);
  } else {
    // If it's before 7 AM, next window is at 7 AM today
    nextWindow.setHours(7, 0, 0, 0);
  }
  
  return nextWindow;
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
  const [isDepositTime, setIsDepositTime] = useState(false);
  const [currentTime, setCurrentTime] = useState<Date | null>(null);
  const [nextDepositTime, setNextDepositTime] = useState<string>("");
  const [depositWindowHours, setDepositWindowHours] = useState<string>("");

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
      setDepositWindowHours("7:00 AM - 10:00 PM");

      // Check if current time is within deposit window
      checkDepositTime();
    }
  }, [isOpen]);

  // Check if current time is within deposit window
  const checkDepositTime = async () => {
    const trustedTime = await getTrustedTime();
    setCurrentTime(trustedTime);

    // Check if time is within deposit window (7 AM to 10 PM)
    const withinWindow = isWithinDepositHours(trustedTime);
    setIsDepositTime(withinWindow);

    if (!withinWindow) {
      // Calculate next deposit time
      const nextWindow = getNextDepositWindowTime(trustedTime);
      
      // Format for display
      setNextDepositTime(
        nextWindow.toLocaleTimeString([], { 
          hour: '2-digit', 
          minute: '2-digit',
          hour12: true 
        }) + " " + nextWindow.toLocaleDateString()
      );
    }
  };

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

    // First verify deposit time again
    const trustedTime = await getTrustedTime();
    
    if (!isWithinDepositHours(trustedTime)) {
      toast({
        title: "Deposit not allowed",
        description: `Deposits are only allowed between ${depositWindowHours}. Next window: ${nextDepositTime}`,
        variant: "destructive",
      });
      return;
    }

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
      const fileName = `${user.id}-${Date.now()}.${fileExt}`;
      const filePath = `${fileName}`;

      console.log("Starting file upload to path:", filePath);

      // Upload the file with public access
      setUploadProgress(25);
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('transaction-proofs')
        .upload(filePath, proofFile, {
          cacheControl: '3600',
          upsert: true
        });

      if (uploadError) {
        console.error("Upload error:", uploadError);
        setUploadError(`Failed to upload proof: ${uploadError.message}`);
        setIsLoading(false);
        return;
      }

      console.log("File uploaded successfully:", uploadData);
      setUploadProgress(75);

      // Get a public URL for the file
      const { data: publicUrlData } = supabase.storage
        .from('transaction-proofs')
        .getPublicUrl(filePath);

      const proofUrl = publicUrlData?.publicUrl || '';
      console.log("Generated public URL:", proofUrl);

      if (!proofUrl) {
        setUploadError("Failed to generate public URL for the uploaded file");
        setIsLoading(false);
        return;
      }

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
        setIsLoading(false);
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
            Deposits are only processed between 7:00 AM and 10:00 PM local time.
          </DialogDescription>
        </DialogHeader>

        {!isDepositTime && (
          <Alert className="bg-amber-50 border-amber-200">
            <Clock className="h-4 w-4 text-amber-800" />
            <AlertDescription className="text-amber-800">
              <p>Deposits are currently closed. The next deposit window opens at:</p>
              <p className="font-semibold">{nextDepositTime}</p>
              <p className="text-xs mt-1">Current time: {currentTime?.toLocaleTimeString()}</p>
            </AlertDescription>
          </Alert>
        )}

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
                disabled={!isDepositTime}
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
                  disabled={!isDepositTime}
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
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.onerror = null;
                      target.src = '/placeholder.svg';
                    }}
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
            <Button type="submit" disabled={isLoading || !isDepositTime}>
              {isLoading ? "Processing..." : "Submit Deposit"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
};

export default CryptoDepositDialog;