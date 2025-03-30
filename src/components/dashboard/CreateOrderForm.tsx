
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Slider } from "@/components/ui/slider";
import { TradingPair } from "@/types";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";

interface CreateOrderFormProps {
  availablePairs: TradingPair[];
  availableBalances: Record<string, number>;
  onOrderCreated?: () => void;
}

const CreateOrderForm = ({ availablePairs, availableBalances, onOrderCreated }: CreateOrderFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orderType, setOrderType] = useState<"buy" | "sell">("buy");
  const [selectedPair, setSelectedPair] = useState<string>("");
  const [pairDetails, setPairDetails] = useState<TradingPair | null>(null);
  const [price, setPrice] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [total, setTotal] = useState<number>(0);
  const [minOrderLimit, setMinOrderLimit] = useState<number>(50); // Default to 50 KES
  const [maxOrderLimit, setMaxOrderLimit] = useState<number>(60000); // Default to 60000 KES
  const [isSubmitting, setIsSubmitting] = useState(false);
  
  // Calculate total when price or amount changes
  useEffect(() => {
    if (price && amount && !isNaN(parseFloat(price)) && !isNaN(parseFloat(amount))) {
      setTotal(parseFloat(price) * parseFloat(amount));
    } else {
      setTotal(0);
    }
  }, [price, amount]);
  
  // Update pair details when selectedPair changes
  useEffect(() => {
    if (selectedPair) {
      const pair = availablePairs.find(p => p.id === selectedPair);
      if (pair) {
        setPairDetails(pair);
        setMinOrderLimit(pair.minOrderSize);
        setMaxOrderLimit(pair.maxOrderSize);
      }
    }
  }, [selectedPair, availablePairs]);
  
  const handleCreateOrder = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!user) {
      toast({
        title: "Authentication required",
        description: "You need to be logged in to create orders",
        variant: "destructive",
      });
      return;
    }
    
    if (!selectedPair || !price || !amount) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }
    
    if (!pairDetails) {
      toast({
        title: "Invalid trading pair",
        description: "Please select a valid trading pair",
        variant: "destructive",
      });
      return;
    }
    
    const priceValue = parseFloat(price);
    const amountValue = parseFloat(amount);
    const totalValue = priceValue * amountValue;
    
    if (orderType === "buy") {
      // Check if user has enough quote currency (e.g., KES)
      const quoteCurrencyBalance = availableBalances[pairDetails.quoteCurrency] || 0;
      
      if (quoteCurrencyBalance < totalValue) {
        toast({
          title: "Insufficient balance",
          description: `You don't have enough ${pairDetails.quoteCurrency} to place this order`,
          variant: "destructive",
        });
        return;
      }
    } else {
      // Check if user has enough base currency (e.g., BTC)
      const baseCurrencyBalance = availableBalances[pairDetails.baseCurrency] || 0;
      
      if (baseCurrencyBalance < amountValue) {
        toast({
          title: "Insufficient balance",
          description: `You don't have enough ${pairDetails.baseCurrency} to place this order`,
          variant: "destructive",
        });
        return;
      }
    }
    
    setIsSubmitting(true);
    
    try {
      // Create the order in the database
      const { data, error } = await supabase
        .from('orders')
        .insert({
          user_id: user.id,
          type: orderType,
          currency: pairDetails.baseCurrency,
          amount: amountValue,
          price: priceValue,
          status: 'open'
        })
        .select();
        
      if (error) throw error;
      
      // If order was created successfully, notify the user
      toast({
        title: "Order created successfully",
        description: `Your ${orderType} order for ${amountValue} ${pairDetails.baseCurrency} has been placed`,
      });
      
      // Reset form
      setAmount("");
      setPrice("");
      
      // Call the callback if provided
      if (onOrderCreated) {
        onOrderCreated();
      }
      
    } catch (error) {
      console.error("Error creating order:", error);
      toast({
        title: "Failed to create order",
        description: "An error occurred while creating your order. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };
  
  const handleMaxAmount = () => {
    if (!pairDetails || !price) return;
    
    const priceValue = parseFloat(price);
    if (isNaN(priceValue) || priceValue <= 0) return;
    
    if (orderType === "buy") {
      // Calculate max amount based on quote currency balance (e.g., KES)
      const quoteCurrencyBalance = availableBalances[pairDetails.quoteCurrency] || 0;
      const maxAmount = quoteCurrencyBalance / priceValue;
      setAmount(maxAmount.toFixed(8));
    } else {
      // Use all available base currency (e.g., BTC)
      const baseCurrencyBalance = availableBalances[pairDetails.baseCurrency] || 0;
      setAmount(baseCurrencyBalance.toFixed(8));
    }
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
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pair-buy">Trading Pair</Label>
                <Select onValueChange={setSelectedPair} value={selectedPair}>
                  <SelectTrigger id="pair-buy">
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
                        No trading pairs available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {pairDetails && (
                  <p className="text-xs text-gray-500">
                    Available: {availableBalances[pairDetails.quoteCurrency] || 0} {pairDetails.quoteCurrency}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price-buy">Price per Coin</Label>
                <Input 
                  id="price-buy" 
                  type="number" 
                  step="0.00000001" 
                  min="0.00000001" 
                  placeholder="0.00" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                {pairDetails && (
                  <p className="text-xs text-gray-500">
                    Price in {pairDetails.quoteCurrency} per {pairDetails.baseCurrency}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="amount-buy">Amount</Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleMaxAmount}
                    className="h-6 text-xs"
                  >
                    Max
                  </Button>
                </div>
                <Input 
                  id="amount-buy" 
                  type="number" 
                  step="0.00000001" 
                  min="0.00000001" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {pairDetails && (
                  <p className="text-xs text-gray-500">
                    Amount in {pairDetails.baseCurrency}
                  </p>
                )}
              </div>
              
              {pairDetails && (
                <div className="space-y-2">
                  <Label>Order Limits ({pairDetails.quoteCurrency})</Label>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Min: {minOrderLimit}</span>
                    <span>Max: {maxOrderLimit}</span>
                  </div>
                  <Slider
                    disabled
                    value={[total]}
                    max={maxOrderLimit}
                    min={minOrderLimit}
                    step={1}
                  />
                  <div className="text-xs text-center mt-1">
                    {total < minOrderLimit && (
                      <span className="text-red-500">
                        Order total must be at least {minOrderLimit} {pairDetails.quoteCurrency}
                      </span>
                    )}
                    {total > maxOrderLimit && (
                      <span className="text-red-500">
                        Order total must be at most {maxOrderLimit} {pairDetails.quoteCurrency}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between text-sm mb-2">
                  <span>Total:</span>
                  <span>
                    {total.toFixed(2)} {pairDetails?.quoteCurrency || ''}
                  </span>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={
                    isSubmitting || 
                    !selectedPair || 
                    !price || 
                    !amount || 
                    (pairDetails && (total < minOrderLimit || total > maxOrderLimit))
                  }
                >
                  {isSubmitting ? "Creating..." : "Create Buy Order"}
                </Button>
              </div>
            </form>
          </TabsContent>
          
          <TabsContent value="sell">
            <form onSubmit={handleCreateOrder} className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="pair-sell">Trading Pair</Label>
                <Select onValueChange={setSelectedPair} value={selectedPair}>
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
                        No trading pairs available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
                {pairDetails && (
                  <p className="text-xs text-gray-500">
                    Available: {availableBalances[pairDetails.baseCurrency] || 0} {pairDetails.baseCurrency}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="price-sell">Price per Coin</Label>
                <Input 
                  id="price-sell" 
                  type="number" 
                  step="0.00000001" 
                  min="0.00000001" 
                  placeholder="0.00" 
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                />
                {pairDetails && (
                  <p className="text-xs text-gray-500">
                    Price in {pairDetails.quoteCurrency} per {pairDetails.baseCurrency}
                  </p>
                )}
              </div>
              
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <Label htmlFor="amount-sell">Amount</Label>
                  <Button 
                    type="button" 
                    variant="ghost" 
                    size="sm" 
                    onClick={handleMaxAmount}
                    className="h-6 text-xs"
                  >
                    Max
                  </Button>
                </div>
                <Input 
                  id="amount-sell" 
                  type="number" 
                  step="0.00000001" 
                  min="0.00000001" 
                  placeholder="0.00" 
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                {pairDetails && (
                  <p className="text-xs text-gray-500">
                    Amount in {pairDetails.baseCurrency}
                  </p>
                )}
              </div>
              
              {pairDetails && (
                <div className="space-y-2">
                  <Label>Order Limits ({pairDetails.quoteCurrency})</Label>
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>Min: {minOrderLimit}</span>
                    <span>Max: {maxOrderLimit}</span>
                  </div>
                  <Slider
                    disabled
                    value={[total]}
                    max={maxOrderLimit}
                    min={minOrderLimit}
                    step={1}
                  />
                  <div className="text-xs text-center mt-1">
                    {total < minOrderLimit && (
                      <span className="text-red-500">
                        Order total must be at least {minOrderLimit} {pairDetails.quoteCurrency}
                      </span>
                    )}
                    {total > maxOrderLimit && (
                      <span className="text-red-500">
                        Order total must be at most {maxOrderLimit} {pairDetails.quoteCurrency}
                      </span>
                    )}
                  </div>
                </div>
              )}
              
              <div className="pt-2 border-t border-gray-200">
                <div className="flex justify-between text-sm mb-2">
                  <span>Total:</span>
                  <span>
                    {total.toFixed(2)} {pairDetails?.quoteCurrency || ''}
                  </span>
                </div>
                <Button 
                  type="submit" 
                  className="w-full" 
                  disabled={
                    isSubmitting || 
                    !selectedPair || 
                    !price || 
                    !amount || 
                    (pairDetails && (total < minOrderLimit || total > maxOrderLimit))
                  }
                >
                  {isSubmitting ? "Creating..." : "Create Sell Order"}
                </Button>
              </div>
            </form>
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default CreateOrderForm;
