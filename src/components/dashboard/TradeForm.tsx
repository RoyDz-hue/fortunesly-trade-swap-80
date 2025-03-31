
import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import CreateOrderForm from "@/components/dashboard/CreateOrderForm";
import { Coin } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface TradeFormProps {
  // Will be populated from database
  availablePairs: Array<{
    id: string;
    baseCurrency: string;
    quoteCurrency: string;
    minOrderSize: number;
    maxOrderSize: number;
    isActive: boolean;
  }>;
  availableBalances: {
    [key: string]: number;
  };
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
  const [viewMode, setViewMode] = useState<"market" | "limit">("market");
  
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
          <div className="flex space-x-2">
            <Button 
              variant={viewMode === "market" ? "default" : "outline"} 
              size="sm"
              onClick={() => setViewMode("market")}
            >
              Market
            </Button>
            <Button 
              variant={viewMode === "limit" ? "default" : "outline"} 
              size="sm"
              onClick={() => setViewMode("limit")}
            >
              Limit
            </Button>
          </div>
        </CardTitle>
      </CardHeader>
      <CardContent>
        {viewMode === "market" ? (
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Market orders are executed immediately at the best available price.
            </p>
            <p className="text-center py-4 text-gray-500">
              Market trades will be implemented soon.
            </p>
            <Button 
              className="w-full" 
              variant="outline" 
              onClick={() => setViewMode("limit")}
            >
              Switch to Limit Order
            </Button>
          </div>
        ) : (
          <CreateOrderForm 
            availablePairs={availablePairs}
            availableBalances={availableBalances}
            availableCoins={availableCoins}
            onOrderCreated={() => {
              toast({
                title: "Order Created",
                description: "Your order has been placed successfully",
              });
            }}
          />
        )}
      </CardContent>
    </Card>
  );
};

export default TradeForm;
