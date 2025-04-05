import { useState, useEffect, useCallback } from "react";
import OrderBook from "@/components/dashboard/OrderBook";
import TradeForm from "@/components/dashboard/TradeForm";
import { supabase } from "@/integrations/supabase/client";
import { TradingPair, Coin } from "@/types";
import { useToast } from "@/hooks/use-toast";
import MarketOverview from "@/components/dashboard/MarketOverview";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowRightCircle } from "lucide-react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const TradePage = () => {
  const [selectedPair, setSelectedPair] = useState({
    baseCurrency: "Coin,",
    quoteCurrency: "KES"
  });
  
  const { toast } = useToast();
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [availableBalances, setAvailableBalances] = useState<Record<string, number>>({});
  const [availableCoins, setAvailableCoins] = useState<Coin[]>([]);
  
  const fetchData = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data: coinsData, error: coinsError } = await supabase
        .from('coins')
        .select('*')
        .order('symbol');
      
      if (coinsError) throw coinsError;
      
      const pairs: TradingPair[] = [];
      const coins = coinsData || [];
      setAvailableCoins(coins.map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        depositAddress: coin.deposit_address,
        deposit_address: coin.deposit_address,
        image: coin.icon_url || `https://via.placeholder.com/40/6E59A5/ffffff?text=${coin.symbol}`,
        icon_url: coin.icon_url,
        taxRate: 10
      })));
      
      for (const coin of coins) {
        if (coin.symbol !== 'KES') {
          pairs.push({
            id: `${coin.symbol.toLowerCase()}-kes`,
            baseCurrency: coin.symbol,
            quoteCurrency: 'KES',
            minOrderSize: 20,
            maxOrderSize: 1000000,
            isActive: true
          });
          
          const usdtCoin = coins.find(c => c.symbol === 'USDT');
          if (usdtCoin && coin.symbol !== 'USDT') {
            pairs.push({
              id: `${coin.symbol.toLowerCase()}-usdt`,
              baseCurrency: coin.symbol,
              quoteCurrency: 'USDT',
              minOrderSize: 1,
              maxOrderSize: 100000,
              isActive: true
            });
          }
        }
      }
      
      setTradingPairs(pairs);
      
      const { data: session } = await supabase.auth.getSession();
      if (session.session) {
        const { data: userData, error: userError } = await supabase
          .from('users')
          .select('balance_crypto, balance_fiat')
          .eq('id', session.session.user.id)
          .single();
          
        if (userError) {
          console.error('Error fetching user balances:', userError);
          const defaultBalances: Record<string, number> = {
            KES: 0
          };
          coins.forEach(coin => {
            defaultBalances[coin.symbol] = 0;
          });
          setAvailableBalances(defaultBalances);
        } else if (userData) {
          const balances: Record<string, number> = {
            KES: userData.balance_fiat || 0
          };
          
          if (userData.balance_crypto) {
            Object.entries(userData.balance_crypto as Record<string, number>).forEach(([currency, balance]) => {
              balances[currency] = balance;
            });
          }
          
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
  }, [toast]);
  
  useEffect(() => {
    fetchData();
    
    const channel = supabase
      .channel('trade-updates')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          console.log('Orders updated, refreshing data');
          fetchData();
        }
      )
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'users' },
        () => {
          console.log('User data updated, refreshing balances');
          fetchData();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchData]);

  const [buyOrders, setBuyOrders] = useState<any[]>([]);
  const [sellOrders, setSellOrders] = useState<any[]>([]);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const { data: buyData, error: buyError } = await supabase
          .from("orders")
          .select("id, price, amount, currency, user_id, users(username)")
          .eq("type", "buy")
          .eq("status", "open")
          .order("price", { ascending: false })
          .limit(10);
          
        if (buyError) throw buyError;
        
        const { data: sellData, error: sellError } = await supabase
          .from("orders")
          .select("id, price, amount, currency, user_id, users(username)")
          .eq("type", "sell")
          .eq("status", "open")
          .order("price", { ascending: true })
          .limit(10);
          
        if (sellError) throw sellError;
        
        const formattedBuyOrders = buyData?.map(order => ({
          id: order.id,
          userId: order.user_id,
          username: order.users?.username || 'Anonymous',
          price: parseFloat(order.price.toString()),
          amount: parseFloat(order.amount.toString()),
          total: parseFloat(order.price.toString()) * parseFloat(order.amount.toString())
        })) || [];
        
        const formattedSellOrders = sellData?.map(order => ({
          id: order.id,
          userId: order.user_id,
          username: order.users?.username || 'Anonymous',
          price: parseFloat(order.price.toString()),
          amount: parseFloat(order.amount.toString()),
          total: parseFloat(order.price.toString()) * parseFloat(order.amount.toString())
        })) || [];
        
        setBuyOrders(formattedBuyOrders);
        setSellOrders(formattedSellOrders);
      } catch (error) {
        console.error("Error fetching orders:", error);
      }
    };

    fetchOrders();
    
    const ordersChannel = supabase
      .channel("orders-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => {
          fetchOrders();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(ordersChannel);
    };
  }, []);

  const handleOrderRefresh = async () => {
    return fetchData();
  };

  const handleOrderSelect = (order, type) => {
    console.log(`Selected ${type} order:`, order);
  };

  return (
    <div className="w-full">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trade</h1>
        <Button asChild variant="outline" className="flex gap-1 items-center">
          <Link to="/market/orders">
            View All Market Orders <ArrowRightCircle className="h-4 w-4 ml-1" />
          </Link>
        </Button>
      </div>
      
      <p className="text-gray-600 mb-4">Buy and sell cryptocurrencies using KES or USDT.</p>
      
      <Tabs defaultValue="trade" className="space-y-6">
        <TabsList>
          <TabsTrigger value="trade">Trade</TabsTrigger>
          <TabsTrigger value="market">Market Overview</TabsTrigger>
        </TabsList>
        
        <TabsContent value="trade">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <OrderBook 
                tradingPair={selectedPair} 
                buyOrders={buyOrders}
                sellOrders={sellOrders}
                onRefresh={handleOrderRefresh}
                onOrderSelect={handleOrderSelect}
              />
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
        </TabsContent>
        
        <TabsContent value="market">
          <MarketOverview />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default TradePage;
