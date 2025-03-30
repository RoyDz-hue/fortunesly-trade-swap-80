
import { lazy, Suspense } from "react";
import { Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

// Lazy load components for better performance
const DashboardHome = lazy(() => import("./dashboard/DashboardHome"));
const WalletPage = lazy(() => import("./dashboard/WalletPage"));
const TradePage = lazy(() => import("./TradePage"));
const OrdersPage = lazy(() => import("./OrdersPage"));
const MyWithdrawalsPage = lazy(() => import("./MyWithdrawalsPage"));
const SettingsPage = lazy(() => import("./dashboard/SettingsPage"));

// Loading component
const PageLoader = () => (
  <div className="flex items-center justify-center h-[60vh]">
    <div className="text-center">
      <div className="w-12 h-12 border-4 border-t-fortunesly-primary border-gray-200 rounded-full animate-spin mx-auto"></div>
      <p className="mt-4 text-gray-600">Loading...</p>
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
      <Suspense fallback={<PageLoader />}>
        <Routes>
          <Route path="/" element={<DashboardHome />} />
          <Route path="/wallet" element={<WalletPage />} />
          <Route path="/trade" element={<TradePage />} />
          <Route path="/orders" element={<OrdersPage />} />
          <Route path="/withdrawals" element={<MyWithdrawalsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
};

export default Dashboard;
