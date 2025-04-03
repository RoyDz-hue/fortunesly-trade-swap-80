import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, CheckCircle2, XCircle, Image, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import { updateUserCryptoBalance } from "@/utils/walletUtils";

interface CryptoDepositRequest {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: string;
  created_at: string;
  proof: string;
  username?: string;
}

const ApproveCryptoDeposits = () => {
  const { toast } = useToast();
  const [deposits, setDeposits] = useState<CryptoDepositRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState<string | null>(null);
  const [processingId, setProcessingId] = useState<string | null>(null);

  // Fetch deposits and set up real-time updates
  useEffect(() => {
    fetchDeposits();
    
    const channel = supabase
      .channel("admin-deposits")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, fetchDeposits)
      .subscribe();

    return () => supabase.removeChannel(channel);
  }, []);

  // Fetch crypto deposit transactions with user info
  const fetchDeposits = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, users(username)")
        .eq("type", "deposit")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Map to interface
      setDeposits(data.map(item => ({
        id: item.id,
        user_id: item.user_id,
        amount: item.amount,
        currency: item.currency,
        status: item.status,
        created_at: item.created_at,
        proof: item.proof,
        username: item.users?.username
      })));
    } catch (error) {
      console.error("Error fetching deposits:", error);
      toast({
        title: "Failed to load deposit requests",
        description: "There was an error fetching the pending deposits",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // Process deposit approval
  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      // Start a Supabase transaction
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .select("*, users(id, balance_crypto)")
        .eq("id", id)
        .single();

      if (txError) throw txError;
      if (!transaction) throw new Error("Transaction not found");

      // Check if already approved
      if (transaction.status === "approved") {
        throw new Error("Transaction already approved");
      }

      // Update the user's crypto balance first
      const { success: balanceUpdateSuccess, error: balanceError } = await updateUserCryptoBalance(
        transaction.user_id,
        transaction.currency,
        transaction.amount
      );

      if (!balanceUpdateSuccess || balanceError) {
        throw new Error(balanceError || "Failed to update balance");
      }

      // If balance update was successful, update transaction status
      const { error: statusError } = await supabase
        .from("transactions")
        .update({ 
          status: "approved",
          updated_at: new Date().toISOString()
        })
        .eq("id", id);

      if (statusError) throw statusError;

      toast({
        title: "Deposit approved successfully",
        description: `${transaction.amount} ${transaction.currency} has been credited to the user's wallet`,
      });

      // Refresh the deposits list
      fetchDeposits();

    } catch (error: any) {
      console.error("Error approving deposit:", error);
      toast({
        title: "Failed to approve deposit",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Process deposit rejection
  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
      // Get transaction details
      const { data: tx, error: txError } = await supabase
        .from("transactions")
        .select("user_id, currency, amount")
        .eq("id", id)
        .single();

      if (txError) throw txError;

      // Update transaction status
      const { error } = await supabase
        .from("transactions")
        .update({ status: "rejected" })
        .eq("id", id);

      if (error) throw error;

      toast({
        title: "Deposit rejected",
        description: "The crypto deposit has been rejected",
      });

      fetchDeposits();
    } catch (error: any) {
      console.error("Error rejecting deposit:", error);
      toast({
        title: "Failed to reject deposit",
        description: error.message || "There was an unexpected error",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  // Helper function to render status badge with appropriate styling
  const renderStatusBadge = (status) => {
    const styles = {
      pending: "bg-yellow-50 text-yellow-800 border-yellow-200",
      approved: "bg-green-50 text-green-800 border-green-200",
      rejected: "bg-red-50 text-red-800 border-red-200"
    };
    
    return (
      <Badge 
        variant="outline"
        className={styles[status] || ""}
      >
        {status.charAt(0).toUpperCase() + status.slice(1)}
      </Badge>
    );
  };

  // Render proof thumbnail and view button
  const renderProofCell = (proof) => {
    if (!proof) return <span className="text-gray-500 text-sm">No proof</span>;
    
    return (
      <div className="flex items-center space-x-2">
        <Button 
          variant="outline" 
          size="sm"
          className="p-1 h-auto"
          onClick={() => setSelectedProof(proof)}
        >
          <Image size={16} className="mr-1" /> 
          View Proof
        </Button>
        <div 
          className="w-10 h-10 rounded border overflow-hidden cursor-pointer"
          onClick={() => setSelectedProof(proof)}
        >
          <ImageWithFallback
            src={proof}
            alt="Proof thumbnail"
            className="w-full h-full object-cover"
            fallbackSrc="/placeholder.svg"
          />
        </div>
      </div>
    );
  };

  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Crypto Deposit Approvals</h1>

      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center p-4">Loading deposits...</div>
          ) : deposits.length === 0 ? (
            <div className="text-center p-4 text-gray-500">No crypto deposit requests found</div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Proof</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {deposits.map((deposit) => (
                    <TableRow key={deposit.id}>
                      <TableCell>{deposit.username || "Unknown"}</TableCell>
                      <TableCell>{deposit.currency}</TableCell>
                      <TableCell>{deposit.amount.toFixed(6)}</TableCell>
                      <TableCell>{new Date(deposit.created_at).toLocaleDateString()}</TableCell>
                      <TableCell>{renderProofCell(deposit.proof)}</TableCell>
                      <TableCell>{renderStatusBadge(deposit.status)}</TableCell>
                      <TableCell>
                        {deposit.status === "pending" && (
                          <div className="flex items-center space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              className="bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                              onClick={() => handleApprove(deposit.id)}
                              disabled={processingId === deposit.id}
                            >
                              {processingId === deposit.id ? (
                                <Loader2 size={16} className="mr-1 animate-spin" />
                              ) : (
                                <CheckCircle2 size={16} className="mr-1" />
                              )}
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              onClick={() => handleReject(deposit.id)}
                              disabled={processingId === deposit.id}
                            >
                              {processingId === deposit.id ? (
                                <Loader2 size={16} className="mr-1 animate-spin" />
                              ) : (
                                <XCircle size={16} className="mr-1" />
                              )}
                              Reject
                            </Button>
                          </div>
                        )}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Proof Image Dialog */}
      <Dialog open={!!selectedProof} onOpenChange={() => setSelectedProof(null)}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Transaction Proof</DialogTitle>
            <DialogDescription>
              Review the submitted proof image
            </DialogDescription>
          </DialogHeader>

          {selectedProof && (
            <div className="flex justify-center">
              <div className="max-h-[70vh] w-full relative">
                <ImageWithFallback
                  src={selectedProof}
                  alt="Transaction Proof"
                  className="max-h-[70vh] max-w-full object-contain mx-auto"
                  fallbackSrc="/placeholder.svg"
                />
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApproveCryptoDeposits;