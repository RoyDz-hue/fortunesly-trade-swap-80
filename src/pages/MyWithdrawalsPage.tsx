
import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database } from "@/integrations/supabase/types";

type WithdrawalStatus = Database["public"]["Enums"]["withdrawal_status"];

// Function to format date
const formatDate = (dateString: string | null) => {
  if (!dateString) return 'N/A';
  return new Date(dateString).toLocaleDateString('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
};

interface Withdrawal {
  id: string;
  currency: string;
  amount: number;
  status: WithdrawalStatus;
  date: string;
  address: string;
  userId: string;
}

// Define a simpler interface to avoid excessive type instantiation
interface RawWithdrawal {
  id: string;
  currency: string;
  amount: number;
  status: string;
  created_at: string | null;
  user_address: string;
  user_id: string | null;
}

const MyWithdrawalsPage = () => {
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const { user } = useAuth();

  useEffect(() => {
    const fetchWithdrawals = async () => {
      if (!user) {
        setWithdrawals([]);
        setIsLoading(false);
        return;
      }
      
      try {
        setIsLoading(true);
        
        const { data: withdrawalData, error: withdrawalError } = await supabase
          .from('withdrawals')
          .select('*')
          .eq('user_id', user.id)
          .order('created_at', { ascending: false });
        
        if (withdrawalError) throw withdrawalError;
        
        // Format withdrawals using the simpler interface to avoid excessive type instantiation
        const formattedWithdrawals = (withdrawalData as unknown as RawWithdrawal[]).map(item => ({
          id: item.id,
          currency: item.currency,
          amount: item.amount,
          status: item.status as WithdrawalStatus,
          date: formatDate(item.created_at),
          address: item.user_address,
          userId: item.user_id || ""
        }));
        
        setWithdrawals(formattedWithdrawals);
      } catch (error) {
        console.error('Error fetching withdrawals:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchWithdrawals();
  }, [user]);

  // Get status badge color
  const getStatusColor = (status: WithdrawalStatus) => {
    switch (status) {
      case "approved":
        return "bg-green-100 text-green-800 border-green-200";
      case "rejected":
        return "bg-red-100 text-red-800 border-red-200";
      case "forfeited":
        return "bg-purple-100 text-purple-800 border-purple-200";
      default:
        return "bg-yellow-100 text-yellow-800 border-yellow-200";
    }
  };

  if (isLoading) {
    return <div>Loading withdrawals...</div>;
  }

  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">My Withdrawals</h1>
      
      {withdrawals.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">You have not made any withdrawal requests yet.</p>
        </div>
      ) : (
        <div className="grid gap-4">
          {withdrawals.map(withdrawal => (
            <Card key={withdrawal.id}>
              <CardContent className="p-6">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="font-semibold text-lg">{withdrawal.amount} {withdrawal.currency}</h3>
                    <p className="text-sm text-gray-500 mt-1">
                      {withdrawal.date}
                    </p>
                    <p className="text-xs text-gray-400 mt-2 font-mono break-all">
                      Address: {withdrawal.address}
                    </p>
                  </div>
                  <Badge className={getStatusColor(withdrawal.status)}>
                    {withdrawal.status}
                  </Badge>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
      
      <div className="mt-6">
        <Button asChild variant="outline">
          <Link to="/dashboard/wallet">Back to Wallet</Link>
        </Button>
      </div>
    </div>
  );
};

export default MyWithdrawalsPage;
