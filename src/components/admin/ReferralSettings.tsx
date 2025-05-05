
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { AlertCircle } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { getReferralSettings, updateReferralSettings } from '@/services/referralService';
import { ReferralSettings as ReferralSettingsType } from '@/types';
import { Skeleton } from '@/components/ui/skeleton';

const ReferralSettings = () => {
  const [settings, setSettings] = useState<ReferralSettingsType | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [saving, setSaving] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const { toast } = useToast();
  
  useEffect(() => {
    const fetchSettings = async () => {
      try {
        setLoading(true);
        const data = await getReferralSettings();
        setSettings(data);
      } catch (err) {
        console.error('Error fetching referral settings:', err);
        setError(err instanceof Error ? err.message : 'Failed to load settings');
      } finally {
        setLoading(false);
      }
    };
    
    fetchSettings();
  }, []);
  
  const handleChange = (field: keyof ReferralSettingsType, value: number) => {
    if (settings) {
      setSettings({
        ...settings,
        [field]: value
      });
    }
  };
  
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!settings) return;
    
    setSaving(true);
    setError(null);
    
    try {
      await updateReferralSettings(settings);
      toast({
        title: "Settings saved",
        description: "Referral settings have been updated successfully.",
      });
    } catch (err) {
      console.error('Error saving settings:', err);
      setError(err instanceof Error ? err.message : 'Failed to save settings');
    } finally {
      setSaving(false);
    }
  };
  
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Referral Settings</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[300px] w-full rounded-lg" />
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card>
      <CardHeader>
        <CardTitle>Referral Settings</CardTitle>
      </CardHeader>
      <CardContent>
        {error && (
          <div className="bg-red-900/30 p-4 rounded-md flex items-start space-x-2 border border-red-800 mb-4">
            <AlertCircle className="h-5 w-5 text-red-400 mt-0.5 flex-shrink-0" />
            <span className="text-sm text-red-300">{error}</span>
          </div>
        )}
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <h3 className="text-lg font-medium mb-4">Reward Configuration</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <Label htmlFor="coins-per-referral">Coins Per Referral</Label>
                <Input
                  id="coins-per-referral"
                  type="number"
                  min="1"
                  value={settings?.coinsPerReferral || 0}
                  onChange={(e) => handleChange('coinsPerReferral', Number(e.target.value))}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Coins earned for each direct referral
                </p>
              </div>
              
              <div>
                <Label htmlFor="level2-rate">Level 2 Rate (%)</Label>
                <Input
                  id="level2-rate"
                  type="number"
                  min="0"
                  max="100"
                  value={settings?.level2RatePercent || 0}
                  onChange={(e) => handleChange('level2RatePercent', Number(e.target.value))}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Percentage of direct referral reward given to level 2 referrers
                </p>
              </div>
            </div>
          </div>
          
          <Separator />
          
          <div>
            <h3 className="text-lg font-medium mb-4">Transfer Configuration</h3>
            <div className="grid gap-4 sm:grid-cols-3">
              <div>
                <Label htmlFor="transaction-fee">Transaction Fee (%)</Label>
                <Input
                  id="transaction-fee"
                  type="number"
                  min="0"
                  max="100"
                  step="0.01"
                  value={settings?.transactionFeePercent || 0}
                  onChange={(e) => handleChange('transactionFeePercent', Number(e.target.value))}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Fee charged for transferring coins between users
                </p>
              </div>
              
              <div>
                <Label htmlFor="min-transferable">Min Transferable Amount</Label>
                <Input
                  id="min-transferable"
                  type="number"
                  min="1"
                  value={settings?.minTransferableBalance || 0}
                  onChange={(e) => handleChange('minTransferableBalance', Number(e.target.value))}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Minimum coins that can be transferred to another user
                </p>
              </div>
              
              <div>
                <Label htmlFor="min-to-wallet">Min to Crypto Wallet</Label>
                <Input
                  id="min-to-wallet"
                  type="number"
                  min="1"
                  value={settings?.minToCryptoWallet || 0}
                  onChange={(e) => handleChange('minToCryptoWallet', Number(e.target.value))}
                  required
                />
                <p className="text-xs text-gray-400 mt-1">
                  Minimum coins that can be transferred to crypto wallet
                </p>
              </div>
            </div>
          </div>
          
          <div className="flex justify-end">
            <Button type="submit" disabled={saving}>
              {saving ? 'Saving...' : 'Save Settings'}
            </Button>
          </div>
        </form>
      </CardContent>
    </Card>
  );
};

export default ReferralSettings;
