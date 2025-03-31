
import { useState, useEffect } from "react";
import OrderBook from "@/components/dashboard/OrderBook";
import TradeForm from "@/components/dashboard/TradeForm";
import { supabase } from "@/integrations/supabase/client";
import { TradingPair, Coin } from "@/types";
import { useToast } from "@/hooks/use-toast";

const TradePage = () => {
  const [selectedPair, setSelectedPair] = useState({
    baseCurrency: "BTC",
    quoteCurrency: "KES"
  });
  
  const { toast } = useToast();
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableBalances, setAvailableBalances] = useState<Record<string, number>>({});
  const [availableCoins, setAvailableCoins] = useState<Coin[]>([]);
  
  useEffect(() => {
    const fetchData = async () => {
      setIsLoading(true);
      try {
        // Fetch all available coins from the database
        const { data: coinsData, error: coinsError } = await supabase
          .from('coins')
          .select('*')
          .order('symbol');
        
        if (coinsError) throw coinsError;
        
        // Create trading pairs from available coins
        const pairs: TradingPair[] = [];
        const coins = coinsData || [];
        setAvailableCoins(coins.map(coin => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          depositAddress: coin.deposit_address,
          image: coin.image || `https://via.placeholder.com/40/6E59A5/ffffff?text=${coin.symbol}`,
          taxRate: 10 // Default tax rate if not specified
        })));
        
        // KES is the default quote currency
        // Create trading pairs with all other coins as base currency
        for (const coin of coins) {
          // Skip KES as a base currency
          if (coin.symbol !== 'KES') {
            // Create a pair with KES
            pairs.push({
              id: `${coin.symbol.toLowerCase()}-kes`,
              baseCurrency: coin.symbol,
              quoteCurrency: 'KES',
              minOrderSize: 20, // New default minimum
              maxOrderSize: 1000000, // New high maximum - will be limited by available balance
              isActive: true
            });
            
            // If USDT is available, create pairs with USDT too
            const usdtCoin = coins.find(c => c.symbol === 'USDT');
            if (usdtCoin && coin.symbol !== 'USDT') {
              pairs.push({
                id: `${coin.symbol.toLowerCase()}-usdt`,
                baseCurrency: coin.symbol,
                quoteCurrency: 'USDT',
                minOrderSize: 1, // Lower minimum for USDT pairs
                maxOrderSize: 100000, // High maximum for USDT pairs
                isActive: true
              });
            }
          }
        }
        
        setTradingPairs(pairs);
        
        // Fetch user balances from the user table
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('balance_crypto, balance_fiat')
            .eq('id', session.session.user.id)
            .single();
            
          if (userError) {
            console.error('Error fetching user balances:', userError);
            // Create a default balance object with 0 for all coins
            const defaultBalances: Record<string, number> = {
              KES: 0
            };
            coins.forEach(coin => {
              defaultBalances[coin.symbol] = 0;
            });
            setAvailableBalances(defaultBalances);
          } else if (userData) {
            // Convert the stored JSON balance_crypto to our balances format
            const balances: Record<string, number> = {
              // Include fiat balance
              KES: userData.balance_fiat || 0
            };
            
            // Add crypto balances from the balance_crypto JSON field
            if (userData.balance_crypto) {
              Object.entries(userData.balance_crypto as Record<string, number>).forEach(([currency, balance]) => {
                balances[currency] = balance;
              });
            }
            
            // Ensure all coins have a balance value (default to 0 if not present)
            coins.forEach(coin => {
              if (!balances[coin.symbol]) {
                balances[coin.symbol] = 0;
              }
            });
            
            setAvailableBalances(balances);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
        toast({
          title: "Failed to load data",
          description: "There was an issue loading trading pairs and balances.",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, [toast]);
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Trade</h1>
      <p className="text-gray-600 mb-4">Buy and sell cryptocurrencies using KES or USDT.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrderBook tradingPair={selectedPair} />
        </div>
        <div>
          <TradeForm 
            availablePairs={tradingPairs} 
            availableBalances={availableBalances}
            availableCoins={availableCoins}
            isLoading={isLoading}
          />
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Trading functionality is connected to the database. Your transactions and orders will be saved in the database.
        </p>
      </div>
    </div>
  );
};

export default TradePage;
