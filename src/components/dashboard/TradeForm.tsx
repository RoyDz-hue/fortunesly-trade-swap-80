
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

interface TradeFormProps {
  // Will be populated from database in the future
  availablePairs: Array<{
    id: string;
    baseCurrency: string;
    quoteCurrency: string;
  }>;
  availableBalances: {
    [key: string]: number;
  };
}

const TradeForm = ({ availablePairs = [], availableBalances = {} }: TradeFormProps) => {
  const { toast } = useToast();
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [selectedPair, setSelectedPair] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [total, setTotal] = useState<number>(0);
  
  // Calculate total when price or amount changes
  useEffect(() => {
    if (price && amount && !isNaN(parseFloat(price)) && !isNaN(parseFloat(amount))) {
      setTotal(parseFloat(price) * parseFloat(amount));
    } else {
      setTotal(0);
    }
  }, [price, amount]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!selectedPair || !price || !amount) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    // In a real implementation, this would create a new order in the database
    toast({
      title: "Order created",
      description: "This feature will be available when connected to the database",
    });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Create Order</CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs defaultValue="buy" onValueChange={(value) => setOrderType(value as "buy" | "sell")}>
          <TabsList className="grid w-full grid-cols-2 mb-4">
            <TabsTrigger value="buy">Buy</TabsTrigger>
            <TabsTrigger value="sell">Sell</TabsTrigger>
          </TabsList>
          
          <TabsContent value="buy">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pair">Trading Pair</Label>
                <Select onValueChange={setSelectedPair}>
                  <SelectTrigger id="pair">
                    <SelectValue placeholder="Select pair" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePairs.length > 0 ? (
                      availablePairs.map((pair) => (
                        <SelectItem key={pair.id} value={pair.id}>
                          {pair.baseCurrency}/{pair.quoteCurrency}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="placeholder" disabled>
                        Will load from database
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price">Price per Coin</Label>
                <Input 
                  id="price" 
                  type="number" 
                  step="0.00000001" 
                  min="0" 
                  placeholder="0.00" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount">Amount</Label>
                <Input 
                  id="amount" 
                  type="number" 
                  step="0.00000001" 
                  min="0" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between text-sm mb-2">
                  <span>Total:</span>
                  <span>{total.toFixed(8)}</span>
                </div>
                <Button type="submit" className="w-full">
                  Create Buy Order
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="sell">
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pair-sell">Trading Pair</Label>
                <Select onValueChange={setSelectedPair}>
                  <SelectTrigger id="pair-sell">
                    <SelectValue placeholder="Select pair" />
                  </SelectTrigger>
                  <SelectContent>
                    {availablePairs.length > 0 ? (
                      availablePairs.map((pair) => (
                        <SelectItem key={pair.id} value={pair.id}>
                          {pair.baseCurrency}/{pair.quoteCurrency}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="placeholder" disabled>
                        Will load from database
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price-sell">Price per Coin</Label>
                <Input 
                  id="price-sell" 
                  type="number" 
                  step="0.00000001" 
                  min="0" 
                  placeholder="0.00" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="amount-sell">Amount</Label>
                <Input 
                  id="amount-sell" 
                  type="number" 
                  step="0.00000001" 
                  min="0" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
              </div>
              
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between text-sm mb-2">
                  <span>Total:</span>
                  <span>{total.toFixed(8)}</span>
                </div>
                <Button type="submit" className="w-full">
                  Create Sell Order
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default TradeForm;
