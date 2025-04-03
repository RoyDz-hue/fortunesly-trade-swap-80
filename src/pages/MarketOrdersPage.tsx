
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { LoaderCircle, Check, X, ArrowUpDown, AlertTriangle } from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";

interface Order {
  id: string;
  type: "buy" | "sell";
  currency: string;
  amount: number;
  price: number;
  status: "open" | "filled" | "cancelled" | "partially_filled";
  created_at: string;
  user_id: string;
  username?: string;
}

const MarketOrdersPage = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [orders, setOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<"all" | "buy" | "sell">("all");
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<Order | null>(null);
  const [tradeAmount, setTradeAmount] = useState<string>("");
  const [tradeType, setTradeType] = useState<"full" | "partial" | "specific">("full");
  const [isProcessing, setIsProcessing] = useState(false);
  
  useEffect(() => {
    if (user) {
      fetchOrders();
      
      // Set up realtime subscription for orders updates
      const channel = supabase
        .channel('orders-changes')
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
    }
  }, [user]);
  
  const fetchOrders = async () => {
    if (!user) return;
    
    setIsLoading(true);
    setError(null);
    
    try {
      // Fetch open orders with user info
      const { data, error } = await supabase
        .from('orders')
        .select(`
          *,
          users (
            username
          )
        `)
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      console.log("Fetched orders:", data);
      
      // Format the data and safely type cast
      const formattedOrders: Order[] = data.map((order: any) => ({
        id: order.id,
        type: order.type === 'sell' ? 'sell' : 'buy',
        currency: order.currency,
        amount: order.amount,
        price: order.price,
        status: order.status as "open" | "filled" | "cancelled" | "partially_filled",
        created_at: order.created_at,
        user_id: order.user_id,
        username: order.users?.username
      }));
      
      setOrders(formattedOrders);
    } catch (error: any) {
      console.error("Error fetching orders:", error);
      setError(error.message || "Failed to load orders");
    } finally {
      setIsLoading(false);
    }
  };
  
  const openTradeDialog = (order: Order) => {
    setSelectedOrder(order);
    // Default to full amount for the trade
    setTradeAmount(order.amount.toString());
    setTradeType("full");
    setIsDialogOpen(true);
  };
  
  const handleTradeTypeChange = (value: "full" | "partial" | "specific") => {
    setTradeType(value);
    
    if (selectedOrder) {
      if (value === "full") {
        setTradeAmount(selectedOrder.amount.toString());
      } else if (value === "partial") {
        setTradeAmount((selectedOrder.amount / 2).toString());
      }
    }
  };
  
  const executeTradeTransaction = async () => {
    if (!user || !selectedOrder) return;
    
    setIsProcessing(true);
    
    try {
      const parsedAmount = parseFloat(tradeAmount);
      
      if (isNaN(parsedAmount) || parsedAmount <= 0) {
        throw new Error("Please enter a valid amount");
      }
      
      if (parsedAmount > selectedOrder.amount) {
        throw new Error("Amount exceeds order size");
      }
      
      console.log("Executing trade:", {
        orderId: selectedOrder.id,
        traderId: user.id,
        amount: parsedAmount
      });
      
      // Execute the market order
      const { data, error } = await supabase.rpc(
        'execute_market_order',
        {
          order_id_param: selectedOrder.id,
          trader_id_param: user.id,
          trade_amount_param: parsedAmount
        }
      );
      
      if (error) {
        console.error("Trade execution error:", error);
        throw new Error(error.message);
      }
      
      console.log("Trade execution result:", data);
      
      toast({
        title: "Trade Executed Successfully",
        description: `You have ${selectedOrder.type === 'buy' ? 'sold' : 'bought'} ${parsedAmount} ${selectedOrder.currency} at ${selectedOrder.price} KES per unit`,
      });
      
      setIsDialogOpen(false);
      fetchOrders();
    } catch (error: any) {
      console.error("Trade execution error:", error);
      toast({
        title: "Trade Failed",
        description: error.message || "There was an error executing the trade",
        variant: "destructive",
      });
    } finally {
      setIsProcessing(false);
    }
  };
  
  return (
    <div className="container mx-auto py-8">
      <h1 className="text-2xl font-bold mb-6">Market Orders</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Available Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="all" value={activeTab} onValueChange={(value) => setActiveTab(value as "all" | "buy" | "sell")}>
            <TabsList className="mb-4">
              <TabsTrigger value="all">All Orders</TabsTrigger>
              <TabsTrigger value="buy">Buy Orders</TabsTrigger>
              <TabsTrigger value="sell">Sell Orders</TabsTrigger>
            </TabsList>
            
            <TabsContent value="all">
              {renderOrdersTable(orders, openTradeDialog, isLoading, user)}
            </TabsContent>
            
            <TabsContent value="buy">
              {renderOrdersTable(orders.filter(order => order.type === 'buy'), openTradeDialog, isLoading, user)}
            </TabsContent>
            
            <TabsContent value="sell">
              {renderOrdersTable(orders.filter(order => order.type === 'sell'), openTradeDialog, isLoading, user)}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
      
      {/* Trade Execution Dialog */}
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Execute {selectedOrder?.type === 'buy' ? 'Sell' : 'Buy'} Order</DialogTitle>
            <DialogDescription>
              {selectedOrder?.type === 'buy' 
                ? `Sell ${selectedOrder?.currency} to fulfill this buy order`
                : `Buy ${selectedOrder?.currency} from this sell order`}
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="currency" className="text-right">
                Currency
              </Label>
              <div className="col-span-3">
                <span className="font-medium">{selectedOrder?.currency}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="price" className="text-right">
                Price
              </Label>
              <div className="col-span-3">
                <span className="font-medium">{selectedOrder?.price} KES per unit</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="available" className="text-right">
                Available
              </Label>
              <div className="col-span-3">
                <span className="font-medium">{selectedOrder?.amount} {selectedOrder?.currency}</span>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right">
                Trade Type
              </Label>
              <div className="col-span-3">
                <RadioGroup 
                  value={tradeType} 
                  onValueChange={(value) => handleTradeTypeChange(value as "full" | "partial" | "specific")}
                >
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="full" id="full" />
                    <Label htmlFor="full">Full Order</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="partial" id="partial" />
                    <Label htmlFor="partial">Half Order</Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <RadioGroupItem value="specific" id="specific" />
                    <Label htmlFor="specific">Specific Amount</Label>
                  </div>
                </RadioGroup>
              </div>
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="amount" className="text-right">
                Amount
              </Label>
              <Input
                id="amount"
                type="number"
                value={tradeAmount}
                onChange={(e) => setTradeAmount(e.target.value)}
                disabled={tradeType !== "specific"}
                className="col-span-3"
                step="0.000001"
                min="0.000001"
                max={selectedOrder?.amount}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="total" className="text-right">
                Total
              </Label>
              <div className="col-span-3">
                <span className="font-medium">
                  {(parseFloat(tradeAmount || "0") * (selectedOrder?.price || 0)).toLocaleString()} KES
                </span>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)} disabled={isProcessing}>
              Cancel
            </Button>
            <Button onClick={executeTradeTransaction} disabled={isProcessing}>
              {isProcessing ? (
                <>
                  <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                <>Execute Trade</>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

const renderOrdersTable = (
  orders: Order[], 
  onTradeClick: (order: Order) => void,
  isLoading: boolean,
  currentUser: any
) => {
  if (isLoading) {
    return (
      <div className="text-center py-8">
        <LoaderCircle className="h-8 w-8 animate-spin mx-auto text-gray-400" />
        <p className="mt-2 text-gray-500">Loading orders...</p>
      </div>
    );
  }
  
  if (!orders || orders.length === 0) {
    return (
      <div className="text-center py-8">
        <AlertTriangle className="h-8 w-8 mx-auto text-amber-500" />
        <p className="mt-2 text-gray-500">No orders available</p>
      </div>
    );
  }
  
  return (
    <div className="overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead>User</TableHead>
            <TableHead>Type</TableHead>
            <TableHead>Currency</TableHead>
            <TableHead>Amount</TableHead>
            <TableHead>Price (KES)</TableHead>
            <TableHead>Total (KES)</TableHead>
            <TableHead>Date</TableHead>
            <TableHead>Action</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {orders.map((order) => {
            const isOwnOrder = currentUser && order.user_id === currentUser.id;
            
            return (
              <TableRow key={order.id}>
                <TableCell>{order.username || "Anonymous"}</TableCell>
                <TableCell>
                  <Badge variant="outline" className={
                    order.type === 'buy' 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-red-50 text-red-700 border-red-200"
                  }>
                    {order.type.toUpperCase()}
                  </Badge>
                </TableCell>
                <TableCell>{order.currency}</TableCell>
                <TableCell>{order.amount}</TableCell>
                <TableCell>{order.price}</TableCell>
                <TableCell>{(order.amount * order.price).toFixed(2)}</TableCell>
                <TableCell>{new Date(order.created_at).toLocaleDateString()}</TableCell>
                <TableCell>
                  {!isOwnOrder ? (
                    <Button 
                      variant="outline" 
                      size="sm"
                      className={
                        order.type === 'buy' 
                          ? "bg-red-50 text-red-700 border-red-200 hover:bg-red-100"
                          : "bg-green-50 text-green-700 border-green-200 hover:bg-green-100"
                      }
                      onClick={() => onTradeClick(order)}
                    >
                      <ArrowUpDown className="h-4 w-4 mr-1" />
                      {order.type === 'buy' ? 'Sell' : 'Buy'}
                    </Button>
                  ) : (
                    <span className="text-sm text-gray-500">Your Order</span>
                  )}
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
};

export default MarketOrdersPage;
