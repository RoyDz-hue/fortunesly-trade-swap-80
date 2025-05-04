
import React, { useState, useEffect } from 'react';
import { getReferralSettings, updateReferralSettings } from '@/services/referralService';
import { ReferralSettings as ReferralSettingsType } from '@/types';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from '@/components/ui/skeleton';
import { AlertCircle, Save, RefreshCw } from 'lucide-react';
import SuccessAlert from '@/components/ui/SuccessAlert';

const ReferralSettings = () => {
  const [settings, setSettings] = useState<ReferralSettingsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [updating, setUpdating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<boolean>(false);
  const { toast } = useToast();

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getReferralSettings();
      setSettings(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load referral settings');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to load referral settings',
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (key: keyof ReferralSettingsType, value: number) => {
    if (settings) {
      setSettings({
        ...settings,
        [key]: value
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setUpdating(true);
    setError(null);
    setSuccess(false);
    
    try {
      await updateReferralSettings(settings);
      setSuccess(true);
      toast({
        title: "Settings updated",
        description: "Referral system settings have been updated successfully",
        variant: "success"
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to update settings');
      toast({
        title: "Error",
        description: err instanceof Error ? err.message : 'Failed to update settings',
        variant: "destructive"
      });
    } finally {
      setUpdating(false);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral System Settings</CardTitle>
          <CardDescription>Configure the referral program parameters</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
            <Skeleton className="h-10 w-full" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!settings) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral System Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-900/30 p-4 rounded-md text-red-400 flex">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error || 'Failed to load settings'}</p>
          </div>
          <Button onClick={fetchSettings} className="mt-4">
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral System Settings</CardTitle>
        <CardDescription>Configure the referral program parameters</CardDescription>
      </CardHeader>
      <CardContent>
        {success && (
          <div className="mb-6">
            <SuccessAlert message="Settings updated successfully" />
          </div>
        )}
        
        {error && (
          <div className="bg-red-900/30 p-4 rounded-md text-red-400 flex mb-6">
            <AlertCircle className="h-5 w-5 mr-2" />
            <p>{error}</p>
          </div>
        )}
        
        <form onSubmit={handleSubmit}>
          <div className="space-y-6">
            <div>
              <h3 className="text-lg font-medium mb-4">Reward Settings</h3>
              <div className="grid gap-4">
                <div className="space-y-1">
                  <Label htmlFor="coins-per-referral">Coins Per Referral</Label>
                  <Input
                    id="coins-per-referral"
                    type="number"
                    value={settings.coinsPerReferral}
                    onChange={(e) => handleInputChange('coinsPerReferral', parseInt(e.target.value))}
                    min={1}
                    required
                  />
                  <p className="text-sm text-gray-400">
                    Number of coins awarded for direct referrals
                  </p>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="level2-rate">Level 2 Rate (%)</Label>
                  <Input
                    id="level2-rate"
                    type="number"
                    value={settings.level2RatePercent}
                    onChange={(e) => handleInputChange('level2RatePercent', parseInt(e.target.value))}
                    min={0}
                    max={100}
                    required
                  />
                  <p className="text-sm text-gray-400">
                    Percentage of coins awarded for indirect (level 2) referrals
                  </p>
                </div>
              </div>
            </div>
            
            <Separator />
            
            <div>
              <h3 className="text-lg font-medium mb-4">Transfer Settings</h3>
              <div className="grid gap-4">
                <div className="space-y-1">
                  <Label htmlFor="transaction-fee">Transaction Fee (%)</Label>
                  <Input
                    id="transaction-fee"
                    type="number"
                    value={settings.transactionFeePercent}
                    onChange={(e) => handleInputChange('transactionFeePercent', parseFloat(e.target.value))}
                    min={0}
                    max={100}
                    step={0.1}
                    required
                  />
                  <p className="text-sm text-gray-400">
                    Fee charged for coin transfers between users
                  </p>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="min-transferable">Minimum Transferable Balance</Label>
                  <Input
                    id="min-transferable"
                    type="number"
                    value={settings.minTransferableBalance}
                    onChange={(e) => handleInputChange('minTransferableBalance', parseInt(e.target.value))}
                    min={0}
                    required
                  />
                  <p className="text-sm text-gray-400">
                    Minimum amount of coins required for a transfer to another user
                  </p>
                </div>
                
                <div className="space-y-1">
                  <Label htmlFor="min-to-wallet">Minimum to Crypto Wallet</Label>
                  <Input
                    id="min-to-wallet"
                    type="number"
                    value={settings.minToCryptoWallet}
                    onChange={(e) => handleInputChange('minToCryptoWallet', parseInt(e.target.value))}
                    min={0}
                    required
                  />
                  <p className="text-sm text-gray-400">
                    Minimum amount of coins required to convert to crypto
                  </p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <Button 
                type="submit" 
                disabled={updating}
                className="flex items-center gap-2"
              >
                {updating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Updating...
                  </>
                ) : (
                  <>
                    <Save className="h-4 w-4" />
                    Save Settings
                  </>
                )}
              </Button>
            </div>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReferralSettings;
