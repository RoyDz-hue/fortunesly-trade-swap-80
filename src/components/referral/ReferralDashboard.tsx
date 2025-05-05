import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { useAuth } from '@/context/AuthContext';
import { 
  getUserReferralStats, 
  getReferralSettings 
} from '@/services/referralService';
import { ReferralStats, ReferralSettings } from '@/types';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Separator } from "@/components/ui/separator";
import ReferralTransferForm from './ReferralTransferForm';
import ReferralNetworkView from './ReferralNetworkView';
import { Copy, Users, Coins, TrendingUp, Share2, Share } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

const ReferralDashboard = () => {
  const [stats, setStats] = useState<ReferralStats | null>(null);
  const [settings, setSettings] = useState<ReferralSettings | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [activeTab, setActiveTab] = useState<string>('overview');
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      try {
        const [statsData, settingsData] = await Promise.all([
          getUserReferralStats(),
          getReferralSettings()
        ]);
        
        setStats(statsData);
        setSettings(settingsData);
      } catch (error) {
        console.error('Error fetching referral data:', error);
        toast({
          title: "Failed to load referral data",
          description: error instanceof Error ? error.message : "Unknown error occurred",
          variant: "destructive"
        });
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [toast]);

  const copyReferralCode = () => {
    if (stats?.referralCode) {
      navigator.clipboard.writeText(stats.referralCode);
      toast({
        title: "Copied!",
        description: "Referral code copied to clipboard",
      });
    }
  };

  const shareReferral = async (platform?: string) => {
    const referralUrl = `${window.location.origin}/register?ref=${stats?.referralCode}`;
    const shareText = `Join Fortunesly using my referral code: ${stats?.referralCode}`;
    
    if (platform) {
      let shareUrl = '';
      
      switch (platform) {
        case 'twitter':
          shareUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(shareText)}&url=${encodeURIComponent(referralUrl)}`;
          break;
        case 'facebook':
          shareUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralUrl)}&quote=${encodeURIComponent(shareText)}`;
          break;
        case 'whatsapp':
          shareUrl = `https://wa.me/?text=${encodeURIComponent(`${shareText} ${referralUrl}`)}`;
          break;
        case 'telegram':
          shareUrl = `https://t.me/share/url?url=${encodeURIComponent(referralUrl)}&text=${encodeURIComponent(shareText)}`;
          break;
      }
      
      if (shareUrl) {
        window.open(shareUrl, '_blank');
      }
    } else if (navigator.share) {
      try {
        await navigator.share({
          title: 'Join Fortunesly',
          text: shareText,
          url: referralUrl
        });
      } catch (error) {
        console.error('Error sharing:', error);
      }
    } else {
      navigator.clipboard.writeText(`${shareText} ${referralUrl}`);
      toast({
        title: "Copied!",
        description: "Referral link copied to clipboard",
      });
    }
  };

  const renderStatsSkeleton = () => (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Skeleton className="h-[100px] w-full rounded-lg" />
        <Skeleton className="h-[100px] w-full rounded-lg" />
        <Skeleton className="h-[100px] w-full rounded-lg" />
      </div>
      <Skeleton className="h-[200px] w-full rounded-lg mb-6" />
    </>
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <h2 className="text-2xl font-bold mb-6">Your Referrals</h2>
        {renderStatsSkeleton()}
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6">
        <h2 className="text-2xl font-bold">Your Referrals</h2>
        <Button 
          variant="outline"
          className="mt-2 md:mt-0"
          onClick={() => shareReferral()}
        >
          <Share className="mr-2 h-4 w-4" /> Share Referral Link
        </Button>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <Card className="bg-gradient-to-br from-yellow-500/10 to-amber-700/20 border-yellow-500/30">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center">
              <Coins className="h-4 w-4 mr-1" />
              TRD Coin Balance
            </CardDescription>
            <CardTitle className="text-2xl">{stats?.referralBalance || 0}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-gray-400">
              Total earned: {stats?.totalEarned || 0}
            </p>
          </CardContent>
        </Card>
        
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center">
              <Users className="h-4 w-4 mr-1" />
              Your Referrals
            </CardDescription>
            <CardTitle className="text-2xl">{(stats?.directReferrals || 0) + (stats?.indirectReferrals || 0)}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex gap-2">
              <Badge variant="outline" className="bg-blue-500/10 text-blue-400 hover:bg-blue-500/20">
                {stats?.directReferrals || 0} Direct
              </Badge>
              <Badge variant="outline" className="bg-purple-500/10 text-purple-400 hover:bg-purple-500/20">
                {stats?.indirectReferrals || 0} Indirect
              </Badge>
            </div>
          </CardContent>
        </Card>
        
        <Card className="overflow-hidden">
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center">
              <TrendingUp className="h-4 w-4 mr-1" />
              Your Referral Code
            </CardDescription>
            <CardTitle className="font-mono text-2xl">{stats?.referralCode}</CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <div className="flex gap-2">
              <Button size="sm" variant="outline" onClick={copyReferralCode}>
                <Copy className="h-3.5 w-3.5 mr-1" />
                Copy Code
              </Button>
              <Button size="sm" variant="outline" onClick={() => shareReferral()}>
                <Share2 className="h-3.5 w-3.5 mr-1" />
                Share
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList className="grid grid-cols-3 md:w-[400px]">
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="network">Network</TabsTrigger>
          <TabsTrigger value="transfer">Transfer</TabsTrigger>
        </TabsList>
        
        <TabsContent value="overview" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>How it works</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div>
                <h3 className="font-medium mb-2">Earn TRD Coins by referring friends</h3>
                <ul className="list-disc pl-5 space-y-2">
                  <li>You earn {settings?.coinsPerReferral || 10} coins for each direct referral</li>
                  <li>You earn {settings?.level2RatePercent || 25}% of coins when your referrals invite others</li>
                  <li>Transfer coins to other users or convert them to crypto</li>
                </ul>
              </div>
              
              <Separator />
              
              <div>
                <h3 className="font-medium mb-2">Share your referral code</h3>
                <p className="text-sm text-gray-400">
                  Share your code with friends or use the direct sharing options below
                </p>
                
                <div className="flex gap-2 mt-4">
                  <Button size="sm" variant="outline" onClick={() => shareReferral('twitter')}>
                    Twitter
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => shareReferral('facebook')}>
                    Facebook
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => shareReferral('whatsapp')}>
                    WhatsApp
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => shareReferral('telegram')}>
                    Telegram
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
            </CardHeader>
            <CardContent>
              {stats && stats.transferHistory.length > 0 ? (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left pb-2">Type</th>
                        <th className="text-left pb-2">Amount</th>
                        <th className="text-left pb-2">Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {stats.transferHistory.slice(0, 5).map((tx) => (
                        <tr key={tx.id} className="border-b border-gray-800">
                          <td className="py-3">
                            <Badge 
                              variant={tx.transactionType.includes('reward') ? 'default' : 
                                      (tx.transactionType === 'transfer_in' ? 'success' : 'destructive')}
                              className="font-normal capitalize"
                            >
                              {tx.transactionType.replace(/_/g, ' ')}
                            </Badge>
                          </td>
                          <td className="py-3">
                            <span className={tx.amount > 0 ? 'text-green-400' : 'text-red-400'}>
                              {tx.amount > 0 ? '+' : ''}{tx.amount}
                            </span>
                          </td>
                          <td className="py-3">
                            {new Date(tx.createdAt).toLocaleDateString()}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-gray-400 text-center py-4">No transactions yet</p>
              )}
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="network">
          {settings && (
            <ReferralNetworkView 
              coinsPerReferral={settings.coinsPerReferral} 
              level2Rate={settings.level2RatePercent}
            />
          )}
        </TabsContent>
        
        <TabsContent value="transfer">
          {settings && stats && (
            <ReferralTransferForm 
              balance={stats.referralBalance} 
              settings={settings}
              onTransferComplete={() => {
                // Refresh stats after transfer
                getUserReferralStats()
                  .then(newStats => setStats(newStats))
                  .catch(console.error);
              }}
            />
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReferralDashboard;
