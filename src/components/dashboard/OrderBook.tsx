import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ArrowRight, ArrowUp, ArrowDown, RefreshCw } from "lucide-react";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

const OrderBook = ({
  tradingPair = { baseCurrency: "BTC", quoteCurrency: "KES" },
  buyOrders = [],
  sellOrders = [],
  onRefresh
}) => {
  const [activeTab, setActiveTab] = useState("buy");
  const [isLoading, setIsLoading] = useState(false);
  
  // Take only the top 5 orders for each type
  const topBuyOrders = buyOrders.slice(0, 5);
  const topSellOrders = sellOrders.slice(0, 5);

  const handleRefresh = () => {
    setIsLoading(true);
    if (onRefresh) {
      // Call the parent refresh function if provided
      onRefresh().finally(() => {
        setIsLoading(false);
      });
    } else {
      // If no refresh function provided, just simulate a refresh
      setTimeout(() => {
        setIsLoading(false);
      }, 500);
    }
  };

  return (
    <Card className="w-full shadow-sm border">
      <CardHeader className="pb-3 bg-gray-50 border-b">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl">
            Market Overview {tradingPair.baseCurrency}/{tradingPair.quoteCurrency}
          </CardTitle>
          <Badge variant="outline" className="ml-auto">
            Preview
          </Badge>
        </div>
      </CardHeader>

      <Tabs defaultValue="buy" value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-4 pt-4">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="buy" className="flex items-center">
              <ArrowUp className="h-4 w-4 mr-2" />
              Buy Orders
            </TabsTrigger>
            <TabsTrigger value="sell" className="flex items-center">
              <ArrowDown className="h-4 w-4 mr-2" />
              Sell Orders
            </TabsTrigger>
          </TabsList>
        </div>

        <CardContent className="p-4">
          {isLoading ? (
            <div className="flex justify-center py-8">
              <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-primary"></div>
            </div>
          ) : (
            <TabsContent value="buy" className="mt-0">
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Price ({tradingPair.quoteCurrency})</TableHead>
                      <TableHead>Amount ({tradingPair.baseCurrency})</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topBuyOrders.length > 0 ? (
                      topBuyOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-gray-100">
                          <TableCell className="text-green-600 font-medium">{order.price.toFixed(2)}</TableCell>
                          <TableCell>{order.amount.toFixed(6)}</TableCell>
                          <TableCell>{(order.price * order.amount).toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500 py-4">
                          No buy orders available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          {isLoading ? null : (
            <TabsContent value="sell" className="mt-0">
              <div className="border rounded-md overflow-hidden">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Price ({tradingPair.quoteCurrency})</TableHead>
                      <TableHead>Amount ({tradingPair.baseCurrency})</TableHead>
                      <TableHead>Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topSellOrders.length > 0 ? (
                      topSellOrders.map((order) => (
                        <TableRow key={order.id} className="hover:bg-gray-100">
                          <TableCell className="text-red-600 font-medium">{order.price.toFixed(2)}</TableCell>
                          <TableCell>{order.amount.toFixed(6)}</TableCell>
                          <TableCell>{(order.price * order.amount).toFixed(2)}</TableCell>
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} className="text-center text-gray-500 py-4">
                          No sell orders available
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
          )}

          <div className="bg-gray-50 rounded-lg mt-6 p-6 border text-center">
            <h3 className="text-lg font-medium mb-2">Ready to Trade?</h3>
            <p className="text-gray-600 mb-4">
              To buy or sell coins, check out our full market interface with all available orders.
            </p>
          </div>
        </CardContent>
      </Tabs>

      <CardFooter className="flex justify-between bg-gray-50 border-t p-4">
        <Button
          variant="outline" 
          size="sm"
          onClick={handleRefresh}
          className="flex items-center gap-2"
          disabled={isLoading}
        >
          <RefreshCw size={16} className={isLoading ? "animate-spin" : ""} />
          Refresh
        </Button>
        
        <Button
          asChild
          className="flex items-center gap-2"
        >
          <Link to="/market/orders">
            Go to Market
            <ArrowRight size={16} />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  );
};

export default OrderBook;