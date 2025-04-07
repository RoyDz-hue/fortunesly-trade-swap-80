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
}

const CreateOrderForm = ({
  availablePairs = [],
  availableBalances = {},
  availableCoins = [],
  onOrderCreated
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

  // ... (keep all existing useEffect hooks and handler functions identical)

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

      {/* Fixed Total Section - Only this block changed */}
      {baseCurrency && price && amount && (
        <Card className="bg-black border border-gray-800"> {/* Changed background and border */}
          <CardContent className="pt-4">
            <div className="flex justify-between text-sm">
              <span className="text-white">Total:</span> {/* Changed text color */}
              <span className="font-medium text-white"> {/* Changed text color */}
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