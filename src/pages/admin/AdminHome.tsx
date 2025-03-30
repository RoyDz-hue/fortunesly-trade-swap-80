
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowUp, ArrowDown, DollarSign, Coins, Users, BarChart3 } from "lucide-react";
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";

const AdminHome = () => {
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalDeposits: 0,
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

        // Get pending withdrawals count
        const { count: pendingCount, error: pendingError } = await supabase
          .from('withdrawals')
          .select('*', { count: 'exact', head: true })
          .eq('status', 'pending');

        // Get total transactions stats
        const { data: deposits, error: depositsError } = await supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'deposit');

        const { data: withdrawals, error: withdrawalsError } = await supabase
          .from('transactions')
          .select('amount')
          .eq('type', 'withdrawal');

        // Calculate totals
        const totalDeposits = deposits?.reduce((sum, item) => sum + item.amount, 0) || 0;
        const totalWithdrawals = withdrawals?.reduce((sum, item) => sum + item.amount, 0) || 0;

        setStats({
          totalUsers: userCount || 0,
          totalDeposits,
          totalWithdrawals,
          pendingApprovals: pendingCount || 0
        });
      } catch (error) {
        console.error("Error fetching admin dashboard data:", error);
      } finally {
        setIsLoading(false);
      }
    }

    fetchDashboardStats();
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
            <CardTitle className="text-sm font-medium">Total Deposits</CardTitle>
            <ArrowDown className="w-4 h-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "Loading..." : `${stats.totalDeposits.toLocaleString()} KES`}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-2 space-y-0">
            <CardTitle className="text-sm font-medium">Total Withdrawals</CardTitle>
            <ArrowUp className="w-4 h-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {isLoading ? "Loading..." : `${stats.totalWithdrawals.toLocaleString()} KES`}
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
      
      {/* Additional dashboard content can be added here */}
    </div>
  );
};

export default AdminHome;
