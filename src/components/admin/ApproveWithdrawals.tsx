import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";

const ApproveWithdrawals = () => {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [processingId, setProcessingId] = useState(null);
  const [confirmReject, setConfirmReject] = useState(null);
  const [showProcessDialog, setShowProcessDialog] = useState(false);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState(null);
  const [txHash, setTxHash] = useState("");

  useEffect(() => {
    fetchWithdrawals();
    const channel = supabase
      .channel("admin-withdrawals")
      .on("postgres_changes", { event: "*", schema: "public", table: "withdrawals" }, fetchWithdrawals)
      .subscribe();
    
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchWithdrawals = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("withdrawals")
        .select("*, users(username, email)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      setWithdrawals(data.map(item => ({
        ...item,
        username: item.users?.username,
        email: item.users?.email
      })));
    } catch (error) {
      toast({ title: "Error", description: "Failed to load withdrawal requests", variant: "destructive" });
    } finally {
      setIsLoading(false);
    }
  };

  const handleApprove = (withdrawal) => {
    setSelectedWithdrawal(withdrawal);
    setShowProcessDialog(true);
    setTxHash("");
  };

  const processWithdrawal = async () => {
    if (!selectedWithdrawal) return;
    
    setProcessingId(selectedWithdrawal.id);
    try {
      // Update withdrawal status to approved
      const { error } = await supabase
        .from("withdrawals")
        .update({ 
          status: "approved",
          tx_hash: txHash.trim() || null
        })
        .eq("id", selectedWithdrawal.id);
      
      if (error) throw error;
      
      // Also update the corresponding transaction if it exists
      const { data: transactions } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", selectedWithdrawal.user_id)
        .eq("type", "withdrawal")
        .eq("amount", selectedWithdrawal.amount)
        .eq("currency", selectedWithdrawal.currency)
        .eq("status", "pending");
      
      if (transactions && transactions.length > 0) {
        await supabase
          .from("transactions")
          .update({ status: "approved" })
          .eq("id", transactions[0].id);
      }
      
      toast({ 
        title: "Withdrawal Approved", 
        description: `${selectedWithdrawal.amount} ${selectedWithdrawal.currency} withdrawal has been approved.` 
      });
      
      setSelectedWithdrawal(null);
      setShowProcessDialog(false);
      fetchWithdrawals();
    } catch (error) {
      console.error("Error processing withdrawal:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async () => {
    if (!confirmReject) return;
    
    setProcessingId(confirmReject.id);
    try {
      // Update withdrawal status to rejected
      const { error } = await supabase
        .from("withdrawals")
        .update({ status: "rejected" })
        .eq("id", confirmReject.id);
      
      if (error) throw error;
      
      // Also update the corresponding transaction if it exists
      const { data: transactions } = await supabase
        .from("transactions")
        .select("id")
        .eq("user_id", confirmReject.user_id)
        .eq("type", "withdrawal")
        .eq("amount", confirmReject.amount)
        .eq("currency", confirmReject.currency)
        .eq("status", "pending");
      
      if (transactions && transactions.length > 0) {
        await supabase
          .from("transactions")
          .update({ status: "rejected" })
          .eq("id", transactions[0].id);
      }
      
      // Return the funds to the user
      const { success, error: balanceError } = await updateUserCryptoBalance(
        confirmReject.user_id,
        confirmReject.currency,
        confirmReject.amount
      );
      
      if (!success && balanceError) {
        console.error("Error returning funds:", balanceError);
      }
      
      toast({ 
        title: "Withdrawal Rejected", 
        description: `${confirmReject.amount} ${confirmReject.currency} withdrawal has been rejected and funds returned.` 
      });
      
      setConfirmReject(null);
      fetchWithdrawals();
    } catch (error) {
      console.error("Error rejecting withdrawal:", error);
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setProcessingId(null);
    }
  };

  return (
    <div>
      <h1 className="text-2xl font-bold mb-4">Withdrawal Approvals</h1>
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal Requests</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? <p>Loading...</p> : withdrawals.length === 0 ? <p>No withdrawal requests found</p> : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Address</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {withdrawals.map((withdrawal) => (
                  <TableRow key={withdrawal.id}>
                    <TableCell>
                      <div>
                        <p className="font-medium">{withdrawal.username || "Unknown"}</p>
                        <p className="text-sm text-gray-500">{withdrawal.email}</p>
                      </div>
                    </TableCell>
                    <TableCell>{withdrawal.currency}</TableCell>
                    <TableCell>{withdrawal.amount}</TableCell>
                    <TableCell>
                      <div className="max-w-[200px] truncate font-mono text-xs">
                        {withdrawal.user_address}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Badge className={
                        withdrawal.status === "pending" ? "bg-yellow-100 text-yellow-800 border-yellow-200" :
                        withdrawal.status === "approved" ? "bg-green-100 text-green-800 border-green-200" : 
                        "bg-red-100 text-red-800 border-red-200"
                      }>
                        {withdrawal.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="space-x-2">
                      {withdrawal.status === "pending" && (
                        <>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"
                            onClick={() => handleApprove(withdrawal)}
                            disabled={processingId === withdrawal.id}
                          >
                            {processingId === withdrawal.id ? 
                              <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : 
                              <CheckCircle2 className="h-4 w-4 mr-1" />}
                            Approve
                          </Button>
                          <Button
                            size="sm"
                            variant="outline"
                            className="flex items-center text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                            onClick={() => setConfirmReject(withdrawal)}
                            disabled={processingId === withdrawal.id}
                          >
                            {processingId === withdrawal.id ? 
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

      {/* Process Withdrawal Dialog */}
      <Dialog open={showProcessDialog} onOpenChange={setShowProcessDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Process Withdrawal</DialogTitle>
            <DialogDescription>
              Complete the withdrawal by sending {selectedWithdrawal?.amount} {selectedWithdrawal?.currency} to the address below.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div>
              <Label htmlFor="address">Destination Address</Label>
              <div className="p-2 border rounded bg-gray-50 font-mono text-sm break-all">
                {selectedWithdrawal?.user_address}
              </div>
            </div>
            <div>
              <Label htmlFor="tx-hash">Transaction Hash (Optional)</Label>
              <Input
                id="tx-hash"
                value={txHash}
                onChange={(e) => setTxHash(e.target.value)}
                placeholder="Enter transaction hash/id"
              />
              <p className="text-xs text-gray-500 mt-1">Transaction hash for reference (optional)</p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowProcessDialog(false)}>Cancel</Button>
            <Button 
              onClick={processWithdrawal} 
              disabled={processingId === selectedWithdrawal?.id}
            >
              {processingId === selectedWithdrawal?.id ? 
                <Loader2 className="h-4 w-4 mr-1 animate-spin" /> : 'Confirm Approval'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm Reject Alert */}
      <AlertDialog open={!!confirmReject} onOpenChange={(open) => !open && setConfirmReject(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Reject Withdrawal?</AlertDialogTitle>
            <AlertDialogDescription>
              This will reject the withdrawal request of {confirmReject?.amount} {confirmReject?.currency} and return the funds to the user's wallet.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReject}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Reject Withdrawal
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

// Helper function to update user crypto balance
const updateUserCryptoBalance = async (userId, currency, amount) => {
  try {
    // First get the current balance
    const { data: userData, error: userError } = await supabase
      .from('users')
      .select('balance_crypto')
      .eq('id', userId)
      .single();

    if (userError) throw userError;

    // Parse and update the balance
    const balances = userData.balance_crypto || {};
    const currentBalance = parseFloat(String(balances[currency])) || 0;
    const newBalance = currentBalance + amount;
    
    // Create updated balance object
    const updatedBalance = {
      ...(typeof balances === 'object' ? balances : {}),
      [currency]: newBalance
    };

    // Update the user's balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        balance_crypto: updatedBalance 
      })
      .eq('id', userId);

    if (updateError) throw updateError;

    return { 
      success: true, 
      balance: newBalance,
      error: null
    };
  } catch (error) {
    console.error(`Error updating ${currency} balance for user ${userId}:`, error);
    return { 
      success: false, 
      balance: null,
      error: error.message || "Failed to update balance"
    };
  }
};

export default ApproveWithdrawals;
