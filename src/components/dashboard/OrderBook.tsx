
import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { Card, CardHeader, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

const OrderBook = ({
  tradingPair = { baseCurrency: "BTC", quoteCurrency: "KES" },
  buyOrders = [],
  sellOrders = [],
  onRefresh,
  onOrderSelect
}) => {
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const topOrders = { buy: buyOrders.slice(0, 3), sell: sellOrders.slice(0, 3) };

  const handleRefresh = (e) => {
    e.stopPropagation();
    setIsLoading(true);
    onRefresh?.().finally(() => setIsLoading(false));
  };

  const handleCardClick = () => {
    navigate("/market/orders");
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
              <div key={order.id} className="flex justify-between text-sm">
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
              <div key={order.id} className="flex justify-between text-sm">
                <span className="text-red-600">{order.price.toFixed(2)}</span>
                <span className="text-foreground">{order.amount.toFixed(4)}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-center">
          <Link 
            to="/market/orders"
            className="text-sm text-primary hover:underline"
            onClick={(e) => e.stopPropagation()}
          >
            View full market →
          </Link>
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderBook;
