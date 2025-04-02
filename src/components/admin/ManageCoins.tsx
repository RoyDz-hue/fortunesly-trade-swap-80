
import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { Plus, Upload, Trash2, Edit, Image } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Coin } from "@/types";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from "@/components/ui/alert-dialog";

const ManageCoins = () => {
  const { toast } = useToast();
  const [coins, setCoins] = useState<Coin[]>([]);
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [selectedCoin, setSelectedCoin] = useState<Coin | null>(null);
  
  const [newCoinName, setNewCoinName] = useState("");
  const [newCoinSymbol, setNewCoinSymbol] = useState("");
  const [newDepositAddress, setNewDepositAddress] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  
  // Edit form states
  const [editCoinName, setEditCoinName] = useState("");
  const [editDepositAddress, setEditDepositAddress] = useState("");

  const fetchCoins = useCallback(async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from("coins")
        .select("*")
        .order("symbol");
        
      if (error) throw error;
      
      setCoins(data || []);
    } catch (error) {
      console.error("Error fetching coins:", error);
      toast({
        title: "Failed to load coins",
        description: "There was an error loading the coin list",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    fetchCoins();
    
    const channel = supabase
      .channel("admin-coins-changes")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "coins" },
        () => {
          fetchCoins();
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [fetchCoins]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setSelectedFile(e.target.files[0]);
    }
  };

  const handleAddCoin = async () => {
    if (!newCoinName || !newCoinSymbol || !newDepositAddress) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { data, error } = await supabase
        .from("coins")
        .insert({
          name: newCoinName,
          symbol: newCoinSymbol.toUpperCase(),
          deposit_address: newDepositAddress
        })
        .select();
        
      if (error) throw error;
      
      if (selectedFile && data && data.length > 0) {
        await uploadCoinIcon(selectedFile, data[0].id);
      }
      
      toast({
        title: "Coin added",
        description: `${newCoinSymbol.toUpperCase()} has been added successfully`
      });
      
      setNewCoinName("");
      setNewCoinSymbol("");
      setNewDepositAddress("");
      setSelectedFile(null);
      setIsAddDialogOpen(false);
      
      fetchCoins();
      
    } catch (error: any) {
      console.error("Error adding coin:", error);
      toast({
        title: "Failed to add coin",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const uploadCoinIcon = async (file: File, coinId: string) => {
    setIsUploading(true);
    try {
      const fileName = `${coinId}-${Date.now()}.${file.name.split('.').pop()}`;
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from("coin-icons")
        .upload(fileName, file);
        
      if (uploadError) throw uploadError;
      
      const { data: publicUrlData } = supabase.storage
        .from("coin-icons")
        .getPublicUrl(fileName);
        
      const { error: updateError } = await supabase
        .from("coins")
        .update({ icon_url: publicUrlData.publicUrl })
        .eq("id", coinId);
        
      if (updateError) throw updateError;
      
      toast({
        title: "Icon uploaded",
        description: "Coin icon has been uploaded successfully"
      });
      
    } catch (error: any) {
      console.error("Error uploading icon:", error);
      toast({
        title: "Failed to upload icon",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsUploading(false);
    }
  };
  
  const handleUpdateIcon = async (coinId: string) => {
    if (!selectedFile) return;
    
    setIsUploading(true);
    try {
      await uploadCoinIcon(selectedFile, coinId);
      
      setIsEditDialogOpen(false);
      setSelectedCoin(null);
      setSelectedFile(null);
      fetchCoins();
      
    } catch (error) {
      console.error("Error updating icon:", error);
    } finally {
      setIsUploading(false);
    }
  };

  const handleOpenEditDialog = (coin: Coin) => {
    setSelectedCoin(coin);
    setEditCoinName(coin.name);
    setEditDepositAddress(coin.deposit_address || '');
    setIsEditDialogOpen(true);
  };

  const handleUpdateCoin = async () => {
    if (!selectedCoin) return;
    if (!editCoinName || !editDepositAddress) {
      toast({
        title: "Missing information",
        description: "Please fill in all required fields",
        variant: "destructive"
      });
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from("coins")
        .update({
          name: editCoinName,
          deposit_address: editDepositAddress
        })
        .eq("id", selectedCoin.id);
        
      if (error) throw error;
      
      if (selectedFile) {
        await uploadCoinIcon(selectedFile, selectedCoin.id);
      }
      
      toast({
        title: "Coin updated",
        description: `${selectedCoin.symbol} has been updated successfully`
      });
      
      setIsEditDialogOpen(false);
      setSelectedCoin(null);
      setSelectedFile(null);
      fetchCoins();
      
    } catch (error: any) {
      console.error("Error updating coin:", error);
      toast({
        title: "Failed to update coin",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleOpenDeleteDialog = (coin: Coin) => {
    setSelectedCoin(coin);
    setIsDeleteDialogOpen(true);
  };

  const handleDeleteCoin = async () => {
    if (!selectedCoin) return;
    
    setIsDeleting(true);
    try {
      // Delete the coin
      const { error } = await supabase
        .from("coins")
        .delete()
        .eq("id", selectedCoin.id);
        
      if (error) throw error;
      
      toast({
        title: "Coin deleted",
        description: `${selectedCoin.symbol} has been deleted successfully`
      });
      
      setIsDeleteDialogOpen(false);
      setSelectedCoin(null);
      fetchCoins();
      
    } catch (error: any) {
      console.error("Error deleting coin:", error);
      toast({
        title: "Failed to delete coin",
        description: error.message || "An unexpected error occurred",
        variant: "destructive"
      });
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Coins</h1>
        <Button onClick={() => setIsAddDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add New Coin
        </Button>
      </div>
      
      {isLoading ? (
        <div className="text-center py-8">Loading coins...</div>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Available Coins</CardTitle>
            <CardDescription>
              Manage cryptocurrency coins available in the system
            </CardDescription>
          </CardHeader>
          <CardContent>
            {coins.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                <p>No coins have been added yet.</p>
                <Button variant="outline" className="mt-4" onClick={() => setIsAddDialogOpen(true)}>
                  Add Your First Coin
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Coin</TableHead>
                      <TableHead>Symbol</TableHead>
                      <TableHead>Deposit Address</TableHead>
                      <TableHead>Icon</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {coins.map((coin) => (
                      <TableRow key={coin.id}>
                        <TableCell className="font-medium">{coin.name}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200">
                            {coin.symbol}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          {coin.deposit_address && coin.deposit_address.length > 20 ? 
                            `${coin.deposit_address.substring(0, 10)}...${coin.deposit_address.substring(coin.deposit_address.length - 10)}` :
                            coin.deposit_address
                          }
                        </TableCell>
                        <TableCell>
                          {coin.icon_url ? (
                            <img 
                              src={coin.icon_url} 
                              alt={coin.symbol} 
                              className="w-8 h-8 rounded-full object-cover"
                              onError={(e) => {
                                const target = e.target as HTMLImageElement;
                                target.src = `https://via.placeholder.com/32/6E59A5/ffffff?text=${coin.symbol}`;
                              }}
                            />
                          ) : (
                            <div className="w-8 h-8 rounded-full bg-gray-200 flex items-center justify-center">
                              <Image className="w-4 h-4 text-gray-400" />
                            </div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center"
                              onClick={() => {
                                setSelectedCoin(coin);
                                setIsEditDialogOpen(true);
                              }}
                            >
                              <Upload className="mr-1 h-3 w-3" />
                              Upload Icon
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center"
                              onClick={() => handleOpenEditDialog(coin)}
                            >
                              <Edit className="mr-1 h-3 w-3" />
                              Edit
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm"
                              className="flex items-center text-red-600 hover:text-red-700"
                              onClick={() => handleOpenDeleteDialog(coin)}
                            >
                              <Trash2 className="mr-1 h-3 w-3" />
                              Delete
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      )}
      
      <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add New Coin</DialogTitle>
            <DialogDescription>
              Add a new cryptocurrency to the system
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="coinName" className="text-right">
                Coin Name
              </Label>
              <Input
                id="coinName"
                value={newCoinName}
                onChange={(e) => setNewCoinName(e.target.value)}
                className="col-span-3"
                placeholder="Bitcoin"
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="coinSymbol" className="text-right">
                Symbol
              </Label>
              <Input
                id="coinSymbol"
                value={newCoinSymbol}
                onChange={(e) => setNewCoinSymbol(e.target.value.toUpperCase())}
                className="col-span-3"
                placeholder="BTC"
                maxLength={5}
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="depositAddress" className="text-right">
                Deposit Address
              </Label>
              <Input
                id="depositAddress"
                value={newDepositAddress}
                onChange={(e) => setNewDepositAddress(e.target.value)}
                className="col-span-3"
                placeholder="0x..."
              />
            </div>
            
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="coinIcon" className="text-right">
                Coin Icon
              </Label>
              <div className="col-span-3">
                <Input
                  id="coinIcon"
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                />
                <p className="text-xs text-gray-500 mt-1">
                  Optional. Recommended size: 64x64px
                </p>
              </div>
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleAddCoin} disabled={isSubmitting}>
              {isSubmitting ? "Adding..." : "Add Coin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{selectedCoin ? `Edit ${selectedCoin.symbol}` : 'Edit Coin'}</DialogTitle>
            <DialogDescription>
              Update coin details or upload a new icon
            </DialogDescription>
          </DialogHeader>
          
          <div className="grid gap-4 py-4">
            {selectedCoin && (
              <>
                <div className="flex items-center justify-center">
                  {selectedCoin.icon_url ? (
                    <img 
                      src={selectedCoin.icon_url} 
                      alt={selectedCoin.symbol} 
                      className="w-20 h-20 rounded-full object-cover"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement;
                        target.src = `https://via.placeholder.com/40/6E59A5/ffffff?text=${selectedCoin.symbol}`;
                      }}
                    />
                  ) : (
                    <div className="w-20 h-20 rounded-full bg-gray-200 flex items-center justify-center">
                      <Image className="w-10 h-10 text-gray-400" />
                    </div>
                  )}
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editCoinName" className="text-right">
                    Coin Name
                  </Label>
                  <Input
                    id="editCoinName"
                    value={editCoinName}
                    onChange={(e) => setEditCoinName(e.target.value)}
                    className="col-span-3"
                    placeholder="Bitcoin"
                  />
                </div>

                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editSymbol" className="text-right">
                    Symbol
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="editSymbol"
                      value={selectedCoin.symbol}
                      disabled
                      className="bg-gray-100"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Symbol cannot be changed after creation
                    </p>
                  </div>
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="editDepositAddress" className="text-right">
                    Deposit Address
                  </Label>
                  <Input
                    id="editDepositAddress"
                    value={editDepositAddress}
                    onChange={(e) => setEditDepositAddress(e.target.value)}
                    className="col-span-3"
                    placeholder="0x..."
                  />
                </div>
                
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="newCoinIcon" className="text-right">
                    New Icon
                  </Label>
                  <div className="col-span-3">
                    <Input
                      id="newCoinIcon"
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Recommended size: 64x64px
                    </p>
                  </div>
                </div>
              </>
            )}
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button 
              onClick={handleUpdateCoin} 
              disabled={isSubmitting}
            >
              {isSubmitting ? "Updating..." : "Update Coin"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={isDeleteDialogOpen} onOpenChange={setIsDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Are you sure you want to delete this coin?</AlertDialogTitle>
            <AlertDialogDescription>
              {selectedCoin && `This will permanently delete ${selectedCoin.name} (${selectedCoin.symbol}) from the system. This action cannot be undone.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteCoin}
              className="bg-red-500 text-white hover:bg-red-600"
              disabled={isDeleting}
            >
              {isDeleting ? "Deleting..." : "Delete Coin"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default ManageCoins;
