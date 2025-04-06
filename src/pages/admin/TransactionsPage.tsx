import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { AlertTriangle, CheckCircle, Search, XCircle, Image, Filter } from "lucide-react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import ImageWithFallback from "@/components/common/ImageWithFallback";
import { updateUserCryptoBalance } from "@/utils/walletUtils";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  forfeited: "bg-gray-100 text-gray-800 border-gray-200",
};

const typeColors = {
  deposit: "bg-blue-100 text-blue-800 border-blue-200",
  withdrawal: "bg-purple-100 text-purple-800 border-purple-200",
};

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [processingId, setProcessingId] = useState(null);
  const [selectedProofImage, setSelectedProofImage] = useState(null);
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  useEffect(() => {
    fetchTransactions();

    // Set up realtime subscription
    const channel = supabase
      .channel('admin-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        () => {
          fetchTransactions();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab]);

  const fetchTransactions = async () => {
    try {
      setIsLoading(true);

      let query = supabase
        .from('transactions')
        .select('*, users!inner(username, email)')
        .order('created_at', { ascending: false });

      // Apply status filter
      if (activeTab !== "all") {
        query = query.eq('status', activeTab);
      }

      const { data, error } = await query;

      if (error) {
        console.error("Error fetching transactions:", error);
        setError(error.message);
        return;
      }

      console.log("Fetched admin transactions:", data);
      setTransactions(data || []);
      setError(null);
    } catch (err) {
      console.error("Unexpected error:", err);
      setError("Failed to load transactions");
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (id, newStatus) => {
    try {
      setProcessingId(id);

      // Get the transaction details first
      const { data: transaction, error: txError } = await supabase
        .from('transactions')
        .select('*')
        .eq('id', id)
        .single();

      if (txError) {
        throw txError;
      }

      // Verify that the transaction is in a pending state
      if (transaction.status !== 'pending') {
        throw new Error(`Cannot change status of a transaction that is already ${transaction.status}`);
      }

      // Process based on transaction type and new status
      if (newStatus === "approved" && transaction.type === "deposit") {
        // Update user's crypto balance when approving deposits
        const { success, error: balanceError } = await updateUserCryptoBalance(
          transaction.user_id, 
          transaction.currency, 
          transaction.amount
        );

        if (!success) {
          throw new Error(balanceError || "Failed to update user balance");
        }
      } else if (newStatus === "rejected" && transaction.type === "withdrawal") {
        // Return funds to user's balance when rejecting withdrawals
        const { success, error: returnError } = await updateUserCryptoBalance(
          transaction.user_id, 
          transaction.currency, 
          transaction.amount
        );

        if (!success) {
          throw new Error(returnError || "Failed to return funds to user balance");
        }
      }

      // Important: Use exact string values that match the enum constraint in the database
      // The status column in transactions table likely has an enum check constraint
      const statusValue = newStatus === "approved" ? "approved" : "rejected";

      const { error } = await supabase
        .from('transactions')
        .update({ status: statusValue })
        .eq('id', id);

      if (error) {
        console.error("Transaction update error:", error);
        throw error;
      }

      toast({
        title: "Status updated",
        description: `Transaction ${id.substring(0, 8)}... has been ${newStatus}`,
        variant: newStatus === "approved" ? "default" : "destructive",
      });

      // Refresh transactions
      fetchTransactions();
    } catch (error) {
      console.error("Error updating transaction status:", error);
      toast({
        title: "Update failed",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setProcessingId(null);
    }
  };

  const formatDate = (dateString) => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const filteredTransactions = transactions.filter(tx => {
    const matchesSearch = !searchQuery || 
      tx.currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.users.username.toLowerCase().includes(searchQuery.toLowerCase()) ||
      tx.users.email.toLowerCase().includes(searchQuery.toLowerCase());

    return matchesSearch;
  });

  // Condensed mobile card view for each transaction
  const TransactionCard = ({ transaction }) => (
    <Card className="mb-4">
      <CardContent className="p-4">
        <div className="flex justify-between items-start mb-3">
          <div className="overflow-hidden">
            <p className="font-medium truncate">{transaction.users.username}</p>
            <p className="text-xs text-gray-500 truncate">{transaction.users.email}</p>
          </div>
          <Badge variant="outline" className={`${statusColors[transaction.status]} ml-2 shrink-0`}>
            {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
          </Badge>
        </div>
        
        <div className="grid grid-cols-2 gap-2 mb-3">
          <div>
            <p className="text-xs text-gray-500">Type</p>
            <Badge variant="outline" className={typeColors[transaction.type]}>
              {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
            </Badge>
          </div>
          <div>
            <p className="text-xs text-gray-500">Date</p>
            <p className="text-sm truncate">{formatDate(transaction.created_at)}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Currency</p>
            <p className="text-sm font-medium">{transaction.currency}</p>
          </div>
          <div>
            <p className="text-xs text-gray-500">Amount</p>
            <p className="text-sm font-medium">{transaction.amount}</p>
          </div>
        </div>
        
        <div className="flex flex-wrap justify-between items-center gap-2">
          {transaction.proof && (
            <Button 
              size="sm" 
              variant="outline"
              className="flex items-center"
              onClick={() => setSelectedProofImage(transaction.proof)}
            >
              <Image className="h-4 w-4 mr-1" />
              View Proof
            </Button>
          )}
          
          {transaction.status === "pending" && (
            <div className="flex flex-wrap gap-2 ml-auto">
              <Button
                size="sm"
                variant="outline"
                className="flex items-center text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"
                onClick={() => handleStatusChange(transaction.id, "approved")}
                disabled={processingId === transaction.id}
              >
                <CheckCircle className="mr-1 h-4 w-4" />
                Approve
              </Button>
              <Button
                size="sm"
                variant="outline"
                className="flex items-center text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                onClick={() => handleStatusChange(transaction.id, "rejected")}
                disabled={processingId === transaction.id}
              >
                <XCircle className="mr-1 h-4 w-4" />
                Reject
              </Button>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Transaction Management</h1>

        <div className="flex flex-col sm:flex-row gap-2 w-full sm:w-auto">
          <div className="relative flex-1 sm:flex-initial">
            <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search transactions..."
              className="pl-9 w-full"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
            />
          </div>
          <Button 
            variant="outline"
            onClick={() => fetchTransactions()}
            className="w-full sm:w-auto"
          >
            Refresh
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader className="pb-2">
          <CardTitle>Transaction List</CardTitle>
        </CardHeader>

        <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab}>
          <div className="px-4 overflow-x-auto pb-1">
            <TabsList className="w-full justify-start mb-2">
              <TabsTrigger value="all">All</TabsTrigger>
              <TabsTrigger value="pending">Pending</TabsTrigger>
              <TabsTrigger value="approved">Approved</TabsTrigger>
              <TabsTrigger value="rejected">Rejected</TabsTrigger>
            </TabsList>
          </div>

          <TabsContent value={activeTab} className="pt-0 mt-0">
            <CardContent className="p-0">
              {isLoading ? (
                <div className="p-6">
                  <div className="space-y-4">
                    {[...Array(5)].map((_, i) => (
                      <div key={i} className="flex justify-between items-center">
                        <div className="space-y-2">
                          <Skeleton className="h-4 w-32" />
                          <Skeleton className="h-4 w-24" />
                        </div>
                        <Skeleton className="h-10 w-20" />
                      </div>
                    ))}
                  </div>
                </div>
              ) : error ? (
                <div className="p-8 text-center">
                  <AlertTriangle className="mx-auto h-8 w-8 text-amber-500" />
                  <h3 className="mt-2 text-xl font-semibold">Error Loading Transactions</h3>
                  <p className="mt-1 text-gray-500">{error}</p>
                  <Button onClick={fetchTransactions} variant="outline" className="mt-4">
                    Try Again
                  </Button>
                </div>
              ) : filteredTransactions.length === 0 ? (
                <div className="p-8 text-center">
                  <p className="text-gray-500">No {activeTab !== "all" ? activeTab : ""} transactions found</p>
                </div>
              ) : (
                <>
                  {/* Desktop table view - hidden on mobile */}
                  <div className="hidden md:block overflow-x-auto">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Date</TableHead>
                          <TableHead>User</TableHead>
                          <TableHead>Type</TableHead>
                          <TableHead>Currency</TableHead>
                          <TableHead>Amount</TableHead>
                          <TableHead>Proof</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Actions</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredTransactions.map((transaction) => (
                          <TableRow key={transaction.id}>
                            <TableCell className="whitespace-nowrap">{formatDate(transaction.created_at)}</TableCell>
                            <TableCell>
                              <div className="max-w-xs">
                                <p className="font-medium truncate">{transaction.users.username}</p>
                                <p className="text-sm text-gray-500 truncate">{transaction.users.email}</p>
                              </div>
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={typeColors[transaction.type]}>
                                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>{transaction.currency}</TableCell>
                            <TableCell>{transaction.amount}</TableCell>
                            <TableCell>
                              {transaction.proof ? (
                                <Button 
                                  size="sm" 
                                  variant="outline"
                                  className="flex items-center"
                                  onClick={() => setSelectedProofImage(transaction.proof)}
                                >
                                  <Image className="h-4 w-4 mr-1" />
                                  View
                                </Button>
                              ) : (
                                <span className="text-sm text-gray-500">No proof</span>
                              )}
                            </TableCell>
                            <TableCell>
                              <Badge variant="outline" className={statusColors[transaction.status]}>
                                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                              </Badge>
                            </TableCell>
                            <TableCell>
                              {transaction.status === "pending" ? (
                                <div className="flex space-x-2">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center text-green-600 hover:text-green-700 border-green-200 hover:bg-green-50"
                                    onClick={() => handleStatusChange(transaction.id, "approved")}
                                    disabled={processingId === transaction.id}
                                  >
                                    <CheckCircle className="mr-1 h-4 w-4" />
                                    Approve
                                  </Button>
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    className="flex items-center text-red-600 hover:text-red-700 border-red-200 hover:bg-red-50"
                                    onClick={() => handleStatusChange(transaction.id, "rejected")}
                                    disabled={processingId === transaction.id}
                                  >
                                    <XCircle className="mr-1 h-4 w-4" />
                                    Reject
                                  </Button>
                                </div>
                              ) : (
                                <span className="text-sm text-gray-500">
                                  {transaction.status === "approved" ? "Approved" : "Rejected"}
                                </span>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>

                  {/* Mobile card view - shown only on mobile */}
                  <div className="md:hidden px-4 py-2">
                    {filteredTransactions.map((transaction) => (
                      <TransactionCard key={transaction.id} transaction={transaction} />
                    ))}
                  </div>
                </>
              )}
            </CardContent>
          </TabsContent>
        </Tabs>
      </Card>

      {/* Proof Image Preview Dialog */}
      <Dialog open={!!selectedProofImage} onOpenChange={() => setSelectedProofImage(null)}>
        <DialogContent className="sm:max-w-md max-w-[90vw] p-4">
          <DialogHeader>
            <DialogTitle>Transaction Proof</DialogTitle>
          </DialogHeader>
          <div className="border rounded-md overflow-hidden">
            {selectedProofImage && (
              <ImageWithFallback
                src={selectedProofImage}
                alt="Transaction Proof"
                className="w-full max-h-[60vh] object-contain"
              />
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TransactionsPage;