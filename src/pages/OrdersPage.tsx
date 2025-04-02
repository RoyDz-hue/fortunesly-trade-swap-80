
import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Order } from "@/types";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { Check, ArrowUp, ArrowDown, X } from "lucide-react";

const OrdersPage = () => {
  const [activeOrders, setActiveOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [cancelledOrders, setCancelledOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCancelling, setIsCancelling] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  
  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);
  
  const fetchOrders = async () => {
    setIsLoading(true);
    try {
      // Fetch active orders
      const { data: activeData, error: activeError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .in('status', ['open', 'partially_filled'])
        .order('created_at', { ascending: false });
        
      if (activeError) throw activeError;
      
      // Fetch completed orders
      const { data: completedData, error: completedError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'filled')
        .order('created_at', { ascending: false });
        
      if (completedError) throw completedError;
      
      // Fetch cancelled orders
      const { data: cancelledData, error: cancelledError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user?.id)
        .eq('status', 'cancelled')
        .order('created_at', { ascending: false });
        
      if (cancelledError) throw cancelledError;
      
      // Format the orders
      const formatOrder = (order: any): Order => ({
        id: order.id,
        userId: order.user_id,
        type: order.type as 'buy' | 'sell',
        fromCurrency: order.currency,
        toCurrency: order.type === 'buy' ? 'KES' : order.currency,
        amount: order.amount,
        price: order.price,
        filled: order.filled || 0,
        status: order.status as 'open' | 'partially_filled' | 'filled' | 'cancelled',
        createdAt: order.created_at,
        updatedAt: order.updated_at || order.created_at
      });
      
      setActiveOrders(activeData.map(formatOrder));
      setCompletedOrders(completedData.map(formatOrder));
      setCancelledOrders(cancelledData.map(formatOrder));
      
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Failed to load orders",
        description: "An error occurred while fetching your orders",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleCancelOrder = async (orderId: string) => {
    if (isCancelling) return;
    
    setIsCancelling(true);
    try {
      // Call a Supabase function to cancel the order and refund balance
      const { data, error } = await supabase.rpc('cancel_order', { 
        order_id_param: orderId 
      });
      
      if (error) throw error;
      
      // Update local state to move order to cancelled list
      const orderToCancel = activeOrders.find(order => order.id === orderId);
      if (orderToCancel) {
        setActiveOrders(activeOrders.filter(order => order.id !== orderId));
        setCancelledOrders([{...orderToCancel, status: 'cancelled'}, ...cancelledOrders]);
        
        toast({
          title: "Order cancelled",
          description: "Your order has been cancelled and funds have been returned to your balance."
        });
      }
      
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Failed to cancel order",
        description: error.message || "An error occurred while cancelling your order",
        variant: "destructive"
      });
    } finally {
      setIsCancelling(false);
    }
  };
  
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };
  
  const renderOrderTable = (orders: Order[], showActions: boolean = false) => (
    <div className="border rounded-md overflow-hidden">
      {orders.length > 0 ? (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Type</TableHead>
              <TableHead>Currency</TableHead>
              <TableHead>Amount / Filled</TableHead>
              <TableHead>Price</TableHead>
              <TableHead>Total</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Date</TableHead>
              {showActions && <TableHead>Actions</TableHead>}
            </TableRow>
          </TableHeader>
          <TableBody>
            {orders.map((order) => (
              <TableRow key={order.id}>
                <TableCell>
                  <div className="flex items-center">
                    {order.type === 'buy' ? (
                      <ArrowDown className="h-4 w-4 text-green-500 mr-1" />
                    ) : (
                      <ArrowUp className="h-4 w-4 text-red-500 mr-1" />
                    )}
                    <span className={order.type === 'buy' ? 'text-green-600' : 'text-red-600'}>
                      {order.type.toUpperCase()}
                    </span>
                  </div>
                </TableCell>
                <TableCell>{order.fromCurrency}</TableCell>
                <TableCell>
                  <div>
                    <span>{order.amount}</span>
                    {order.filled > 0 && (
                      <div className="text-xs text-gray-500">
                        Filled: {order.filled} ({((order.filled / order.amount) * 100).toFixed(1)}%)
                        <div className="w-full bg-gray-200 h-1 mt-1 rounded-full">
                          <div 
                            className="bg-fortunesly-primary h-1 rounded-full" 
                            style={{ width: `${(order.filled / order.amount) * 100}%` }}
                          ></div>
                        </div>
                      </div>
                    )}
                  </div>
                </TableCell>
                <TableCell>{order.price} KES</TableCell>
                <TableCell>{(order.price * order.amount).toFixed(2)} KES</TableCell>
                <TableCell>
                  <Badge variant="outline" className={
                    order.status === 'open' ? 'bg-blue-50 text-blue-700 border-blue-200' :
                    order.status === 'partially_filled' ? 'bg-amber-50 text-amber-700 border-amber-200' :
                    order.status === 'filled' ? 'bg-green-50 text-green-700 border-green-200' :
                    'bg-red-50 text-red-700 border-red-200'
                  }>
                    {order.status === 'open' ? 'Open' :
                     order.status === 'partially_filled' ? 'Partially Filled' :
                     order.status === 'filled' ? 'Filled' : 'Cancelled'}
                  </Badge>
                </TableCell>
                <TableCell>{formatDate(order.createdAt)}</TableCell>
                {showActions && (
                  <TableCell>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => handleCancelOrder(order.id)}
                      disabled={isCancelling}
                    >
                      <X className="h-3 w-3 mr-1" />
                      {isCancelling ? "Cancelling..." : "Cancel"}
                    </Button>
                  </TableCell>
                )}
              </TableRow>
            ))}
          </TableBody>
        </Table>
      ) : (
        <div className="p-8 text-center text-gray-500">
          No orders found
        </div>
      )}
    </div>
  );
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
      
      <Tabs defaultValue="active" className="space-y-4">
        <TabsList className="border-b w-full rounded-none bg-transparent p-0">
          <TabsTrigger 
            value="active" 
            className="data-[state=active]:border-b-2 data-[state=active]:border-fortunesly-primary rounded-none pb-2 pt-1 px-4"
          >
            Active Orders
          </TabsTrigger>
          <TabsTrigger 
            value="completed"
            className="data-[state=active]:border-b-2 data-[state=active]:border-fortunesly-primary rounded-none pb-2 pt-1 px-4"
          >
            Completed Orders
          </TabsTrigger>
          <TabsTrigger 
            value="cancelled"
            className="data-[state=active]:border-b-2 data-[state=active]:border-fortunesly-primary rounded-none pb-2 pt-1 px-4"
          >
            Cancelled Orders
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="active">
          {isLoading ? (
            <div className="p-8 text-center">
              <p>Loading orders...</p>
            </div>
          ) : (
            renderOrderTable(activeOrders, true)
          )}
        </TabsContent>
        
        <TabsContent value="completed">
          {isLoading ? (
            <div className="p-8 text-center">
              <p>Loading orders...</p>
            </div>
          ) : (
            renderOrderTable(completedOrders)
          )}
        </TabsContent>
        
        <TabsContent value="cancelled">
          {isLoading ? (
            <div className="p-8 text-center">
              <p>Loading orders...</p>
            </div>
          ) : (
            renderOrderTable(cancelledOrders)
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OrdersPage;
