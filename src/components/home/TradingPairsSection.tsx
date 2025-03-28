
import { ArrowRight } from "lucide-react";
import { mockCoins } from "@/data/mockData";

const TradingPairsSection = () => {
  // Get all currencies except KES (which is the base currency)
  const tradingCoins = mockCoins.filter(coin => coin.symbol !== 'KES');
  
  return (
    <section className="py-20">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-fortunesly-dark mb-4">
            Available Trading Pairs
          </h2>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Trade these emerging cryptocurrencies with KES or USDT on our secure P2P platform.
          </p>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {tradingCoins.map((coin) => (
            <div key={coin.id} className="bg-white rounded-lg shadow-md border border-gray-100 overflow-hidden hover:shadow-lg transition-shadow duration-300">
              <div className="p-6">
                <div className="flex items-center mb-4">
                  <img 
                    src={coin.image} 
                    alt={coin.name} 
                    className="w-10 h-10 rounded-full mr-3"
                    onError={(e) => {
                      const target = e.target as HTMLImageElement;
                      target.src = `https://via.placeholder.com/40/6E59A5/ffffff?text=${coin.symbol}`;
                    }}
                  />
                  <div>
                    <h3 className="font-semibold text-lg">{coin.name}</h3>
                    <p className="text-sm text-gray-500">{coin.symbol}</p>
                  </div>
                </div>
                
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div className="bg-fortunesly-light p-3 rounded">
                    <div className="text-xs text-gray-500">KES Pair</div>
                    <div className="font-medium flex items-center">
                      <span className="mr-2">{coin.symbol}/KES</span>
                      {Math.random() > 0.5 ? (
                        <span className="text-green-500 text-xs">+{(Math.random() * 5).toFixed(2)}%</span>
                      ) : (
                        <span className="text-red-500 text-xs">-{(Math.random() * 5).toFixed(2)}%</span>
                      )}
                    </div>
                  </div>
                  
                  <div className="bg-fortunesly-light p-3 rounded">
                    <div className="text-xs text-gray-500">USDT Pair</div>
                    <div className="font-medium flex items-center">
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
