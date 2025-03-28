
import { useState, useEffect } from "react";
import { Transaction } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { generateTransactions } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";

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
  const { user } = useAuth();
  
  // Mock loading transactions from API
  useEffect(() => {
    if (user) {
      // Simulate API delay
      const fetchData = setTimeout(() => {
        const userTransactions = generateTransactions(user.id);
        // Sort by date (newest first)
        userTransactions.sort((a, b) => 
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
        );
        setTransactions(userTransactions.slice(0, 5)); // Get only 5 most recent
      }, 700);
      
      return () => clearTimeout(fetchData);
    }
  }, [user]);
  
  const formatDate = (dateString: string): string => {
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };
  
  return (
    <Card className="border border-gray-200">
      <CardHeader className="p-4 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold">Recent Transactions</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {transactions.length === 0 ? (
          <div className="p-8 text-center text-gray-500">
            Loading transactions...
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
