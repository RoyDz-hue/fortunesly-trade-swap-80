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
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";

const WalletOverview = () => {
  const [wallets, setWallets] = useState<Wallet[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const [isDepositOpen, setIsDepositOpen] = useState(false);
  const [isWithdrawOpen, setIsWithdrawOpen] = useState(false);
  const [isCryptoDepositOpen, setIsCryptoDepositOpen] = useState(false);
  const [isCryptoWithdrawOpen, setIsCryptoWithdrawOpen] = useState(false);
  const [selectedWallet, setSelectedWallet] = useState<Wallet | null>(null);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  const [availableCoins, setAvailableCoins] = useState<Coin[]>([]);
  
  useEffect(() => {
    if (user) {
      const fetchData = async () => {
        setIsLoading(true);
        setError(null);
        try {
          console.log("Fetching coins and wallet data...");
          
          const { data: coinsData, error: coinsError } = await supabase
            .from('coins')
            .select('*')
            .order('symbol');
          
          if (coinsError) {
            console.error('Error fetching coins:', coinsError);
            throw coinsError;
          }
          
          console.log("Coins data:", coinsData);
          
          const coins = coinsData || [];
          const formattedCoins = coins.map(coin => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            depositAddress: coin.deposit_address,
            image: coin.image || `https://via.placeholder.com/40/6E59A5/ffffff?text=${coin.symbol}`,
            taxRate: 10
          }));
          setAvailableCoins(formattedCoins);
          
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('balance_crypto, balance_fiat')
            .eq('id', user.id)
            .single();
            
          if (userError) {
            console.error('Error fetching user balances:', userError);
            
            if (userError.code === 'PGRST116') {
              console.log("User not found, creating new user record");
              const randomPassword = Math.random().toString(36).slice(-10);
              
              const { data: newUser, error: insertError } = await supabase
                .from('users')
                .insert({
                  id: user.id,
                  email: user.email || '',
                  username: user.email?.split('@')[0] || 'user',
                  password: randomPassword,
                  balance_fiat: 0,
                  balance_crypto: {}
                })
                .select()
                .single();
                
              if (insertError) {
                console.error('Error creating user record:', insertError);
                throw insertError;
              }
              
              if (newUser) {
                console.log("New user created:", newUser);
                
                const walletsList: Wallet[] = [{
                  id: 'kes-wallet',
                  currency: 'KES',
                  balance: newUser.balance_fiat || 0,
                  type: 'fiat'
                }];
                
                formattedCoins.forEach(coin => {
                  if (coin.symbol !== 'KES') {
                    walletsList.push({
                      id: `${coin.symbol.toLowerCase()}-wallet`,
                      currency: coin.symbol,
                      balance: 0,
                      type: 'crypto'
                    });
                  }
                });
                
                setWallets(walletsList);
                setIsLoading(false);
                return;
              }
            }
            
            setError("Failed to load wallet balances. Please try again.");
            setWallets([]);
          } else if (userData) {
            console.log("User data:", userData);
            
            const walletsList: Wallet[] = [{
              id: 'kes-wallet',
              currency: 'KES',
              balance: userData.balance_fiat || 0,
              type: 'fiat'
            }];
            
            const cryptoBalances = userData.balance_crypto || {};
            console.log("Crypto balances:", cryptoBalances);
            
            formattedCoins.forEach(coin => {
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
            
            console.log("Final wallets list:", walletsList);
            setWallets(walletsList);
          }
        } catch (error) {
          console.error('Error fetching data:', error);
          setError("Failed to load wallet data. Please try again.");
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
  
  if (error) {
    return (
      <div className="space-y-6">
        <h2 className="text-2xl font-bold text-gray-900">Wallet Overview</h2>
        
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>{error}</AlertDescription>
        </Alert>
        
        <button 
          className="px-4 py-2 bg-fortunesly-primary text-white rounded-md hover:bg-fortunesly-primary/90"
          onClick={() => window.location.reload()}
        >
          Retry
        </button>
      </div>
    );
  }
  
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-gray-900">Wallet Overview</h2>
      
      {wallets.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No wallets found. Please contact support if you believe this is an error.</AlertDescription>
        </Alert>
      ) : (
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
      )}

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
