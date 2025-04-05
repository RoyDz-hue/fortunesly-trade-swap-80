
import { useState, useEffect } from "react";
import { Transaction } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Filter } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

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

const RecentTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("all");
  
  useEffect(() => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }
    
    fetchTransactions();
    
    // Set up realtime subscription for transactions
    const channel = supabase
      .channel('user-transactions-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
          filter: `user_id=eq.${user.id}`
        },
        (payload) => {
          console.log('Transaction change received:', payload);
          fetchTransactions();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [user, isAuthenticated]);
  
  const fetchTransactions = async () => {
    if (!isAuthenticated || !user) {
      setIsLoading(false);
      return;
    }
    
    try {
      setIsLoading(true);
      console.log("Fetching transactions for user:", user.id);
      
      const { data, error } = await supabase
        .from('transactions')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false })
        .limit(5);
        
      if (error) {
        console.error('Error fetching transactions:', error);
        setError('Failed to load transactions');
        return;
      }
      
      console.log("Fetched transactions:", data);
      
      // Map the Supabase data (snake_case) to our Transaction type (camelCase)
      const formattedTransactions: Transaction[] = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        type: (item.type === 'trade' ? 'purchase' : item.type) as 'deposit' | 'withdrawal' | 'purchase' | 'sale',
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
      console.error('Unexpected error:', err);
      setError('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  const renderSkeletons = () => (
    <div className="divide-y divide-gray-200">
      {[...Array(3)].map((_, i) => (
        <div key={i} className="p-4">
          <div className="flex justify-between items-start mb-2">
            <div className="flex items-center space-x-2">
              <Skeleton className="h-6 w-20" />
              <Skeleton className="h-6 w-24" />
            </div>
            <Skeleton className="h-5 w-32" />
          </div>
          <div className="flex justify-between items-center">
            <Skeleton className="h-5 w-48" />
            <Skeleton className="h-5 w-28" />
          </div>
        </div>
      ))}
    </div>
  );
  
  const handleViewAllClick = () => {
    navigate('/dashboard/transactions');
  };
  
  if (error) {
    console.error("Transaction component error:", error);
  }

  const filteredTransactions = transactions.filter(tx => {
    if (activeTab === "all") return true;
    if (activeTab === "trade") return tx.type === "purchase" || tx.type === "sale";
    return tx.type === activeTab;
  });
  
  const getTransactionDescription = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'deposit':
        return `Deposit of ${transaction.amount} ${transaction.currency}`;
      case 'withdrawal':
        return `Withdrawal of ${transaction.amount} ${transaction.currency}`;
      case 'purchase':
        return `Purchase of ${transaction.amount} ${transaction.currency}${transaction.secondaryAmount ? ` for ${transaction.secondaryAmount} ${transaction.secondaryCurrency}` : ''}`;
      case 'sale':
        return `Sale of ${transaction.amount} ${transaction.currency}${transaction.secondaryAmount ? ` for ${transaction.secondaryAmount} ${transaction.secondaryCurrency}` : ''}`;
      default:
        return transaction.description || `${transaction.amount} ${transaction.currency}`;
    }
  };

  const getTransactionChangeLabel = (transaction: Transaction) => {
    switch (transaction.type) {
      case 'deposit':
        return `+${transaction.amount} ${transaction.currency}`;
      case 'withdrawal':
        return `-${transaction.amount} ${transaction.currency}`;
      case 'purchase':
        return `+${transaction.amount} ${transaction.currency}${transaction.secondaryAmount ? `, -${transaction.secondaryAmount} ${transaction.secondaryCurrency}` : ''}`;
      case 'sale':
        return `-${transaction.amount} ${transaction.currency}${transaction.secondaryAmount ? `, +${transaction.secondaryAmount} ${transaction.secondaryCurrency}` : ''}`;
      default:
        return `${transaction.amount} ${transaction.currency}`;
    }
  };
  
  return (
    <Card className="border border-gray-200">
      <CardHeader className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-center">
          <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-auto">
            <TabsList className="grid grid-cols-4 h-8">
              <TabsTrigger value="all" className="text-xs">All</TabsTrigger>
              <TabsTrigger value="deposit" className="text-xs">Deposits</TabsTrigger>
              <TabsTrigger value="withdrawal" className="text-xs">Withdrawals</TabsTrigger>
              <TabsTrigger value="trade" className="text-xs">Trades</TabsTrigger>
            </TabsList>
          </Tabs>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          renderSkeletons()
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p>{error}</p>
            <button 
              onClick={() => fetchTransactions()} 
              className="mt-2 text-sm text-fortunesly-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : filteredTransactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            <p>No {activeTab !== "all" ? activeTab : ""} transactions found.</p>
            <p className="text-xs mt-2">Your transaction history will appear here.</p>
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {filteredTransactions.map((transaction) => (
              <div key={transaction.id} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex justify-between items-start mb-2">
                  <div className="flex items-start space-x-2">
                    <Badge variant="outline" className={typeColors[transaction.type]}>
                      {transaction.type.charAt(0).toUpperCase() + transaction.type.slice(1)}
                    </Badge>
                    <Badge variant="outline" className={statusColors[transaction.status]}>
                      {transaction.status.charAt(0).toUpperCase() + transaction.status.slice(1)}
                    </Badge>
                  </div>
                  <span className="text-sm text-gray-500">{formatDate(transaction.createdAt)}</span>
                </div>
                <div className="flex flex-col">
                  <div className="text-sm text-gray-700">
                    {getTransactionDescription(transaction)}
                  </div>
                  <div className="text-sm font-medium mt-1">
                    {getTransactionChangeLabel(transaction)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="p-4 border-t border-gray-200">
          <button 
            className="w-full py-2 text-sm font-medium text-center text-fortunesly-primary hover:text-fortunesly-accent transition-colors"
            onClick={handleViewAllClick}
          >
            View All Transactions
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
