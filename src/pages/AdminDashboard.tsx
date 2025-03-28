
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
          <div className="text-2xl font-bold">-</div>
          <div className="text-xs text-gray-600 mt-2">Will load from database</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">Pending Approvals</div>
          <div className="text-2xl font-bold">-</div>
          <div className="text-xs text-gray-600 mt-2">Will load from database</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">Total Trades</div>
          <div className="text-2xl font-bold">-</div>
          <div className="text-xs text-gray-600 mt-2">Will load from database</div>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <div className="text-sm text-gray-500 mb-1">Total Volume (KES)</div>
          <div className="text-2xl font-bold">-</div>
          <div className="text-xs text-gray-600 mt-2">Will load from database</div>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Pending Approvals</h2>
          <p className="text-sm text-gray-500">Pending approvals will appear here when connected to the database.</p>
        </div>
        
        <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
          <h2 className="text-lg font-semibold mb-4">Recent System Activity</h2>
          <p className="text-sm text-gray-500">System activity will appear here when connected to the database.</p>
        </div>
      </div>
    </div>
  );
};

// Users Management Page
const UsersPage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Users</h1>
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <p className="text-sm text-gray-500">User management will be available when connected to the database.</p>
    </div>
  </div>
);

// Coins Management Page
const CoinsPage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Coins</h1>
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <p className="text-sm text-gray-500">Coin management will be available when connected to the database.</p>
    </div>
  </div>
);

// Transactions Management Page
const DepositsPage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Deposits</h1>
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <p className="text-sm text-gray-500">Deposit management will be available when connected to the database.</p>
    </div>
  </div>
);

// Withdrawals Management Page
const WithdrawalsPage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Withdrawals</h1>
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <p className="text-sm text-gray-500">Withdrawal management will be available when connected to the database.</p>
    </div>
  </div>
);

// Trading Pairs Management Page
const TradingPairsPage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">Manage Trading Pairs</h1>
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <p className="text-sm text-gray-500">Trading pair management will be available when connected to the database.</p>
    </div>
  </div>
);

// Settings Page
const SettingsPage = () => (
  <div>
    <h1 className="text-2xl font-bold text-gray-900 mb-6">System Settings</h1>
    <div className="bg-white p-6 rounded-lg shadow-sm border border-gray-200">
      <p className="text-sm text-gray-500">System settings will be available when connected to the database.</p>
    </div>
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
        <Route path="/deposits" element={<DepositsPage />} />
        <Route path="/withdrawals" element={<WithdrawalsPage />} />
        <Route path="/trading-pairs" element={<TradingPairsPage />} />
        <Route path="/settings" element={<SettingsPage />} />
      </Routes>
    </AdminLayout>
  );
};

export default AdminDashboard;
