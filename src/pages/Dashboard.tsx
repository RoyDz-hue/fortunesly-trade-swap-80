
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

// Wallet Page
const WalletPage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">My Wallet</h1>
    <WalletOverview />
    <div className="mt-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Transaction History</h2>
      <RecentTransactions showViewAll={false} />
    </div>
  </div>
);

// Trade Page
const TradePage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Trade</h1>
    <p className="text-gray-600 mb-4">Buy and sell cryptocurrencies using KES or USDT.</p>
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
      <div className="lg:col-span-2 bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Order Book</h2>
        <p className="text-sm text-gray-500">This feature will be available when connected to the database.</p>
      </div>
      <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
        <h2 className="text-lg font-semibold mb-4">Create Order</h2>
        <p className="text-sm text-gray-500">This feature will be available when connected to the database.</p>
      </div>
    </div>
  </div>
);

// Orders History Page
const OrdersPage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">My Orders</h1>
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <div className="flex border-b border-gray-200 mb-4">
        <button className="px-4 py-2 text-fortunesly-primary border-b-2 border-fortunesly-primary font-medium">
          Active Orders
        </button>
        <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
          Completed Orders
        </button>
        <button className="px-4 py-2 text-gray-500 hover:text-gray-700">
          Cancelled Orders
        </button>
      </div>
      <p className="text-sm text-gray-500">Your order history will appear here when connected to the database.</p>
    </div>
  </div>
);

// Settings Page
const SettingsPage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Account Settings</h1>
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <h2 className="text-lg font-semibold mb-4">Profile Information</h2>
      <p className="text-sm text-gray-500">Account settings will be available when connected to the database.</p>
    </div>
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
        <Route path="/orders" element={<OrdersPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </DashboardLayout>
  );
};

export default Dashboard;
