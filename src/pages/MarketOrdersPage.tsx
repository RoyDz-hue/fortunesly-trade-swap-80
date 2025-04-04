
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';
import { useAuth } from '@/context/AuthContext';
import TradeExecutionDialog from '@/components/dashboard/TradeExecutionDialog';

const MarketOrdersPage = () => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [showTradeDialog, setShowTradeDialog] = useState(false);

  useEffect(() => {
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
  }, []);

  const fetchOrders = async () => {
    try {
      setIsLoading(true);
      
      // Modified query to ensure we're getting all open orders
      // Use explicit 'open' status check instead of nullable status
      const { data, error } = await supabase
        .from('orders')
        .select('*, users(username)')
        .eq('status', 'open')
        .order('created_at', { ascending: false });
      
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

  return (
    <div className="container mx-auto py-6">
      <h1 className="text-2xl font-bold mb-6">Market Orders</h1>
      
      <Card>
        <CardHeader>
          <CardTitle>Open Orders</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <p>Loading orders...</p>
          ) : marketOrders.length === 0 ? (
            <p className="text-center py-8 text-gray-500">No open orders available</p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead>Currency</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Price</TableHead>
                  <TableHead>Total</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {marketOrders.map((order) => (
                  <TableRow key={order.id}>
                    <TableCell>{formatDate(order.created_at)}</TableCell>
                    <TableCell>{order.username}</TableCell>
                    <TableCell>
                      <Badge className={
                        order.type === 'buy' ? 
                          'bg-green-100 text-green-800 border-green-200' :
                          'bg-red-100 text-red-800 border-red-200'
                      }>
                        {order.type.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell>{order.currency}</TableCell>
                    <TableCell>{order.amount}</TableCell>
                    <TableCell>{order.price} KES</TableCell>
                    <TableCell>{(order.amount * order.price).toFixed(2)} KES</TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {order.status ? order.status.toUpperCase().replace('_', ' ') : 'OPEN'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button 
                        size="sm"
                        onClick={() => handleTrade(order)}
                        className={
                          order.type === 'buy' ? 
                            'bg-red-600 hover:bg-red-700' : 
                            'bg-green-600 hover:bg-green-700'
                        }
                      >
                        {order.type === 'buy' ? 'Sell' : 'Buy'}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      
      {/* Trade Execution Dialog */}
      <TradeExecutionDialog
        isOpen={showTradeDialog}
        onClose={() => setShowTradeDialog(false)}
        order={selectedOrder}
        onSuccess={fetchOrders}
      />
    </div>
  );
};

export default MarketOrdersPage;
