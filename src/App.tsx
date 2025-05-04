
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "./components/ui/toaster";
import Index from "./pages/Index";
import Dashboard from "./pages/Dashboard";
import DashboardHome from "./pages/dashboard/DashboardHome";
import WalletPage from "./pages/dashboard/WalletPage";
import SettingsPage from "./pages/dashboard/SettingsPage";
import TransactionsPage from "./pages/dashboard/TransactionsPage";
import OrdersPage from "./pages/OrdersPage";
import MarketPage from "./pages/MarketPage";
import TradePage from "./pages/TradePage";
import Register from "./pages/Register";
import Login from "./pages/Login";
import AdminDashboard from "./pages/AdminDashboard";
import AdminHome from "./pages/admin/AdminHome";
import UsersPage from "./pages/admin/UsersPage";
import CoinsPage from "./pages/admin/CoinsPage";
import TradingPairsPage from "./pages/admin/TradingPairsPage";
import SettingsAdminPage from "./pages/admin/SettingsPage";
import WithdrawalsPage from "./pages/WithdrawalsPage";
import AdminTransactionsPage from "./pages/admin/TransactionsPage";
import DepositsPage from "./pages/admin/DepositsPage";
import MarketOrdersPage from "./pages/MarketOrdersPage";
import MyWithdrawalsPage from "./pages/MyWithdrawalsPage";
import ReferralPage from "./pages/dashboard/ReferralPage";
import ReferralsPage from "./pages/admin/ReferralsPage";
import AuthProvider from "./context/AuthContext";
import NotFound from "./pages/NotFound";
import './App.css'

// Create a client
const queryClient = new QueryClient()

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <Routes>
            <Route path="/" element={<Index />} />
            <Route path="/register" element={<Register />} />
            <Route path="/login" element={<Login />} />
            
            {/* Dashboard routes */}
            <Route path="/dashboard" element={<Dashboard />}>
              <Route index element={<DashboardHome />} />
              <Route path="wallet" element={<WalletPage />} />
              <Route path="settings" element={<SettingsPage />} />
              <Route path="transactions" element={<TransactionsPage />} />
              <Route path="withdrawals" element={<MyWithdrawalsPage />} />
              <Route path="referrals" element={<ReferralPage />} />
              {/* Add missing routes for orders and trade inside dashboard */}
              <Route path="orders" element={<OrdersPage />} />
              <Route path="trade" element={<TradePage />} />
            </Route>
            
            {/* Trading routes */}
            <Route path="/orders" element={<OrdersPage />} />
            <Route path="/market" element={<MarketPage />} />
            <Route path="/market/orders" element={<MarketOrdersPage />} />
            <Route path="/trade/:id" element={<TradePage />} />
            
            {/* Admin routes */}
            <Route path="/admin" element={<AdminDashboard />}>
              <Route index element={<AdminHome />} />
              <Route path="users" element={<UsersPage />} />
              <Route path="coins" element={<CoinsPage />} />
              <Route path="trading-pairs" element={<TradingPairsPage />} />
              <Route path="settings" element={<SettingsAdminPage />} />
              <Route path="withdrawals" element={<WithdrawalsPage />} />
              <Route path="deposits" element={<DepositsPage />} />
              <Route path="transactions" element={<AdminTransactionsPage />} />
              <Route path="referrals" element={<ReferralsPage />} />
            </Route>
            
            {/* 404 Not Found */}
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Router>
        <Toaster />
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
