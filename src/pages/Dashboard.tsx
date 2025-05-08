
import { lazy, Suspense, useEffect } from "react";
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import DashboardLayout from "@/components/dashboard/DashboardLayout";

// Lazy load components for better performance
const DashboardHome = lazy(() => import("./dashboard/DashboardHome"));
const WalletPage = lazy(() => import("./dashboard/WalletPage"));
const TradePage = lazy(() => import("./TradePage"));
const OrdersPage = lazy(() => import("./OrdersPage"));
const MyWithdrawalsPage = lazy(() => import("./MyWithdrawalsPage"));
const SettingsPage = lazy(() => import("./dashboard/SettingsPage"));
const TransactionsPage = lazy(() => import("./dashboard/TransactionsPage"));
const ReferralPage = lazy(() => import("./dashboard/ReferralPage"));

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
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log("Dashboard mount - Auth status:", { isAuthenticated, isAdmin, user });
    
    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to login");
      navigate("/login");
      return;
    }
    
    if (isAdmin) {
      console.log("Admin user detected, redirecting to admin dashboard");
      navigate("/admin");
      return;
    }

    console.log("Regular user authenticated, staying on dashboard");
  }, [isAuthenticated, isAdmin, user, navigate]);
  
  // Show loader while authentication is being checked
  if (!isAuthenticated) {
    return <PageLoader />;
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
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/referrals" element={<ReferralPage />} />
        </Routes>
      </Suspense>
    </DashboardLayout>
  );
};

export default Dashboard;
