
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface OrderBookProps {
  tradingPair?: { 
    baseCurrency: string; 
    quoteCurrency: string; 
  };
  buyOrders?: any[];
  sellOrders?: any[];
  onRefresh?: () => void | Promise<void>;
  onOrderSelect?: (order: any, type: "buy" | "sell") => void;
}

const OrderBook = ({
  tradingPair = { baseCurrency: "BTC", quoteCurrency: "KES" },
  buyOrders = [],
  sellOrders = [],
  onRefresh,
  onOrderSelect
}: OrderBookProps) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const topOrders = { buy: buyOrders.slice(0, 3), sell: sellOrders.slice(0, 3) };

  const handleRefresh = (e: React.MouseEvent) => {
    e.stopPropagation();
    setIsLoading(true);
    
    if (onRefresh) {
      try {
        const result = onRefresh();
        // Check if result is a Promise
        if (result instanceof Promise) {
          result.finally(() => setIsLoading(false));
        } else {
          // If not a Promise, just set loading to false
          setIsLoading(false);
        }
      } catch (error) {
        console.error("Error refreshing orders:", error);
        setIsLoading(false);
      }
    } else {
      setIsLoading(false);
    }
  };

  const handleCardClick = () => {
    navigate("/market/orders");
  };

  const handleOrderClick = (order: any, type: "buy" | "sell") => {
    if (onOrderSelect) {
      onOrderSelect(order, type);
    }
  };

  return (
    <Card 
      className="w-full shadow-sm border hover:shadow-md transition-shadow"
      onClick={handleCardClick}
    >
      <CardHeader className="p-4 pb-2">
        <div className="flex items-center justify-between">
          <h3 className="text-lg font-semibold">
            {tradingPair.baseCurrency}/{tradingPair.quoteCurrency}
          </h3>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRefresh}
            className="p-2 h-auto text-muted-foreground"
          >
            <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          </Button>
        </div>
      </CardHeader>

      <CardContent className="p-4 pt-0">
        <div className="grid grid-cols-2 gap-4">
          {/* Buy Orders */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-green-600">
              <ArrowUp className="h-4 w-4 mr-1" />
              Buy
            </div>
            {topOrders.buy.map((order) => (
              <div 
                key={order.id} 
                className="flex justify-between text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOrderClick(order, "buy");
                }}
              >
                <span className="text-foreground">{order.amount.toFixed(4)}</span>
                <span className="text-green-600">{order.price.toFixed(2)}</span>
              </div>
            ))}
          </div>

          {/* Sell Orders */}
          <div className="space-y-2">
            <div className="flex items-center text-sm text-red-600">
              <ArrowDown className="h-4 w-4 mr-1" />
              Sell
            </div>
            {topOrders.sell.map((order) => (
              <div 
                key={order.id} 
                className="flex justify-between text-sm cursor-pointer hover:bg-gray-50 p-1 rounded"
                onClick={(e) => {
                  e.stopPropagation();
                  handleOrderClick(order, "sell");
                }}
              >
                <span className="text-red-600">{order.price.toFixed(2)}</span>
                <span className="text-foreground">{order.amount.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-center">
          <Button
            variant="link"
            className="text-sm text-primary hover:underline"
            onClick={(e) => {
              e.stopPropagation();
              navigate("/market/orders");
            }}
          >
            View full market →
          </Button>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderBook;
