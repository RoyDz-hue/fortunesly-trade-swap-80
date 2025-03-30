
import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Settings, Wallet, ShieldCheck } from "lucide-react";

interface AdminSettings {
  id: number;
  tax_percentage: number | null;
  payhero_channel_id: string | null;
}

const SystemSettings = () => {
  const { toast } = useToast();
  const [settings, setSettings] = useState<AdminSettings | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [taxPercentage, setTaxPercentage] = useState<number>(10);
  const [payheroChannelId, setPayheroChannelId] = useState<string>("");
  const [activeTab, setActiveTab] = useState("general");
  
  useEffect(() => {
    fetchSettings();
  }, []);
  
  const fetchSettings = async () => {
    setIsLoading(true);
    try {
      const { data, error } = await supabase
        .from('admin_settings')
        .select('*')
        .limit(1);
        
      if (error) throw error;
      
      if (data && data.length > 0) {
        setSettings(data[0]);
        setTaxPercentage(data[0].tax_percentage || 10);
        setPayheroChannelId(data[0].payhero_channel_id || "");
      } else {
        // If no settings exist, create default settings
        const { data: newSettings, error: insertError } = await supabase
          .from('admin_settings')
          .insert({
            tax_percentage: 10,
            payhero_channel_id: "1472"
          })
          .select();
          
        if (insertError) throw insertError;
        
        if (newSettings && newSettings.length > 0) {
          setSettings(newSettings[0]);
          setTaxPercentage(newSettings[0].tax_percentage || 10);
          setPayheroChannelId(newSettings[0].payhero_channel_id || "");
        }
      }
    } catch (error) {
      console.error("Error fetching settings:", error);
      toast({
        title: "Error loading settings",
        description: "Failed to load system settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };
  
  const saveSettings = async () => {
    if (!settings) return;
    
    setIsSaving(true);
    try {
      const { error } = await supabase
        .from('admin_settings')
        .update({
          tax_percentage: taxPercentage,
          payhero_channel_id: payheroChannelId
        })
        .eq('id', settings.id);
        
      if (error) throw error;
      
      toast({
        title: "Settings saved",
        description: "System settings have been updated successfully."
      });
      
      // Refresh settings
      fetchSettings();
      
    } catch (error) {
      console.error("Error saving settings:", error);
      toast({
        title: "Error saving settings",
        description: "Failed to save system settings. Please try again.",
        variant: "destructive"
      });
    } finally {
      setIsSaving(false);
    }
  };
  
  return (
    <div>
      <h1 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h1>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-4">
        <TabsList>
          <TabsTrigger value="general">
            <Settings className="mr-2 h-4 w-4" />
            General Settings
          </TabsTrigger>
          <TabsTrigger value="payment">
            <Wallet className="mr-2 h-4 w-4" />
            Payment Settings
          </TabsTrigger>
          <TabsTrigger value="security">
            <ShieldCheck className="mr-2 h-4 w-4" />
            Security Settings
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="general" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Global Platform Settings</CardTitle>
              <CardDescription>
                Configure global platform settings and defaults
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="taxPercentage">
                  Withdrawal Tax Percentage: {taxPercentage}%
                </Label>
                <Slider
                  id="taxPercentage"
                  min={0}
                  max={30}
                  step={0.5}
                  defaultValue={[taxPercentage]}
                  onValueChange={(value) => setTaxPercentage(value[0])}
                />
                <p className="text-sm text-gray-500">
                  Set the percentage fee that will be deducted from all withdrawals
                </p>
              </div>
              
              <Button 
                onClick={saveSettings} 
                disabled={isLoading || isSaving}
              >
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="payment" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Payment Processor Settings</CardTitle>
              <CardDescription>
                Configure PayHero API settings for mobile money transactions
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="payheroChannelId">PayHero Channel ID</Label>
                <Input
                  id="payheroChannelId"
                  value={payheroChannelId}
                  onChange={(e) => setPayheroChannelId(e.target.value)}
                  placeholder="Enter PayHero channel ID"
                />
                <p className="text-sm text-gray-500">
                  This ID is used to process KES deposits and withdrawals via M-Pesa
                </p>
              </div>
              
              <Button 
                onClick={saveSettings} 
                disabled={isLoading || isSaving}
              >
                {isSaving ? "Saving..." : "Save Settings"}
              </Button>
            </CardContent>
          </Card>
          
          <Card>
            <CardHeader>
              <CardTitle>API Status</CardTitle>
              <CardDescription>
                Check the status of payment integrations
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex justify-between items-center p-3 border rounded-md bg-green-50 border-green-200">
                <div className="flex items-center">
                  <div className="h-3 w-3 rounded-full bg-green-500 mr-2"></div>
                  <span>PayHero API: Connected</span>
                </div>
                <Button variant="outline" size="sm">
                  Test Connection
                </Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        
        <TabsContent value="security" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Security Settings</CardTitle>
              <CardDescription>
                Configure security options for the platform
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">Admin Account Security</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Your admin account (cyntoremix@gmail.com) is protected with password authentication.
                  </p>
                  <Button>
                    Change Admin Password
                  </Button>
                </div>
                
                <div className="p-4 border rounded-md">
                  <h3 className="font-medium mb-2">API Keys</h3>
                  <p className="text-sm text-gray-500 mb-4">
                    Manage API keys for integrations and external services.
                  </p>
                  <div className="flex items-center justify-between border p-3 rounded-md">
                    <div>
                      <span className="text-sm font-medium">PayHero API</span>
                      <p className="text-xs text-gray-500">Last used: Today</p>
                    </div>
                    <Button variant="outline" size="sm">
                      Manage Keys
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default SystemSettings;
