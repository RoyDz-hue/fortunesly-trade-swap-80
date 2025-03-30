
import { useState, useEffect } from "react";
import OrderBook from "@/components/dashboard/OrderBook";
import TradeForm from "@/components/dashboard/TradeForm";
import { supabase } from "@/integrations/supabase/client";
import { TradingPair, Coin } from "@/types";

const TradePage = () => {
  const [selectedPair, setSelectedPair] = useState({
    baseCurrency: "BTC",
    quoteCurrency: "KES"
  });
  
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableBalances, setAvailableBalances] = useState<Record<string, number>>({});
  
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
              minOrderSize: 0.0001,
              maxOrderSize: 100,
              isActive: true
            });
            
            // If USDT is available, create pairs with USDT too
            const usdtCoin = coins.find(c => c.symbol === 'USDT');
            if (usdtCoin && coin.symbol !== 'USDT') {
              pairs.push({
                id: `${coin.symbol.toLowerCase()}-usdt`,
                baseCurrency: coin.symbol,
                quoteCurrency: 'USDT',
                minOrderSize: 0.0001,
                maxOrderSize: 100,
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
            
            setAvailableBalances(balances);
          }
        }
      } catch (error) {
        console.error('Error fetching data:', error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchData();
  }, []);
  
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
          />
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Trading functionality is now connected to the Supabase database. Your transactions and orders will be saved in the database.
        </p>
      </div>
    </div>
  );
};

export default TradePage;
