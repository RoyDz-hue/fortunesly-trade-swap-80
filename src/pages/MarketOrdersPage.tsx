
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
import { ArrowDown, ArrowUp, Filter, Plus } from 'lucide-react';
import TradeExecutionDialog from '@/components/dashboard/TradeExecutionDialog';
import { useNavigate } from 'react-router-dom';
import ImageWithFallback from '@/components/common/ImageWithFallback';

const MarketOrdersPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  const [activeTab, setActiveTab] = useState("sell"); // "sell" means showing buy orders, "buy" means showing sell orders
  const [selectedCoin, setSelectedCoin] = useState("all");
  const [priceSort, setPriceSort] = useState(null);
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
        .eq('status', 'open')
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
      
      // Format the data to include username
      const formattedData = data.map(order => ({
        ...order,
        username: order.users?.username || 'Unknown'
      }));
      
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

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return new Intl.DateTimeFormat('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    }).format(date);
  };

  // Filter out user's own orders
  const marketOrders = user ? orders.filter(order => order.user_id !== user.id) : orders;

  const handleCreateOrder = () => {
    navigate('/dashboard/orders');
  };

  const getCoinDetails = (symbol) => {
    return availableCoins.find(coin => coin.symbol === symbol) || { name: symbol, icon_url: null };
  };

  return (
    <div className="w-full py-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 gap-4">
        <h1 className="text-3xl font-bold">Market Orders</h1>
        
        <Button 
          onClick={handleCreateOrder} 
          className="flex items-center gap-2"
        >
          <Plus size={16} />
          Create Order
        </Button>
      </div>
      
      <Card className="mb-6 border shadow-sm">
        <CardHeader className="pb-3 bg-gray-50 border-b">
          <CardTitle className="text-xl">Available Orders</CardTitle>
        </CardHeader>
        
        <Tabs defaultValue="sell" value={activeTab} onValueChange={setActiveTab} className="w-full">
          <div className="px-4 pt-4">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="sell" className="flex items-center">
                <ArrowDown className="h-4 w-4 mr-2" />
                Buy
              </TabsTrigger>
              <TabsTrigger value="buy" className="flex items-center">
                <ArrowUp className="h-4 w-4 mr-2" />
                Sell
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
            ) : marketOrders.length === 0 ? (
              <div className="text-center py-12 text-gray-500 bg-gray-50 rounded-lg border border-dashed">
                <div className="flex justify-center mb-2">
                  {activeTab === 'buy' ? <ArrowUp className="h-12 w-12 text-gray-300" /> : <ArrowDown className="h-12 w-12 text-gray-300" />}
                </div>
                <h3 className="text-lg font-medium mb-1">No {activeTab === 'buy' ? 'sell' : 'buy'} orders available</h3>
                <p className="text-sm">Be the first to create a {activeTab === 'buy' ? 'sell' : 'buy'} order!</p>
                <Button 
                  onClick={handleCreateOrder} 
                  variant="outline"
                  className="mt-4"
                >
                  Create Order
                </Button>
              </div>
            ) : (
              <div className="grid gap-4">
                {marketOrders.map((order) => {
                  const coinDetails = getCoinDetails(order.currency);
                  const orderType = activeTab === 'buy' ? 'sell' : 'buy';
                  const buttonColorClass = orderType === 'buy' ? 
                    'bg-green-600 hover:bg-green-700 text-white' : 
                    'bg-red-600 hover:bg-red-700 text-white';
                  
                  return (
                    <div key={order.id} className="border rounded-lg p-6 hover:shadow-md transition-shadow bg-white">
                      <div className="flex flex-col sm:flex-row justify-between gap-4">
                        <div className="flex-1">
                          <div className="flex items-center gap-3 mb-4">
                            <Avatar className="h-10 w-10 bg-gray-200">
                              <span className="text-sm">{order.username.charAt(0).toUpperCase()}</span>
                            </Avatar>
                            <div>
                              <p className="font-medium text-lg">{order.username}</p>
                              <p className="text-sm text-gray-500">Transactions: {Math.floor(Math.random() * 10) + 1}</p>
                            </div>
                          </div>
                          
                          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mt-3">
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">Price</p>
                              <p className="font-medium text-lg">KES {order.price.toLocaleString()}</p>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">Available</p>
                              <div className="flex items-center gap-1 font-medium text-lg">
                                {order.amount.toLocaleString()} 
                                <div className="flex items-center ml-1">
                                  {coinDetails.icon_url ? (
                                    <ImageWithFallback 
                                      src={coinDetails.icon_url}
                                      alt={coinDetails.name}
                                      className="h-4 w-4 ml-1"
                                      fallbackSrc="/placeholder.svg"
                                    />
                                  ) : null}
                                  <span className="ml-1">{order.currency}</span>
                                </div>
                              </div>
                            </div>
                            <div className="bg-gray-50 p-3 rounded-lg">
                              <p className="text-sm text-gray-500 mb-1">Limit</p>
                              <p className="font-medium text-lg">
                                KES {(order.price * order.amount * 0.1).toLocaleString(undefined, {maximumFractionDigits: 0})} - {(order.price * order.amount).toLocaleString(undefined, {maximumFractionDigits: 0})}
                              </p>
                            </div>
                          </div>
                        </div>
                        
                        <div className="flex items-center">
                          <Button
                            onClick={() => handleTrade(order)}
                            className={buttonColorClass + " px-8 py-6 text-lg font-medium"}
                          >
                            {orderType === 'buy' ? 'Buy' : 'Sell'}
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
