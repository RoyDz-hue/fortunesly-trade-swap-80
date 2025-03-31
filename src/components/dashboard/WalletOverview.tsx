
import { useState, useEffect } from "react";
import { Wallet, Coin } from "@/types";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import DepositDialog from "./DepositDialog";
import WithdrawDialog from "./WithdrawDialog";
import CryptoDepositDialog from "./CryptoDepositDialog";
import CryptoWithdrawDialog from "./CryptoWithdrawDialog";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";

const WalletOverview = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isCryptoDepositOpen, setIsCryptoDepositOpen] = useState(false);
  const [isCryptoWithdrawOpen, setIsCryptoWithdrawOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [availableCoins, setAvailableCoins] = useState<Coin[]>([]);
  
  // Fetch balances and coins from database
  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setIsLoading(true);
        try {
          // Fetch all available coins from the database
          const { data: coinsData, error: coinsError } = await supabase
            .from('coins')
            .select('*')
            .order('symbol');
          
          if (coinsError) throw coinsError;
          
          // Convert coins to the format we need
          const coins = coinsData || [];
          const formattedCoins = coins.map(coin => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            depositAddress: coin.deposit_address,
            image: coin.image || `https://via.placeholder.com/40/6E59A5/ffffff?text=${coin.symbol}`,
            taxRate: 10 // Default tax rate
          }));
          setAvailableCoins(formattedCoins);
          
          // Fetch user balances
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('balance_crypto, balance_fiat')
            .eq('id', user.id)
            .single();
            
          if (userError) {
            console.error('Error fetching user balances:', userError);
            toast({
              title: "Error",
              description: "Failed to fetch wallet balances",
              variant: "destructive"
            });
            setWallets([]);
          } else if (userData) {
            // Create wallets from KES balance
            const walletsList: Wallet[] = [{
              id: 'kes-wallet',
              currency: 'KES',
              balance: userData.balance_fiat || 0,
              type: 'fiat'
            }];
            
            // Add crypto wallets from balance_crypto
            const cryptoBalances = userData.balance_crypto || {};
            
            // Create a wallet for each available coin
            formattedCoins.forEach(coin => {
              // Skip KES as it's already added as fiat
              if (coin.symbol !== 'KES') {
                const balance = (cryptoBalances as Record<string, number>)[coin.symbol] || 0;
                walletsList.push({
                  id: `${coin.symbol.toLowerCase()}-wallet`,
                  currency: coin.symbol,
                  balance: balance,
                  type: 'crypto'
                });
              }
            });
            
            setWallets(walletsList);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          toast({
            title: "Error",
            description: "Failed to load wallet data",
            variant: "destructive"
          });
        } finally {
          setIsLoading(false);
        }
      };
      
      fetchData();
    }
  }, [user, toast]);

  const handleDepositClick = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    if (wallet.type === 'fiat') {
      setIsDepositOpen(true);
    } else {
      // Find the coin data for this wallet
      const coinData = availableCoins.find(coin => coin.symbol === wallet.currency);
      if (coinData) {
        setSelectedCoin(coinData);
        setIsCryptoDepositOpen(true);
      } else {
        toast({
          title: "Error",
          description: "Coin information not found",
          variant: "destructive"
        });
      }
    }
  };

  const handleWithdrawClick = (wallet: Wallet) => {
    setSelectedWallet(wallet);
    if (wallet.type === 'fiat') {
      setIsWithdrawOpen(true);
    } else {
      // Find the coin data for this wallet
      const coinData = availableCoins.find(coin => coin.symbol === wallet.currency);
      if (coinData) {
        setSelectedCoin(coinData);
        setIsCryptoWithdrawOpen(true);
      } else {
        toast({
          title: "Error",
          description: "Coin information not found",
          variant: "destructive"
        });
      }
    }
  };

  const handleTransactionSuccess = () => {
    // Reload wallet data after a transaction
    if (user) {
      setIsLoading(true);
      supabase
        .from('users')
        .select('balance_crypto, balance_fiat')
        .eq('id', user.id)
        .single()
        .then(({ data, error }) => {
          if (error) {
            console.error('Error refreshing balances:', error);
          } else if (data) {
            // Update wallets with new balances
            const updatedWallets = wallets.map(wallet => {
              if (wallet.currency === 'KES') {
                return { ...wallet, balance: data.balance_fiat || 0 };
              } else {
                const cryptoBalances = data.balance_crypto || {};
                return { 
                  ...wallet, 
                  balance: (cryptoBalances as Record<string, number>)[wallet.currency] || 0 
                };
              }
            });
            
            setWallets(updatedWallets);
          }
          setIsLoading(false);
        });
    }
  };
  
  if (isLoading) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Wallet Overview</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1, 2, 3].map((i) => (
            <Card key={i} className="overflow-hidden border border-gray-200">
              <CardHeader className="p-4 bg-gray-50 border-b border-gray-200">
                <div className="flex items-center">
                  <Skeleton className="w-8 h-8 mr-3 rounded-full" />
                  <Skeleton className="h-4 w-24" />
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <Skeleton className="h-4 w-20" />
                  <Skeleton className="h-4 w-32" />
                </div>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <Skeleton className="h-10" />
                  <Skeleton className="h-10" />
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Wallet Overview</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {wallets.map((wallet) => {
          const coin = availableCoins.find(c => c.symbol === wallet.currency);
          
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
                    {coin?.name || wallet.currency} ({wallet.currency})
                  </CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-4">
                <div className="flex justify-between items-center">
                  <div className="text-gray-500 text-sm">Available Balance</div>
                  <div className="font-medium">{wallet.balance.toLocaleString()} {wallet.currency}</div>
                </div>
                <div className="mt-6 grid grid-cols-2 gap-2">
                  <button 
                    className="py-2 text-xs font-medium text-center text-white bg-fortunesly-primary rounded-md hover:bg-fortunesly-primary/90 transition-colors"
                    onClick={() => handleDepositClick(wallet)}
                  >
                    Deposit
                  </button>
                  <button 
                    className="py-2 text-xs font-medium text-center text-fortunesly-primary bg-white border border-fortunesly-primary rounded-md hover:bg-gray-50 transition-colors"
                    onClick={() => handleWithdrawClick(wallet)}
                  >
                    Withdraw
                  </button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Dialogs */}
      {selectedWallet?.type === 'fiat' && (
        <>
          <DepositDialog
            isOpen={isDepositOpen}
            onClose={() => setIsDepositOpen(false)}
            currency={selectedWallet.currency}
            onSuccess={handleTransactionSuccess}
          />
          <WithdrawDialog
            isOpen={isWithdrawOpen}
            onClose={() => setIsWithdrawOpen(false)}
            currency={selectedWallet.currency}
            maxAmount={selectedWallet.balance}
            onSuccess={handleTransactionSuccess}
          />
        </>
      )}
      
      {selectedCoin && (
        <>
          <CryptoDepositDialog
            isOpen={isCryptoDepositOpen}
            onClose={() => setIsCryptoDepositOpen(false)}
            coin={selectedCoin}
            onSuccess={handleTransactionSuccess}
          />
          <CryptoWithdrawDialog
            isOpen={isCryptoWithdrawOpen}
            onClose={() => setIsCryptoWithdrawOpen(false)}
            coin={selectedCoin}
            maxAmount={selectedWallet?.balance || 0}
            onSuccess={handleTransactionSuccess}
          />
        </>
      )}
    </div>
  );
};

export default WalletOverview;
