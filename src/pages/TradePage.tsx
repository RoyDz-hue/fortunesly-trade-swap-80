
import { useState, useEffect } from "react";
import OrderBook from "@/components/dashboard/OrderBook";
import TradeForm from "@/components/dashboard/TradeForm";
import { supabase } from "@/integrations/supabase/client";
import { TradingPair } from "@/types";

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
        // In a real implementation, we would fetch actual trading pairs
        // For now we'll create a simple mock as we don't have a trading_pairs table yet
        const coins = await supabase.from('coins').select('symbol').order('symbol');
        
        if (coins.error) throw coins.error;
        
        // Create trading pairs from available coins
        const pairs: TradingPair[] = [];
        if (coins.data?.length) {
          const symbols = coins.data.map(coin => coin.symbol);
          
          // Create trading pairs (e.g., BTC/KES, BTC/USDT)
          if (symbols.includes('KES')) {
            pairs.push({
              id: 'btc-kes',
              baseCurrency: 'BTC',
              quoteCurrency: 'KES',
              minOrderSize: 0.0001,
              maxOrderSize: 100,
              isActive: true
            });
          }
          
          if (symbols.includes('USDT')) {
            pairs.push({
              id: 'btc-usdt',
              baseCurrency: 'BTC',
              quoteCurrency: 'USDT',
              minOrderSize: 0.0001,
              maxOrderSize: 100,
              isActive: true
            });
          }
        }
        
        setTradingPairs(pairs);
        
        // Fetch user balances
        const { data: session } = await supabase.auth.getSession();
        if (session.session) {
          const { data: wallets, error: walletsError } = await supabase
            .from('wallets')
            .select('currency, balance')
            .eq('user_id', session.session.user.id);
            
          if (walletsError) {
            console.error('Error fetching wallets:', walletsError);
          } else if (wallets) {
            const balances: Record<string, number> = {};
            wallets.forEach(wallet => {
              balances[wallet.currency] = wallet.balance || 0;
            });
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
