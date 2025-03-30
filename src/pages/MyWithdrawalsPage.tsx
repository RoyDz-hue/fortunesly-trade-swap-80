
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Button } from "@/components/ui/button";
import { CryptoWithdrawDialog } from "@/components/dashboard/CryptoWithdrawDialog";
import { WithdrawDialog } from "@/components/dashboard/WithdrawDialog";
import { Coin } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Wallet, ArrowUpRight } from "lucide-react";

interface Withdrawal {
  id: string;
  currency: string;
  amount: number;
  status: "pending" | "approved" | "rejected" | "forfeited";
  createdAt: string;
  userAddress: string;
  userId: string;
}

const MyWithdrawalsPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [withdrawals, setWithdrawals] = useState<Withdrawal[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  const [isCryptoWithdrawDialogOpen, setIsCryptoWithdrawDialogOpen] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [availableCoins, setAvailableCoins] = useState<Coin[]>([]);
  const [availableBalances, setAvailableBalances] = useState<Record<string, number>>({});
  
  useEffect(() => {
    if (user) {
      fetchData();
    }
  }, [user]);
  
  const fetchData = async () => {
    setIsLoading(true);
    try {
      // Fetch withdrawals
      const { data: withdrawalData, error: withdrawalError } = await supabase
        .from('withdrawals')
        .select('*')
        .eq('user_id', user?.id)
        .order('created_at', { ascending: false });
        
      if (withdrawalError) throw withdrawalError;
      
      // Format withdrawals
      const formattedWithdrawals: Withdrawal[] = withdrawalData.map(item => ({
        id: item.id,
        currency: item.currency,
        amount: item.amount,
        status: item.status as "pending" | "approved" | "rejected" | "forfeited",
        createdAt: item.created_at,
        userAddress: item.user_address,
        userId: item.user_id
      }));
      
      setWithdrawals(formattedWithdrawals);
      
      // Fetch available coins
      const { data: coinData, error: coinError } = await supabase
        .from('coins')
        .select('*')
        .eq('status', 'active');
        
      if (coinError) throw coinError;
      
      const formattedCoins: Coin[] = coinData.map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        taxRate: coin.tax_rate || 10,
        status: 'active',
        depositAddress: coin.deposit_address,
        image: coin.image
      }));
      
      setAvailableCoins(formattedCoins);
      
      // Fetch user balances
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('balance_crypto, balance_fiat')
        .eq('id', user?.id)
        .single();
        
      if (userError) throw userError;
      
      // Set balances
      const balances: Record<string, number> = {
        KES: userData.balance_fiat || 0
      };
      
      if (userData.balance_crypto) {
        Object.entries(userData.balance_crypto as Record<string, number>).forEach(
          ([currency, amount]) => {
            balances[currency] = amount;
          }
        );
      }
      
      setAvailableBalances(balances);
      
    } catch (error) {
      console.error("Error fetching data:", error);
      toast({
        title: "Error loading data",
        description: "Could not load your withdrawals and balances",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCryptoWithdraw = (coin: Coin) => {
    setSelectedCoin(coin);
    setIsCryptoWithdrawDialogOpen(true);
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  const getStatusBadgeStyles = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'forfeited':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Withdrawals</h1>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => setIsWithdrawDialogOpen(true)}
          >
            <Wallet className="mr-2 h-4 w-4" />
            KES Withdrawal
          </Button>
          
          <Button onClick={() => {
            if (availableCoins.length > 0) {
              handleCryptoWithdraw(availableCoins[0]);
            } else {
              toast({
                title: "No coins available",
                description: "There are currently no cryptocurrencies available for withdrawal",
                variant: "destructive"
              });
            }
          }}>
            <ArrowUpRight className="mr-2 h-4 w-4" />
            Crypto Withdrawal
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Withdrawal History</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="p-8 text-center">
              <p>Loading withdrawals...</p>
            </div>
          ) : withdrawals.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <p>No withdrawal requests found</p>
              <p className="text-sm mt-2">Your withdrawal history will appear here</p>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Address/Phone</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {withdrawals.map((withdrawal) => (
                    <TableRow key={withdrawal.id}>
                      <TableCell>{formatDate(withdrawal.createdAt)}</TableCell>
                      <TableCell>{withdrawal.currency}</TableCell>
                      <TableCell>{withdrawal.amount}</TableCell>
                      <TableCell>
                        <Badge variant="outline" className={getStatusBadgeStyles(withdrawal.status)}>
                          {withdrawal.status.charAt(0).toUpperCase() + withdrawal.status.slice(1)}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <span className="font-mono text-xs truncate max-w-[150px] inline-block">
                          {withdrawal.userAddress}
                        </span>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* KES Withdrawal Dialog */}
      <WithdrawDialog 
        isOpen={isWithdrawDialogOpen}
        onClose={() => setIsWithdrawDialogOpen(false)}
        onSuccess={() => {
          fetchData();
          setIsWithdrawDialogOpen(false);
        }}
      />
      
      {/* Crypto Withdrawal Dialog */}
      {selectedCoin && (
        <CryptoWithdrawDialog
          isOpen={isCryptoWithdrawDialogOpen}
          onClose={() => setIsCryptoWithdrawDialogOpen(false)}
          coin={selectedCoin}
          maxAmount={availableBalances[selectedCoin.symbol] || 0}
          onSuccess={() => {
            fetchData();
            setIsCryptoWithdrawDialogOpen(false);
          }}
        />
      )}
    </div>
  );
};

export default MyWithdrawalsPage;
