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
    <div className="container py-8 bg-gray-900 text-gray-100">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-3xl font-bold text-white">Market Overview</h1>
          <p className="text-gray-400">View and trade available cryptocurrencies</p>
        </div>

        <div className="flex items-center gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input 
              placeholder="Search by name or symbol"
              className="pl-10 w-full md:w-auto bg-gray-800 border-gray-700 text-gray-100 focus:border-gray-600 focus:ring-gray-600"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)} 
            />
          </div>

          <Button 
            onClick={() => navigate(ROUTES.MARKET_ORDERS)}
            variant="outline"
            className="border-gray-700 text-gray-300 hover:bg-gray-800 hover:text-gray-100"
          >
            View All Market Orders
          </Button>
        </div>
      </div>

      <Card className="bg-gray-800 border-gray-700">
        <CardHeader>
          <CardTitle className="text-white">Available Coins</CardTitle>
          <CardDescription className="text-gray-400">
            Click on a coin to view its trading pair with KES
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex justify-center py-8">
              <div className="w-8 h-8 border-2 border-t-blue-500 border-gray-700 rounded-full animate-spin"></div>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow className="border-gray-700">
                    <TableHead className="text-gray-300">Coin</TableHead>
                    <TableHead className="text-gray-300">Symbol</TableHead>
                    <TableHead className="text-right text-gray-300">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredCoins.length === 0 ? (
                    <TableRow className="border-gray-700">
                      <TableCell colSpan={3} className="text-center py-4 text-gray-400">
                        {searchQuery 
                          ? "No coins match your search criteria" 
                          : "No coins available for trading"}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCoins.map((coin) => (
                      <TableRow key={coin.id} className="border-gray-700 hover:bg-gray-700">
                        <TableCell className="text-gray-200">
                          <div className="flex items-center gap-3">
                            {coin.icon_url ? (
                              <ImageWithFallback
                                src={coin.icon_url}
                                alt={coin.symbol}
                                className="w-8 h-8 rounded-full"
                              />
                            ) : (
                              <div className="w-8 h-8 bg-gray-700 rounded-full flex items-center justify-center">
                                <span className="text-xs font-bold text-gray-300">
                                  {coin.symbol.substring(0, 2).toUpperCase()}
                                </span>
                              </div>
                            )}
                            {coin.name}
                          </div>
                        </TableCell>
                        <TableCell className="text-gray-200">
                          <Badge variant="outline" className="bg-gray-700 text-blue-300 border-blue-800">
                            {coin.symbol}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <Button 
                            onClick={() => handleGoToTrade(coin.id)}
                            variant="default"
                            size="sm"
                            className="bg-blue-600 hover:bg-blue-700 text-white"
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
        <CardFooter className="flex justify-center border-t border-gray-700 pt-6">
          <Button 
            onClick={() => navigate(ROUTES.MARKET_ORDERS)}
            variant="secondary"
            className="bg-gray-700 hover:bg-gray-600 text-gray-200"
          >
            View All Market Orders
          </Button>
        </CardFooter>
      </Card>
    </div>
  );
};

export default MarketPage;