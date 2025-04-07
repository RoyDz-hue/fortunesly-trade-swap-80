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
  
  // Apply global styles to ensure all dynamically created elements have dark backgrounds
  React.useEffect(() => {
    // Add global style for dynamic placeholders and total displays
    const style = document.createElement('style');
    style.innerHTML = `
      .dynamic-total, 
      .price-placeholder, 
      .total-display {
        background-color: black !important;
        color: white !important;
      }
      
      /* Target input placeholders */
      ::placeholder {
        color: #6b7280 !important;
      }
      
      /* Target all inputs within the trade form */
      .create-order-form input,
      .create-order-form select {
        background-color: black !important;
        color: white !important;
        border-color: #374151 !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      document.head.removeChild(style);
    };
  }, []);
  
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
          className="create-order-form" // Added class for targeting in CSS
        />
      </CardContent>
    </Card>
  );
};

export default TradeForm;