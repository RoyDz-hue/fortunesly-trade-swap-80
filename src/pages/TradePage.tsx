
import { useState } from "react";
import OrderBook from "@/components/dashboard/OrderBook";
import TradeForm from "@/components/dashboard/TradeForm";

const TradePage = () => {
  const [selectedPair, setSelectedPair] = useState({
    baseCurrency: "BTC",
    quoteCurrency: "KES"
  });
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Trade</h1>
      <p className="text-gray-600 mb-4">Buy and sell cryptocurrencies using KES or USDT.</p>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2">
          <OrderBook tradingPair={selectedPair} />
        </div>
        <div>
          <TradeForm availablePairs={[]} availableBalances={{}} />
        </div>
      </div>
      
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
        <p className="text-sm text-blue-800">
          <strong>Note:</strong> Trading functionality will be fully operational when connected to the Supabase database.
        </p>
      </div>
    </div>
  );
};

export default TradePage;
