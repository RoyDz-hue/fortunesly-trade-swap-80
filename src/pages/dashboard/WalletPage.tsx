
import { useState } from "react";
import WalletOverview from "@/components/dashboard/WalletOverview";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import DepositDialog from "@/components/dashboard/DepositDialog";
import WithdrawDialog from "@/components/dashboard/WithdrawDialog";
import { Button } from "@/components/ui/button";
import { Coins, Download, Upload } from "lucide-react";

// Wallet Page
const WalletPage = () => {
  const [isDepositDialogOpen, setIsDepositDialogOpen] = useState(false);
  const [isWithdrawDialogOpen, setIsWithdrawDialogOpen] = useState(false);
  
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">My Wallet</h1>
        
        <div className="flex space-x-2">
          <Button 
            variant="outline"
            onClick={() => setIsDepositDialogOpen(true)}
          >
            <Download className="mr-2 h-4 w-4" />
            Deposit
          </Button>
          <Button onClick={() => setIsWithdrawDialogOpen(true)}>
            <Upload className="mr-2 h-4 w-4" />
            Withdraw
          </Button>
        </div>
      </div>
      
      <WalletOverview />
      
      <div className="mt-6">
        <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaction History</h2>
        <RecentTransactions />
      </div>
      
      {/* Deposit Dialog */}
      <DepositDialog 
        isOpen={isDepositDialogOpen}
        onClose={() => setIsDepositDialogOpen(false)}
        currency="KES"
        onSuccess={() => {
          // Reload wallet data
        }}
      />
      
      {/* Withdraw Dialog */}
      <WithdrawDialog 
        isOpen={isWithdrawDialogOpen}
        onClose={() => setIsWithdrawDialogOpen(false)}
        onSuccess={() => {
          // Reload wallet data
        }}
      />
    </div>
  );
};

export default WalletPage;
