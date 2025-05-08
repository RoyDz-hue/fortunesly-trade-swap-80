
import { Routes, Route, Navigate, useNavigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import AdminLayout from "@/components/admin/AdminLayout";
import { lazy, Suspense, useEffect } from "react";

// Lazy load pages for better performance
const AdminHome = lazy(() => import("./admin/AdminHome"));
const UsersPage = lazy(() => import("./admin/UsersPage"));
const CoinsPage = lazy(() => import("./admin/CoinsPage"));
const DepositsPage = lazy(() => import("./admin/DepositsPage"));
const WithdrawalsPage = lazy(() => import("./WithdrawalsPage"));
const TradingPairsPage = lazy(() => import("./admin/TradingPairsPage"));
const SettingsPage = lazy(() => import("./admin/SettingsPage"));
const TransactionsPage = lazy(() => import("./admin/TransactionsPage"));
const MarketPage = lazy(() => import("./MarketPage"));
const ReferralsPage = lazy(() => import("./admin/ReferralsPage"));

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
  const { isAuthenticated, isAdmin, user } = useAuth();
  const navigate = useNavigate();
  
  useEffect(() => {
    console.log("AdminDashboard mount - Auth status:", { isAuthenticated, isAdmin, user });
    
    if (!isAuthenticated) {
      console.log("Not authenticated, redirecting to login");
      navigate("/login");
      return;
    }
    
    if (!isAdmin) {
      console.log("Non-admin user detected, redirecting to regular dashboard");
      navigate("/dashboard");
      return;
    }

    console.log("Admin user authenticated, staying on admin dashboard");
  }, [isAuthenticated, isAdmin, user, navigate]);
  
  // Show loader while authentication is being checked
  if (!isAuthenticated) {
    return <PageLoader />;
  }
  
  // Additional check to ensure only admin users can access this page
  if (!isAdmin) {
    return <PageLoader />;
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
          <Route path="/transactions" element={<TransactionsPage />} />
          <Route path="/trading-pairs" element={<TradingPairsPage />} />
          <Route path="/settings" element={<SettingsPage />} />
          <Route path="/referrals" element={<ReferralsPage />} />
          <Route path="/market" element={<MarketPage />} />
        </Routes>
      </Suspense>
    </AdminLayout>
  );
};

export default AdminDashboard;
