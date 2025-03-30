
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { lazy, Suspense } from "react";

// Lazy load pages for better performance
const AdminHome = lazy(() => import("./admin/AdminHome"));
const UsersPage = lazy(() => import("./admin/UsersPage"));
const CoinsPage = lazy(() => import("./admin/CoinsPage"));
const DepositsPage = lazy(() => import("./admin/DepositsPage"));
const WithdrawalsPage = lazy(() => import("./WithdrawalsPage"));
const TradingPairsPage = lazy(() => import("./admin/TradingPairsPage"));
const SettingsPage = lazy(() => import("./admin/SettingsPage"));

// Loading fallback
const PageLoader = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-t-fortunesly-primary border-gray-200 rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<AdminHome />} />
          <Route path="/users" element={<UsersPage />} />
          <Route path="/coins" element={<CoinsPage />} />
          <Route path="/deposits" element={<DepositsPage />} />
          <Route path="/withdrawals" element={<WithdrawalsPage />} />
          <Route path="/trading-pairs" element={<TradingPairsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
    </AdminLayout>
  );
};

export default AdminDashboard;
