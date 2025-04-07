import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/context/AuthContext";
import { Card, CardContent } from "@/components/ui/card";
import { ArrowUp, ArrowDown } from "lucide-react";
import { Coin } from "@/types";

interface CreateOrderFormProps {
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
  onOrderCreated?: () => void;
  totalCardClassOverride?: string; // Add this new prop
}

const CreateOrderForm = ({
  availablePairs = [],
  availableBalances = {},
  availableCoins = [],
  onOrderCreated,
  totalCardClassOverride // Use this prop for the total Card styling
}: CreateOrderFormProps) => {
  const { toast } = useToast();
  const { user } = useAuth();
  const [orderType, setOrderType] = useState<'buy' | 'sell'>('buy');
  const [selectedPair, setSelectedPair] = useState<string>("");
  const [amount, setAmount] = useState<string>("");
  const [price, setPrice] = useState<string>("");
  const [baseCurrency, setBaseCurrency] = useState<string>("");
  const [quoteCurrency, setQuoteCurrency] = useState<string>("KES");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [maxAmount, setMaxAmount] = useState<number>(0);
  const [pairDetails, setPairDetails] = useState<{
    minOrderSize: number;
    maxOrderSize: number;
  } | null>(null);

  useEffect(() => {
    if (selectedPair) {
      const pair = availablePairs.find(p => p.id === selectedPair);
      if (pair) {
        if (orderType === 'buy') {
          if (price) {
            const quoteBalance = availableBalances[pair.quoteCurrency] || 0;
            const maxBuyAmount = quoteBalance / Number(price);
            setMaxAmount(Math.floor(maxBuyAmount * 100000) / 100000);
          }
        } else {
          const baseBalance = availableBalances[pair.baseCurrency] || 0;
          setMaxAmount(baseBalance);
        }
      }
    }
  }, [selectedPair, availableBalances, orderType, price, availablePairs]);

  const handlePairChange = (pairId: string) => {
    const pair = availablePairs.find(p => p.id === pairId);

    if (pair) {
      setSelectedPair(pairId);
      setBaseCurrency(pair.baseCurrency);
      setQuoteCurrency(pair.quoteCurrency);
      setPairDetails({
        minOrderSize: pair.minOrderSize,
        maxOrderSize: pair.maxOrderSize
      });

      if (orderType === 'buy') {
        if (pair.quoteCurrency === 'KES' && price) {
          const balance = availableBalances['KES'] || 0;
          const maxBuyAmount = balance / Number(price);
          setMaxAmount(Math.floor(maxBuyAmount * 100000) / 100000);
        }
      } else {
        const balance = availableBalances[pair.baseCurrency] || 0;
        setMaxAmount(balance);
      }
    }
  };

  const handleOrderTypeChange = (type: 'buy' | 'sell') => {
    setOrderType(type);

    if (selectedPair) {
      const pair = availablePairs.find(p => p.id === selectedPair);

      if (pair && price) {
        if (type === 'buy' && pair.quoteCurrency === 'KES') {
          const balance = availableBalances['KES'] || 0;
          const maxBuyAmount = balance / Number(price);
          setMaxAmount(Math.floor(maxBuyAmount * 100000) / 100000);
        } else if (type === 'sell') {
          const balance = availableBalances[pair.baseCurrency] || 0;
          setMaxAmount(balance);
        }
      }
    }
  };

  const handlePriceChange = (value: string) => {
    setPrice(value);

    if (orderType === 'buy' && selectedPair && value) {
      const pair = availablePairs.find(p => p.id === selectedPair);

      if (pair && pair.quoteCurrency === 'KES') {
        const balance = availableBalances['KES'] || 0;
        const maxBuyAmount = balance / Number(value);
        setMaxAmount(Math.floor(maxBuyAmount * 100000) / 100000);
      }
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!user) {
      toast({
        title: "Authentication required",
        description: "Please log in to create orders",
        variant: "destructive",
      });
      return;
    }

    if (!selectedPair || !amount || !price) {
      toast({
        title: "Invalid order",
        description: "Please fill in all fields",
        variant: "destructive",
      });
      return;
    }

    const numericAmount = Number(amount);
    const numericPrice = Number(price);

    if (isNaN(numericAmount) || numericAmount <= 0 || isNaN(numericPrice) || numericPrice <= 0) {
      toast({
        title: "Invalid values",
        description: "Amount and price must be positive numbers",
        variant: "destructive",
      });
      return;
    }

    if (pairDetails) {
      if (numericAmount < pairDetails.minOrderSize) {
        toast({
          title: "Order too small",
          description: `Minimum order size is ${pairDetails.minOrderSize} ${baseCurrency}`,
          variant: "destructive",
        });
        return;
      }

      if (numericAmount > pairDetails.maxOrderSize) {
        toast({
          title: "Order too large",
          description: `Maximum order size is ${pairDetails.maxOrderSize} ${baseCurrency}`,
          variant: "destructive",
        });
        return;
      }
    }

    if (orderType === 'sell') {
      const availableBalance = availableBalances[baseCurrency] || 0;
      if (numericAmount > availableBalance) {
        toast({
          title: "Insufficient balance",
          description: `You only have ${availableBalance.toFixed(6)} ${baseCurrency} available`,
          variant: "destructive",
        });
        return;
      }
    } else if (orderType === 'buy') {
      const totalCost = numericAmount * numericPrice;
      const availableBalance = availableBalances[quoteCurrency] || 0;
      if (totalCost > availableBalance) {
        toast({
          title: "Insufficient balance",
          description: `You need ${totalCost.toFixed(2)} ${quoteCurrency}, but only have ${availableBalance.toFixed(2)} available`,
          variant: "destructive",
        });
        return;
      }
    }

    setIsSubmitting(true);

    try {
      const { data, error } = await supabase.rpc('create_order', {
        user_id_param: user.id,
        order_type_param: orderType,
        currency_param: baseCurrency,
        quote_currency_param: quoteCurrency,
        amount_param: numericAmount,
        price_param: numericPrice,
        original_amount_param: numericAmount
      });

      if (error) {
        console.warn("First attempt failed, trying alternative approach");

        const { data: directData, error: directError } = await supabase
          .from('orders')
          .insert({
            user_id: user.id,
            type: orderType,
            currency: baseCurrency,
            quote_currency: quoteCurrency,
            amount: numericAmount,
            price: numericPrice,
            original_amount: numericAmount,
            status: 'open'
          });

        if (directError) throw directError;
      }

      setAmount("");
      setPrice("");

      toast({
        title: "Order created",
        description: `Your ${orderType} order for ${numericAmount} ${baseCurrency} at ${numericPrice} ${quoteCurrency} has been created`,
      });

      if (onOrderCreated) {
        onOrderCreated();
      }

    } catch (error: any) {
      console.error("Error creating order:", error);
      toast({
        title: "Failed to create order",
        description: error.message || "An unexpected error occurred",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSetMaxAmount = () => {
    if (maxAmount > 0) {
      setAmount(maxAmount.toString());
    }
  };

  // Use the totalCardClassOverride if provided, otherwise use the original class
  const totalCardClass = totalCardClassOverride || "bg-gray-50 border border-gray-200";

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <div>
        <div className="grid grid-cols-2 gap-2 mb-4">
          <Button
            type="button"
            variant={orderType === 'buy' ? "default" : "outline"}
            className={orderType === 'buy' ? "bg-green-600 hover:bg-green-700" : ""}
            onClick={() => handleOrderTypeChange('buy')}
          >
            <ArrowDown className="h-4 w-4 mr-2" />
            Buy
          </Button>
          <Button
            type="button"
            variant={orderType === 'sell' ? "default" : "outline"}
            className={orderType === 'sell' ? "bg-red-600 hover:bg-red-700" : ""}
            onClick={() => handleOrderTypeChange('sell')}
          >
            <ArrowUp className="h-4 w-4 mr-2" />
            Sell
          </Button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Trading Pair
            </label>
            <Select
              value={selectedPair}
              onValueChange={handlePairChange}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select trading pair" />
              </SelectTrigger>
              <SelectContent>
                {availablePairs.map((pair) => (
                  <SelectItem key={pair.id} value={pair.id}>
                    {pair.baseCurrency}/{pair.quoteCurrency}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <div className="flex justify-between">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Amount ({baseCurrency || "—"})
              </label>
              <div className="flex items-center gap-2">
                <span className="text-xs text-gray-500">
                  Available: {orderType === 'sell' ? (availableBalances[baseCurrency] || 0).toFixed(6) : (maxAmount > 0 ? maxAmount.toFixed(6) : '0.000000')}
                </span>
                <button 
                  type="button"
                  className="text-xs text-blue-600 font-medium bg-blue-50 px-2 py-0.5 rounded hover:bg-blue-100"
                  onClick={handleSetMaxAmount}
                >
                  MAX
                </button>
              </div>
            </div>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder={`Amount in ${baseCurrency}`}
              step="0.000001"
              min="0"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Price ({quoteCurrency || "KES"})
            </label>
            <Input
              type="number"
              value={price}
              onChange={(e) => handlePriceChange(e.target.value)}
              placeholder="Price per coin"
              step="0.01"
              min="0"
            />
          </div>
        </div>
      </div>

      {baseCurrency && price && amount && (
        <Card className={totalCardClass}>
          <CardContent className="pt-4">
            <div className="flex justify-between text-sm">
              <span className={totalCardClassOverride ? "text-gray-400" : "text-gray-500"}>Total:</span>
              <span className="font-medium">
                {(Number(price) * Number(amount)).toFixed(2)} {quoteCurrency}
              </span>
            </div>
          </CardContent>
        </Card>
      )}

      <Button
        type="submit"
        className="w-full"
        disabled={isSubmitting || !selectedPair || !amount || !price}
      >
        {isSubmitting ? "Creating Order..." : `Create ${orderType === 'buy' ? 'Buy' : 'Sell'} Order`}
      </Button>
    </form>
  );
};

export default CreateOrderForm;