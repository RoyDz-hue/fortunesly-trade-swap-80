
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowUp, ArrowDown, Filter } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

interface MarketOrder {
  id: string;
  userId: string;
  username?: string;
  type: 'buy' | 'sell';
  currency: string;
  amount: number;
  price: number;
  status: string;
  createdAt: string;
}

const MarketPage = () => {
  const [marketOrders, setMarketOrders] = useState<MarketOrder[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedCurrency, setSelectedCurrency] = useState<string>("all");
  const [availableCurrencies, setAvailableCurrencies] = useState<string[]>([]);
  const [isOrderDialogOpen, setIsOrderDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<MarketOrder | null>(null);
  const [tradeAmount, setTradeAmount] = useState<number>(0);
  const [maxTradeAmount, setMaxTradeAmount] = useState<number>(0);
  
  const { user } = useAuth();
  const { toast } = useToast();
  
  // Fetch available currencies for filtering
  useEffect(() => {
    const fetchCurrencies = async () => {
      try {
        const { data, error } = await supabase
          .from('coins')
          .select('symbol')
          .order('symbol');
          
        if (error) throw error;
        
        if (data) {
          const currencies = data.map(coin => coin.symbol);
          setAvailableCurrencies(currencies);
        }
      } catch (error) {
        console.error("Error fetching currencies:", error);
      }
    };
    
    fetchCurrencies();
  }, []);
  
  // Set up realtime subscription for orders
  useEffect(() => {
    fetchMarketOrders();
    
    const channel = supabase
      .channel('market-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          console.log("Orders table changed, refreshing market data");
          fetchMarketOrders();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, [selectedCurrency]);
  
  const fetchMarketOrders = async () => {
    setIsLoading(true);
    try {
      let query = supabase
        .from('orders')
        .select(`
          *,
          users:user_id (username)
        `)
        .in('status', ['open', 'partially_filled'])
        .order('created_at', { ascending: false });
      
      // Apply currency filter if not "all"
      if (selectedCurrency && selectedCurrency !== "all") {
        query = query.eq('currency', selectedCurrency);
      }
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      if (data) {
        const formattedOrders: MarketOrder[] = data.map(order => ({
          id: order.id,
          userId: order.user_id || "",
          username: order.users?.username || "Unknown user",
          type: order.type as 'buy' | 'sell',
          currency: order.currency,
          amount: Number(order.amount),
          price: Number(order.price),
          status: order.status || "open",
          createdAt: order.created_at || new Date().toISOString()
        }));
        
        setMarketOrders(formattedOrders);
      }
    } catch (error) {
      console.error("Error fetching market orders:", error);
      toast({
        title: "Failed to load market data",
        description: "An error occurred while fetching market orders",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleOrderClick = async (order: MarketOrder) => {
    if (order.userId === user?.id) {
      toast({
        title: "Cannot trade with your own order",
        description: "You cannot fulfill your own buy/sell order",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedOrder(order);
    setTradeAmount(order.amount);  // Default to full amount
    setMaxTradeAmount(order.amount);
    
    // Get user's balance to validate trade
    try {
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('balance_crypto, balance_fiat')
        .eq('id', user?.id)
        .single();
        
      if (userError) throw userError;
      
      if (userData) {
        const cryptoBalances = userData.balance_crypto as Record<string, number> || {};
        const fiatBalance = userData.balance_fiat || 0;
        
        // If buying crypto with KES, check KES balance
        if (order.type === 'sell') {
          const totalCost = order.price * order.amount;
          if (fiatBalance < totalCost) {
            toast({
              title: "Insufficient KES balance",
              description: `You need ${totalCost} KES but only have ${fiatBalance} KES`,
              variant: "destructive"
            });
            return;
          }
        }
        
        // If selling crypto for KES, check crypto balance
        if (order.type === 'buy') {
          const cryptoBalance = cryptoBalances[order.currency] || 0;
          if (cryptoBalance < order.amount) {
            toast({
              title: "Insufficient crypto balance",
              description: `You need ${order.amount} ${order.currency} but only have ${cryptoBalance} ${order.currency}`,
              variant: "destructive"
            });
            return;
          }
        }
        
        setIsOrderDialogOpen(true);
      }
    } catch (error) {
      console.error("Error checking balances:", error);
      toast({
        title: "Failed to check balances",
        description: "An error occurred while validating your balances",
        variant: "destructive"
      });
    }
  };
  
  const executeOrder = async () => {
    if (!selectedOrder || !user) return;
    
    try {
      const isBuying = selectedOrder.type === 'sell'; // If market order is sell, user is buying
      const totalCost = selectedOrder.price * tradeAmount;
      
      // Start a transaction to handle the order execution
      const { data: transaction, error: transactionError } = await supabase.rpc('execute_market_order', {
        order_id_param: selectedOrder.id,
        trader_id_param: user.id,
        trade_amount_param: tradeAmount
      });
      
      if (transactionError) {
        console.error("Transaction error:", transactionError);
        throw new Error(transactionError.message);
      }
      
      // Close dialog and refresh orders
      setIsOrderDialogOpen(false);
      setSelectedOrder(null);
      fetchMarketOrders();
      
      toast({
        title: "Order executed successfully",
        description: `You have ${isBuying ? 'bought' : 'sold'} ${tradeAmount} ${selectedOrder.currency} at ${selectedOrder.price} KES each`,
      });
      
    } catch (error: any) {
      console.error("Error executing order:", error);
      toast({
        title: "Failed to execute order",
        description: error.message || "An error occurred while processing your order",
        variant: "destructive"
      });
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">Market</h1>
      
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center space-x-2">
          <Filter className="h-5 w-5 text-gray-500" />
          <span className="text-sm font-medium">Filter by:</span>
          <Select
            value={selectedCurrency}
            onValueChange={setSelectedCurrency}
          >
            <SelectTrigger className="w-36 h-9">
              <SelectValue placeholder="All Currencies" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Currencies</SelectItem>
              {availableCurrencies.map(currency => (
                <SelectItem key={currency} value={currency}>{currency}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        
        <Button
          variant="outline"
          size="sm"
          onClick={fetchMarketOrders}
        >
          Refresh Market
        </Button>
      </div>
      
      <Card>
        <CardHeader className="py-4">
          <CardTitle className="text-lg font-semibold">Available Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">
              <div className="w-8 h-8 border-2 border-t-fortunesly-primary border-gray-200 rounded-full animate-spin mx-auto"></div>
              <p className="mt-2 text-gray-500">Loading market data...</p>
            </div>
          ) : marketOrders.length > 0 ? (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Currency</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Price</TableHead>
                    <TableHead>Total</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Action</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {marketOrders.map(order => (
                    <TableRow key={order.id}>
                      <TableCell>
                        <div className="flex items-center">
                          {order.type === 'buy' ? (
                            <Badge variant="outline" className="bg-green-50 text-green-700 border-green-200">
                              <ArrowDown className="h-3 w-3 mr-1" /> BUY
                            </Badge>
                          ) : (
                            <Badge variant="outline" className="bg-red-50 text-red-700 border-red-200">
                              <ArrowUp className="h-3 w-3 mr-1" /> SELL
                            </Badge>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{order.currency}</TableCell>
                      <TableCell>{order.amount}</TableCell>
                      <TableCell>{order.price} KES</TableCell>
                      <TableCell>{(order.price * order.amount).toFixed(2)} KES</TableCell>
                      <TableCell>{order.username}</TableCell>
                      <TableCell>
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => handleOrderClick(order)}
                          disabled={order.userId === user?.id}
                          className={order.type === 'buy' ? 'text-green-600 hover:text-green-700' : 'text-red-600 hover:text-red-700'}
                        >
                          {order.type === 'buy' ? 'Sell Here' : 'Buy Now'}
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          ) : (
            <div className="text-center py-10 text-gray-500">
              <p>No market orders available{selectedCurrency !== "all" ? ` for ${selectedCurrency}` : ''}</p>
              <p className="text-sm mt-1">Be the first to create an order!</p>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Order Execution Dialog */}
      {selectedOrder && (
        <Dialog open={isOrderDialogOpen} onOpenChange={setIsOrderDialogOpen}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>
                {selectedOrder.type === 'sell' ? 'Buy' : 'Sell'} {selectedOrder.currency}
              </DialogTitle>
              <DialogDescription>
                {selectedOrder.type === 'sell'
                  ? `You are about to buy ${selectedOrder.currency} at ${selectedOrder.price} KES per coin`
                  : `You are about to sell ${selectedOrder.currency} at ${selectedOrder.price} KES per coin`
                }
              </DialogDescription>
            </DialogHeader>
            
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount to {selectedOrder.type === 'sell' ? 'buy' : 'sell'}</Label>
                <Input
                  id="amount"
                  type="number"
                  value={tradeAmount}
                  onChange={(e) => setTradeAmount(Math.min(Number(e.target.value), maxTradeAmount))}
                  min={0.000001}
                  max={maxTradeAmount}
                  step={0.000001}
                />
                <p className="text-xs text-gray-500">
                  Max: {maxTradeAmount} {selectedOrder.currency}
                </p>
              </div>
              
              <div className="space-y-2">
                <Label>Total Cost</Label>
                <div className="p-2 bg-gray-50 border border-gray-200 rounded-md">
                  {(selectedOrder.price * tradeAmount).toFixed(2)} KES
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsOrderDialogOpen(false)}>
                Cancel
              </Button>
              <Button 
                onClick={executeOrder}
                disabled={tradeAmount <= 0 || tradeAmount > maxTradeAmount}
              >
                Confirm {selectedOrder.type === 'sell' ? 'Purchase' : 'Sale'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
};

export default MarketPage;
