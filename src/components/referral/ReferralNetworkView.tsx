
import React, { useState, useEffect } from 'react';
import { getUserReferralNetwork } from '@/services/referralService';
import { ReferralNetwork } from '@/types';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Avatar, AvatarImage, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from '@/components/ui/skeleton';
import { CoinIcon } from 'lucide-react';

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
      setLoading(true);
      try {
        const data = await getUserReferralNetwork();
        setNetwork(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load network data');
      } finally {
        setLoading(false);
      }
    };

    fetchNetwork();
  }, []);

  if (loading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Network</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-[400px] w-full" />
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Your Referral Network</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="bg-red-500/10 border border-red-500/30 text-red-400 p-4 rounded-md">
            {error}
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Your Referral Network</CardTitle>
      </CardHeader>
      <CardContent>
        {!network || (network.directReferrals.length === 0 && network.indirectReferrals.length === 0) ? (
          <div className="text-center py-12 space-y-3">
            <p className="text-gray-400">You haven't referred anyone yet.</p>
            <p className="text-gray-500 text-sm">
              Share your referral code <span className="font-mono font-bold">{network?.user.referralCode}</span> to earn rewards!
            </p>
          </div>
        ) : (
          <div className="space-y-8">
            {/* Network visualization */}
            <div className="flex flex-col items-center">
              <div className="border border-dashed border-gray-700 rounded-full p-5 bg-gray-900">
                <Avatar className="h-20 w-20">
                  <AvatarFallback className="bg-gradient-to-br from-blue-600 to-purple-700 text-lg">
                    {network?.user.email.substring(0, 2).toUpperCase()}
                  </AvatarFallback>
                </Avatar>
              </div>
              
              <div className="text-center mt-2">
                <p className="font-medium">{network?.user.email}</p>
                <Badge variant="outline" className="mt-1">
                  {network?.user.referralCode}
                </Badge>
              </div>

              {/* Level 1 Referrals - Direct */}
              {network?.directReferrals.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm text-center mb-4 text-gray-400 flex items-center justify-center">
                    <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400 mr-2">Level 1</Badge>
                    Direct Referrals ({network.directReferrals.length})
                  </h3>
                  
                  <div className="flex flex-wrap justify-center gap-4">
                    {network.directReferrals.map((referral) => (
                      <div 
                        key={referral.id}
                        className="text-center border border-blue-500/20 bg-blue-500/5 rounded-lg p-4 min-w-[180px]"
                      >
                        <Avatar>
                          <AvatarFallback className="bg-blue-600">
                            {referral.email.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="mt-2 text-sm truncate" title={referral.email}>{referral.email}</p>
                        <p className="text-xs text-gray-400">{new Date(referral.joinDate).toLocaleDateString()}</p>
                        <Badge className="mt-2 bg-gradient-to-r from-yellow-500 to-amber-600 border-none flex items-center justify-center gap-1">
                          <CoinIcon className="h-3 w-3" /> {referral.coinsEarned}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Level 2 Referrals - Indirect */}
              {network?.indirectReferrals.length > 0 && (
                <div className="mt-8">
                  <h3 className="text-sm text-center mb-4 text-gray-400 flex items-center justify-center">
                    <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400 mr-2">Level 2</Badge>
                    Indirect Referrals ({network.indirectReferrals.length})
                  </h3>
                  
                  <div className="flex flex-wrap justify-center gap-4">
                    {network.indirectReferrals.map((referral) => (
                      <div 
                        key={referral.id}
                        className="text-center border border-purple-500/20 bg-purple-500/5 rounded-lg p-4 min-w-[180px]"
                      >
                        <Avatar>
                          <AvatarFallback className="bg-purple-600">
                            {referral.email.substring(0, 2).toUpperCase()}
                          </AvatarFallback>
                        </Avatar>
                        <p className="mt-2 text-sm truncate" title={referral.email}>{referral.email}</p>
                        <p className="text-xs text-gray-400">{new Date(referral.joinDate).toLocaleDateString()}</p>
                        <Badge className="mt-2 bg-gradient-to-r from-yellow-500 to-amber-600 border-none flex items-center justify-center gap-1">
                          <CoinIcon className="h-3 w-3" /> {referral.coinsEarned}
                        </Badge>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* Earnings Info */}
            <Card className="bg-gray-900/60">
              <CardContent className="pt-6">
                <h3 className="font-medium mb-4">Your Earnings Structure</h3>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <Badge variant="outline" className="bg-blue-500/10 border-blue-500/30 text-blue-400 mr-2">Level 1</Badge>
                      Direct Referral
                    </span>
                    <span className="font-mono">{coinsPerReferral} coins</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="flex items-center">
                      <Badge variant="outline" className="bg-purple-500/10 border-purple-500/30 text-purple-400 mr-2">Level 2</Badge>
                      Indirect Referral
                    </span>
                    <span className="font-mono">{Math.round((coinsPerReferral * level2Rate) / 100)} coins ({level2Rate}% of {coinsPerReferral})</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default ReferralNetworkView;
