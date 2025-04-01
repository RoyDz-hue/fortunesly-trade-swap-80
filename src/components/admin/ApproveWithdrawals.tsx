
import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { supabase } from "@/integrations/supabase/client";
import { Check, X, Copy, AlertTriangle } from "lucide-react";

// Define withdrawal status types
type WithdrawalStatus = 'pending' | 'approved' | 'rejected' | 'forfeited';

// Define action types and their mapping to the database enum values
type WithdrawalAction = "approve" | "reject" | "forfeit";

// Map UI action to database status
const mapActionToStatus = (action: WithdrawalAction): WithdrawalStatus => {
  switch(action) {
    case "approve": return "approved";
    case "reject": return "rejected";
    case "forfeit": return "forfeited";
    default: return "pending";
  }
};

interface Withdrawal {
  id: string;
  userId: string;
  currency: string;
  amount: number;
  status: WithdrawalStatus;
  createdAt: string;
  userAddress: string;
  username?: string;
}

const ApproveWithdrawals = () => {
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedWithdrawal, setSelectedWithdrawal] = useState<Withdrawal | null>(null);
  const [isActionDialogOpen, setIsActionDialogOpen] = useState(false);
  const [actionType, setActionType] = useState<WithdrawalAction | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  useEffect(() => {
    fetchWithdrawals();
    
    // Set up realtime subscription for withdrawals
    const channel = supabase
      .channel('admin-withdrawals-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'withdrawals' },
        (payload) => {
          console.log('Withdrawal change received:', payload);
          fetchWithdrawals();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);
  
  const fetchWithdrawals = async () => {
    setIsLoading(true);
    try {
      console.log("Fetching pending withdrawals...");
      const { data, error } = await supabase
        .from('withdrawals')
        .select(`
          *,
          users:user_id (username)
        `)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      console.log("Fetched withdrawals:", data);
      
      const formattedWithdrawals: Withdrawal[] = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        currency: item.currency,
        amount: item.amount,
        status: item.status as WithdrawalStatus,
        createdAt: item.created_at,
        userAddress: item.user_address,
        username: item.users?.username
      }));
      
      setWithdrawals(formattedWithdrawals);
    } catch (error) {
      console.error("Error fetching withdrawals:", error);
      toast({
        title: "Error",
        description: "Failed to load pending withdrawals",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleWithdrawalAction = (withdrawal: Withdrawal, action: WithdrawalAction) => {
    setSelectedWithdrawal(withdrawal);
    setActionType(action);
    setIsActionDialogOpen(true);
  };
  
  const executeWithdrawalAction = async () => {
    if (!selectedWithdrawal || !actionType) return;
    
    setIsSubmitting(true);
    
    try {
      const finalStatus = mapActionToStatus(actionType);
      
      const { error: updateError } = await supabase
        .from('withdrawals')
        .update({ status: finalStatus })
        .eq('id', selectedWithdrawal.id);
        
      if (updateError) throw updateError;
      
      if (actionType === "reject") {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('balance_crypto, balance_fiat')
          .eq('id', selectedWithdrawal.userId)
          .single();
          
        if (userError) throw userError;
        
        if (selectedWithdrawal.currency === "KES") {
          const currentBalance = userData.balance_fiat || 0;
          const newBalance = currentBalance + selectedWithdrawal.amount;
          
          const { error: balanceError } = await supabase
            .from('users')
            .update({ balance_fiat: newBalance })
            .eq('id', selectedWithdrawal.userId);
            
          if (balanceError) throw balanceError;
        } else {
          let currentBalances = userData.balance_crypto || {};
          
          if (!currentBalances[selectedWithdrawal.currency]) {
            currentBalances[selectedWithdrawal.currency] = 0;
          }
          
          currentBalances[selectedWithdrawal.currency] += selectedWithdrawal.amount;
          
          const { error: balanceError } = await supabase
            .from('users')
            .update({ balance_crypto: currentBalances })
            .eq('id', selectedWithdrawal.userId);
            
          if (balanceError) throw balanceError;
        }
      }
      
      setWithdrawals(withdrawals.filter(w => w.id !== selectedWithdrawal.id));
      setIsActionDialogOpen(false);
      setSelectedWithdrawal(null);
      
      toast({
        title: `Withdrawal ${finalStatus}`,
        description: `The withdrawal has been ${finalStatus}${actionType === "reject" ? " and funds have been refunded to the user" : ""}`
      });
      
    } catch (error) {
      console.error(`Error ${actionType}ing withdrawal:`, error);
      toast({
        title: "Error",
        description: `Failed to ${actionType} withdrawal`,
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    toast({
      title: "Copied to clipboard",
      description: "The address has been copied to your clipboard"
    });
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Pending Withdrawals</h2>
        
        <Tabs defaultValue="crypto" className="space-y-4">
          <TabsList>
            <TabsTrigger value="crypto">Crypto Withdrawals</TabsTrigger>
            <TabsTrigger value="kes">KES Withdrawals</TabsTrigger>
          </TabsList>
          
          <TabsContent value="crypto">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-t-fortunesly-primary border-gray-200 rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading crypto withdrawals...</p>
              </div>
            ) : withdrawals.filter(w => w.currency !== "KES").length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No pending crypto withdrawals</p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Currency</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Withdrawal Address</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals
                      .filter(withdrawal => withdrawal.currency !== "KES")
                      .map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell>{formatDate(withdrawal.createdAt)}</TableCell>
                          <TableCell>{withdrawal.username || withdrawal.userId}</TableCell>
                          <TableCell>{withdrawal.currency}</TableCell>
                          <TableCell>{withdrawal.amount}</TableCell>
                          <TableCell className="max-w-[200px] truncate">
                            <div className="flex items-center space-x-2">
                              <span className="font-mono text-xs">{withdrawal.userAddress}</span>
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => copyToClipboard(withdrawal.userAddress)}
                              >
                                <Copy className="h-3 w-3" />
                                <span className="sr-only">Copy</span>
                              </Button>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                                onClick={() => handleWithdrawalAction(withdrawal, "approve")}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                onClick={() => handleWithdrawalAction(withdrawal, "reject")}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-gray-50 text-gray-600 hover:bg-gray-100 hover:text-gray-700"
                                onClick={() => handleWithdrawalAction(withdrawal, "forfeit")}
                              >
                                <AlertTriangle className="h-3 w-3 mr-1" />
                                Forfeit
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
          
          <TabsContent value="kes">
            {isLoading ? (
              <div className="text-center py-8">
                <div className="w-8 h-8 border-2 border-t-fortunesly-primary border-gray-200 rounded-full animate-spin mx-auto"></div>
                <p className="mt-2 text-gray-500">Loading KES withdrawals...</p>
              </div>
            ) : withdrawals.filter(w => w.currency === "KES").length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No pending KES withdrawals</p>
                <p className="text-xs mt-1">KES withdrawals are typically processed automatically</p>
              </div>
            ) : (
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Date</TableHead>
                      <TableHead>User</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Phone Number</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {withdrawals
                      .filter(withdrawal => withdrawal.currency === "KES")
                      .map((withdrawal) => (
                        <TableRow key={withdrawal.id}>
                          <TableCell>{formatDate(withdrawal.createdAt)}</TableCell>
                          <TableCell>{withdrawal.username || withdrawal.userId}</TableCell>
                          <TableCell>{withdrawal.amount} KES</TableCell>
                          <TableCell>{withdrawal.userAddress}</TableCell>
                          <TableCell>
                            <div className="flex space-x-2">
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                                onClick={() => handleWithdrawalAction(withdrawal, "approve")}
                              >
                                <Check className="h-3 w-3 mr-1" />
                                Approve
                              </Button>
                              <Button 
                                variant="outline" 
                                size="sm"
                                className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                                onClick={() => handleWithdrawalAction(withdrawal, "reject")}
                              >
                                <X className="h-3 w-3 mr-1" />
                                Reject
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </TabsContent>
        </Tabs>
      </div>
      
      {selectedWithdrawal && (
        <Dialog open={isActionDialogOpen} onOpenChange={setIsActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "approve" 
                  ? "Approve Withdrawal" 
                  : actionType === "reject"
                  ? "Reject Withdrawal"
                  : "Forfeit Withdrawal"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "approve" 
                  ? "Please confirm that you have sent the funds and want to approve this withdrawal." 
                  : actionType === "reject"
                  ? "This will refund the user's funds to their account balance."
                  : "This will permanently forfeit the funds. They will not be refunded to the user."}
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm font-medium">User</p>
                  <p className="text-sm text-gray-500">{selectedWithdrawal.username || selectedWithdrawal.userId}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Date</p>
                  <p className="text-sm text-gray-500">{formatDate(selectedWithdrawal.createdAt)}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Currency</p>
                  <p className="text-sm text-gray-500">{selectedWithdrawal.currency}</p>
                </div>
                <div>
                  <p className="text-sm font-medium">Amount</p>
                  <p className="text-sm text-gray-500">{selectedWithdrawal.amount}</p>
                </div>
                <div className="col-span-2">
                  <p className="text-sm font-medium">
                    {selectedWithdrawal.currency === "KES" ? "Phone Number" : "Withdrawal Address"}
                  </p>
                  <div className="flex items-center space-x-2">
                    <p className="text-sm text-gray-500 font-mono">{selectedWithdrawal.userAddress}</p>
                    <Button 
                      variant="ghost" 
                      size="sm"
                      onClick={() => copyToClipboard(selectedWithdrawal.userAddress)}
                    >
                      <Copy className="h-3 w-3" />
                      <span className="sr-only">Copy</span>
                    </Button>
                  </div>
                </div>
              </div>
              
              {actionType === "forfeit" && (
                <div className="bg-red-50 border border-red-200 rounded-md p-3">
                  <p className="text-sm text-red-600 font-medium flex items-center">
                    <AlertTriangle className="h-4 w-4 mr-2" />
                    Warning: This action cannot be undone
                  </p>
                  <p className="text-sm text-red-600 mt-1">
                    Forfeited funds will not be refunded to the user and will be permanently removed from the system.
                  </p>
                </div>
              )}
            </div>
            
            <DialogFooter>
              <Button 
                variant="outline" 
                onClick={() => setIsActionDialogOpen(false)}
              >
                Cancel
              </Button>
              <Button 
                onClick={executeWithdrawalAction}
                disabled={isSubmitting}
                variant={actionType === "forfeit" ? "destructive" : "default"}
              >
                {isSubmitting 
                  ? "Processing..." 
                  : actionType === "approve" 
                    ? "Approve Withdrawal" 
                    : actionType === "reject"
                      ? "Reject and Refund"
                      : "Forfeit Funds"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ApproveWithdrawals;
