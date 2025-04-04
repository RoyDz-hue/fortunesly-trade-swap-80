
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/context/AuthContext";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import TradeExecutionDialog from "./TradeExecutionDialog";

interface OrderBookProps {
  tradingPair?: {
    baseCurrency: string;
    quoteCurrency: string;
  };
  buyOrders?: Array<{
    id: string;
    userId: string;
    username?: string;
    price: number;
    amount: number;
    total: number;
  }>;
  sellOrders?: Array<{
    id: string;
    userId: string;
    username?: string;
    price: number;
    amount: number;
    total: number;
  }>;
  onOrderSelect?: (order: any, type: 'buy' | 'sell') => void;
}

const OrderBook = ({ 
  tradingPair = { baseCurrency: 'BTC', quoteCurrency: 'KES' }, 
  buyOrders = [], 
  sellOrders = [],
  onOrderSelect
}: OrderBookProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedOrderType, setSelectedOrderType] = useState<'buy' | 'sell' | null>(null);
  const [showTradeDialog, setShowTradeDialog] = useState(false);
  
  const handleOrderClick = (order: any, type: 'buy' | 'sell') => {
    // Don't allow users to trade with their own orders
    if (user && order.userId === user.id) {
      toast({
        title: "Can't trade with own order",
        description: "You cannot execute trades with your own orders.",
        variant: "destructive"
      });
      return;
    }
    
    // Open trade execution dialog
    setSelectedOrder(order);
    setSelectedOrderType(type);
    setShowTradeDialog(true);
  };

  const handleTradeSuccess = () => {
    // Refresh orders or perform any other actions after successful trade
    if (onOrderSelect) {
      // Use the onOrderSelect for any custom refresh logic provided by parent
      onOrderSelect(selectedOrder, selectedOrderType);
    }
    
    toast({
      title: "Trade executed",
      description: "Your trade was executed successfully.",
    });
    
    // Reset selection and close dialog
    setSelectedOrder(null);
    setSelectedOrderType(null);
    setShowTradeDialog(false);
  };

  return (
    <>
      <Card>
        <CardHeader>
          <CardTitle>Order Book {tradingPair.baseCurrency}/{tradingPair.quoteCurrency}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <h3 className="text-sm font-medium text-red-500 mb-2">Sell Orders</h3>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Price</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Seller</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sellOrders.length > 0 ? (
                      sellOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-gray-100">
                          <TableCell className="text-red-500">{order.price.toFixed(2)}</TableCell>
                          <TableCell>{order.amount.toFixed(6)}</TableCell>
                          <TableCell>{order.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help truncate max-w-[80px] inline-block">
                                    {order.username || 'Anonymous'}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {order.username || 'Anonymous'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="default" 
                              size="sm"
                              onClick={() => handleOrderClick(order, 'sell')}
                              disabled={user && order.userId === user.id}
                            >
                              Buy
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                          No sell orders
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium text-green-500 mb-2">Buy Orders</h3>
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Price</TableHead>
                      <TableHead>Amount</TableHead>
                      <TableHead>Total</TableHead>
                      <TableHead>Buyer</TableHead>
                      <TableHead>Action</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {buyOrders.length > 0 ? (
                      buyOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-gray-100">
                          <TableCell className="text-green-500">{order.price.toFixed(2)}</TableCell>
                          <TableCell>{order.amount.toFixed(6)}</TableCell>
                          <TableCell>{order.total.toFixed(2)}</TableCell>
                          <TableCell>
                            <TooltipProvider>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <span className="cursor-help truncate max-w-[80px] inline-block">
                                    {order.username || 'Anonymous'}
                                  </span>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {order.username || 'Anonymous'}
                                </TooltipContent>
                              </Tooltip>
                            </TooltipProvider>
                          </TableCell>
                          <TableCell>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="border-green-500 text-green-700 hover:bg-green-50"
                              onClick={() => handleOrderClick(order, 'buy')}
                              disabled={user && order.userId === user.id}
                            >
                              Sell
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-gray-500 py-4">
                          No buy orders
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </div>
          </div>
          
          <div className="mt-4 flex justify-center gap-4">
            <Button variant="outline" size="sm" onClick={() => window.location.reload()}>
              Refresh
            </Button>
            <Button variant="outline" size="sm" disabled>
              Market Depth
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Trade Execution Dialog */}
      {selectedOrder && (
        <TradeExecutionDialog
          isOpen={showTradeDialog}
          onClose={() => setShowTradeDialog(false)}
          order={{
            ...selectedOrder,
            type: selectedOrderType === 'buy' ? 'sell' : 'buy'
          }}
          onSuccess={handleTradeSuccess}
        />
      )}
    </>
  );
};

export default OrderBook;
