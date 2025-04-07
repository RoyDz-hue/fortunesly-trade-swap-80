import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import CreateOrderForm from "@/components/dashboard/CreateOrderForm";
import { Coin } from "@/types";
import { Skeleton } from "@/components/ui/skeleton";

interface TradeFormProps {
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
  
  if (isLoading) {
    return (
      <Card className="bg-black border-gray-800 text-white">
        <CardHeader>
          <CardTitle>
            <Skeleton className="h-6 w-24 bg-gray-800" />
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-8 w-full bg-gray-800" />
            <Skeleton className="h-12 w-full bg-gray-800" />
            <Skeleton className="h-12 w-full bg-gray-800" />
            <Skeleton className="h-12 w-full bg-gray-800" />
            <Skeleton className="h-8 w-full bg-gray-800" />
          </div>
        </CardContent>
      </Card>
    );
  }
  
  const handleOrderCreated = () => {
    toast({
      title: "Order Created",
      description: "Your order has been placed successfully",
      className: "bg-black text-white border-gray-800"
    });
  };
  
  return (
    <Card className="bg-black border-gray-800 text-white">
      <CardHeader>
        <CardTitle className="text-white">Create Order</CardTitle>
      </CardHeader>
      <CardContent>
        <CreateOrderForm 
          availablePairs={availablePairs}
          availableBalances={availableBalances}
          availableCoins={availableCoins}
          onOrderCreated={handleOrderCreated}
        />
      </CardContent>
    </Card>
  );
};

export default TradeForm;