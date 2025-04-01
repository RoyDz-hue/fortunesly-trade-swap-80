
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, DollarSign, Coins, Users, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminHome = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalKesDeposits: 0,
    totalCryptoDeposits: 0,
    totalWithdrawals: 0,
    pendingApprovals: 0
  });
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    async function fetchDashboardStats() {
      setIsLoading(true);
      try {
        // Get user count
        const { count: userCount, error: userError } = await supabase
          .from('users')
          .select('*', { count: 'exact', head: true });

        if (userError) throw userError;

        // Get pending approvals count (deposits + withdrawals)
        const { count: pendingDepositsCount, error: pendingDepositsError } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
          .eq('type', 'deposit');
          
        if (pendingDepositsError) throw pendingDepositsError;
        
        const { count: pendingWithdrawalsCount, error: pendingWithdrawalsError } = await supabase
          .from('transactions')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending')
          .eq('type', 'withdrawal');
          
        if (pendingWithdrawalsError) throw pendingWithdrawalsError;

        // Get KES deposits
        const { data: kesDeposits, error: kesDepositsError } = await supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'deposit')
          .eq('currency', 'KES')
          .eq('status', 'approved');

        if (kesDepositsError) throw kesDepositsError;

        // Get crypto deposits (all currencies except KES)
        const { data: cryptoDeposits, error: cryptoDepositsError } = await supabase
          .from('transactions')
          .select('amount, currency')
          .eq('type', 'deposit')
          .neq('currency', 'KES')
          .eq('status', 'approved');
          
        if (cryptoDepositsError) throw cryptoDepositsError;

        // Get withdrawals
        const { data: withdrawals, error: withdrawalsError } = await supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'withdrawal')
          .eq('status', 'approved');

        if (withdrawalsError) throw withdrawalsError;
        
        // Calculate totals
        const totalKesDeposits = kesDeposits
          ? kesDeposits.reduce((sum, item) => sum + Number(item.amount), 0)
          : 0;
          
        const totalCryptoDeposits = cryptoDeposits
          ? cryptoDeposits.reduce((sum, item) => sum + Number(item.amount), 0)
          : 0;
          
        const totalWithdrawals = withdrawals
          ? withdrawals.reduce((sum, item) => sum + Number(item.amount), 0)
          : 0;

        const pendingApprovals = (pendingDepositsCount || 0) + (pendingWithdrawalsCount || 0);
          
        console.log("Stats calculated:", {
          totalUsers: userCount || 0,
          totalKesDeposits,
          totalCryptoDeposits,
          totalWithdrawals,
          pendingApprovals
        });

        setStats({
          totalUsers: userCount || 0,
          totalKesDeposits,
          totalCryptoDeposits,
          totalWithdrawals,
          pendingApprovals
        });
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardStats();
    
    // Set up a refresh interval (every 30 seconds)
    const interval = setInterval(() => {
      fetchDashboardStats();
    }, 30000);
    
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="w-4 h-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "Loading..." : stats.totalUsers}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">KES Deposits</CardTitle>
            <DollarSign className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "Loading..." : `${stats.totalKesDeposits.toLocaleString()} KES`}
            </div>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Crypto Deposits</CardTitle>
            <Coins className="w-4 h-4 text-blue-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "Loading..." : stats.totalCryptoDeposits.toLocaleString()}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Pending Approvals</CardTitle>
            <BarChart3 className="w-4 h-4 text-amber-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "Loading..." : stats.pendingApprovals}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default AdminHome;
