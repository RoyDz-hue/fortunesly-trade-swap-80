
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { getTradeRoute, ROUTES } from "@/utils/routeUtils";
import ImageWithFallback from "@/components/common/ImageWithFallback";

interface Coin {
  id: string;
  name: string;
  symbol: string;
  icon_url?: string;
}

const MarketPage = () => {
  const navigate = useNavigate();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  
  useEffect(() => {
    fetchCoins();
  }, []);
  
  const fetchCoins = async () => {
    setLoading(true);
    try {
      const { data, error } = await supabase
        .from('coins')
        .select('*')
        .order('symbol');
        
      if (error) throw error;
      
      setCoins(data || []);
    } catch (error) {
      console.error("Error fetching coins:", error);
    } finally {
      setLoading(false);
    }
  };
  
  const filteredCoins = coins.filter(coin => 
    coin.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
    coin.symbol.toLowerCase().includes(searchQuery.toLowerCase())
  );
  
  const handleGoToTrade = (coinId: string) => {
    navigate(getTradeRoute(coinId));
  };
  
  return (
    <div className="container py-8">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold">Market Overview</h1>
          <p className="text-gray-500">View and trade available cryptocurrencies</p>
        </div>
        
        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-500" />
            <Input 
              placeholder="Search by name or symbol"
              className="pl-10 w-full md:w-auto"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>
          
          <Button 
            onClick={() => navigate(ROUTES.MARKET_ORDERS)}
            variant="outline"
          >
            View All Market Orders
          </Button>
        </div>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle>Available Coins</CardTitle>
          <CardDescription>
            Click on a coin to view its trading pair with KES
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-t-blue-600 border-gray-200 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coin</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoins.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={3} className="text-center py-4 text-gray-500">
                        {searchQuery 
                          ? "No coins match your search criteria" 
                          : "No coins available for trading"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCoins.map((coin) => (
                      <TableRow key={coin.id}>
                        <TableCell>
                          <div className="flex items-center gap-3">
                            {coin.icon_url ? (
                              <ImageWithFallback
                                src={coin.icon_url}
                                alt={coin.symbol}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold">
                                  {coin.symbol.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                            )}
                            {coin.name}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {coin.symbol}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            onClick={() => handleGoToTrade(coin.id)}
                            variant="default"
                            size="sm"
                          >
                            Trade
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
        <CardFooter className="flex justify-center border-t pt-6">
          <Button 
            onClick={() => navigate(ROUTES.MARKET_ORDERS)}
            variant="secondary"
          >
            View All Market Orders
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MarketPage;
