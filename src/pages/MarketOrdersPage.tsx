import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuth } from "@/context/AuthContext";

interface Order {
  id: string;
  type: 'buy' | 'sell';
  currency: string;
  amount: number;
  price: number;
  status: 'open' | 'filled' | 'cancelled' | 'partially_filled';
  created_at: string;
  user_id: string;
  username?: string;
}

interface OrderResponse {
  id: string;
  type: string;
  currency: string;
  amount: number;
  price: number;
  status: string | null;
  created_at: string | null;
  user_id: string | null;
  users: {
    username: string;
  };
}

const MarketOrdersPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [tradeAmount, setTradeAmount] = useState<string>("");
  const [isTrading, setIsTrading] = useState(false);
  const [isDialogOpen, setIsDialogOpen] = useState(false);

  useEffect(() => {
    fetchOrders();
    
    // Setup real-time subscriptions
    const channel = supabase
      .channel('orders-changes')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'orders' },
        () => {
          fetchOrders();
        }
      )
      .subscribe();
      
    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users:user_id (username)
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });
        
      if (error) throw error;
      
      console.log("Fetched orders:", data);
      
      // Format the data and safely type cast
      const formattedOrders: Order[] = data.map((order: OrderResponse) => ({
        id: order.id,
        type: order.type === 'sell' ? 'sell' : 'buy',
        currency: order.currency,
        amount: order.amount,
        price: order.price,
        status: (order.status as 'open' | 'filled' | 'cancelled' | 'partially_filled') || 'open',
        created_at: order.created_at || new Date().toISOString(),
        user_id: order.user_id || '',
        username: order.users?.username
      }));
      
      setOrders(formattedOrders);
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Failed to load orders",
        description: "There was an error fetching the market orders",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const openTradeDialog = (order: Order) => {
    setSelectedOrder(order);
    // Set default to full amount
    setTradeAmount(order.amount.toString());
    setIsDialogOpen(true);
  };

  const setMaxAmount = () => {
    if (selectedOrder) {
      setTradeAmount(selectedOrder.amount.toString());
    }
  };

  const setHalfAmount = () => {
    if (selectedOrder) {
      setTradeAmount((selectedOrder.amount / 2).toString());
    }
  };

  const handleTradeSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedOrder || !tradeAmount || !user) return;
    
    setIsTrading(true);
    
    try {
      const parsedAmount = parseFloat(tradeAmount);
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        toast({
          title: "Invalid amount",
          description: "Please enter a valid amount greater than zero",
          variant: "destructive"
        });
        return;
      }
      
      if (parsedAmount > selectedOrder.amount) {
        toast({
          title: "Amount too large",
          description: `The maximum available amount is ${selectedOrder.amount}`,
          variant: "destructive"
        });
        return;
      }
      
      // Execute the market order
      const { data, error } = await supabase.rpc(
        'execute_market_order',
        {
          order_id_param: selectedOrder.id,
          trader_id_param: user.id,
          trade_amount_param: parsedAmount
        } as any
      );
      
      if (error) {
        console.error("Error executing trade:", error);
        throw error;
      }
      
      console.log("Trade completed:", data);
      
      toast({
        title: "Trade successful",
        description: `You have successfully ${selectedOrder.type === 'buy' ? 'sold' : 'bought'} ${parsedAmount} ${selectedOrder.currency} at ${selectedOrder.price} KES/unit`,
      });
      
      setIsDialogOpen(false);
      fetchOrders();
    } catch (error: any) {
      console.error("Failed to execute trade:", error);
      toast({
        title: "Trade failed",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsTrading(false);
    }
  };

  const calculateTotal = () => {
    if (!selectedOrder || !tradeAmount) return 0;
    
    const amount = parseFloat(tradeAmount);
    return isNaN(amount) ? 0 : amount * selectedOrder.price;
  };

  return (
    <div className="container py-8">
      <h1 className="text-2xl font-bold mb-6">Market Orders</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Open Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" className="space-y-4">
            <TabsList>
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="buy">Buy Orders</TabsTrigger>
              <TabsTrigger value="sell">Sell Orders</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {renderOrdersTable(orders, openTradeDialog, isLoading)}
            </TabsContent>
            
            <TabsContent value="buy">
              {renderOrdersTable(orders.filter(order => order.type === 'buy'), openTradeDialog, isLoading)}
            </TabsContent>
            
            <TabsContent value="sell">
              {renderOrdersTable(orders.filter(order => order.type === 'sell'), openTradeDialog, isLoading)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          {selectedOrder && (
            <>
              <DialogHeader>
                <DialogTitle>
                  {selectedOrder.type === 'buy' ? 'Sell to' : 'Buy from'} this {selectedOrder.type} order
                </DialogTitle>
                <DialogDescription>
                  {selectedOrder.type === 'buy' 
                    ? `You are selling ${selectedOrder.currency} at ${selectedOrder.price} KES/unit`
                    : `You are buying ${selectedOrder.currency} at ${selectedOrder.price} KES/unit`
                  }
                </DialogDescription>
              </DialogHeader>
              
              <form onSubmit={handleTradeSubmit}>
                <div className="grid gap-4 py-4">
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="order-type" className="text-right">
                      Order Type
                    </Label>
                    <div className="col-span-3">
                      <Badge variant={selectedOrder.type === 'buy' ? 'default' : 'outline'}>
                        {selectedOrder.type === 'buy' ? 'Buy Order (you sell)' : 'Sell Order (you buy)'}
                      </Badge>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="owner" className="text-right">
                      Owner
                    </Label>
                    <div className="col-span-3">
                      <span className="text-sm">
                        {selectedOrder.username || "Anonymous"}
                      </span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                      Amount
                    </Label>
                    <div className="col-span-3 space-y-2">
                      <div className="flex gap-2">
                        <Input
                          id="amount"
                          type="number"
                          step="0.00000001"
                          value={tradeAmount}
                          onChange={(e) => setTradeAmount(e.target.value)}
                          placeholder={`Enter ${selectedOrder.currency} amount`}
                        />
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={setMaxAmount}
                        >
                          Max
                        </Button>
                        <Button 
                          type="button" 
                          variant="outline" 
                          size="sm"
                          onClick={setHalfAmount}
                        >
                          Half
                        </Button>
                      </div>
                      <div className="text-xs text-gray-500">
                        Available: {selectedOrder.amount} {selectedOrder.currency}
                      </div>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="price" className="text-right">
                      Price
                    </Label>
                    <div className="col-span-3">
                      <span>{selectedOrder.price} KES/{selectedOrder.currency}</span>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="total" className="text-right">
                      Total
                    </Label>
                    <div className="col-span-3">
                      <span className="font-semibold">{calculateTotal()} KES</span>
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                    Cancel
                  </Button>
                  <Button type="submit" disabled={isTrading}>
                    {isTrading ? "Processing..." : (
                      selectedOrder.type === 'buy' ? "Sell" : "Buy"
                    )}
                  </Button>
                </DialogFooter>
              </form>
            </>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

const renderOrdersTable = (
  orders: Order[], 
  onTradeClick: (order: Order) => void,
  isLoading: boolean
) => {
  const { user } = useAuth();
  
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <div className="w-8 h-8 border-2 border-t-blue-600 border-gray-200 rounded-full animate-spin mx-auto"></div>
        <p className="mt-2 text-gray-500">Loading market orders...</p>
      </div>
    );
  }
  
  if (orders.length === 0) {
    return (
      <div className="text-center py-8 text-gray-500">
        <p>No open orders found</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>Type</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Price (KES)</TableHead>
            <TableHead>Total (KES)</TableHead>
            <TableHead>Owner</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isOwnOrder = user && order.user_id === user.id;
            
            return (
              <TableRow key={order.id}>
                <TableCell>
                  <Badge variant={order.type === 'buy' ? "default" : "outline"}>
                    {order.type === 'buy' ? 'Buy' : 'Sell'}
                  </Badge>
                </TableCell>
                <TableCell>{order.currency}</TableCell>
                <TableCell>{order.amount.toFixed(8)}</TableCell>
                <TableCell>{order.price}</TableCell>
                <TableCell>{(order.amount * order.price).toFixed(2)}</TableCell>
                <TableCell>{isOwnOrder ? "You" : (order.username || "Anonymous")}</TableCell>
                <TableCell>{new Date(order.created_at).toLocaleString()}</TableCell>
                <TableCell>
                  {!isOwnOrder ? (
                    <Button 
                      size="sm" 
                      variant="outline"
                      className={order.type === 'buy' 
                        ? "bg-green-50 text-green-700 border-green-200 hover:bg-green-100" 
                        : "bg-blue-50 text-blue-700 border-blue-200 hover:bg-blue-100"
                      }
                      onClick={() => onTradeClick(order)}
                    >
                      {order.type === 'buy' ? 'Sell' : 'Buy'}
                    </Button>
                  ) : (
                    <span className="text-sm text-gray-500">Your order</span>
                  )}
                </TableCell>
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default MarketOrdersPage;
