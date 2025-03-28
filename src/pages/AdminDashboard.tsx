
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";

// Admin Dashboard Home Component
const AdminHome = () => {
  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold text-gray-900">Admin Dashboard</h1>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">Total Users</div>
          <div className="text-2xl font-bold">248</div>
          <div className="text-xs text-green-600 mt-2">+12% from last month</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">Pending Approvals</div>
          <div className="text-2xl font-bold">14</div>
          <div className="text-xs text-yellow-600 mt-2">Needs attention</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">Total Trades</div>
          <div className="text-2xl font-bold">1,256</div>
          <div className="text-xs text-green-600 mt-2">+8% from last week</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">Total Volume (KES)</div>
          <div className="text-2xl font-bold">2.4M</div>
          <div className="text-xs text-green-600 mt-2">+15% from last month</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Pending Approvals</h2>
          <div className="divide-y divide-gray-200">
            <div className="py-3 flex justify-between items-center">
              <div>
                <div className="font-medium">Deposit - HRC</div>
                <div className="text-sm text-gray-500">User: john_doe</div>
              </div>
              <div className="text-right">
                <div className="font-medium">500 HRC</div>
                <div className="text-xs text-gray-500">2 hours ago</div>
              </div>
            </div>
            <div className="py-3 flex justify-between items-center">
              <div>
                <div className="font-medium">Withdrawal - USDT</div>
                <div className="text-sm text-gray-500">User: crypto_trader</div>
              </div>
              <div className="text-right">
                <div className="font-medium">250 USDT</div>
                <div className="text-xs text-gray-500">5 hours ago</div>
              </div>
            </div>
            <div className="py-3 flex justify-between items-center">
              <div>
                <div className="font-medium">Deposit - PVC</div>
                <div className="text-sm text-gray-500">User: alice_crypto</div>
              </div>
              <div className="text-right">
                <div className="font-medium">1,000 PVC</div>
                <div className="text-xs text-gray-500">8 hours ago</div>
              </div>
            </div>
          </div>
          <button className="mt-4 w-full py-2 text-sm font-medium text-center text-fortunesly-primary hover:text-fortunesly-accent transition-colors">
            View All Approvals
          </button>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Recent System Activity</h2>
          <div className="divide-y divide-gray-200">
            <div className="py-3">
              <div className="font-medium">New Coin Added: HRC</div>
              <div className="text-sm text-gray-500">Admin: system_admin</div>
              <div className="text-xs text-gray-500">Today, 10:24 AM</div>
            </div>
            <div className="py-3">
              <div className="font-medium">Tax Rate Updated: 10% → 8%</div>
              <div className="text-sm text-gray-500">Admin: system_admin</div>
              <div className="text-xs text-gray-500">Yesterday, 2:15 PM</div>
            </div>
            <div className="py-3">
              <div className="font-medium">User Accounts Reviewed</div>
              <div className="text-sm text-gray-500">Admin: system_admin</div>
              <div className="text-xs text-gray-500">Yesterday, 11:30 AM</div>
            </div>
          </div>
          <button className="mt-4 w-full py-2 text-sm font-medium text-center text-fortunesly-primary hover:text-fortunesly-accent transition-colors">
            View All Activity
          </button>
        </div>
      </div>
    </div>
  );
};

// Users Page (Placeholder)
const UsersPage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Users</h1>
    <p className="text-gray-600">This is the users management page. Full implementation coming soon.</p>
  </div>
);

// Coins Page (Placeholder)
const CoinsPage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Coins</h1>
    <p className="text-gray-600">This is the coins management page. Full implementation coming soon.</p>
  </div>
);

// Transactions Page (Placeholder)
const TransactionsPage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Transactions</h1>
    <p className="text-gray-600">This is the transactions page. Full implementation coming soon.</p>
  </div>
);

// Settings Page (Placeholder)
const SettingsPage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Settings</h1>
    <p className="text-gray-600">This is the settings page. Full implementation coming soon.</p>
  </div>
);

// Main Admin Dashboard Component with Routes
const AdminDashboard = () => {
  const { isAuthenticated, isAdmin } = useAuth();
  
  // If not authenticated, redirect to login
  if (!isAuthenticated) {
    return <Navigate to="/login" />;
  }
  
  // If not admin, redirect to user dashboard
  if (!isAdmin) {
    return <Navigate to="/dashboard" />;
  }
  
  return (
    <AdminLayout>
      <Routes>
        <Route path="/" element={<AdminHome />} />
        <Route path="/users" element={<UsersPage />} />
        <Route path="/coins" element={<CoinsPage />} />
        <Route path="/transactions" element={<TransactionsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;
