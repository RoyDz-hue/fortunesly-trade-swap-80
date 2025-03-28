
import { useState, useEffect } from "react";
import { Wallet, Coin } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockCoins, generateWallets } from "@/data/mockData";
import { useAuth } from "@/context/AuthContext";

const WalletOverview = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const { user } = useAuth();
  
  // Mock loading wallets from API
  useEffect(() => {
    if (user) {
      // Simulate API delay
      const fetchData = setTimeout(() => {
        setWallets(generateWallets(user.id));
      }, 500);
      
      return () => clearTimeout(fetchData);
    }
  }, [user]);
  
  const findCoin = (symbol: string): Coin | undefined => {
    return mockCoins.find(coin => coin.symbol === symbol);
  };
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Wallet Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets.map((wallet) => {
          const coin = findCoin(wallet.currency);
          
          return (
            <Card key={wallet.id} className="overflow-hidden border border-gray-200 hover:shadow-md transition-shadow">
              <CardHeader className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center">
                  <div className="w-8 h-8 mr-3 rounded-full overflow-hidden flex-shrink-0">
                    <img 
                      src={coin?.image} 
                      alt={wallet.currency} 
                      className="w-full h-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/32/6E59A5/ffffff?text=${wallet.currency}`;
                      }}
                    />
                  </div>
                  <CardTitle className="text-base font-semibold">
                    {coin?.name} ({wallet.currency})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="text-gray-500 text-sm">Available Balance</div>
                  <div className="font-medium">{wallet.balance.toLocaleString()} {wallet.currency}</div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <button className="py-2 text-xs font-medium text-center text-white bg-fortunesly-primary rounded-md hover:bg-fortunesly-primary/90 transition-colors">
                    Deposit
                  </button>
                  <button className="py-2 text-xs font-medium text-center text-fortunesly-primary bg-white border border-fortunesly-primary rounded-md hover:bg-gray-50 transition-colors">
                    Withdraw
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default WalletOverview;
