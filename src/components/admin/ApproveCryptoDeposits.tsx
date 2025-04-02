
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { ExternalLink, CheckCircle2, XCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";

interface CryptoDepositRequest {
  id: string;
  user_id: string;
  amount: number;
  currency: string;
  status: "pending" | "approved" | "rejected";
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

  useEffect(() => {
    fetchDeposits();
    
    // Setup real-time updates
    const channel = supabase
      .channel("admin-deposits")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "transactions" },
        () => {
          fetchDeposits();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchDeposits = async () => {
    setIsLoading(true);
    try {
      // Fetch crypto deposit transactions with user info
      const { data, error } = await supabase
        .from("transactions")
        .select("*, users(username)")
        .eq("type", "deposit")
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Map to our interface
      const depositRequests = data.map((item) => ({
        id: item.id,
        user_id: item.user_id,
        amount: item.amount,
        currency: item.currency,
        status: item.status,
        created_at: item.created_at,
        proof: item.proof,
        username: item.users?.username
      }));

      setDeposits(depositRequests);
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

  const handleApprove = async (id: string) => {
    setProcessingId(id);
    try {
      // Use our new approve_crypto_deposit database function
      const { data, error } = await supabase
        .rpc('approve_crypto_deposit', { transaction_id_param: id });
        
      if (error) throw error;
      
      toast({
        title: "Deposit approved",
        description: "The crypto deposit has been approved and funds have been added to the user's wallet",
      });
      
      fetchDeposits();
    } catch (error: any) {
      console.error("Error approving deposit:", error);
      toast({
        title: "Failed to approve deposit",
        description: error.message || "There was an unexpected error",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
  };

  const handleReject = async (id: string) => {
    setProcessingId(id);
    try {
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
    } catch (error) {
      console.error("Error rejecting deposit:", error);
      toast({
        title: "Failed to reject deposit",
        description: "There was an error rejecting the deposit",
        variant: "destructive"
      });
    } finally {
      setProcessingId(null);
    }
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
                      <TableCell>
                        {deposit.proof ? (
                          <Button 
                            variant="link" 
                            className="p-0 h-auto"
                            onClick={() => setSelectedProof(deposit.proof)}
                          >
                            <ExternalLink size={16} className="mr-1" /> 
                            View Proof
                          </Button>
                        ) : (
                          <span className="text-gray-500 text-sm">No proof</span>
                        )}
                      </TableCell>
                      <TableCell>
                        <Badge 
                          variant="outline" 
                          className={
                            deposit.status === "pending" ? "bg-yellow-50 text-yellow-800 border-yellow-200" :
                            deposit.status === "approved" ? "bg-green-50 text-green-800 border-green-200" :
                            "bg-red-50 text-red-800 border-red-200"
                          }
                        >
                          {deposit.status.charAt(0).toUpperCase() + deposit.status.slice(1)}
                        </Badge>
                      </TableCell>
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
                              <CheckCircle2 size={16} className="mr-1" />
                              Approve
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                              onClick={() => handleReject(deposit.id)}
                              disabled={processingId === deposit.id}
                            >
                              <XCircle size={16} className="mr-1" />
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
              <img 
                src={selectedProof} 
                alt="Transaction Proof" 
                className="max-h-[70vh] object-contain"
              />
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default ApproveCryptoDeposits;
