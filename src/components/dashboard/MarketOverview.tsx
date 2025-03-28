
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { mockCoins } from "@/data/mockData";

interface MarketPrice {
  symbol: string;
  name: string;
  image?: string;
  kesPrice: number;
  usdtPrice: number;
  changePercentage24h: number;
}

const MarketOverview = () => {
  const [marketPrices, setMarketPrices] = useState<MarketPrice[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  // Mock loading market data from API
  useEffect(() => {
    // Simulate API delay
    const fetchData = setTimeout(() => {
      // Generate mock market data for all coins except KES
      const prices = mockCoins
        .filter(coin => coin.symbol !== 'KES')
        .map(coin => ({
          symbol: coin.symbol,
          name: coin.name,
          image: coin.image,
          kesPrice: coin.symbol === 'USDT' 
            ? 130 + Math.random() * 5 
            : Math.random() * 100 + 1,
          usdtPrice: coin.symbol === 'USDT' 
            ? 1 
            : Math.random() * 10 + 0.1,
          changePercentage24h: (Math.random() * 10 - 5), // -5% to +5%
        }));
      
      setMarketPrices(prices);
      setIsLoading(false);
    }, 800);
    
    return () => clearTimeout(fetchData);
  }, []);
  
  return (
    <Card className="border border-gray-200">
      <CardHeader className="p-4 border-b border-gray-200">
        <CardTitle className="text-lg font-semibold">Market Overview</CardTitle>
      </CardHeader>
      <CardContent className="p-0">
        {isLoading ? (
          <div className="p-8 text-center text-gray-500">
            Loading market data...
          </div>
        ) : (
          <div className="divide-y divide-gray-200">
            {marketPrices.map((market) => (
              <div key={market.symbol} className="p-4 hover:bg-gray-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center">
                    <div className="w-8 h-8 mr-3 rounded-full overflow-hidden flex-shrink-0">
                      <img 
                        src={market.image} 
                        alt={market.symbol} 
                        className="w-full h-full object-cover"
                        onError={(e) => {
                          const target = e.target as HTMLImageElement;
                          target.src = `https://via.placeholder.com/32/6E59A5/ffffff?text=${market.symbol}`;
                        }}
                      />
                    </div>
                    <div>
                      <div className="font-medium">{market.name}</div>
                      <div className="text-xs text-gray-500">{market.symbol}</div>
                    </div>
                  </div>
                  
                  <div className="text-right">
                    <div className="font-medium">{market.kesPrice.toFixed(2)} KES</div>
                    <div className="text-xs text-gray-500">{market.usdtPrice.toFixed(4)} USDT</div>
                  </div>
                  
                  <div className={`text-right ${market.changePercentage24h >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                    <div>{market.changePercentage24h >= 0 ? '+' : ''}{market.changePercentage24h.toFixed(2)}%</div>
                    <div className="text-xs">(24h)</div>
                  </div>
                  
                  <button className="ml-4 px-3 py-1 text-xs font-medium bg-fortunesly-primary text-white rounded hover:bg-fortunesly-primary/90 transition-colors">
                    Trade
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default MarketOverview;
