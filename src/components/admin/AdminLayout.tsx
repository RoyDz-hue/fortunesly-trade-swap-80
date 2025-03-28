
import { Link, useLocation } from "react-router-dom";
import { Users, Database, CreditCard, BarChart3, Settings, LogOut } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
}

const SidebarLink = ({ href, icon, children, isActive }: SidebarLinkProps) => (
  <Link
    to={href}
    className={cn(
      "flex items-center py-3 px-4 rounded-lg text-sm font-medium transition-colors",
      isActive
        ? "bg-fortunesly-primary text-white"
        : "text-gray-600 hover:bg-gray-100"
    )}
  >
    <div className="mr-3">{icon}</div>
    {children}
  </Link>
);

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { logout, user } = useAuth();
  
  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') {
      return true;
    }
    if (path !== '/admin' && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-gray-200">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center justify-center px-4">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-fortunesly-primary">Fortunesly</span>
              <span className="text-xl font-bold text-fortunesly-secondary">.shop</span>
              <span className="ml-2 text-xs font-bold bg-fortunesly-secondary text-white px-2 py-0.5 rounded">ADMIN</span>
            </Link>
          </div>
          <div className="mt-8 px-4">
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-500 mb-1">Admin Portal</div>
              <div className="font-medium text-gray-900">{user?.username}</div>
            </div>
            <nav className="space-y-2">
              <SidebarLink href="/admin" icon={<BarChart3 size={20} />} isActive={isActive('/admin')}>
                Dashboard
              </SidebarLink>
              <SidebarLink href="/admin/users" icon={<Users size={20} />} isActive={isActive('/admin/users')}>
                Manage Users
              </SidebarLink>
              <SidebarLink href="/admin/coins" icon={<Database size={20} />} isActive={isActive('/admin/coins')}>
                Manage Coins
              </SidebarLink>
              <SidebarLink href="/admin/transactions" icon={<CreditCard size={20} />} isActive={isActive('/admin/transactions')}>
                Transactions
              </SidebarLink>
              <SidebarLink href="/admin/settings" icon={<Settings size={20} />} isActive={isActive('/admin/settings')}>
                Settings
              </SidebarLink>
            </nav>
          </div>
        </div>
        <div className="p-4 border-t border-gray-200">
          <Button
            variant="outline"
            className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1">
        <div className="sticky top-0 z-10 flex-shrink-0 flex bg-white border-b border-gray-200 md:hidden">
          <div className="flex-1 flex justify-between px-4 py-3">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-fortunesly-primary">Fortunesly</span>
              <span className="text-xl font-bold text-fortunesly-secondary">.shop</span>
              <span className="ml-2 text-xs font-bold bg-fortunesly-secondary text-white px-2 py-0.5 rounded">ADMIN</span>
            </Link>
            {/* Mobile menu button */}
            <button type="button" className="text-gray-500 hover:text-gray-600 focus:outline-none">
              <span className="sr-only">Open sidebar</span>
              <svg className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>
        </div>
        <main className="flex-1 pb-8">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default AdminLayout;
