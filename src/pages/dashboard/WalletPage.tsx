
import { useState } from "react";
import WalletOverview from "@/components/dashboard/WalletOverview";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import { Button } from "@/components/ui/button";
import { Coins } from "lucide-react";
import { useAuth } from "@/context/AuthContext";

// Wallet Page
const WalletPage = () => {
  const { user } = useAuth();
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
        
        <div className="flex space-x-2">
          <Button 
            variant="default"
          >
            <Coins className="mr-2 h-4 w-4" />
            Manage Assets
          </Button>
        </div>
      </div>
      
      <WalletOverview />
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaction History</h2>
        <RecentTransactions />
      </div>
    </div>
  );
};

export default WalletPage;
