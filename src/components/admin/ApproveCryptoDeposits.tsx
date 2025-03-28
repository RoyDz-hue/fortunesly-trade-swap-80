
import { useState } from "react";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CryptoDepositRequest } from "@/types";

interface ApproveCryptoDepositsProps {
  // Will be populated from database in the future
  pendingDeposits?: CryptoDepositRequest[];
}

const ApproveCryptoDeposits = ({ pendingDeposits = [] }: ApproveCryptoDepositsProps) => {
  const { toast } = useToast();
  const [selectedDeposit, setSelectedDeposit] = useState<CryptoDepositRequest | null>(null);
  const [isViewingProof, setIsViewingProof] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleViewProof = (deposit: CryptoDepositRequest) => {
    setSelectedDeposit(deposit);
    setIsViewingProof(true);
  };

  const handleApprove = async (deposit: CryptoDepositRequest) => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call an API to approve the deposit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Deposit Approved",
        description: "This feature will be available when connected to the database"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to approve deposit",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleReject = async (deposit: CryptoDepositRequest) => {
    setIsLoading(true);
    
    try {
      // In a real implementation, this would call an API to reject the deposit
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      toast({
        title: "Deposit Rejected",
        description: "This feature will be available when connected to the database"
      });
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to reject deposit",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Pending Crypto Deposits</h2>
        
        {pendingDeposits.length > 0 ? (
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Date</TableHead>
                  <TableHead>User</TableHead>
                  <TableHead>Coin</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Proof</TableHead>
                  <TableHead>Action</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {pendingDeposits.map((deposit) => (
                  <TableRow key={deposit.id}>
                    <TableCell>{new Date(deposit.createdAt).toLocaleString()}</TableCell>
                    <TableCell>{deposit.userId}</TableCell>
                    <TableCell>{deposit.coinId}</TableCell>
                    <TableCell>{deposit.amount}</TableCell>
                    <TableCell>
                      <Button variant="outline" size="sm" onClick={() => handleViewProof(deposit)}>
                        View Proof
                      </Button>
                    </TableCell>
                    <TableCell>
                      <div className="flex space-x-2">
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                          onClick={() => handleApprove(deposit)}
                          disabled={isLoading}
                        >
                          Approve
                        </Button>
                        <Button 
                          variant="outline" 
                          size="sm" 
                          className="bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                          onClick={() => handleReject(deposit)}
                          disabled={isLoading}
                        >
                          Reject
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        ) : (
          <div className="text-center py-10 text-gray-500">
            <p>No pending crypto deposits found</p>
            <p className="text-sm mt-1">Deposit requests will appear here when connected to the database</p>
          </div>
        )}
      </div>
      
      {/* Proof Viewing Dialog */}
      {selectedDeposit && (
        <Dialog open={isViewingProof} onOpenChange={setIsViewingProof}>
          <DialogContent className="sm:max-w-[500px]">
            <DialogHeader>
              <DialogTitle>Deposit Proof</DialogTitle>
              <DialogDescription>
                Proof of deposit submitted by user
              </DialogDescription>
            </DialogHeader>
            
            <div className="py-4">
              <div className="border rounded-md overflow-hidden">
                <img 
                  src={selectedDeposit.proofImageUrl} 
                  alt="Deposit Proof" 
                  className="w-full object-contain max-h-[300px]"
                  onError={(e) => {
                    const target = e.target as HTMLImageElement;
                    target.src = "https://via.placeholder.com/500x300?text=Proof+Image+(Will+load+from+database)";
                  }}
                />
              </div>
              
              <div className="mt-4 space-y-2 text-sm">
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">User ID:</span>
                  <span>{selectedDeposit.userId}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Coin:</span>
                  <span>{selectedDeposit.coinId}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Amount:</span>
                  <span>{selectedDeposit.amount}</span>
                </div>
                <div className="flex justify-between border-b pb-2">
                  <span className="font-medium">Date:</span>
                  <span>{new Date(selectedDeposit.createdAt).toLocaleString()}</span>
                </div>
              </div>
            </div>
            
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsViewingProof(false)}>
                Close
              </Button>
              <Button 
                className="bg-green-600 hover:bg-green-700" 
                onClick={() => {
                  handleApprove(selectedDeposit);
                  setIsViewingProof(false);
                }}
                disabled={isLoading}
              >
                Approve Deposit
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default ApproveCryptoDeposits;
