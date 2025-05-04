
import React, { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from "@/hooks/use-toast";
import { adminAdjustBalance } from '@/services/referralService';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Search, Users, Plus, Minus } from 'lucide-react';

interface UserReferralData {
  id: string;
  email: string;
  username: string;
  referral_code: string;
  referral_balance: number;
  direct_referrals: number;
  indirect_referrals: number;
}

const UserReferralManagement = () => {
  const [users, setUsers] = useState<UserReferralData[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState<string>('');
  
  // Balance adjustment state
  const [adjustDialogOpen, setAdjustDialogOpen] = useState<boolean>(false);
  const [selectedUser, setSelectedUser] = useState<UserReferralData | null>(null);
  const [adjustmentAmount, setAdjustmentAmount] = useState<number>(0);
  const [adjustmentReason, setAdjustmentReason] = useState<string>('');
  const [adjusting, setAdjusting] = useState<boolean>(false);
  
  const { toast } = useToast();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async (query = '') => {
    setLoading(true);
    try {
      let userQuery = supabase
        .from('users')
        .select('id, email, username, referral_code, referral_balance, referral_count')
        .order('referral_balance', { ascending: false });
      
      if (query) {
        userQuery = userQuery.or(`email.ilike.%${query}%,referral_code.ilike.%${query}%,username.ilike.%${query}%`);
      }
      
      const { data, error } = await userQuery;
      
      if (error) throw error;
      
      // For each user, get their direct and indirect referral counts
      const usersWithReferrals = await Promise.all((data || []).map(async (user) => {
        // Get direct referrals
        const { count: directCount } = await supabase
          .from('users')
          .select('id', { count: 'exact', head: true })
          .eq('referred_by', user.id);
          
        // Get users directly referred by the current user
        const { data: directReferrals } = await supabase
          .from('users')
          .select('id')
          .eq('referred_by', user.id);
          
        // Count indirect referrals
        let indirectCount = 0;
        
        if (directReferrals && directReferrals.length > 0) {
          const directIds = directReferrals.map(ref => ref.id);
          
          const { count: indirectCountResult } = await supabase
            .from('users')
            .select('id', { count: 'exact', head: true })
            .in('referred_by', directIds);
            
          indirectCount = indirectCountResult || 0;
        }
        
        return {
          ...user,
          direct_referrals: directCount || 0,
          indirect_referrals: indirectCount
        };
      }));
      
      setUsers(usersWithReferrals);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast({
        title: "Failed to load users",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    fetchUsers(searchQuery);
  };

  const openAdjustBalanceDialog = (user: UserReferralData) => {
    setSelectedUser(user);
    setAdjustmentAmount(0);
    setAdjustmentReason('');
    setAdjustDialogOpen(true);
  };

  const handleAdjustBalance = async () => {
    if (!selectedUser || adjustmentAmount === 0 || !adjustmentReason) return;
    
    setAdjusting(true);
    try {
      await adminAdjustBalance(selectedUser.id, adjustmentAmount, adjustmentReason);
      
      toast({
        title: "Balance adjusted",
        description: `${selectedUser.username || selectedUser.email}'s balance was ${adjustmentAmount > 0 ? 'increased' : 'decreased'} by ${Math.abs(adjustmentAmount)}`,
        variant: "success"
      });
      
      // Close dialog and refresh users
      setAdjustDialogOpen(false);
      fetchUsers(searchQuery);
    } catch (error) {
      console.error('Error adjusting balance:', error);
      toast({
        title: "Failed to adjust balance",
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: "destructive"
      });
    } finally {
      setAdjusting(false);
    }
  };

  return (
    <>
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center">
              <Users className="mr-2 h-5 w-5" />
              User Referrals
            </CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSearch} className="relative mb-6">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-500" />
            <Input
              placeholder="Search by email, username, or referral code..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
            <Button type="submit" size="sm" className="absolute right-1 top-1">
              Search
            </Button>
          </form>
          
          <div className="border rounded-md overflow-hidden">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Referral Code</TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>Referrals</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loading ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      Loading users...
                    </TableCell>
                  </TableRow>
                ) : users.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={5} className="text-center py-8">
                      No users found
                    </TableCell>
                  </TableRow>
                ) : (
                  users.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{user.username || 'N/A'}</div>
                          <div className="text-sm text-gray-500">{user.email}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline" className="font-mono">
                          {user.referral_code}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right font-mono">
                        {user.referral_balance}
                      </TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Badge variant="outline" className="bg-blue-500/10 text-blue-400 border-blue-500/30">
                            {user.direct_referrals} Direct
                          </Badge>
                          <Badge variant="outline" className="bg-purple-500/10 text-purple-400 border-purple-500/30">
                            {user.indirect_referrals} Indirect
                          </Badge>
                        </div>
                      </TableCell>
                      <TableCell className="text-right">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => openAdjustBalanceDialog(user)}
                        >
                          Adjust Balance
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>
      
      <Dialog open={adjustDialogOpen} onOpenChange={setAdjustDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Adjust Referral Balance</DialogTitle>
            <DialogDescription>
              Modify the referral balance for {selectedUser?.email}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="adjustment-amount">Amount</Label>
              <div className="flex items-center gap-2">
                <Button
                  type="button"
                  size="icon"
                  variant={adjustmentAmount < 0 ? "default" : "outline"}
                  className="rounded-full h-8 w-8"
                  onClick={() => setAdjustmentAmount(Math.abs(adjustmentAmount) * -1)}
                >
                  <Minus className="h-4 w-4" />
                </Button>
                <Input
                  id="adjustment-amount"
                  type="number"
                  value={Math.abs(adjustmentAmount)}
                  onChange={(e) => {
                    const value = parseInt(e.target.value);
                    setAdjustmentAmount(
                      isNaN(value) ? 0 : (adjustmentAmount < 0 ? -value : value)
                    );
                  }}
                  className="text-center font-mono"
                />
                <Button
                  type="button"
                  size="icon"
                  variant={adjustmentAmount >= 0 ? "default" : "outline"}
                  className="rounded-full h-8 w-8"
                  onClick={() => setAdjustmentAmount(Math.abs(adjustmentAmount))}
                >
                  <Plus className="h-4 w-4" />
                </Button>
              </div>
              <div className="text-sm text-center pt-2">
                {adjustmentAmount > 0 ? (
                  <span className="text-green-500">Adding {adjustmentAmount} coins</span>
                ) : adjustmentAmount < 0 ? (
                  <span className="text-red-500">Removing {Math.abs(adjustmentAmount)} coins</span>
                ) : (
                  <span className="text-gray-500">No change</span>
                )}
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="adjustment-reason">Reason</Label>
              <Textarea
                id="adjustment-reason"
                value={adjustmentReason}
                onChange={(e) => setAdjustmentReason(e.target.value)}
                placeholder="Provide a reason for this adjustment"
                rows={3}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => setAdjustDialogOpen(false)}
              disabled={adjusting}
            >
              Cancel
            </Button>
            <Button
              onClick={handleAdjustBalance}
              disabled={adjusting || adjustmentAmount === 0 || !adjustmentReason}
            >
              {adjusting ? 'Adjusting...' : 'Confirm Adjustment'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default UserReferralManagement;
