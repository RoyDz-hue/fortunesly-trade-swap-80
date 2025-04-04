
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

const ApproveCryptoDeposits = () => {
  const { toast } = useToast();
  const [deposits, setDeposits] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedProof, setSelectedProof] = useState(null);
  const [processingId, setProcessingId] = useState(null);

  useEffect(() => {
    fetchDeposits();
    const channel = supabase
      .channel("admin-deposits")
      .on("postgres_changes", { event: "*", schema: "public", table: "transactions" }, fetchDeposits)
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDeposits = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, users(username)")
        .eq("type", "deposit")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setDeposits(data.map(item => ({ ...item, username: item.users?.username })));
    } catch (error) {
      toast({ title: "Error", description: "Failed to load deposit requests", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    setProcessingId(id);
    try {
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .select("*, users(id)")
        .eq("id", id)
        .single();
      
      if (txError) throw new Error("Transaction not found");
      if (transaction.status !== "pending") throw new Error(`Transaction is already ${transaction.status}`);

      if (newStatus === "approved") {
        const { success, error: balanceError } = await updateUserCryptoBalance(
          transaction.user_id,
          transaction.currency,
          transaction.amount
        );
        
        if (!success) {
          throw new Error(balanceError || "Failed to update balance");
        }
      }
      
      // Make sure we're using a valid status value - the constraint might be limiting to 'pending', 'approved', 'rejected'
      const validStatus = newStatus === "rejected" ? "rejected" : 
                           newStatus === "approved" ? "approved" : "pending";
      
      const { error: statusError } = await supabase
        .from("transactions")
        .update({ status: validStatus })
        .eq("id", id);
        
      if (statusError) throw statusError;
      
      toast({ 
        title: `Deposit ${newStatus}`, 
        description: `${transaction.amount} ${transaction.currency} deposit has been ${newStatus}.` 
      });
      
      fetchDeposits();
    } catch (error) {
      console.error("Error handling deposit:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold">Crypto Deposit Approvals</h1>
      <Card>
        <CardHeader>
          <CardTitle>Pending Approvals</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <p>Loading...</p> : deposits.length === 0 ? <p>No deposits found</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Amount</TableHead>
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
                    <TableCell>{deposit.amount}</TableCell>
                    <TableCell>
                      {deposit.proof ? (
                        <Button 
                          size="sm"
                          variant="outline"
                          className="flex items-center"
                          onClick={() => setSelectedProof(deposit.proof)}
                        >
                          <Image className="h-4 w-4 mr-1" />
                          View Proof
                        </Button>
                      ) : "No proof"}
                    </TableCell>
                    <TableCell><Badge>{deposit.status}</Badge></TableCell>
                    <TableCell className="space-x-2">
                      {deposit.status === "pending" && (
                        <>
                          <Button 
                            size="sm"
                            variant="outline"
                            className="flex items-center text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"
                            onClick={() => handleStatusChange(deposit.id, "approved")} 
                            disabled={processingId === deposit.id}
                          >
                            {processingId === deposit.id ? 
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : 
                              <CheckCircle2 className="h-4 w-4 mr-1" />} 
                            Approve
                          </Button>
                          <Button 
                            size="sm"
                            variant="outline"
                            className="flex items-center text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                            onClick={() => handleStatusChange(deposit.id, "rejected")} 
                            disabled={processingId === deposit.id}
                          >
                            {processingId === deposit.id ? 
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : 
                              <XCircle className="h-4 w-4 mr-1" />} 
                            Reject
                          </Button>
                        </>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      <Dialog open={!!selectedProof} onOpenChange={() => setSelectedProof(null)}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Transaction Proof</DialogTitle>
            <DialogDescription>Review the submitted proof image.</DialogDescription>
          </DialogHeader>
          <div className="border rounded-md overflow-hidden">
            {selectedProof && (
              <ImageWithFallback 
                src={selectedProof} 
                alt="Transaction Proof" 
                className="w-full object-contain max-h-[60vh]"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApproveCryptoDeposits;
