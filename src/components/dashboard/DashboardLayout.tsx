
import { useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Wallet, ArrowLeftRight, ListOrdered, Settings, LogOut, Menu, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { ROUTES } from "@/utils/routeUtils";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
}

const SidebarLink = ({ href, icon, children, isActive, onClick }: SidebarLinkProps) => (
  <Link
    to={href}
    className={cn(
      "flex items-center py-3 px-4 rounded-lg text-sm font-medium transition-colors",
      isActive
        ? "bg-fortunesly-primary text-white"
        : "text-gray-600 hover:bg-gray-100"
    )}
    onClick={onClick}
  >
    <div className="mr-3">{icon}</div>
    {children}
  </Link>
);

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  
  const isActive = (path: string) => {
    if (path === ROUTES.DASHBOARD && location.pathname === ROUTES.DASHBOARD) {
      return true;
    }
    if (path !== ROUTES.DASHBOARD && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  const closeMobileMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  const renderNavLinks = (isMobile: boolean = false) => (
    <nav className="space-y-2">
      <SidebarLink 
        href={ROUTES.DASHBOARD} 
        icon={<Home size={20} />} 
        isActive={isActive(ROUTES.DASHBOARD)}
        onClick={isMobile ? closeMobileMenu : undefined}
      >
        Dashboard
      </SidebarLink>
      <SidebarLink 
        href={ROUTES.DASHBOARD_WALLET} 
        icon={<Wallet size={20} />} 
        isActive={isActive(ROUTES.DASHBOARD_WALLET)}
        onClick={isMobile ? closeMobileMenu : undefined}
      >
        Wallet
      </SidebarLink>
      <SidebarLink 
        href={ROUTES.DASHBOARD_TRADE} 
        icon={<ArrowLeftRight size={20} />} 
        isActive={isActive(ROUTES.DASHBOARD_TRADE)}
        onClick={isMobile ? closeMobileMenu : undefined}
      >
        Trade
      </SidebarLink>
      <SidebarLink 
        href={ROUTES.DASHBOARD_ORDERS} 
        icon={<ListOrdered size={20} />} 
        isActive={isActive(ROUTES.DASHBOARD_ORDERS)}
        onClick={isMobile ? closeMobileMenu : undefined}
      >
        Orders
      </SidebarLink>
      <SidebarLink 
        href={ROUTES.DASHBOARD_SETTINGS} 
        icon={<Settings size={20} />} 
        isActive={isActive(ROUTES.DASHBOARD_SETTINGS)}
        onClick={isMobile ? closeMobileMenu : undefined}
      >
        Settings
      </SidebarLink>
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-white border-r border-gray-200">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center justify-center px-4">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-fortunesly-primary">Fortunesly</span>
              <span className="text-xl font-bold text-fortunesly-secondary">.shop</span>
            </Link>
          </div>
          <div className="mt-8 px-4">
            <div className="bg-gray-50 rounded-lg p-4 mb-6">
              <div className="text-sm text-gray-500 mb-1">Welcome,</div>
              <div className="font-medium text-gray-900">{user?.username}</div>
            </div>
            {renderNavLinks()}
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
        {/* Mobile header */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex bg-white border-b border-gray-200 md:hidden">
          <div className="flex-1 flex justify-between px-4 py-3">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-fortunesly-primary">Fortunesly</span>
              <span className="text-xl font-bold text-fortunesly-secondary">.shop</span>
            </Link>
            
            {/* Mobile menu button */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[80%] sm:w-[350px] p-0">
                <div className="flex flex-col h-full">
                  <div className="border-b border-gray-200 p-4">
                    <div className="flex items-center justify-between mb-6">
                      <Link to="/" className="flex items-center" onClick={closeMobileMenu}>
                        <span className="text-xl font-bold text-fortunesly-primary">Fortunesly</span>
                        <span className="text-xl font-bold text-fortunesly-secondary">.shop</span>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={closeMobileMenu}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>
                    
                    <div className="bg-gray-50 rounded-lg p-4 mb-4">
                      <div className="text-sm text-gray-500 mb-1">Welcome,</div>
                      <div className="font-medium text-gray-900">{user?.username}</div>
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-auto p-4">
                    {renderNavLinks(true)}
                  </div>
                  
                  <div className="p-4 border-t border-gray-200">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50"
                      onClick={handleLogout}
                    >
                      <LogOut className="mr-2 h-4 w-4" />
                      Log out
                    </Button>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
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

export default DashboardLayout;
