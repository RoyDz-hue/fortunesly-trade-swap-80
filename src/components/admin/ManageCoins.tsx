
import { useState, useEffect } from "react";
import { Coin } from "@/types";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { useToast } from "@/hooks/use-toast";
import { Skeleton } from "@/components/ui/skeleton";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Plus, Edit, Coins } from "lucide-react";

const ManageCoins = () => {
  const { toast } = useToast();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isEditing, setIsEditing] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  
  // Form state
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [depositAddress, setDepositAddress] = useState("");
  const [taxRate, setTaxRate] = useState<number>(10);
  const [status, setStatus] = useState<boolean>(true);
  const [coinImage, setCoinImage] = useState<File | null>(null);
  const [formSubmitting, setFormSubmitting] = useState(false);
  
  useEffect(() => {
    fetchCoins();
  }, []);
  
  const fetchCoins = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('coins')
        .select('*')
        .order('symbol');
        
      if (error) {
        throw error;
      }
      
      // Convert to Coin type
      const formattedCoins: Coin[] = data.map(coin => ({
        id: coin.id,
        name: coin.name,
        symbol: coin.symbol,
        depositAddress: coin.deposit_address,
        status: coin.status || 'active',
        taxRate: coin.tax_rate || 10,
        image: coin.image || ''
      }));
      
      setCoins(formattedCoins);
    } catch (error) {
      console.error("Error fetching coins:", error);
      toast({
        title: "Failed to load coins",
        description: "Please try again later",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const handleAddCoin = () => {
    resetForm();
    setIsEditing(false);
    setIsFormOpen(true);
  };
  
  const handleEditCoin = (coin: Coin) => {
    setSelectedCoin(coin);
    setName(coin.name);
    setSymbol(coin.symbol);
    setDepositAddress(coin.depositAddress || '');
    setTaxRate(coin.taxRate || 10);
    setStatus(coin.status === 'active');
    setIsEditing(true);
    setIsFormOpen(true);
  };
  
  const resetForm = () => {
    setName("");
    setSymbol("");
    setDepositAddress("");
    setTaxRate(10);
    setStatus(true);
    setCoinImage(null);
    setSelectedCoin(null);
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name || !symbol || !depositAddress) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }
    
    setFormSubmitting(true);
    
    try {
      let imageUrl = selectedCoin?.image || '';
      
      // If there's a new image, upload it to storage
      if (coinImage) {
        // Create storage bucket if it doesn't exist (would be done in SQL setup)
        const { error: uploadError, data } = await supabase.storage
          .from('coin-icons')
          .upload(`${symbol.toLowerCase()}.png`, coinImage, {
            contentType: 'image/png',
            upsert: true
          });
          
        if (uploadError) {
          throw uploadError;
        }
        
        const { data: { publicUrl } } = supabase.storage
          .from('coin-icons')
          .getPublicUrl(`${symbol.toLowerCase()}.png`);
          
        imageUrl = publicUrl;
      }
      
      if (isEditing && selectedCoin) {
        // Update existing coin
        const { error } = await supabase
          .from('coins')
          .update({
            name,
            symbol,
            deposit_address: depositAddress,
            tax_rate: taxRate,
            status: status ? 'active' : 'inactive',
            image: imageUrl
          })
          .eq('id', selectedCoin.id);
          
        if (error) throw error;
        
        toast({
          title: "Coin updated",
          description: `${name} (${symbol}) has been updated`
        });
      } else {
        // Insert new coin
        const { error } = await supabase
          .from('coins')
          .insert({
            name,
            symbol,
            deposit_address: depositAddress,
            tax_rate: taxRate,
            status: 'active',
            image: imageUrl
          });
          
        if (error) throw error;
        
        toast({
          title: "Coin added",
          description: `${name} (${symbol}) has been added to the platform`
        });
      }
      
      // Refresh coins list
      fetchCoins();
      setIsFormOpen(false);
      resetForm();
      
    } catch (error) {
      console.error("Error saving coin:", error);
      toast({
        title: "Error",
        description: "Failed to save coin. Please try again.",
        variant: "destructive"
      });
    } finally {
      setFormSubmitting(false);
    }
  };
  
  const toggleCoinStatus = async (coin: Coin) => {
    try {
      const newStatus = coin.status === 'active' ? 'inactive' : 'active';
      
      const { error } = await supabase
        .from('coins')
        .update({ status: newStatus })
        .eq('id', coin.id);
        
      if (error) throw error;
      
      // Update local state
      setCoins(coins.map(c => {
        if (c.id === coin.id) {
          return { ...c, status: newStatus };
        }
        return c;
      }));
      
      toast({
        title: `Coin ${newStatus === 'active' ? 'activated' : 'deactivated'}`,
        description: `${coin.name} (${coin.symbol}) is now ${newStatus}`
      });
      
    } catch (error) {
      console.error("Error toggling coin status:", error);
      toast({
        title: "Error",
        description: "Failed to update coin status",
        variant: "destructive"
      });
    }
  };
  
  const renderSkeletons = () => (
    <div>
      {[...Array(5)].map((_, i) => (
        <div key={i} className="flex items-center space-x-4 py-4">
          <Skeleton className="h-12 w-12 rounded-full" />
          <div className="space-y-2">
            <Skeleton className="h-4 w-[250px]" />
            <Skeleton className="h-4 w-[200px]" />
          </div>
        </div>
      ))}
    </div>
  );
  
  return (
    <>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Coins</h1>
        <Button onClick={handleAddCoin}>
          <Plus className="mr-2 h-4 w-4" /> Add New Coin
        </Button>
      </div>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Coins className="mr-2 h-5 w-5" />
            Available Cryptocurrencies
          </CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            renderSkeletons()
          ) : coins.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-gray-500">No coins available</p>
              <Button variant="outline" className="mt-4" onClick={handleAddCoin}>
                Add Your First Coin
              </Button>
            </div>
          ) : (
            <div className="border rounded-md overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Coin</TableHead>
                    <TableHead>Symbol</TableHead>
                    <TableHead>Deposit Address</TableHead>
                    <TableHead>Tax Rate</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {coins.map((coin) => (
                    <TableRow key={coin.id}>
                      <TableCell>
                        <div className="flex items-center space-x-3">
                          {coin.image ? (
                            <img 
                              src={coin.image} 
                              alt={coin.symbol} 
                              className="w-8 h-8 rounded-full"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = "https://via.placeholder.com/32";
                              }} 
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              {coin.symbol.charAt(0)}
                            </div>
                          )}
                          <span>{coin.name}</span>
                        </div>
                      </TableCell>
                      <TableCell>{coin.symbol}</TableCell>
                      <TableCell>
                        <span className="font-mono text-xs truncate max-w-[150px] inline-block">
                          {coin.depositAddress || "Not set"}
                        </span>
                      </TableCell>
                      <TableCell>{coin.taxRate || 10}%</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Switch 
                            checked={coin.status === 'active'} 
                            onCheckedChange={() => toggleCoinStatus(coin)}
                          />
                          <span className={coin.status === 'active' ? 'text-green-600' : 'text-red-600'}>
                            {coin.status === 'active' ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm" onClick={() => handleEditCoin(coin)}>
                          <Edit className="h-4 w-4" />
                          <span className="sr-only">Edit</span>
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Add/Edit Coin Dialog */}
      <Dialog open={isFormOpen} onOpenChange={setIsFormOpen}>
        <DialogContent className="sm:max-w-[550px]">
          <DialogHeader>
            <DialogTitle>{isEditing ? "Edit Coin" : "Add New Coin"}</DialogTitle>
            <DialogDescription>
              {isEditing 
                ? "Update the cryptocurrency information below." 
                : "Add a new cryptocurrency to the platform."}
            </DialogDescription>
          </DialogHeader>
          
          <form onSubmit={handleSubmit}>
            <div className="grid grid-cols-2 gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="name">Coin Name</Label>
                <Input 
                  id="name" 
                  value={name} 
                  onChange={(e) => setName(e.target.value)} 
                  placeholder="e.g. Bitcoin"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="symbol">Symbol</Label>
                <Input 
                  id="symbol" 
                  value={symbol} 
                  onChange={(e) => setSymbol(e.target.value.toUpperCase())} 
                  placeholder="e.g. BTC"
                  maxLength={10}
                />
              </div>
              
              <div className="col-span-2 space-y-2">
                <Label htmlFor="depositAddress">Deposit Address</Label>
                <Input 
                  id="depositAddress" 
                  value={depositAddress} 
                  onChange={(e) => setDepositAddress(e.target.value)} 
                  placeholder="Enter blockchain address for deposits"
                />
                <p className="text-xs text-gray-500">
                  This is the address that users will send funds to when depositing this cryptocurrency.
                </p>
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="taxRate">Withdrawal Tax Rate (%)</Label>
                <Input 
                  id="taxRate" 
                  type="number" 
                  value={taxRate} 
                  onChange={(e) => setTaxRate(Number(e.target.value))} 
                  min={0}
                  max={100}
                  step={0.1}
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="status">Status</Label>
                <div className="flex items-center space-x-2 h-10 pt-2">
                  <Switch 
                    id="status"
                    checked={status} 
                    onCheckedChange={setStatus}
                  />
                  <span>{status ? 'Active' : 'Inactive'}</span>
                </div>
              </div>
              
              <div className="col-span-2 space-y-2">
                <Label htmlFor="image">Coin Image</Label>
                <Input 
                  id="image" 
                  type="file" 
                  accept="image/png,image/jpeg,image/svg+xml"
                  onChange={(e) => {
                    if (e.target.files && e.target.files[0]) {
                      setCoinImage(e.target.files[0]);
                    }
                  }}
                />
                <p className="text-xs text-gray-500">
                  Upload an image for this cryptocurrency (PNG, JPG, or SVG).
                </p>
              </div>
            </div>
            
            <DialogFooter>
              <Button 
                type="button" 
                variant="outline" 
                onClick={() => {
                  resetForm();
                  setIsFormOpen(false);
                }}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={formSubmitting}>
                {formSubmitting 
                  ? 'Saving...' 
                  : isEditing 
                    ? 'Update Coin' 
                    : 'Add Coin'
                }
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default ManageCoins;
