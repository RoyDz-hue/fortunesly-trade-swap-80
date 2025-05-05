
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { adminAdjustBalance } from '@/services/referralService';
import { Skeleton } from '@/components/ui/skeleton';
import { User } from '@/types';

const UserReferralManagement = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [isAdjustDialogOpen, setIsAdjustDialogOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [isAdjusting, setIsAdjusting] = useState<boolean>(false);
  const { toast } = useToast();
  
  useEffect(() => {
    fetchUsers();
  }, []);
  
  const fetchUsers = async (query = '') => {
    setLoading(true);
    try {
      let userQuery = supabase
        .from('users')
        .select('id, username, email, referral_code, referral_balance, referral_count, referred_by')
        .order('created_at', { ascending: false });
      
      if (query) {
        userQuery = userQuery.or(`email.ilike.%${query}%,username.ilike.%${query}%,referral_code.ilike.%${query}%`);
      }
      
      const { data, error } = await userQuery.limit(100);
      
      if (error) throw error;
      
      setUsers(data.map(user => ({
        id: user.id,
        username: user.username,
        email: user.email,
        referralCode: user.referral_code,
        referralBalance: user.referral_balance,
        referralCount: user.referral_count,
        role: user.email === 'cyntoremix@gmail.com' ? 'admin' : 'user'
      })));
      
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Error fetching users",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };
  
  const handleSearch = () => {
    fetchUsers(searchQuery);
  };
  
  const openAdjustDialog = (user: User) => {
    setSelectedUser(user);
    setAdjustmentAmount(0);
    setAdjustmentReason('');
    setIsAdjustDialogOpen(true);
  };
  
  const handleAdjustBalance = async () => {
    if (!selectedUser || !adjustmentReason) return;
    
    setIsAdjusting(true);
    
    try {
      await adminAdjustBalance(
        selectedUser.id,
        adjustmentAmount,
        adjustmentReason
      );
      
      // Update the user in the list
      setUsers(users.map(user => {
        if (user.id === selectedUser.id) {
          return {
            ...user,
            referralBalance: (user.referralBalance || 0) + adjustmentAmount
          };
        }
        return user;
      }));
      
      toast({
        title: "Balance adjusted",
        description: `${selectedUser.username || selectedUser.email}'s balance has been adjusted by ${adjustmentAmount} coins.`,
      });
      
      setIsAdjustDialogOpen(false);
    } catch (error) {
      console.error('Error adjusting balance:', error);
      toast({
        title: "Error adjusting balance",
        description: error instanceof Error ? error.message : "Unknown error occurred",
        variant: "destructive"
      });
    } finally {
      setIsAdjusting(false);
    }
  };
  
  return (
    <>
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Search Users</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="flex-1">
              <Label htmlFor="search-query">Search by Email, Username or Referral Code</Label>
              <Input
                id="search-query"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search users..."
                className="mt-1"
              />
            </div>
            <div className="self-end">
              <Button onClick={handleSearch}>Search</Button>
            </div>
          </div>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle>User Referrals</CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <Skeleton className="h-[400px] w-full rounded-lg" />
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Referral Code</TableHead>
                    <TableHead>Balance</TableHead>
                    <TableHead>Referral Count</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.length > 0 ? (
                    users.map((user) => (
                      <TableRow key={user.id}>
                        <TableCell>
                          <div>
                            <div className="font-medium">{user.username || 'N/A'}</div>
                            <div className="text-sm text-muted-foreground">{user.email}</div>
                          </div>
                        </TableCell>
                        <TableCell>{user.referralCode || 'N/A'}</TableCell>
                        <TableCell>{user.referralBalance || 0}</TableCell>
                        <TableCell>{user.referralCount || 0}</TableCell>
                        <TableCell>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => openAdjustDialog(user)}
                          >
                            Adjust Balance
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))
                  ) : (
                    <TableRow>
                      <TableCell colSpan={5} className="text-center py-8">
                        No users found
                      </TableCell>
                    </TableRow>
                  )}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
      
      {/* Adjust Balance Dialog */}
      <Dialog open={isAdjustDialogOpen} onOpenChange={setIsAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Referral Balance</DialogTitle>
            <DialogDescription>
              Adjust the referral balance for {selectedUser?.username || selectedUser?.email}. 
              Use positive values to add coins, negative values to subtract.
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div>
              <Label htmlFor="adjustment-amount">Amount</Label>
              <Input
                id="adjustment-amount"
                type="number"
                value={adjustmentAmount}
                onChange={(e) => setAdjustmentAmount(Number(e.target.value))}
              />
              <p className="text-xs text-muted-foreground mt-1">
                Current balance: {selectedUser?.referralBalance || 0} coins
              </p>
            </div>
            
            <div>
              <Label htmlFor="adjustment-reason">Reason</Label>
              <Input
                id="adjustment-reason"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Provide a reason for this adjustment"
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setIsAdjustDialogOpen(false)}
              disabled={isAdjusting}
            >
              Cancel
            </Button>
            <Button 
              onClick={handleAdjustBalance}
              disabled={!adjustmentReason || isAdjusting}
            >
              {isAdjusting ? 'Adjusting...' : 'Adjust Balance'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserReferralManagement;
