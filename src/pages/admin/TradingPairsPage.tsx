
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { TradingPair, Coin } from "@/types";
import { PlusCircle, ArrowRightLeft } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const TradingPairsPage = () => {
  const { toast } = useToast();
  const [tradingPairs, setTradingPairs] = useState<TradingPair[]>([]);
  const [availableCoins, setAvailableCoins] = useState<Coin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  
  // Form state
  const [baseCurrency, setBaseCurrency] = useState("");
  const [quoteCurrency, setQuoteCurrency] = useState("");
  const [minOrderSize, setMinOrderSize] = useState(0.001);
  const [maxOrderSize, setMaxOrderSize] = useState(100);
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // For future implementation: fetch trading pairs from database
  useEffect(() => {
    const loadData = async () => {
      setIsLoading(true);
      try {
        // Fetch available coins
        const { data: coinData, error: coinError } = await supabase
          .from('coins')
          .select('*');
          
        if (coinError) throw coinError;
        
        const coins = coinData.map(coin => ({
          id: coin.id,
          name: coin.name,
          symbol: coin.symbol,
          depositAddress: coin.deposit_address,
          image: coin.image
        }));
        
        setAvailableCoins(coins);
        
        // In the future, fetch trading pairs from database
        // For now, use mock data
        setTradingPairs([
          {
            id: "1",
            baseCurrency: "BTC",
            quoteCurrency: "KES",
            minOrderSize: 0.001,
            maxOrderSize: 10,
            isActive: true,
            createdAt: new Date().toISOString()
          },
          {
            id: "2",
            baseCurrency: "ETH",
            quoteCurrency: "KES",
            minOrderSize: 0.01,
            maxOrderSize: 100,
            isActive: true,
            createdAt: new Date().toISOString()
          }
        ]);
      } catch (error) {
        console.error("Error loading trading pairs data:", error);
        toast({
          title: "Failed to load data",
          description: "Could not load trading pairs information",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };
    
    loadData();
  }, []);

  const handleAddPair = () => {
    if (!baseCurrency || !quoteCurrency) {
      toast({
        title: "Missing information",
        description: "Please select both base and quote currencies",
        variant: "destructive"
      });
      return;
    }
    
    if (baseCurrency === quoteCurrency) {
      toast({
        title: "Invalid pair",
        description: "Base and quote currencies must be different",
        variant: "destructive"
      });
      return;
    }
    
    // Check if pair already exists
    const pairExists = tradingPairs.some(
      pair => pair.baseCurrency === baseCurrency && pair.quoteCurrency === quoteCurrency
    );
    
    if (pairExists) {
      toast({
        title: "Pair exists",
        description: "This trading pair already exists",
        variant: "destructive"
      });
      return;
    }
    
    // Add new pair
    const newPair: TradingPair = {
      id: Date.now().toString(), // Mock ID
      baseCurrency,
      quoteCurrency,
      minOrderSize,
      maxOrderSize,
      isActive,
      createdAt: new Date().toISOString()
    };
    
    setTradingPairs([...tradingPairs, newPair]);
    setIsDialogOpen(false);
    
    toast({
      title: "Pair added",
      description: `${baseCurrency}/${quoteCurrency} pair has been added`,
    });
    
    // Reset form state
    setBaseCurrency("");
    setQuoteCurrency("");
    setMinOrderSize(0.001);
    setMaxOrderSize(100);
    setIsActive(true);
  };
  
  const togglePairStatus = (id: string) => {
    setTradingPairs(tradingPairs.map(pair => {
      if (pair.id === id) {
        return { ...pair, isActive: !pair.isActive };
      }
      return pair;
    }));
    
    const pair = tradingPairs.find(p => p.id === id);
    if (pair) {
      toast({
        title: pair.isActive ? "Pair deactivated" : "Pair activated",
        description: `${pair.baseCurrency}/${pair.quoteCurrency} is now ${pair.isActive ? 'inactive' : 'active'}`,
      });
    }
  };

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Trading Pairs</h1>
        <Button onClick={() => setIsDialogOpen(true)}>
          <PlusCircle className="mr-2 h-4 w-4" /> Add Trading Pair
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <ArrowRightLeft className="mr-2 h-5 w-5" />
            Available Trading Pairs
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">Loading trading pairs...</div>
          ) : tradingPairs.length === 0 ? (
            <div className="text-center py-8 text-gray-500">
              <p>No trading pairs available</p>
              <Button variant="outline" className="mt-4" onClick={() => setIsDialogOpen(true)}>
                Add Your First Trading Pair
              </Button>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pair</TableHead>
                    <TableHead>Min Size</TableHead>
                    <TableHead>Max Size</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Created</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tradingPairs.map((pair) => (
                    <TableRow key={pair.id}>
                      <TableCell className="font-medium">
                        {pair.baseCurrency}/{pair.quoteCurrency}
                      </TableCell>
                      <TableCell>{pair.minOrderSize}</TableCell>
                      <TableCell>{pair.maxOrderSize}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch
                            checked={pair.isActive}
                            onCheckedChange={() => togglePairStatus(pair.id)}
                          />
                          <span className={pair.isActive ? 'text-green-600' : 'text-red-600'}>
                            {pair.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        {new Date(pair.createdAt).toLocaleDateString()}
                      </TableCell>
                      <TableCell>
                        {/* Future actions */}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Add New Trading Pair</DialogTitle>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="baseCurrency">Base Currency</Label>
                <Select value={baseCurrency} onValueChange={setBaseCurrency}>
                  <SelectTrigger id="baseCurrency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    {availableCoins.map(coin => (
                      <SelectItem key={coin.id} value={coin.symbol}>
                        {coin.symbol} - {coin.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="quoteCurrency">Quote Currency</Label>
                <Select value={quoteCurrency} onValueChange={setQuoteCurrency}>
                  <SelectTrigger id="quoteCurrency">
                    <SelectValue placeholder="Select currency" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="KES">KES - Kenyan Shilling</SelectItem>
                    <SelectItem value="USDT">USDT - Tether</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="minOrderSize">Minimum Order Size</Label>
                <Input
                  id="minOrderSize"
                  type="number"
                  step="0.001"
                  value={minOrderSize}
                  onChange={(e) => setMinOrderSize(parseFloat(e.target.value))}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="maxOrderSize">Maximum Order Size</Label>
                <Input
                  id="maxOrderSize"
                  type="number"
                  step="0.1"
                  value={maxOrderSize}
                  onChange={(e) => setMaxOrderSize(parseFloat(e.target.value))}
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="isActive"
                checked={isActive}
                onCheckedChange={setIsActive}
              />
              <Label htmlFor="isActive">Active</Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddPair} disabled={isSubmitting}>
              {isSubmitting ? 'Adding...' : 'Add Pair'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default TradingPairsPage;
