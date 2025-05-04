import { useState, useEffect } from "react";
import { Link, useLocation } from "react-router-dom";
import { Home, Wallet, ArrowLeftRight, ListOrdered, Settings, LogOut, Menu, X, CreditCard, Download, Upload, Users } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
  subMenuLinks?: { href: string; label: string; icon: React.ReactNode }[];
}

const SidebarLink = ({ href, icon, children, isActive, onClick, subMenuLinks }: SidebarLinkProps) => {
  const [isSubMenuOpen, setIsSubMenuOpen] = useState(false);
  const location = useLocation();

  const isSubLinkActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const hasActiveSubLink = subMenuLinks?.some(link => isSubLinkActive(link.href));

  useEffect(() => {
    if (hasActiveSubLink) {
      setIsSubMenuOpen(true);
    }
  }, [hasActiveSubLink]);

  return (
    <div className="space-y-1">
      <Link
        to={href}
        className={cn(
          "flex items-center py-3 px-4 rounded-lg text-sm font-medium transition-all duration-200 ease-in-out",
          (isActive || hasActiveSubLink)
            ? "bg-gradient-to-r from-fortunesly-primary to-fortunesly-primary/90 text-white shadow-md"
            : "text-gray-300 hover:bg-gray-800 hover:translate-x-1"
        )}
        onClick={() => {
          if (subMenuLinks?.length) {
            setIsSubMenuOpen(!isSubMenuOpen);
          } else if (onClick) {
            onClick();
          }
        }}
      >
        <div className={cn("mr-3 transition-transform", (isActive || hasActiveSubLink) ? "scale-110" : "")}>{icon}</div>
        <span className="flex-1">{children}</span>
        {(isActive || hasActiveSubLink) && (
          <div className="h-2 w-2 rounded-full bg-white animate-pulse"></div>
        )}
        {subMenuLinks?.length && (
          <svg 
            className={cn("w-4 h-4 ml-2 transition-transform", isSubMenuOpen ? "rotate-90" : "")} 
            fill="none" 
            stroke="currentColor" 
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
          </svg>
        )}
      </Link>

      {subMenuLinks?.length && isSubMenuOpen && (
        <div className="pl-8 space-y-1">
          {subMenuLinks.map((subLink) => (
            <Link
              key={subLink.href}
              to={subLink.href}
              className={cn(
                "flex items-center py-2 px-4 rounded-lg text-sm transition-all duration-200 ease-in-out",
                isSubLinkActive(subLink.href)
                  ? "bg-gray-800 font-medium text-fortunesly-primary"
                  : "text-gray-400 hover:bg-gray-800 hover:translate-x-1"
              )}
              onClick={onClick}
            >
              <div className="mr-3 text-sm">{subLink.icon}</div>
              <span>{subLink.label}</span>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

interface DashboardLayoutProps {
  children: React.ReactNode;
}

const DashboardLayout = ({ children }: DashboardLayoutProps) => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkScreenSize = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkScreenSize();
    window.addEventListener('resize', checkScreenSize);

    return () => {
      window.removeEventListener('resize', checkScreenSize);
    };
  }, []);

  const isActive = (path: string) => {
    return location.pathname === path || location.pathname.startsWith(`${path}/`);
  };

  const closeMobileMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  const navLinks = [
    { 
      href: "/dashboard", 
      icon: <Home size={18} />, 
      label: "Dashboard"
    },
    { 
      href: "/dashboard/trade", 
      icon: <ArrowLeftRight size={18} />, 
      label: "Trade Now"
    },
    { 
      href: "/dashboard/wallet", 
      icon: <Wallet size={18} />, 
      label: "Wallet",
      subMenuLinks: [
        { href: "/dashboard/wallet/deposit", icon: <Upload size={16} />, label: "Deposit" },
        { href: "/dashboard/wallet/withdraw", icon: <Download size={16} />, label: "Withdraw" }
      ]
    },
    { 
      href: "/dashboard/orders", 
      icon: <ListOrdered size={18} />, 
      label: "Manage"
    },
    { 
      href: "/dashboard/settings", 
      icon: <Settings size={18} />, 
      label: "Settings"
    },
    {
      name: "Referrals",
      href: "/dashboard/referrals",
      icon: <Users size={18} />,
      current: location.pathname === "/dashboard/referrals",
    },
  ];

  const renderNavLinks = (isMobile: boolean = false) => (
    <nav className="space-y-1">
      {navLinks.map((link) => (
        <SidebarLink 
          key={link.href}
          href={link.href} 
          icon={link.icon} 
          isActive={isActive(link.href)}
          onClick={isMobile ? closeMobileMenu : undefined}
          subMenuLinks={link.subMenuLinks}
        >
          {link.label}
        </SidebarLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-900 flex overflow-hidden">
      {/* Desktop Sidebar */}
      <div className="hidden md:flex md:flex-col md:w-64 md:fixed md:inset-y-0 bg-gray-950 border-r border-gray-800 shadow-lg transition-all duration-300">
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className="flex items-center justify-center px-4 mb-6">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-fortunesly-primary">Fortunesly</span>
              <span className="text-xl font-bold text-gray-300">.shop</span>
            </Link>
          </div>
          <div className="px-4">
            <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-4 mb-6 shadow-md border border-gray-800">
              <div className="text-sm text-gray-400 mb-1">Welcome,</div>
              <div className="font-medium text-gray-200 truncate">{user?.username}</div>
            </div>
            {renderNavLinks()}
          </div>
        </div>
        <div className="p-4 border-t border-gray-800">
          <Button
            variant="outline"
            className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-gray-800 border-gray-700 transition-all duration-200"
            onClick={logout}
          >
            <LogOut className="mr-2 h-4 w-4" />
            Log out
          </Button>
        </div>
      </div>

      {/* Main content */}
      <div className="md:pl-64 flex flex-col flex-1 w-full">
        {/* Mobile header */}
        <div className="sticky top-0 z-10 flex-shrink-0 flex h-16 bg-gray-900 border-b border-gray-800 md:hidden shadow-md">
          <div className="flex-1 flex justify-between items-center px-4">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-fortunesly-primary">Fortunesly</span>
              <span className="text-xl font-bold text-gray-300">.shop</span>
            </Link>

            {/* Mobile menu button */}
            <Sheet open={isOpen} onOpenChange={setIsOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-gray-300 hover:bg-gray-800">
                  <Menu className="h-6 w-6" />
                  <span className="sr-only">Open menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-[85%] max-w-[300px] p-0 border-r-0 bg-gray-950 border-gray-800">
                <div className="flex flex-col h-full">
                  <div className="border-b border-gray-800 p-4">
                    <div className="flex items-center justify-between mb-6">
                      <Link to="/" className="flex items-center" onClick={closeMobileMenu}>
                        <span className="text-xl font-bold text-fortunesly-primary">Fortunesly</span>
                        <span className="text-xl font-bold text-gray-300">.shop</span>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={closeMobileMenu} className="hover:bg-gray-800 text-gray-300">
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="bg-gradient-to-r from-gray-900 to-gray-800 rounded-lg p-4 mb-4 shadow-md border border-gray-800">
                      <div className="text-sm text-gray-400 mb-1">Welcome,</div>
                      <div className="font-medium text-gray-200 truncate">{user?.username}</div>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                    {renderNavLinks(true)}
                  </div>

                  <div className="p-4 border-t border-gray-800">
                    <Button
                      variant="outline"
                      className="w-full justify-start text-red-400 hover:text-red-300 hover:bg-gray-800 border-gray-700 transition-all duration-200"
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

        {/* Mobile Bottom Navigation for Quick Access */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 bg-gray-950 border-t border-gray-800 shadow-lg z-10">
          <div className="flex justify-around items-center h-16">
            <Link 
              to="/dashboard" 
              className={cn(
                "flex flex-col items-center justify-center text-xs font-medium flex-1 h-full",
                isActive("/dashboard") ? "text-fortunesly-primary" : "text-gray-400"
              )}
            >
              <Home size={20} className={isActive("/dashboard") ? "text-fortunesly-primary" : "text-gray-400"} />
              <span className="mt-1">Dashboard</span>
            </Link>

            <Link 
              to="/dashboard/trade" 
              className={cn(
                "flex flex-col items-center justify-center text-xs font-medium flex-1 h-full",
                isActive("/dashboard/trade") ? "text-fortunesly-primary" : "text-gray-400"
              )}
            >
              <ArrowLeftRight size={20} className={isActive("/dashboard/trade") ? "text-fortunesly-primary" : "text-gray-400"} />
              <span className="mt-1">Trade</span>
            </Link>

            <Link 
              to="/dashboard/wallet" 
              className={cn(
                "flex flex-col items-center justify-center text-xs font-medium flex-1 h-full",
                isActive("/dashboard/wallet") ? "text-fortunesly-primary" : "text-gray-400"
              )}
            >
              <Wallet size={20} className={isActive("/dashboard/wallet") ? "text-fortunesly-primary" : "text-gray-400"} />
              <span className="mt-1">Wallet</span>
            </Link>

            <Link 
              to="/dashboard/orders" 
              className={cn(
                "flex flex-col items-center justify-center text-xs font-medium flex-1 h-full",
                isActive("/dashboard/orders") ? "text-fortunesly-primary" : "text-gray-400"
              )}
            >
              <ListOrdered size={20} className={isActive("/dashboard/orders") ? "text-fortunesly-primary" : "text-gray-400"} />
              <span className="mt-1">Manage</span>
            </Link>
          </div>
        </div>

        {/* Page content */}
        <main className="flex-1 pb-16 md:pb-0 bg-gray-900">
          <div className="py-4 sm:py-6">
            <div className="max-w-7xl mx-auto px-3 sm:px-4 md:px-6">
              <div className="w-full overflow-x-hidden">
                {children}
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
};

export default DashboardLayout;
