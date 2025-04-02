
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowDown, ArrowUp, Search, RefreshCcw } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";

interface MarketOrder {
  id: string;
  userId: string;
  type: "buy" | "sell";
  currency: string;
  amount: number;
  price: number;
  status: "open" | "partially_filled" | "filled" | "cancelled";
  createdAt: string;
  username?: string;
}

const MarketPage = () => {
  const { toast } = useToast();
  const { user, isAuthenticated } = useAuth();
  const [orders, setOrders] = useState<MarketOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const [filterCurrency, setFilterCurrency] = useState("");
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const [isTradeDialogOpen, setIsTradeDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MarketOrder | null>(null);
  const [tradeAmount, setTradeAmount] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  
  const fetchOrders = useCallback(async () => {
    setIsLoading(true);
    try {
      // Fetch open orders
      let query = supabase
        .from("orders")
        .select("*, users(username)")
        .in("status", ["open", "partially_filled"])
        .order("created_at", { ascending: false });
      
      // Apply type filter
      if (activeTab === "buy") {
        query = query.eq("type", "buy");
      } else if (activeTab === "sell") {
        query = query.eq("type", "sell");
      }
      
      // Apply currency filter
      if (filterCurrency) {
        query = query.eq("currency", filterCurrency);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      // Format orders
      const formattedOrders: MarketOrder[] = data.map(item => ({
        id: item.id,
        userId: item.user_id,
        type: item.type as "buy" | "sell",
        currency: item.currency,
        amount: item.amount,
        price: item.price,
        status: item.status as "open" | "partially_filled" | "filled" | "cancelled",
        createdAt: item.created_at,
        username: item.users?.username
      }));
      
      // Get unique currencies for filter
      const currencies = [...new Set(data.map(item => item.currency))];
      setAvailableCurrencies(currencies);
      
      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Failed to load market orders",
        description: "An error occurred while fetching the market data.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [activeTab, filterCurrency, toast]);
  
  useEffect(() => {
    fetchOrders();
    
    // Set up real-time subscription for orders
    const channel = supabase
      .channel("market-changes")
      .on(
        "postgres_changes",
        {
          event: "*",
          schema: "public",
          table: "orders"
        },
        () => {
          fetchOrders();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchOrders]);
  
  const handleTradeClick = (order: MarketOrder) => {
    // Can't trade with own orders
    if (order.userId === user?.id) {
      toast({
        title: "Can't trade with own order",
        description: "You cannot execute trades with your own orders.",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedOrder(order);
    setTradeAmount(order.amount.toString());
    setIsTradeDialogOpen(true);
  };
  
  const executeTrade = async () => {
    if (!selectedOrder || !isAuthenticated || !user) return;
    
    const numericAmount = parseFloat(tradeAmount);
    if (isNaN(numericAmount) || numericAmount <= 0 || numericAmount > selectedOrder.amount) {
      toast({
        title: "Invalid amount",
        description: "Please enter a valid amount to trade.",
        variant: "destructive"
      });
      return;
    }
    
    setIsProcessing(true);
    
    try {
      // Execute the order using our database function
      const { data, error } = await supabase.rpc("execute_market_order", {
        order_id_param: selectedOrder.id,
        trader_id_param: user.id,
        trade_amount_param: numericAmount
      });
      
      if (error) throw error;
      
      toast({
        title: "Trade executed successfully",
        description: `You have ${selectedOrder.type === "buy" ? "sold" : "bought"} ${numericAmount} ${selectedOrder.currency}.`,
      });
      
      setIsTradeDialogOpen(false);
      fetchOrders();
    } catch (error: any) {
      console.error("Error executing trade:", error);
      toast({
        title: "Failed to execute trade",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Marketplace</h1>
      
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>Available Orders</CardTitle>
          <div className="flex flex-col sm:flex-row gap-4 items-center justify-between mt-4">
            <Tabs defaultValue="all" value={activeTab} onValueChange={setActiveTab} className="w-full sm:w-auto">
              <TabsList>
                <TabsTrigger value="all">All Orders</TabsTrigger>
                <TabsTrigger value="buy">Buy Orders</TabsTrigger>
                <TabsTrigger value="sell">Sell Orders</TabsTrigger>
              </TabsList>
            </Tabs>
            
            <div className="flex flex-1 gap-2 mt-4 sm:mt-0 w-full sm:w-auto">
              <div className="relative flex-1">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-gray-500" />
                <Select value={filterCurrency} onValueChange={setFilterCurrency}>
                  <SelectTrigger className="pl-9">
                    <SelectValue placeholder="Filter by currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Currencies</SelectItem>
                    {availableCurrencies.map(currency => (
                      <SelectItem key={currency} value={currency}>{currency}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <Button variant="outline" onClick={fetchOrders} size="icon">
                <RefreshCcw className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading market data...</div>
          ) : orders.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No active orders found for the selected filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Price (KES)</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Date</TableHead>
                    {isAuthenticated && <TableHead>Action</TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {orders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <Badge variant="outline" className={
                          order.type === "buy" 
                            ? "bg-green-100 text-green-800 border-green-200" 
                            : "bg-red-100 text-red-800 border-red-200"
                        }>
                          {order.type === "buy" ? (
                            <><ArrowDown className="h-3 w-3 mr-1 inline" /> Buy</>
                          ) : (
                            <><ArrowUp className="h-3 w-3 mr-1 inline" /> Sell</>
                          )}
                        </Badge>
                      </TableCell>
                      <TableCell>{order.currency}</TableCell>
                      <TableCell>{order.amount.toFixed(6)}</TableCell>
                      <TableCell>{order.price.toFixed(2)}</TableCell>
                      <TableCell>{(order.amount * order.price).toFixed(2)}</TableCell>
                      <TableCell>{order.username || "Anonymous"}</TableCell>
                      <TableCell>{formatDate(order.createdAt)}</TableCell>
                      {isAuthenticated && (
                        <TableCell>
                          {user?.id !== order.userId ? (
                            <Button 
                              size="sm" 
                              onClick={() => handleTradeClick(order)}
                              variant={order.type === "buy" ? "outline" : "default"}
                              className={order.type === "buy" ? "text-green-600 border-green-200" : ""}
                            >
                              {order.type === "buy" ? "Sell to" : "Buy from"}
                            </Button>
                          ) : (
                            <span className="text-sm text-gray-500">Your order</span>
                          )}
                        </TableCell>
                      )}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {isAuthenticated ? (
        <div className="mt-6">
          <p className="text-center text-sm text-gray-500">
            To create new orders, visit the <a href="/trade" className="text-blue-600 hover:underline">Trade</a> page
          </p>
        </div>
      ) : (
        <div className="mt-6 p-4 bg-amber-50 border border-amber-200 rounded-md">
          <p className="text-sm text-amber-800 text-center">
            <a href="/login" className="font-medium hover:underline">Sign in</a> or <a href="/register" className="font-medium hover:underline">register</a> to trade on the marketplace.
          </p>
        </div>
      )}
      
      {/* Trade Dialog */}
      <Dialog open={isTradeDialogOpen} onOpenChange={setIsTradeDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedOrder?.type === "buy" ? "Sell" : "Buy"} {selectedOrder?.currency}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Order Type:</span>
              <Badge variant="outline" className={
                selectedOrder?.type === "buy" 
                  ? "bg-green-100 text-green-800 border-green-200" 
                  : "bg-red-100 text-red-800 border-red-200"
              }>
                {selectedOrder?.type === "buy" ? "Buy" : "Sell"} Order
              </Badge>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Price:</span>
              <span className="font-medium">{selectedOrder?.price.toFixed(2)} KES</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-500">Available Amount:</span>
              <span className="font-medium">{selectedOrder?.amount.toFixed(6)} {selectedOrder?.currency}</span>
            </div>
            
            <div className="space-y-2 pt-2">
              <Label htmlFor="tradeAmount">Amount to {selectedOrder?.type === "buy" ? "sell" : "buy"}:</Label>
              <Input
                id="tradeAmount"
                type="number"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                placeholder={`Enter amount in ${selectedOrder?.currency}`}
                min="0.000001"
                max={selectedOrder?.amount.toString()}
                step="0.000001"
              />
              
              <div className="flex justify-between text-sm mt-1">
                <span 
                  className="text-blue-600 hover:underline cursor-pointer"
                  onClick={() => setTradeAmount(selectedOrder?.amount.toString() || "")}
                >
                  Max
                </span>
                <span 
                  className="text-blue-600 hover:underline cursor-pointer"
                  onClick={() => {
                    if (selectedOrder) {
                      setTradeAmount((selectedOrder.amount / 2).toFixed(6));
                    }
                  }}
                >
                  Half
                </span>
              </div>
            </div>
            
            {tradeAmount && selectedOrder && (
              <div className="p-3 bg-gray-50 rounded-md border">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-gray-500">Total Cost:</span>
                  <span className="font-medium">
                    {(parseFloat(tradeAmount) * selectedOrder.price).toFixed(2)} KES
                  </span>
                </div>
              </div>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsTradeDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={executeTrade} 
              disabled={isProcessing || !tradeAmount}
              variant={selectedOrder?.type === "sell" ? "default" : "destructive"}
            >
              {isProcessing ? "Processing..." : selectedOrder?.type === "buy" ? "Sell Now" : "Buy Now"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default MarketPage;
