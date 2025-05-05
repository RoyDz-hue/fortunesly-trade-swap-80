
import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { getUserReferralNetwork } from '@/services/referralService';
import { ReferralNetwork } from '@/types';
import { User, Users } from 'lucide-react';

interface ReferralNetworkViewProps {
  coinsPerReferral: number;
  level2Rate: number;
}

const ReferralNetworkView: React.FC<ReferralNetworkViewProps> = ({ 
  coinsPerReferral,
  level2Rate
}) => {
  const [network, setNetwork] = useState<ReferralNetwork | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchNetwork = async () => {
      try {
        setLoading(true);
        const data = await getUserReferralNetwork();
        setNetwork(data);
      } catch (err) {
        console.error('Error fetching referral network:', err);
        setError(err instanceof Error ? err.message : 'Failed to load referral network');
      } finally {
        setLoading(false);
      }
    };

    fetchNetwork();
  }, []);

  if (loading) {
    return (
      <div className="space-y-4">
        <Skeleton className="h-[200px] w-full rounded-lg" />
        <Skeleton className="h-[300px] w-full rounded-lg" />
      </div>
    );
  }

  if (error) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="bg-red-900/20 border border-red-800 rounded p-4 text-red-300">
            <p>Failed to load referral network: {error}</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center mb-8">
            <div className="bg-primary/10 rounded-full p-6 mb-4">
              <User size={48} className="text-primary" />
            </div>
            <span className="text-lg font-medium">You</span>
            <span className="text-sm text-muted-foreground">
              Code: {network?.user.referralCode}
            </span>
          </div>

          {/* Level 1: Direct Referrals */}
          <div className="mb-8">
            <h3 className="text-lg font-medium mb-4">Level 1: Direct Referrals</h3>
            <div className="bg-blue-500/5 rounded-lg p-4 border border-blue-500/20">
              {network?.directReferrals && network.directReferrals.length > 0 ? (
                <div className="space-y-4">
                  {network.directReferrals.map(referral => (
                    <div key={referral.id} className="flex items-center justify-between border-b border-blue-500/10 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center">
                        <div className="bg-blue-500/20 rounded-full p-2 mr-3">
                          <User size={20} className="text-blue-400" />
                        </div>
                        <div>
                          <p className="font-medium">{referral.username || referral.email.split('@')[0]}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(referral.joinDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-400">+{referral.coinsEarned} coins</p>
                        <p className="text-xs text-muted-foreground">Direct referral</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="mx-auto h-10 w-10 opacity-20 mb-2" />
                  <p>You haven't referred anyone yet.</p>
                  <p className="text-sm">Share your referral code to earn {coinsPerReferral} coins per referral!</p>
                </div>
              )}
            </div>
          </div>

          {/* Level 2: Indirect Referrals */}
          <div>
            <h3 className="text-lg font-medium mb-4">Level 2: Indirect Referrals</h3>
            <div className="bg-purple-500/5 rounded-lg p-4 border border-purple-500/20">
              {network?.indirectReferrals && network.indirectReferrals.length > 0 ? (
                <div className="space-y-4">
                  {network.indirectReferrals.map(referral => (
                    <div key={referral.id} className="flex items-center justify-between border-b border-purple-500/10 pb-3 last:border-0 last:pb-0">
                      <div className="flex items-center">
                        <div className="bg-purple-500/20 rounded-full p-2 mr-3">
                          <User size={20} className="text-purple-400" />
                        </div>
                        <div>
                          <p className="font-medium">{referral.username || referral.email.split('@')[0]}</p>
                          <p className="text-xs text-muted-foreground">
                            Joined {new Date(referral.joinDate).toLocaleDateString()}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-green-400">+{referral.coinsEarned} coins</p>
                        <p className="text-xs text-muted-foreground">Indirect referral</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-4 text-muted-foreground">
                  <Users className="mx-auto h-10 w-10 opacity-20 mb-2" />
                  <p>No indirect referrals yet.</p>
                  <p className="text-sm">
                    You earn {level2Rate}% commission when your referrals invite others!
                  </p>
                </div>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default ReferralNetworkView;
