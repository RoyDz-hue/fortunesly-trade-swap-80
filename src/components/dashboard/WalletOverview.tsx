import { useState, useEffect } from "react";
import { Wallet, Coin } from "@/types";
import { Card, CardContent } from "@/components/ui/card";
import { useAuth } from "@/context/AuthContext";
import DepositDialog from "./DepositDialog";
import WithdrawDialog from "./WithdrawDialog";
import CryptoDepositDialog from "./CryptoDepositDialog";
import CryptoWithdrawDialog from "./CryptoWithdrawDialog";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ArrowDownCircle, ArrowUpCircle, ChevronDown, ChevronRight } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
            image: coin.icon_url || `https://via.placeholder.com/40/6E59A5/ffffff?text=${coin.symbol}`,
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
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Wallet</h2>
        <div className="flex justify-end space-x-2 mb-4">
          <Skeleton className="h-10 w-24" />
          <Skeleton className="h-10 w-24" />
        </div>
        <Card className="overflow-hidden">
          <CardContent className="p-0">
            {[1, 2, 3].map((i) => (
              <div key={i} className="flex items-center justify-between p-4 border-b border-gray-100">
                <div className="flex items-center">
                  <Skeleton className="w-8 h-8 mr-3 rounded-full" />
                  <div>
                    <Skeleton className="h-4 w-24 mb-1" />
                    <Skeleton className="h-3 w-16" />
                  </div>
                </div>
                <Skeleton className="h-4 w-20" />
              </div>
            ))}
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error) {
    return (
      <div className="space-y-4">
        <h2 className="text-xl font-bold text-gray-900">Wallet</h2>
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
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold text-gray-900">Wallet</h2>
        <div className="flex space-x-2">
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center px-3 py-2 text-sm font-medium text-white bg-fortunesly-primary rounded-md hover:bg-fortunesly-primary/90 transition-colors">
              <ArrowDownCircle className="h-4 w-4 mr-1" />
              Deposit
              <ChevronDown className="h-4 w-4 ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {wallets.map((wallet) => (
                <DropdownMenuItem 
                  key={`deposit-${wallet.id}`} 
                  className="cursor-pointer"
                  onClick={() => handleDepositClick(wallet)}
                >
                  <div className="flex items-center w-full">
                    <div className="w-5 h-5 mr-2 rounded-full overflow-hidden flex-shrink-0">
                      <img 
                        src={wallet.currency === "KES" 
                          ? "https://bfsodqqylpfotszjlfuk.supabase.co/storage/v1/object/public/apps//kenya.png" 
                          : availableCoins.find(c => c.symbol === wallet.currency)?.image} 
                        alt={wallet.currency} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://via.placeholder.com/20/6E59A5/ffffff?text=${wallet.currency}`;
                          target.onerror = null;
                        }}
                      />
                    </div>
                    <span>{wallet.currency}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
          
          <DropdownMenu>
            <DropdownMenuTrigger className="flex items-center px-3 py-2 text-sm font-medium text-fortunesly-primary bg-white border border-fortunesly-primary rounded-md hover:bg-gray-50 transition-colors">
              <ArrowUpCircle className="h-4 w-4 mr-1" />
              Withdraw
              <ChevronDown className="h-4 w-4 ml-1" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {wallets.map((wallet) => (
                <DropdownMenuItem 
                  key={`withdraw-${wallet.id}`} 
                  className="cursor-pointer"
                  onClick={() => handleWithdrawClick(wallet)}
                >
                  <div className="flex items-center w-full">
                    <div className="w-5 h-5 mr-2 rounded-full overflow-hidden flex-shrink-0">
                      <img 
                        src={wallet.currency === "KES" 
                          ? "https://bfsodqqylpfotszjlfuk.supabase.co/storage/v1/object/public/apps//kenya.png" 
                          : availableCoins.find(c => c.symbol === wallet.currency)?.image} 
                        alt={wallet.currency} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://via.placeholder.com/20/6E59A5/ffffff?text=${wallet.currency}`;
                          target.onerror = null;
                        }}
                      />
                    </div>
                    <span>{wallet.currency}</span>
                  </div>
                </DropdownMenuItem>
              ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {wallets.length === 0 ? (
        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>No wallets found. Please contact support if you believe this is an error.</AlertDescription>
        </Alert>
      ) : (
        <Card className="overflow-hidden shadow-sm">
          <CardContent className="p-0">
            {wallets.map((wallet, index) => {
              const coin = availableCoins.find(c => c.symbol === wallet.currency);
              const isLast = index === wallets.length - 1;

              return (
                <div 
                  key={wallet.id} 
                  className={`flex items-center justify-between p-4 hover:bg-gray-50 transition-colors cursor-pointer ${!isLast ? 'border-b border-gray-100' : ''}`}
                  onClick={() => {}}
                >
                  <div className="flex items-center">
                    <div className="w-8 h-8 mr-3 rounded-full overflow-hidden flex-shrink-0 bg-gray-100 flex items-center justify-center">
                      <img 
                        src={wallet.currency === "KES" 
                          ? "https://bfsodqqylpfotszjlfuk.supabase.co/storage/v1/object/public/apps//kenya.png" 
                          : coin?.image} 
                        alt={wallet.currency} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://via.placeholder.com/32/6E59A5/ffffff?text=${wallet.currency}`;
                          target.onerror = null;
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-medium">{coin?.name || wallet.currency}</div>
                      <div className="text-sm text-gray-500">{wallet.balance.toLocaleString()} {wallet.currency}</div>
                    </div>
                  </div>
                  <ChevronRight className="h-4 w-4 text-gray-400" />
                </div>
              );
            })}
          </CardContent>
        </Card>
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