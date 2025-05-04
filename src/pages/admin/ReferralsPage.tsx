
import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import ReferralSettings from '@/components/admin/ReferralSettings';
import UserReferralManagement from '@/components/admin/UserReferralManagement';

const ReferralsPage = () => {
  const [activeTab, setActiveTab] = useState<string>('users');

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Manage Referrals</h1>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">User Referrals</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>
        
        <TabsContent value="users" className="space-y-4">
          <UserReferralManagement />
        </TabsContent>
        
        <TabsContent value="settings">
          <ReferralSettings />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ReferralsPage;
