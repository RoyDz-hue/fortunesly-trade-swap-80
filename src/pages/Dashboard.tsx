
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";
import WalletOverview from "@/components/dashboard/WalletOverview";
import RecentTransactions from "@/components/dashboard/RecentTransactions";
import MarketOverview from "@/components/dashboard/MarketOverview";

// Main Dashboard Home Component
const DashboardHome = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Dashboard</h1>
      </div>
      
      <WalletOverview />
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <RecentTransactions />
        <MarketOverview />
      </div>
    </div>
  );
};

// Wallet Page (Placeholder)
const WalletPage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Wallet</h1>
    <p className="text-gray-600">This is the wallet page. Full implementation coming soon.</p>
  </div>
);

// Trade Page (Placeholder)
const TradePage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Trade</h1>
    <p className="text-gray-600">This is the trade page. Full implementation coming soon.</p>
  </div>
);

// History Page (Placeholder)
const HistoryPage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">History</h1>
    <p className="text-gray-600">This is the history page. Full implementation coming soon.</p>
  </div>
);

// Settings Page (Placeholder)
const SettingsPage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
    <p className="text-gray-600">This is the settings page. Full implementation coming soon.</p>
  </div>
);

// Main Dashboard Component with Routes
const Dashboard = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If admin, redirect to admin dashboard
  if (isAdmin) {
    return <Navigate to="/admin" />;
  }
  
  return (
    <DashboardLayout>
      <Routes>
        <Route path="/" element={<DashboardHome />} />
        <Route path="/wallet" element={<WalletPage />} />
        <Route path="/trade" element={<TradePage />} />
        <Route path="/history" element={<HistoryPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;
