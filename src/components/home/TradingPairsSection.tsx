
import { useState, useEffect } from "react";
import { ArrowRight } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { Coin } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

const TradingPairsSection = () => {
  const [tradingCoins, setTradingCoins] = useState<Coin[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchCoins = async () => {
      try {
        setIsLoading(true);
        const { data, error } = await supabase
          .from('coins')
          .select('*')
          .order('symbol');

        if (error) {
          throw error;
        }

        // Convert to Coin type and filter out KES
        const coins: Coin[] = data
          .map(coin => ({
            id: coin.id,
            name: coin.name,
            symbol: coin.symbol,
            depositAddress: coin.deposit_address,
            image: coin.image || `https://via.placeholder.com/40/9b87f5/ffffff?text=${coin.symbol}`,
          }))
          .filter(coin => coin.symbol !== 'KES');

        setTradingCoins(coins);
      } catch (error) {
        console.error("Error fetching coins:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchCoins();
  }, []);

  if (isLoading) {
    return (
      <section className="py-20 bg-[#221F26]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Available Trading Pairs
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              Trade these emerging cryptocurrencies with KES or USDT on our secure P2P platform.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, index) => (
              <div key={index} className="bg-[#403E43]/20 rounded-lg shadow-md border border-gray-800 overflow-hidden p-6">
                <div className="flex items-center mb-4">
                  <Skeleton className="w-10 h-10 rounded-full mr-3 bg-gray-800" />
                  <div>
                    <Skeleton className="h-5 w-24 bg-gray-800" />
                    <Skeleton className="h-3 w-12 mt-1 bg-gray-800" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <Skeleton className="h-12 w-full bg-gray-800" />
                  <Skeleton className="h-12 w-full bg-gray-800" />
                </div>

                <Skeleton className="h-8 w-full bg-gray-800" />
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  if (tradingCoins.length === 0) {
    return (
      <section className="py-20 bg-[#221F26]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-8">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Available Trading Pairs
            </h2>
            <p className="text-lg text-gray-400 max-w-2xl mx-auto">
              No trading pairs available yet. Our admins are setting everything up.
            </p>
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="py-20 bg-[#221F26]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
            Available Trading Pairs
          </h2>
          <p className="text-lg text-gray-400 max-w-2xl mx-auto">
            Trade these emerging cryptocurrencies with KES or USDT on our secure P2P platform.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tradingCoins.map((coin) => (
            <div key={coin.id} className="bg-[#403E43]/20 rounded-lg shadow-md border border-gray-800 overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <img 
                    src={coin.image} 
                    alt={coin.name} 
                    className="w-10 h-10 rounded-full mr-3"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/40/9b87f5/ffffff?text=${coin.symbol}`;
                    }}
                  />
                  <div>
                    <h3 className="font-semibold text-lg text-white">{coin.name}</h3>
                    <p className="text-sm text-gray-400">{coin.symbol}</p>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-[#403E43]/40 p-3 rounded">
                    <div className="text-xs text-gray-400">KES Pair</div>
                    <div className="font-medium flex items-center text-white">
                      <span className="mr-2">{coin.symbol}/KES</span>
                      {Math.random() > 0.5 ? (
                        <span className="text-green-500 text-xs">+{(Math.random() * 5).toFixed(2)}%</span>
                      ) : (
                        <span className="text-red-500 text-xs">-{(Math.random() * 5).toFixed(2)}%</span>
                      )}
                    </div>
                  </div>

                  <div className="bg-[#403E43]/40 p-3 rounded">
                    <div className="text-xs text-gray-400">USDT Pair</div>
                    <div className="font-medium flex items-center text-white">
                      <span className="mr-2">{coin.symbol}/USDT</span>
                      {Math.random() > 0.5 ? (
                        <span className="text-green-500 text-xs">+{(Math.random() * 5).toFixed(2)}%</span>
                      ) : (
                        <span className="text-red-500 text-xs">-{(Math.random() * 5).toFixed(2)}%</span>
                      )}
                    </div>
                  </div>
                </div>

                <button className="group w-full py-2 text-center text-fortunesly-primary font-medium hover:text-fortunesly-accent transition-colors flex items-center justify-center">
                  Trade {coin.symbol}
                  <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default TradingPairsSection;
