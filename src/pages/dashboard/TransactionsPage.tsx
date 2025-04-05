
import { useState, useEffect } from "react";
import { Transaction } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { DownloadIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useIsMobile } from "@/hooks/use-mobile";

const statusColors = {
  pending: "bg-yellow-100 text-yellow-800 border-yellow-200",
  approved: "bg-green-100 text-green-800 border-green-200",
  rejected: "bg-red-100 text-red-800 border-red-200",
  forfeited: "bg-gray-100 text-gray-800 border-gray-200",
};

const typeColors = {
  deposit: "bg-blue-100 text-blue-800 border-blue-200",
  withdrawal: "bg-purple-100 text-purple-800 border-purple-200",
  purchase: "bg-green-100 text-green-800 border-green-200",
  sale: "bg-red-100 text-red-800 border-red-200",
};

const TransactionsPage = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("all");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const itemsPerPage = 10;
  const isMobile = useIsMobile();
  
  const { user } = useAuth();
  
  useEffect(() => {
    fetchTransactions();
  }, [currentPage, typeFilter, statusFilter, user]);

  const fetchTransactions = async () => {
    if (!user) return;
    
    setIsLoading(true);
    try {
      let query = supabase
        .from('transactions')
        .select('*', { count: 'exact' })
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });
      
      // Apply filters
      if (typeFilter !== "all") {
        if (typeFilter === "trade") {
          // Trade includes both purchase and sale
          query = query.in('type', ['purchase', 'sale']);
        } else {
          query = query.eq('type', typeFilter);
        }
      }
      
      if (statusFilter !== "all") {
        query = query.eq('status', statusFilter);
      }
      
      // Apply pagination
      const start = (currentPage - 1) * itemsPerPage;
      const end = start + itemsPerPage - 1;
      
      query = query.range(start, end);
      
      const { data, error, count } = await query;
      
      if (error) throw error;
      
      // Calculate total pages
      if (count !== null) {
        setTotalPages(Math.ceil(count / itemsPerPage));
      }
      
      const formattedTransactions: Transaction[] = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        type: item.type as 'deposit' | 'withdrawal' | 'purchase' | 'sale',
        currency: item.currency,
        amount: item.amount,
        status: item.status as 'pending' | 'approved' | 'rejected' | 'forfeited',
        createdAt: item.created_at,
        proof: item.proof || '',
        withdrawalAddress: item.withdrawal_address || '',
        secondaryCurrency: item.secondary_currency || '',
        secondaryAmount: item.secondary_amount || 0,
        description: item.description || ''
      }));
      
      setTransactions(formattedTransactions);
      setError(null);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError('Failed to load transactions');
    } finally {
      setIsLoading(false);
    }
  };

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  const filteredTransactions = transactions.filter(transaction => {
    const matchesSearch = searchQuery === "" || 
      transaction.currency.toLowerCase().includes(searchQuery.toLowerCase()) ||
      transaction.id.toLowerCase().includes(searchQuery.toLowerCase());
    
    return matchesSearch;
  });

  const handlePrevPage = () => {
    setCurrentPage(prev => Math.max(prev - 1, 1));
  };

  const handleNextPage = () => {
    setCurrentPage(prev => Math.min(prev + 1, totalPages));
  };

  const exportToCsv = () => {
    // Create CSV data
    const headers = ["Date", "Type", "Currency", "Amount", "Status"];
    let csvContent = headers.join(",") + "\n";
    
    transactions.forEach(tx => {
      const row = [
        new Date(tx.createdAt).toLocaleDateString(),
        tx.type,
        tx.currency,
        tx.amount,
        tx.status
      ];
      csvContent += row.join(",") + "\n";
    });
    
    // Create download link
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.setAttribute("href", url);
    link.setAttribute("download", `transactions-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Format transaction amounts for display
  const formatTransactionAmounts = (transaction: Transaction) => {
    const primaryAmount = (
      <div className={transaction.type === 'deposit' || transaction.type === 'purchase' ? 'text-green-600' : 'text-red-600'}>
        {transaction.type === 'deposit' || transaction.type === 'purchase' ? '+' : '-'}{transaction.amount} {transaction.currency}
      </div>
    );
    
    const secondaryAmount = transaction.secondaryAmount > 0 && (
      <div className={transaction.type === 'sale' ? 'text-green-600' : 'text-red-600'}>
        {transaction.type === 'sale' ? '+' : '-'}{transaction.secondaryAmount} {transaction.secondaryCurrency}
      </div>
    );
    
    return (
      <>
        {primaryAmount}
        {secondaryAmount}
      </>
    );
  };

  // For mobile view, we'll create a card-based layout
  const renderMobileView = () => (
    <div className="space-y-4">
      {isLoading ? (
        <div className="flex justify-center items-center p-8">
          <div className="w-8 h-8 border-4 border-t-fortunesly-primary border-gray-200 rounded-full animate-spin"></div>
          <span className="ml-2">Loading transactions...</span>
        </div>
      ) : filteredTransactions.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          {searchQuery || typeFilter !== "all" || statusFilter !== "all" ? 
            "No transactions match your filters." : 
            "You have no transactions yet."}
        </div>
      ) : (
        filteredTransactions.map(transaction => (
          <div key={transaction.id} className="bg-white rounded-lg shadow border p-4">
            <div className="flex justify-between items-start mb-3">
              <Badge variant="outline" className={typeColors[transaction.type]}>
                {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
              </Badge>
              <span className="text-xs text-gray-500">{formatDate(transaction.createdAt)}</span>
            </div>
            
            <div className="mb-2">
              <div className="font-medium">
                {transaction.type === 'deposit' 
                  ? `Deposit of ${transaction.amount} ${transaction.currency}`
                  : transaction.type === 'withdrawal'
                  ? `Withdrawal of ${transaction.amount} ${transaction.currency}`
                  : transaction.type === 'purchase'
                  ? `Purchase of ${transaction.amount} ${transaction.currency}`
                  : `Sale of ${transaction.amount} ${transaction.currency}`
                }
              </div>
            </div>
            
            <div className="flex justify-between items-center">
              <Badge variant="outline" className={statusColors[transaction.status]}>
                {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
              </Badge>
              <div className="text-right">
                {formatTransactionAmounts(transaction)}
              </div>
            </div>
            
            <div className="mt-2 text-xs text-gray-500 truncate">
              ID: {transaction.id.substring(0, 8)}...
            </div>
          </div>
        ))
      )}
    </div>
  );

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Transaction History</h1>
        <Button variant="outline" onClick={exportToCsv} disabled={transactions.length === 0}>
          <DownloadIcon className="mr-2 h-4 w-4" /> Export CSV
        </Button>
      </div>
      
      <Card className="border border-gray-200">
        <CardHeader className="p-4 border-b border-gray-200">
          <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
            <CardTitle className="text-lg font-semibold">All Transactions</CardTitle>
            <div className="flex flex-col space-y-2 sm:flex-row sm:space-y-0 sm:space-x-2">
              <Input 
                placeholder="Search by currency or ID"
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="max-w-[250px]"
              />
              <Select 
                value={typeFilter} 
                onValueChange={value => {
                  setTypeFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="deposit">Deposits</SelectItem>
                  <SelectItem value="withdrawal">Withdrawals</SelectItem>
                  <SelectItem value="purchase">Purchases</SelectItem>
                  <SelectItem value="sale">Sales</SelectItem>
                  <SelectItem value="trade">Trades</SelectItem>
                </SelectContent>
              </Select>
              <Select 
                value={statusFilter} 
                onValueChange={value => {
                  setStatusFilter(value);
                  setCurrentPage(1);
                }}
              >
                <SelectTrigger className="w-[150px]">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                  <SelectItem value="forfeited">Forfeited</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardHeader>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="w-8 h-8 border-4 border-t-fortunesly-primary border-gray-200 rounded-full animate-spin"></div>
              <span className="ml-2">Loading transactions...</span>
            </div>
          ) : error ? (
            <div className="text-center py-8 text-red-500">
              <p>{error}</p>
              <button 
                onClick={() => fetchTransactions()} 
                className="mt-2 text-sm text-fortunesly-primary hover:underline"
              >
                Try again
              </button>
            </div>
          ) : filteredTransactions.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              {searchQuery || typeFilter !== "all" || statusFilter !== "all" ? 
                "No transactions match your filters." : 
                "You have no transactions yet."}
            </div>
          ) : isMobile ? (
            <div className="p-4">
              {renderMobileView()}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredTransactions.map(transaction => (
                    <TableRow key={transaction.id}>
                      <TableCell>{formatDate(transaction.createdAt)}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={typeColors[transaction.type] || "bg-gray-100 text-gray-800"}>
                          {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        {transaction.currency}
                        {transaction.secondaryCurrency && (
                          <span className="text-xs text-gray-500 ml-1">
                            / {transaction.secondaryCurrency}
                          </span>
                        )}
                      </TableCell>
                      <TableCell>
                        {formatTransactionAmounts(transaction)}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className={statusColors[transaction.status]}>
                          {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell className="font-mono text-xs">{transaction.id.substring(0, 8)}...</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
          
          {totalPages > 1 && (
            <div className="flex items-center justify-between border-t border-gray-200 px-4 py-3">
              <div className="text-sm text-gray-500">
                Page {currentPage} of {totalPages}
              </div>
              <div className="flex space-x-2">
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handlePrevPage}
                  disabled={currentPage === 1}
                >
                  <ChevronLeft className="h-4 w-4" />
                  <span className="sr-only">Previous</span>
                </Button>
                <Button 
                  variant="outline" 
                  size="sm" 
                  onClick={handleNextPage}
                  disabled={currentPage === totalPages}
                >
                  <ChevronRight className="h-4 w-4" />
                  <span className="sr-only">Next</span>
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default TransactionsPage;
