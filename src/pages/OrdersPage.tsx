
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import { X } from "lucide-react";

interface Order {
  id: string;
  type: 'buy' | 'sell';
  currency: string;
  amount: number;
  price: number;
  status: 'open' | 'filled' | 'cancelled' | 'partially_filled';
  createdAt: string;
  total: number;
}

const OrdersPage = () => {
  const [openOrders, setOpenOrders] = useState<Order[]>([]);
  const [completedOrders, setCompletedOrders] = useState<Order[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [cancellingOrderId, setCancellingOrderId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setIsLoading(true);
    if (!user) {
      setIsLoading(false);
      return;
    }

    try {
      const { data: openOrdersData, error: openOrdersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['open', 'partially_filled'])
        .order('created_at', { ascending: false });

      if (openOrdersError) throw openOrdersError;

      const { data: completedOrdersData, error: completedOrdersError } = await supabase
        .from('orders')
        .select('*')
        .eq('user_id', user.id)
        .in('status', ['filled', 'cancelled'])
        .order('created_at', { ascending: false });

      if (completedOrdersError) throw completedOrdersError;

      const formatOrders = (orders: any[] | null) => {
        return orders?.map(order => ({
          id: order.id,
          type: order.type,
          currency: order.currency,
          amount: order.amount,
          price: order.price,
          status: order.status,
          createdAt: order.created_at,
          total: order.price * order.amount
        })) || [];
      };

      setOpenOrders(formatOrders(openOrdersData));
      setCompletedOrders(formatOrders(completedOrdersData));
    } catch (error) {
      console.error("Error fetching orders:", error);
      toast({
        title: "Error",
        description: "Failed to load orders",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancelOrder = async (orderId: string) => {
    if (!user) return;
    
    try {
      setCancellingOrderId(orderId);
      
      // Call the cancel_order function with proper type casting
      const { data, error } = await supabase
        .rpc('cancel_order', { 
          order_id_param: orderId 
        } as any);
        
      if (error) throw error;
      
      toast({
        title: "Order cancelled",
        description: "Your order has been cancelled successfully.",
      });
      
      // Refresh the orders list
      fetchOrders();
    } catch (error: any) {
      console.error("Error cancelling order:", error);
      toast({
        title: "Error",
        description: error.message || "Failed to cancel the order",
        variant: "destructive"
      });
    } finally {
      setCancellingOrderId(null);
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleString();
  };

  return (
    <div className="container mx-auto py-8">
      <Card>
        <CardHeader>
          <CardTitle>Your Orders</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="open">
            <TabsList>
              <TabsTrigger value="open">Open Orders</TabsTrigger>
              <TabsTrigger value="completed">Completed Orders</TabsTrigger>
            </TabsList>
            <TabsContent value="open">
              {isLoading ? (
                <div className="text-center py-4">Loading open orders...</div>
              ) : openOrders.length === 0 ? (
                <div className="text-center py-4">No open orders found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {openOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>{order.type}</TableCell>
                          <TableCell>{order.currency}</TableCell>
                          <TableCell>{order.amount}</TableCell>
                          <TableCell>{order.price}</TableCell>
                          <TableCell>{order.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge variant="secondary">{order.status}</Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="outline"
                              size="sm"
                              disabled={cancellingOrderId === order.id}
                              onClick={() => handleCancelOrder(order.id)}
                            >
                              {cancellingOrderId === order.id ? (
                                "Cancelling..."
                              ) : (
                                <>
                                  <X className="mr-2 h-4 w-4" />
                                  Cancel
                                </>
                              )}
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
            <TabsContent value="completed">
              {isLoading ? (
                <div className="text-center py-4">Loading completed orders...</div>
              ) : completedOrders.length === 0 ? (
                <div className="text-center py-4">No completed orders found.</div>
              ) : (
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Currency</TableHead>
                        <TableHead>Amount</TableHead>
                        <TableHead>Price</TableHead>
                        <TableHead>Total</TableHead>
                        <TableHead>Status</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {completedOrders.map((order) => (
                        <TableRow key={order.id}>
                          <TableCell>{formatDate(order.createdAt)}</TableCell>
                          <TableCell>{order.type}</TableCell>
                          <TableCell>{order.currency}</TableCell>
                          <TableCell>{order.amount}</TableCell>
                          <TableCell>{order.price}</TableCell>
                          <TableCell>{order.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <Badge
                              variant={order.status === "cancelled" ? "destructive" : "outline"}
                            >
                              {order.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default OrdersPage;
