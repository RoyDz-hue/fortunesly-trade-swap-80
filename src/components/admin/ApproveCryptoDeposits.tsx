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
    return () => supabase.removeChannel(channel);
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

  const handleApprove = async (id) => {
    setProcessingId(id);
    try {
      const { data: transaction, error: txError } = await supabase
        .from("transactions")
        .select("*, users(id, balance_crypto)")
        .eq("id", id)
        .single();
      if (txError || !transaction) throw new Error("Transaction not found");
      if (transaction.status === "approved") throw new Error("Already approved");
      const { success, error } = await updateUserCryptoBalance(transaction.user_id, transaction.currency, transaction.amount);
      if (!success) throw new Error(error);
      const { error: statusError } = await supabase.from("transactions").update({ status: "approved" }).eq("id", id);
      if (statusError) throw statusError;
      toast({ title: "Success", description: `Deposit of ${transaction.amount} ${transaction.currency} approved.` });
      fetchDeposits();
    } catch (error) {
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
                      {deposit.proof ? <Button onClick={() => setSelectedProof(deposit.proof)}>View Proof</Button> : "No proof"}
                    </TableCell>
                    <TableCell><Badge>{deposit.status}</Badge></TableCell>
                    <TableCell>
                      {deposit.status === "pending" && (
                        <Button onClick={() => handleApprove(deposit.id)} disabled={processingId === deposit.id}>
                          {processingId === deposit.id ? <Loader2 className="animate-spin" /> : <CheckCircle2 />} Approve
                        </Button>
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
          {selectedProof && <ImageWithFallback src={selectedProof} alt="Transaction Proof" />}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApproveCryptoDeposits;
