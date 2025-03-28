
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";

interface OrderBookProps {
  // Will be populated from database in the future
  tradingPair?: {
    baseCurrency: string;
    quoteCurrency: string;
  };
  buyOrders?: Array<{
    id: string;
    price: number;
    amount: number;
    total: number;
  }>;
  sellOrders?: Array<{
    id: string;
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
  
  const handleOrderClick = (order: any, type: 'buy' | 'sell') => {
    if (onOrderSelect) {
      onOrderSelect(order, type);
    } else {
      toast({
        title: "Feature not available",
        description: "This feature will be available when connected to the database",
      });
    }
  };

  return (
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sellOrders.length > 0 ? (
                    sellOrders.map((order) => (
                      <TableRow key={order.id} onClick={() => handleOrderClick(order, 'sell')} className="cursor-pointer hover:bg-gray-100">
                        <TableCell className="text-red-500">{order.price.toFixed(8)}</TableCell>
                        <TableCell>{order.amount.toFixed(8)}</TableCell>
                        <TableCell>{order.total.toFixed(8)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-4">
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
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {buyOrders.length > 0 ? (
                    buyOrders.map((order) => (
                      <TableRow key={order.id} onClick={() => handleOrderClick(order, 'buy')} className="cursor-pointer hover:bg-gray-100">
                        <TableCell className="text-green-500">{order.price.toFixed(8)}</TableCell>
                        <TableCell>{order.amount.toFixed(8)}</TableCell>
                        <TableCell>{order.total.toFixed(8)}</TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center text-gray-500 py-4">
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
          <Button variant="outline" size="sm" disabled>
            Refresh
          </Button>
          <Button variant="outline" size="sm" disabled>
            Market Depth
          </Button>
        </div>
        
        <div className="mt-4 py-3 px-4 bg-gray-50 rounded-md text-sm text-gray-500 text-center">
          Order book data will be loaded from the database
        </div>
      </CardContent>
    </Card>
  );
};

export default OrderBook;
