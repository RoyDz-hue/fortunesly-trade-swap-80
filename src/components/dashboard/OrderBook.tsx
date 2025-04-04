import { useState, useEffect } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowDown, ArrowUp, Filter, Plus, RefreshCw } from "lucide-react";
import TradeExecutionDialog from "./TradeExecutionDialog";
import ImageWithFallback from "@/components/common/ImageWithFallback";

const OrderBook = ({
  tradingPair = { baseCurrency: "BTC", quoteCurrency: "KES" },
  buyOrders = [],
  sellOrders = [],
  onOrderSelect,
  availableCoins = []
}) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("sell"); // "sell" tab shows buy orders
  const [selectedCoin, setSelectedCoin] = useState("all");
  const [priceSort, setPriceSort] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  
  // Filter orders based on selected coin if needed
  const filteredBuyOrders = selectedCoin !== "all" 
    ? buyOrders.filter(order => order.currency === selectedCoin || order.baseCurrency === selectedCoin)
    : buyOrders;
    
  const filteredSellOrders = selectedCoin !== "all" 
    ? sellOrders.filter(order => order.currency === selectedCoin || order.baseCurrency === selectedCoin)
    : sellOrders;

  // Sort orders if needed
  const sortedBuyOrders = [...filteredBuyOrders].sort((a, b) => {
    if (priceSort === "asc") return a.price - b.price;
    if (priceSort === "desc") return b.price - a.price;
    return 0; // Default: no sort
  });

  const sortedSellOrders = [...filteredSellOrders].sort((a, b) => {
    if (priceSort === "asc") return a.price - b.price;
    if (priceSort === "desc") return b.price - a.price;
    return 0; // Default: no sort
  });

  // Get displayed orders based on active tab
  const displayedOrders = activeTab === "sell" ? sortedBuyOrders : sortedSellOrders;

  const handleOrderClick = (order, type) => {
    // Don't allow users to trade with their own orders
    if (user && order.userId === user.id) {
      toast({
        title: "Can't trade with own order",
        description: "You cannot execute trades with your own orders.",
        variant: "destructive"
      });
      return;
    }

    // Set selected order and open trade dialog
    setSelectedOrder({
      ...order,
      type: type === "buy" ? "sell" : "buy" // Inverse for trade execution
    });
    setShowTradeDialog(true);
  };

  const handleTradeSuccess = () => {
    // Refresh orders or perform any other actions after successful trade
    if (onOrderSelect) {
      // Use the onOrderSelect for any custom refresh logic provided by parent
      onOrderSelect(selectedOrder);
    }

    toast({
      title: "Trade executed",
      description: "Your trade was executed successfully.",
    });

    // Reset selection and close dialog
    setSelectedOrder(null);
    setShowTradeDialog(false);
  };

  const handleRefresh = () => {
    setIsLoading(true);
    // Simulate refresh delay
    setTimeout(() => {
      if (onOrderSelect) {
        onOrderSelect();
      }
      setIsLoading(false);
    }, 500);
  };

  const getCoinDetails = (symbol) => {
    return availableCoins.find(coin => coin.symbol === symbol) || { name: symbol, icon_url: null };
  };

  return (
    <Card className="w-full shadow-sm border">
      <CardHeader className="pb-3 bg-gray-50 border-b">
        <CardTitle className="text-xl">
          Order Book {tradingPair.baseCurrency}/{tradingPair.quoteCurrency}
        </CardTitle>
      </CardHeader>

      <Tabs defaultValue="sell" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-4 pt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="sell" className="flex items-center">
              <ArrowUp className="h-4 w-4 mr-2" />
              Sell Orders
            </TabsTrigger>
            <TabsTrigger value="buy" className="flex items-center">
              <ArrowDown className="h-4 w-4 mr-2" />
              Buy Orders
            </TabsTrigger>
          </TabsList>
        </div>

        <div className="p-4 border-t">
          <div className="flex flex-col sm:flex-row justify-between gap-4">
            <div className="flex items-center gap-2">
              <Filter className="h-4 w-4 text-muted-foreground" />
              <span className="text-sm text-muted-foreground">Filters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={selectedCoin} onValueChange={setSelectedCoin}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Select Coin" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Coins</SelectItem>
                  {availableCoins.map((coin) => (
                    <SelectItem key={coin.symbol} value={coin.symbol}>
                      <div className="flex items-center gap-2">
                        {coin.icon_url ? (
                          <ImageWithFallback 
                            src={coin.icon_url}
                            alt={coin.name}
                            className="h-4 w-4"
                            fallbackSrc="/placeholder.svg"
                          />
                        ) : (
                          <span className="h-4 w-4 flex items-center justify-center text-xs bg-gray-100 rounded-full">
                            {coin.symbol.charAt(0)}
                          </span>
                        )}
                        {coin.symbol}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceSort} onValueChange={setPriceSort}>
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Sort by Price" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={null}>Default</SelectItem>
                  <SelectItem value="asc">Low to High</SelectItem>
                  <SelectItem value="desc">High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>

        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : displayedOrders.length === 0 ? (
            <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
              <div className="flex justify-center mb-2">
                {activeTab === "buy" ? <ArrowDown className="h-12 w-12 text-gray-300" /> : <ArrowUp className="h-12 w-12 text-gray-300" />}
              </div>
              <h3 className="text-lg font-medium mb-1">No {activeTab === "buy" ? "buy" : "sell"} orders available</h3>
              <p className="text-sm">No orders match your current filter criteria.</p>
              <Button 
                onClick={handleRefresh} 
                variant="outline"
                className="mt-4 flex items-center gap-2"
              >
                <RefreshCw size={16} />
                Refresh Orders
              </Button>
            </div>
          ) : (
            <div className="grid gap-4">
              {displayedOrders.map((order) => {
                const orderType = activeTab === "buy" ? "buy" : "sell";
                const inversedType = orderType === "buy" ? "sell" : "buy";
                const buttonColorClass = inversedType === "buy" ? 
                  "bg-green-600 hover:bg-green-700 text-white" : 
                  "bg-red-600 hover:bg-red-700 text-white";
                const coinDetails = getCoinDetails(order.currency || tradingPair.baseCurrency);
                
                return (
                  <div key={order.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
                    <div className="flex flex-col sm:flex-row justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                          <Avatar className="h-10 w-10 bg-gray-200">
                            <span className="text-sm">{(order.username || "Anonymous").charAt(0).toUpperCase()}</span>
                          </Avatar>
                          <div>
                            <p className="font-medium text-lg">{order.username || "Anonymous"}</p>
                            <p className="text-sm text-gray-500">
                              <Badge variant="outline" className="mr-2">
                                {orderType === "buy" ? "Sell to this user" : "Buy from this user"}
                              </Badge>
                              ID: {order.id.substring(0, 8)}
                            </p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Price</p>
                            <p className="font-medium text-lg">
                              {tradingPair.quoteCurrency} {order.price.toLocaleString(undefined, {maximumFractionDigits: 2})}
                            </p>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Amount</p>
                            <div className="flex items-center gap-1 font-medium text-lg">
                              {order.amount.toLocaleString(undefined, {maximumFractionDigits: 6})} 
                              <div className="flex items-center ml-1">
                                {coinDetails.icon_url ? (
                                  <ImageWithFallback 
                                    src={coinDetails.icon_url}
                                    alt={coinDetails.name}
                                    className="h-4 w-4 ml-1"
                                    fallbackSrc="/placeholder.svg"
                                  />
                                ) : null}
                                <span className="ml-1">{order.currency || tradingPair.baseCurrency}</span>
                              </div>
                            </div>
                          </div>
                          <div className="bg-gray-50 p-3 rounded-lg">
                            <p className="text-sm text-gray-500 mb-1">Total</p>
                            <p className="font-medium text-lg">
                              {tradingPair.quoteCurrency} {order.total ? order.total.toLocaleString(undefined, {maximumFractionDigits: 2}) : (order.price * order.amount).toLocaleString(undefined, {maximumFractionDigits: 2})}
                            </p>
                          </div>
                        </div>
                      </div>

                      <div className="flex items-center">
                        <Button
                          onClick={() => handleOrderClick(order, orderType)}
                          className={buttonColorClass + " px-8 py-6 text-lg font-medium"}
                          disabled={user && order.userId === user.id}
                        >
                          {inversedType}
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
          
          <div className="mt-6 flex justify-center space-x-4">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              className="flex items-center gap-2"
            >
              <RefreshCw size={16} />
              Refresh
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => window.location.href = "/dashboard/orders/create"}
              className="flex items-center gap-2"
            >
              <Plus size={16} />
              Create Order
            </Button>
          </div>
        </CardContent>
      </Tabs>

      {/* Trade Execution Dialog */}
      {selectedOrder && (
        <TradeExecutionDialog
          isOpen={showTradeDialog}
          onClose={() => setShowTradeDialog(false)}
          order={selectedOrder}
          onSuccess={handleTradeSuccess}
        />
      )}
    </Card>
  );
};

export default OrderBook;
