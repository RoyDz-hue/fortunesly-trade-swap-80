import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Avatar } from '@/components/ui/avatar';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { ArrowDown, ArrowUp, Filter, Plus, RefreshCw } from 'lucide-react';
import TradeExecutionDialog from '@/components/dashboard/TradeExecutionDialog';
import { useNavigate } from 'react-router-dom';
import ImageWithFallback from '@/components/common/ImageWithFallback';

// Define the type for order objects
interface OrderType {
  id: string;
  user_id: string;
  type: string;
  currency: string;
  amount: number;
  price: number;
  quote_currency: string | null; // Added quote_currency field
  status: string;
  created_at: string;
  original_amount?: number;
  users: {
    username: string;
  };
  filled_percentage?: number;
  username?: string; // Added as optional for backward compatibility
}

const MarketOrdersPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState<OrderType[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<OrderType | null>(null);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("sell"); // "sell" means showing buy orders, "buy" means showing sell orders
  const [selectedCoin, setSelectedCoin] = useState("all");
  const [priceSort, setPriceSort] = useState<string | null>(null);
  const [availableCoins, setAvailableCoins] = useState([]);

  useEffect(() => {
    fetchCoins();
    fetchOrders();

    // Set up realtime subscription
    const channel = supabase
      .channel('market-orders-changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'orders',
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [activeTab, selectedCoin, priceSort]);

  const fetchCoins = async () => {
    try {
      const { data, error } = await supabase
        .from('coins')
        .select('name, symbol, icon_url');

      if (error) throw error;

      setAvailableCoins(data || []);
    } catch (error) {
      console.error("Error fetching coins:", error);
    }
  };

  const fetchOrders = async () => {
    try {
      setIsLoading(true);

      // Build query
      let query = supabase
        .from('orders')
        .select('*, users(username)')
        .in('status', ['open', 'partially_filled']) // Show only open or partially filled orders
        .eq('type', activeTab === 'buy' ? 'sell' : 'buy'); // Inverse logic: "buy" tab shows 'sell' orders

      // Apply coin filter if selected
      if (selectedCoin !== 'all') {
        query = query.eq('currency', selectedCoin);
      }

      // Apply sorting if selected
      if (priceSort) {
        query = query.order('price', { ascending: priceSort === 'asc' });
      } else {
        query = query.order('created_at', { ascending: false });
      }

      const { data, error } = await query;

      if (error) {
        throw error;
      }

      console.log("Fetched market orders:", data);

      // Format the data to include username and ensure all required properties are present
      const formattedData: OrderType[] = data?.map(order => ({
        ...order,
        username: order.users?.username || 'Unknown',
        // Add tracking for partially filled orders
        filled_percentage: order.original_amount ? ((order.original_amount - order.amount) / order.original_amount * 100) : 0,
        // Ensure quote_currency is present (even if null)
        quote_currency: order.quote_currency || null
      })) || [];

      setOrders(formattedData);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Failed to load orders",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleTrade = (order) => {
    setSelectedOrder(order);
    setShowTradeDialog(true);
  };

  const handleCreateOrder = () => {
    navigate('/dashboard/trade'); // Changed from /dashboard/orders to /dashboard/trade
  };

  const getCoinDetails = (symbol) => {
    return availableCoins.find(coin => coin.symbol === symbol) || { name: symbol, icon_url: null };
  };

  // Function to get price currency display based on quote_currency field
  const getPriceCurrency = (order) => {
    // If quote_currency exists and is not empty, use it
    if (order.quote_currency) {
      return order.quote_currency;
    }
    // Otherwise fall back to KES
    return 'KES';
  };

  // Filter out user's own orders
  const marketOrders = user ? orders.filter(order => order.user_id !== user.id) : orders;

  const handleRefresh = () => {
    fetchOrders();
  };

  return (
    <div className="w-full py-4 bg-black text-gray-200">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-4 gap-2">
        <h1 className="text-2xl font-bold text-white">Market Orders</h1>

        <div className="flex gap-2">
          <Button 
            variant="outline" 
            size="sm" 
            onClick={handleRefresh}
            className="flex items-center gap-1 bg-zinc-900 text-gray-200 border-zinc-800 hover:bg-zinc-800"
          >
            <RefreshCw size={14} />
            Refresh
          </Button>
          <Button 
            onClick={handleCreateOrder} 
            size="sm"
            className="flex items-center gap-1 bg-zinc-800 hover:bg-zinc-700 text-white"
          >
            <Plus size={14} />
            Create Order
          </Button>
        </div>
      </div>

      <Card className="border-zinc-800 shadow-md w-full bg-zinc-950 text-gray-200">
        <Tabs defaultValue="sell" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="flex flex-col sm:flex-row justify-between items-center p-4 border-b border-zinc-800 bg-black">
            <CardTitle className="text-lg mb-3 sm:mb-0 text-white">Available Orders</CardTitle>
            <TabsList className="grid w-full max-w-[240px] grid-cols-2 bg-zinc-900">
              <TabsTrigger value="sell" className="flex items-center gap-1 data-[state=active]:bg-zinc-800">
                <ArrowUp className="h-3 w-3" />
                Sell
              </TabsTrigger>
              <TabsTrigger value="buy" className="flex items-center gap-1 data-[state=active]:bg-zinc-800">
                <ArrowDown className="h-3 w-3" />
                Buy
              </TabsTrigger>
            </TabsList>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 p-3 border-b border-zinc-800 bg-black">
            <div className="flex items-center gap-1 text-xs text-gray-400">
              <Filter className="h-3 w-3" />
              <span>Filters:</span>
            </div>
            <div className="flex flex-wrap gap-2">
              <Select value={selectedCoin} onValueChange={setSelectedCoin}>
                <SelectTrigger className="h-8 w-[120px] text-xs bg-zinc-900 border-zinc-800 text-gray-200">
                  <SelectValue placeholder="Select Coin" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-gray-200">
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
                          <span className="h-4 w-4 flex items-center justify-center text-xs bg-zinc-800 rounded-full">
                            {coin.symbol.charAt(0)}
                          </span>
                        )}
                        {coin.symbol}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>

              <Select value={priceSort || undefined} onValueChange={setPriceSort}>
                <SelectTrigger className="h-8 w-[120px] text-xs bg-zinc-900 border-zinc-800 text-gray-200">
                  <SelectValue placeholder="Sort by Price" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-900 border-zinc-800 text-gray-200">
                  <SelectItem value={undefined}>Default</SelectItem>
                  <SelectItem value="asc">Low to High</SelectItem>
                  <SelectItem value="desc">High to Low</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <CardContent className="p-2 sm:p-3 bg-black">
            {isLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-gray-300"></div>
              </div>
            ) : marketOrders.length === 0 ? (
              <div className="text-center py-8 text-gray-400 bg-zinc-950 rounded-lg border border-dashed border-zinc-800">
                <div className="flex justify-center mb-2">
                  {activeTab === 'buy' ? <ArrowDown className="h-8 w-8 text-zinc-700" /> : <ArrowUp className="h-8 w-8 text-zinc-700" />}
                </div>
                <h3 className="text-base font-medium mb-1 text-gray-300">No {activeTab === 'buy' ? 'buy' : 'sell'} orders available</h3>
                <p className="text-xs text-gray-400">Be the first to create a {activeTab === 'buy' ? 'buy' : 'sell'} order!</p>
                <Button 
                  onClick={handleCreateOrder} 
                  size="sm"
                  variant="outline"
                  className="mt-3 bg-zinc-900 border-zinc-800 text-gray-200 hover:bg-zinc-800"
                >
                  Create Order
                </Button>
              </div>
            ) : (
              <div className="grid gap-2">
                {marketOrders.map((order) => {
                  const coinDetails = getCoinDetails(order.currency);
                  const orderType = activeTab === 'buy' ? 'buy' : 'sell';
                  const buttonColorClass = orderType === 'buy' ? 
                    'bg-green-800 hover:bg-green-700 text-white' : 
                    'bg-red-800 hover:bg-red-700 text-white';

                  // Get the correct currency for price display
                  const priceCurrency = getPriceCurrency(order);

                  return (
                    <div key={order.id} className="border border-zinc-800 rounded-lg p-3 hover:shadow-md transition-shadow bg-zinc-950">
                      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
                        {/* User Info - Minimized Version */}
                        <div className="flex items-center gap-2">
                          <Avatar className="h-8 w-8 bg-zinc-800">
                            <span className="text-xs text-gray-200">{order.users.username.charAt(0).toUpperCase()}</span>
                          </Avatar>
                          <div>
                            <p className="font-medium text-sm text-gray-200">{order.users.username}</p>
                            <p className="text-xs text-gray-400">Transactions: {Math.floor(Math.random() * 10) + 1}</p>
                          </div>
                        </div>

                        {/* Order Details - Compact Grid */}  
                        <div className="flex flex-1 flex-wrap gap-2">
                          <div className="bg-zinc-900 rounded-md px-3 py-2 text-center min-w-[100px]">
                            <p className="text-xs text-gray-400">Price</p>
                            <p className="font-medium text-sm text-gray-200">{priceCurrency} {order.price.toLocaleString()}</p>
                          </div>

                          <div className="bg-zinc-900 rounded-md px-3 py-2 text-center min-w-[120px]">
                            <p className="text-xs text-gray-400">Available</p>
                            <div className="flex items-center justify-center gap-1 font-medium text-sm text-gray-200">
                              {order.amount.toLocaleString()} 
                              <div className="flex items-center">
                                {coinDetails.icon_url ? (
                                  <ImageWithFallback 
                                    src={coinDetails.icon_url}
                                    alt={coinDetails.name}
                                    className="h-3 w-3 ml-1"
                                    fallbackSrc="/placeholder.svg"
                                  />
                                ) : null}
                                <span className="ml-1">{order.currency}</span>
                              </div>
                            </div>

                            {/* Show fill status if partially filled */}
                            {order.status === 'partially_filled' && (
                              <div className="mt-1">
                                <div className="w-full bg-zinc-800 rounded-full h-1">
                                  <div 
                                    className="bg-blue-600 h-1 rounded-full" 
                                    style={{ width: `${order.filled_percentage}%` }}
                                  ></div>
                                </div>
                                <p className="text-xs text-gray-400 mt-1">{order.filled_percentage.toFixed(0)}% filled</p>
                              </div>
                            )}
                          </div>

                          <div className="bg-zinc-900 rounded-md px-3 py-2 text-center min-w-[120px]">
                            <p className="text-xs text-gray-400">Limit</p>
                            <p className="font-medium text-sm text-gray-200">
                              {priceCurrency} {(order.price * order.amount * 0.1).toLocaleString(undefined, {maximumFractionDigits: 0})} - {(order.price * order.amount).toLocaleString(undefined, {maximumFractionDigits: 0})}
                            </p>
                          </div>
                        </div>

                        {/* Action Button */}
                        <div>
                          <Button
                            onClick={() => handleTrade(order)}
                            className={buttonColorClass + " px-6 py-2 text-sm font-medium"}
                            size="sm"
                          >
                            {orderType}
                          </Button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </CardContent>
        </Tabs>
      </Card>

      {/* Trade Execution Dialog */}
      <TradeExecutionDialog
        isOpen={showTradeDialog}
        onClose={() => setShowTradeDialog(false)}
        order={selectedOrder}
        onSuccess={() => {
          fetchOrders();
        }}
      />
    </div>
  );
};

export default MarketOrdersPage;