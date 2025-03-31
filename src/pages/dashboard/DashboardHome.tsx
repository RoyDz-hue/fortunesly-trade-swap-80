
import { useState, useEffect } from "react";
import WalletOverview from "@/components/dashboard/WalletOverview";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import MarketOverview from "@/components/dashboard/MarketOverview";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { ArrowRight, Wallet, TrendingUp } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { supabase } from "@/integrations/supabase/client";

// Main Dashboard Home Component
const DashboardHome = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [isDataLoading, setIsDataLoading] = useState(true);
  
  useEffect(() => {
    // Preload the user data when dashboard loads
    const preloadData = async () => {
      if (!user) return;
      
      try {
        await supabase
          .from('users')
          .select('balance_crypto, balance_fiat')
          .eq('id', user.id)
          .single();
          
        await supabase
          .from('coins')
          .select('*')
          .order('symbol');
      } catch (error) {
        console.error('Error preloading data:', error);
      } finally {
        setIsDataLoading(false);
      }
    };
    
    preloadData();
  }, [user]);
  
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => navigate('/dashboard/trade')}
          >
            <TrendingUp className="mr-2 h-4 w-4" />
            Trade Now
          </Button>
          <Button onClick={() => navigate('/dashboard/wallet')}>
            <Wallet className="mr-2 h-4 w-4" />
            Manage Wallet
          </Button>
        </div>
      </div>
      
      <WalletOverview />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentTransactions />
        <MarketOverview />
      </div>
    </div>
  );
};

export default DashboardHome;
