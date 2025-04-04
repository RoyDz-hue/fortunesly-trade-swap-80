
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Link } from "react-router-dom";
import { ArrowUpRight } from "lucide-react";

interface MarketPrice {
  symbol: string;
  name: string;
  image?: string;
  icon_url?: string;
  latestPrice: number;
  prevPrice: number;
  changePercentage24h: number;
  volume24h: number;
}

const MarketOverview = () => {
  const [marketData, setMarketData] = useState<MarketPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  useEffect(() => {
    const fetchMarketData = async () => {
      setIsLoading(true);
      try {
        // Get all available coins
        const { data: coins, error: coinsError } = await supabase
          .from('coins')
          .select('*')
          .neq('symbol', 'KES')
          .order('symbol');
          
        if (coinsError) throw coinsError;
        
        if (!coins || coins.length === 0) {
          setMarketData([]);
          setIsLoading(false);
          return;
        }
        
        // For each coin, get the latest completed order to determine price
        const marketPrices: MarketPrice[] = [];
        
        for (const coin of coins) {
          // Get latest order for this coin
          const { data: orders, error: ordersError } = await supabase
            .from('orders')
            .select('*')
            .eq('currency', coin.symbol)
            .eq('status', 'filled')
            .order('created_at', { ascending: false })
            .limit(10);
            
          if (ordersError) {
            console.error(`Error fetching orders for ${coin.symbol}:`, ordersError);
            continue;
          }
          
          let latestPrice = 0;
          let prevPrice = 0;
          let volume24h = 0;
          
          if (orders && orders.length > 0) {
            // Latest price is from most recent order
            latestPrice = Number(orders[0].price);
            
            // Previous price is from an older order (if available)
            if (orders.length > 1) {
              prevPrice = Number(orders[1].price);
            } else {
              prevPrice = latestPrice;
            }
            
            // Calculate 24h volume
            const now = new Date();
            const yesterday = new Date(now.setDate(now.getDate() - 1));
            
            volume24h = orders
              .filter(order => new Date(order.created_at) >= yesterday)
              .reduce((sum, order) => sum + Number(order.amount) * Number(order.price), 0);
          } else {
            // If no orders, use a default price based on the symbol
            // This is just for demo purposes
            const basePrice = coin.symbol === 'BTC' ? 35000 : 
                            coin.symbol === 'ETH' ? 3000 : 
                            coin.symbol === 'USDT' ? 130 : 
                            Math.random() * 100 + 1;
                            
            latestPrice = basePrice;
            prevPrice = basePrice * (1 + (Math.random() * 0.1 - 0.05));
            volume24h = Math.random() * 10000;
          }
          
          // Calculate change percentage
          const changePercentage = prevPrice > 0 ? 
            ((latestPrice - prevPrice) / prevPrice) * 100 : 0;
            
          marketPrices.push({
            symbol: coin.symbol,
            name: coin.name,
            image: coin.image,
            icon_url: coin.icon_url,
            latestPrice: latestPrice,
            prevPrice: prevPrice,
            changePercentage24h: changePercentage,
            volume24h: volume24h
          });
        }
        
        setMarketData(marketPrices);
      } catch (error) {
        console.error("Error fetching market data:", error);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchMarketData();
    
    // Set up polling interval to refresh data every 30 seconds
    const interval = setInterval(fetchMarketData, 30000);
    
    return () => clearInterval(interval);
  }, []);
  
  return (
    <Card className="border border-gray-200">
      <CardHeader className="p-4 border-b border-gray-200 flex items-center justify-between">
        <CardTitle className="text-lg font-semibold">Market Overview</CardTitle>
        <Button asChild variant="link" size="sm" className="flex gap-1 items-center p-0">
          <Link to="/market/orders">
            View Markets <ArrowUpRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            <div className="w-8 h-8 border-2 border-t-fortunesly-primary border-gray-200 rounded-full animate-spin mx-auto"></div>
            <p className="mt-2">Loading market data...</p>
          </div>
        ) : marketData.length > 0 ? (
          <div className="divide-y divide-gray-200">
            {marketData.map((market) => (
              <div key={market.symbol} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 mr-3 rounded-full overflow-hidden flex-shrink-0 bg-gray-100">
                      <img 
                        src={market.icon_url || `https://via.placeholder.com/32/6E59A5/ffffff?text=${market.symbol}`} 
                        alt={market.symbol} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://via.placeholder.com/32/6E59A5/ffffff?text=${market.symbol}`;
                          // Prevent infinite error loop
                          target.onerror = null;
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-medium">{market.name}</div>
                      <div className="text-xs text-gray-500">{market.symbol}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">{market.latestPrice.toLocaleString()} KES</div>
                    <div className="text-xs text-gray-500">Vol: {market.volume24h.toLocaleString()} KES</div>
                  </div>
                  
                  <div className={`text-right ${market.changePercentage24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <div>{market.changePercentage24h >= 0 ? '+' : ''}{market.changePercentage24h.toFixed(2)}%</div>
                    <div className="text-xs">(24h)</div>
                  </div>
                  
                  <Link to="/dashboard/trade">
                    <Button variant="default" size="sm" className="ml-4">
                      Trade
                    </Button>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-8 text-center text-gray-500">
            <p>No market data available</p>
            <p className="text-sm mt-2">Check back after some trading activity</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketOverview;
