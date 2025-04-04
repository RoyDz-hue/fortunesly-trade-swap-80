import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateOrderForm from "@/components/dashboard/CreateOrderForm";
import { Coin, TradePair } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface TradeFormProps {
  availablePairs: Array<TradePair>;
  availableBalances: {
    [key: string]: number;
  };
  availableCoins?: Coin[];
  isLoading?: boolean;
}

// Define the TradePair type if not already defined in @/types
// Uncomment if needed
/*
export interface TradePair {
  id: string;
  baseCurrency: string;
  quoteCurrency: string;
  minOrderSize: number;
  maxOrderSize: number;
  isActive: boolean;
  customMinLimit?: number;
}
*/

const TradeForm = ({ 
  availablePairs = [], 
  availableBalances = {}, 
  availableCoins = [],
  isLoading = false
}: TradeFormProps) => {
  const { toast } = useToast();
  const [viewMode, setViewMode] = useState<"market" | "limit" | "custom">("market");
  const [customLimits, setCustomLimits] = useState<{[pairId: string]: number}>({});

  // Helper function to get effective minimum for a pair
  const getEffectiveMinimum = (pairId: string) => {
    const pair = availablePairs.find(p => p.id === pairId);
    if (!pair) return 0;
    
    return customLimits[pairId] || pair.minOrderSize;
  };

  // Handle custom limit changes
  const handleCustomLimitChange = (pairId: string, value: number) => {
    setCustomLimits(prev => ({
      ...prev,
      [pairId]: value,
    }));
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
          <span>Trade</span>
          <Tabs 
            defaultValue={viewMode} 
            onValueChange={(value) => setViewMode(value as "market" | "limit" | "custom")}
            className="w-auto"
          >
            <TabsList className="grid grid-cols-3 w-auto">
              <TabsTrigger value="market">Market</TabsTrigger>
              <TabsTrigger value="limit">Limit</TabsTrigger>
              <TabsTrigger value="custom">Custom</TabsTrigger>
            </TabsList>
          </Tabs>
        </CardTitle>
        <CardDescription className="text-xs mt-2">
          {viewMode === "market" && "Execute trades at current market price"}
          {viewMode === "limit" && "Set specific price points for your orders"}
          {viewMode === "custom" && "Customize minimum trade limits for each pair"}
        </CardDescription>
      </CardHeader>
      <CardContent>
        {viewMode === "market" ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Market orders are executed immediately at the best available price.
            </p>
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={() => setViewMode("limit")}
            >
              Click to Create Order
            </Button>
          </div>
        ) : viewMode === "limit" ? (
          <CreateOrderForm 
            availablePairs={availablePairs}
            availableBalances={availableBalances}
            availableCoins={availableCoins}
            getCustomMinimum={getEffectiveMinimum}
            onOrderCreated={() => {
              toast({
                title: "Order Created",
                description: "Your order has been placed successfully",
              });
            }}
          />
        ) : (
          <div className="space-y-4">
            <p className="text-sm text-gray-500 mb-4">
              Set custom minimum limits for trading pairs. These limits will override the default minimums when placing orders.
            </p>
            <div className="space-y-4 max-h-96 overflow-y-auto pr-2">
              {availablePairs.filter(pair => pair.isActive).map((pair) => (
                <div key={pair.id} className="flex flex-col space-y-2 p-3 border rounded-md">
                  <div className="flex justify-between items-center">
                    <span className="font-medium">{pair.baseCurrency}/{pair.quoteCurrency}</span>
                    <span className="text-xs text-gray-500">Default Min: {pair.minOrderSize}</span>
                  </div>
                  <div className="flex items-center space-x-2">
                    <input
                      type="number"
                      className="w-full p-2 border rounded-md text-sm"
                      placeholder={`Min (default: ${pair.minOrderSize})`}
                      value={customLimits[pair.id] || ''}
                      onChange={(e) => handleCustomLimitChange(pair.id, parseFloat(e.target.value))}
                      min={0}
                      step="0.0001"
                    />
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        const newLimits = {...customLimits};
                        delete newLimits[pair.id];
                        setCustomLimits(newLimits);
                      }}
                    >
                      Reset
                    </Button>
                  </div>
                </div>
              ))}
            </div>
            <Button 
              className="w-full mt-4" 
              onClick={() => {
                setViewMode("limit");
                toast({
                  title: "Custom Limits Saved",
                  description: "Your custom minimum limits will be applied to your orders",
                });
              }}
            >
              Apply and Create Order
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default TradeForm;