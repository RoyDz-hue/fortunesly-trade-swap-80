
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from "@/integrations/supabase/client";

interface CryptoDeposit {
  id: string;
  userId: string;
  username?: string;
  currency: string;
  amount: number;
  status: 'pending' | 'approved' | 'rejected';
  createdAt: string;
  proofImageUrl: string;
}

const ApproveCryptoDeposits = () => {
  const { toast } = useToast();
  const [pendingDeposits, setPendingDeposits] = useState<CryptoDeposit[]>([]);
  const [selectedDeposit, setSelectedDeposit] = useState<CryptoDeposit | null>(null);
  const [isViewingProof, setIsViewingProof] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    fetchPendingDeposits();
  }, []);

  const fetchPendingDeposits = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('transactions')
        .select(`
          id,
          user_id,
          currency,
          amount,
          status,
          created_at,
          proof,
          users:user_id (username)
        `)
        .eq('type', 'deposit')
        .eq('status', 'pending')
        .neq('currency', 'KES')
        .order('created_at', { ascending: false });

      if (error) {
        throw error;
      }

      const formattedDeposits: CryptoDeposit[] = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        username: item.users?.username,
        currency: item.currency,
        amount: item.amount,
        status: item.status,
        createdAt: item.created_at,
        proofImageUrl: item.proof || ''
      }));

      setPendingDeposits(formattedDeposits);
    } catch (error) {
      console.error("Error fetching pending deposits:", error);
      toast({
        title: "Error",
        description: "Failed to load pending deposits",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleViewProof = (deposit: CryptoDeposit) => {
    setSelectedDeposit(deposit);
    setIsViewingProof(true);
  };

  const handleApprove = async (deposit: CryptoDeposit) => {
    setIsProcessing(true);
    
    try {
      // 1. Update transaction status
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'approved' })
        .eq('id', deposit.id);
        
      if (updateError) throw updateError;
      
      // 2. Get user's current crypto balance
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('balance_crypto')
        .eq('id', deposit.userId)
        .single();
        
      if (userError) throw userError;
      
      // 3. Update user's crypto balance
      let cryptoBalance = userData.balance_crypto || {};
      
      if (!cryptoBalance[deposit.currency]) {
        cryptoBalance[deposit.currency] = 0;
      }
      
      cryptoBalance[deposit.currency] += Number(deposit.amount);
      
      const { error: balanceError } = await supabase
        .from('users')
        .update({ balance_crypto: cryptoBalance })
        .eq('id', deposit.userId);
        
      if (balanceError) throw balanceError;
      
      // 4. Remove from UI and show success
      setPendingDeposits(pendingDeposits.filter(d => d.id !== deposit.id));
      setIsViewingProof(false);
      
      toast({
        title: "Deposit Approved",
        description: `${deposit.amount} ${deposit.currency} has been credited to the user's account.`
      });
    } catch (error) {
      console.error("Error approving deposit:", error);
      toast({
        title: "Error",
        description: "Failed to approve deposit",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async (deposit: CryptoDeposit) => {
    setIsProcessing(true);
    
    try {
      // Simply update transaction status to rejected
      const { error: updateError } = await supabase
        .from('transactions')
        .update({ status: 'rejected' })
        .eq('id', deposit.id);
        
      if (updateError) throw updateError;
      
      // Remove from UI and show success
      setPendingDeposits(pendingDeposits.filter(d => d.id !== deposit.id));
      setIsViewingProof(false);
      
      toast({
        title: "Deposit Rejected",
        description: "The deposit request has been rejected."
      });
    } catch (error) {
      console.error("Error rejecting deposit:", error);
      toast({
        title: "Error",
        description: "Failed to reject deposit",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Pending Crypto Deposits</h2>
        
        {isLoading ? (
          <div className="text-center py-8">
            <div className="w-8 h-8 border-2 border-t-fortunesly-primary border-gray-200 rounded-full animate-spin mx-auto"></div>
            <p className="mt-2 text-gray-500">Loading pending deposits...</p>
          </div>
        ) : pendingDeposits.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Coin</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingDeposits.map((deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell>{new Date(deposit.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{deposit.username || deposit.userId}</TableCell>
                    <TableCell>{deposit.currency}</TableCell>
                    <TableCell>{deposit.amount}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleViewProof(deposit)}>
                        View Proof
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                          onClick={() => handleApprove(deposit)}
                          disabled={isProcessing}
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                          onClick={() => handleReject(deposit)}
                          disabled={isProcessing}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>No pending crypto deposits found</p>
            <p className="text-sm mt-1">Deposits will appear here when users submit them</p>
          </div>
        )}
      </div>
      
      {/* Proof Viewing Dialog */}
      {selectedDeposit && (
        <Dialog open={isViewingProof} onOpenChange={setIsViewingProof}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Deposit Proof</DialogTitle>
              <DialogDescription>
                Proof of deposit submitted by user
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="border rounded-md overflow-hidden">
                <img 
                  src={selectedDeposit.proofImageUrl} 
                  alt="Deposit Proof" 
                  className="w-full object-contain max-h-[300px]"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/500x300?text=Proof+Image+Not+Available";
                  }}
                />
              </div>
              
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">User ID:</span>
                  <span>{selectedDeposit.username || selectedDeposit.userId}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Coin:</span>
                  <span>{selectedDeposit.currency}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Amount:</span>
                  <span>{selectedDeposit.amount}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Date:</span>
                  <span>{new Date(selectedDeposit.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewingProof(false)}>
                Close
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700" 
                onClick={() => {
                  handleApprove(selectedDeposit);
                }}
                disabled={isProcessing}
              >
                Approve Deposit
              </Button>
              <Button 
                className="bg-red-600 hover:bg-red-700 text-white" 
                onClick={() => {
                  handleReject(selectedDeposit);
                }}
                disabled={isProcessing}
              >
                Reject Deposit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ApproveCryptoDeposits;
