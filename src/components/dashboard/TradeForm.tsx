import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Coin } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

interface TradeFormProps {
  availablePairs: Array<{
    id: string;
    baseCurrency: string;
    quoteCurrency: string;
    minOrderSize: number;
    maxOrderSize: number;
    isActive: boolean;
  }>;
  availableBalances: { [key: string]: number };
  availableCoins?: Coin[];
  isLoading?: boolean;
}

const TradeForm = ({ 
  availablePairs = [], 
  availableBalances = {}, 
  availableCoins = [],
  isLoading = false
}: TradeFormProps) => {
  const { toast } = useToast();
  const [orderSide, setOrderSide] = useState<"BUY" | "SELL">("BUY");
  const [selectedPair, setSelectedPair] = useState<string>("");
  const [orderSize, setOrderSize] = useState<string>("");
  
  const selectedPairDetails = availablePairs.find(pair => pair.id === selectedPair);
  const minOrderSize = selectedPairDetails?.minOrderSize || 0;
  const maxOrderSize = selectedPairDetails?.maxOrderSize || Infinity;

  const handleSubmit = () => {
    const size = parseFloat(orderSize);
    if (size < minOrderSize) {
      toast({
        title: "Order Too Small",
        description: `Minimum order size is ${minOrderSize} ${selectedPairDetails?.baseCurrency}`,
        variant: "destructive"
      });
      return;
    }
    
    if (size > maxOrderSize) {
      toast({
        title: "Order Too Large",
        description: `Maximum order size is ${maxOrderSize} ${selectedPairDetails?.baseCurrency}`,
        variant: "destructive"
      });
      return;
    }

    toast({
      title: `${orderSide} Order Created`,
      description: `${orderSide} order for ${orderSize} ${selectedPairDetails?.baseCurrency} has been placed`
    });
    setOrderSize("");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <Skeleton className="h-6 w-24" />
            <div className="flex space-x-2">
              <Skeleton className="h-8 w-20" />
              <Skeleton className="h-8 w-20" />
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-12 w-full" />
            <Skeleton className="h-8 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex justify-between items-center">
          <span>Create Order</span>
          <div className="flex space-x-2">
            <Button 
              variant={orderSide === "BUY" ? "default" : "outline"} 
              onClick={() => setOrderSide("BUY")}
            >
              BUY
            </Button>
            <Button 
              variant={orderSide === "SELL" ? "default" : "outline"} 
              onClick={() => setOrderSide("SELL")}
            >
              SELL
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Trading Pair</Label>
            <Select onValueChange={setSelectedPair} value={selectedPair}>
              <SelectTrigger>
                <SelectValue placeholder="Choose pair" />
              </SelectTrigger>
              <SelectContent>
                {availablePairs.map(pair => (
                  <SelectItem key={pair.id} value={pair.id}>
                    {pair.baseCurrency}/{pair.quoteCurrency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {selectedPair && (
            <>
              <div className="space-y-2">
                <Label>Order Size ({selectedPairDetails?.baseCurrency})</Label>
                <Input
                  type="number"
                  value={orderSize}
                  onChange={(e) => setOrderSize(e.target.value)}
                  placeholder={`Enter amount (min ${minOrderSize})`}
                  min={minOrderSize}
                  max={maxOrderSize}
                />
                <div className="flex justify-between text-sm text-muted-foreground">
                  <span>Min: {minOrderSize}</span>
                  <span>Max: {maxOrderSize}</span>
                </div>
              </div>

              <Button 
                className="w-full" 
                onClick={handleSubmit}
                disabled={!orderSize || parseFloat(orderSize) < minOrderSize}
              >
                {orderSide} {selectedPairDetails?.baseCurrency}
              </Button>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default TradeForm;