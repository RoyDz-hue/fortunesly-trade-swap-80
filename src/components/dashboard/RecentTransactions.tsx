
import { useState, useEffect } from "react";
import { Transaction } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";

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

const RecentTransactions = () => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user, isAuthenticated } = useAuth();
  
  useEffect(() => {
    const fetchTransactions = async () => {
      if (!isAuthenticated || !user) {
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
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
        
        // Map the Supabase data (snake_case) to our Transaction type (camelCase)
        const formattedTransactions: Transaction[] = data.map(item => ({
          id: item.id,
          userId: item.user_id,
          type: item.type as 'deposit' | 'withdrawal',
          currency: item.currency,
          amount: item.amount,
          status: item.status as 'pending' | 'approved' | 'rejected' | 'forfeited',
          createdAt: item.created_at,
          // Only add optional properties if they exist in the item
          updatedAt: new Date().toISOString(), // Default to current time since updated_at isn't available
          proof: '', // Default empty since proof isn't available
          withdrawalAddress: '' // Default empty since withdrawal_address isn't available
        }));
        
        setTransactions(formattedTransactions);
      } catch (err) {
        console.error('Unexpected error:', err);
        setError('An unexpected error occurred');
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchTransactions();
  }, [user, isAuthenticated]);
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  // Loading skeletons
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
  
  return (
    <Card className="border border-gray-200">
      <CardHeader className="p-4 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          renderSkeletons()
        ) : error ? (
          <div className="p-8 text-center text-red-500">
            <p>{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-2 text-sm text-fortunesly-primary hover:underline"
            >
              Try again
            </button>
          </div>
        ) : transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            No transactions found. Your recent transactions will appear here.
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {transactions.map((transaction) => (
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
                <div className="flex justify-between items-center">
                  <div className="text-sm text-gray-700">
                    {transaction.type === 'deposit' 
                      ? `Deposit of ${transaction.amount} ${transaction.currency}` 
                      : `Withdrawal of ${transaction.amount} ${transaction.currency}`}
                  </div>
                  <div className={`font-medium ${transaction.type === 'deposit' ? 'text-green-600' : 'text-red-600'}`}>
                    {transaction.type === 'deposit' ? '+' : '-'}{transaction.amount} {transaction.currency}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="p-4 border-t border-gray-200">
          <button className="w-full py-2 text-sm font-medium text-center text-fortunesly-primary hover:text-fortunesly-accent transition-colors">
            View All Transactions
          </button>
        </div>
      </CardContent>
    </Card>
  );
};

export default RecentTransactions;
