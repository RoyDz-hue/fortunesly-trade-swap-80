import { useState, useMemo } from "react";
import { Link, useLocation } from "react-router-dom";
import { Users, Database, CreditCard, BarChart3, Settings, LogOut, Menu, X, Home, Share2 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/context/AuthContext";
import { Button } from "@/components/ui/button";
import { 
  Sheet, 
  SheetContent, 
  SheetTrigger 
} from "@/components/ui/sheet";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

interface NavItem {
  path: string;
  label: string;
  icon: React.ReactNode;
}

interface SidebarLinkProps {
  href: string;
  icon: React.ReactNode;
  children: React.ReactNode;
  isActive: boolean;
  onClick?: () => void;
  showTooltip?: boolean;
}

const SidebarLink = ({ href, icon, children, isActive, onClick, showTooltip = false }: SidebarLinkProps) => {
  const linkContent = (
    <Link
      to={href}
      className={cn(
        "flex items-center py-3 px-4 rounded-lg text-sm font-medium transition-colors",
        isActive
          ? "bg-fortunesly-primary text-white shadow-md"
          : "text-gray-600 hover:bg-gray-100 hover:text-fortunesly-primary"
      )}
      onClick={onClick}
    >
      <div className="mr-3">{icon}</div>
      <span className="whitespace-nowrap">{children}</span>
    </Link>
  );

  if (showTooltip) {
    return (
      <TooltipProvider>
        <Tooltip delayDuration={300}>
          <TooltipTrigger asChild>{linkContent}</TooltipTrigger>
          <TooltipContent side="right">{children}</TooltipContent>
        </Tooltip>
      </TooltipProvider>
    );
  }

  return linkContent;
};

interface AdminLayoutProps {
  children: React.ReactNode;
}

const AdminLayout: React.FC<AdminLayoutProps> = ({ children }) => {
  const location = useLocation();
  const { logout, user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [collapsed, setCollapsed] = useState(false);

  const isActive = (path: string) => {
    if (path === '/admin' && location.pathname === '/admin') {
      return true;
    }
    if (path !== '/admin' && location.pathname.startsWith(path)) {
      return true;
    }
    return false;
  };

  const navItems: NavItem[] = useMemo(() => [
    { path: "/admin", label: "Dashboard", icon: <BarChart3 size={20} /> },
    { path: "/admin/users", label: "Manage Users", icon: <Users size={20} /> },
    { path: "/admin/coins", label: "Manage Coins", icon: <Database size={20} /> },
    { path: "/admin/transactions", label: "Transactions", icon: <CreditCard size={20} /> },
    { path: "/admin/settings", label: "Settings", icon: <Settings size={20} /> },
    {
      name: "Referrals",
      href: "/admin/referrals",
      icon: <Share2 size={20} />,
      current: location.pathname === "/admin/referrals",
    }
  ], []);

  const closeMobileMenu = () => {
    setIsOpen(false);
  };

  const handleLogout = () => {
    logout();
    closeMobileMenu();
  };

  const toggleCollapse = () => {
    setCollapsed(!collapsed);
  };

  const getUserInitials = () => {
    if (!user?.username) return 'U';
    return user.username.charAt(0).toUpperCase();
  };

  // Mobile bottom navigation component
  const MobileBottomNav = () => (
    <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 py-2 px-4 md:hidden">
      <div className="flex justify-between items-center">
        {navItems.map((item) => (
          <Link
            key={item.path}
            to={item.path}
            className={cn(
              "flex flex-col items-center py-1 px-2 rounded transition-colors",
              isActive(item.path)
                ? "text-fortunesly-primary"
                : "text-gray-500 hover:text-fortunesly-primary"
            )}
          >
            <div>{item.icon}</div>
            <span className="text-xs mt-1 whitespace-nowrap">{item.label}</span>
          </Link>
        ))}
      </div>
    </div>
  );

  const renderNavLinks = (isMobile: boolean = false) => (
    <nav className="space-y-2">
      {navItems.map((item) => (
        <SidebarLink 
          key={item.path}
          href={item.path} 
          icon={item.icon} 
          isActive={isActive(item.path)}
          onClick={isMobile ? closeMobileMenu : undefined}
          showTooltip={collapsed && !isMobile}
        >
          {item.label}
        </SidebarLink>
      ))}
    </nav>
  );

  return (
    <div className="min-h-screen bg-gray-50 flex">
      {/* Desktop Sidebar */}
      <div 
        className={cn(
          "hidden md:flex md:flex-col md:fixed md:inset-y-0 bg-white border-r border-gray-200 transition-all duration-300 ease-in-out z-30",
          collapsed ? "md:w-20" : "md:w-64"
        )}
      >
        <div className="flex-1 flex flex-col pt-5 pb-4 overflow-y-auto">
          <div className={cn(
            "flex items-center px-4",
            collapsed ? "justify-center" : "justify-between"
          )}>
            {!collapsed && (
              <Link to="/" className="flex items-center">
                <span className="text-xl font-bold text-fortunesly-primary">Fortunesly</span>
                <span className="text-xl font-bold text-fortunesly-secondary">.shop</span>
                <span className="ml-2 text-xs font-bold bg-fortunesly-secondary text-white px-2 py-0.5 rounded">ADMIN</span>
              </Link>
            )}
            {collapsed && (
              <TooltipProvider>
                <Tooltip delayDuration={300}>
                  <TooltipTrigger asChild>
                    <Link to="/" className="flex items-center">
                      <span className="text-2xl font-bold text-fortunesly-primary">F</span>
                    </Link>
                  </TooltipTrigger>
                  <TooltipContent side="right">Fortunesly.shop</TooltipContent>
                </Tooltip>
              </TooltipProvider>
            )}
            <Button 
              variant="ghost" 
              size="sm" 
              className={cn("p-1", collapsed && "mt-2")}
              onClick={toggleCollapse}
            >
              <Menu size={16} className="transform rotate-90" />
            </Button>
          </div>
          <div className={cn("mt-8", collapsed ? "px-2" : "px-4")}>
            {!collapsed && (
              <div className="bg-gray-50 rounded-lg p-4 mb-6 flex items-center">
                <Avatar className="h-10 w-10 mr-3">
                  <AvatarImage src={user?.avatarUrl} alt={user?.username} />
                  <AvatarFallback>{getUserInitials()}</AvatarFallback>
                </Avatar>
                <div>
                  <div className="text-sm text-gray-500 mb-1">Admin Portal</div>
                  <div className="font-medium text-gray-900">{user?.username}</div>
                </div>
              </div>
            )}
            {collapsed && (
              <div className="flex justify-center mb-6">
                <TooltipProvider>
                  <Tooltip delayDuration={300}>
                    <TooltipTrigger asChild>
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={user?.avatarUrl} alt={user?.username} />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                    </TooltipTrigger>
                    <TooltipContent side="right">{user?.username}</TooltipContent>
                  </Tooltip>
                </TooltipProvider>
              </div>
            )}
            {renderNavLinks()}
          </div>
        </div>
        <div className={cn("p-4 border-t border-gray-200", collapsed && "px-2")}>
          <TooltipProvider>
            <Tooltip delayDuration={300}>
              <TooltipTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-red-500 hover:text-red-700 hover:bg-red-50",
                    collapsed && "justify-center px-2"
                  )}
                  onClick={logout}
                >
                  <LogOut className={cn("h-4 w-4", collapsed ? "" : "mr-2")} />
                  {!collapsed && "Log out"}
                </Button>
              </TooltipTrigger>
              {collapsed && <TooltipContent side="right">Log out</TooltipContent>}
            </Tooltip>
          </TooltipProvider>
        </div>
      </div>

      {/* Main content */}
      <div className={cn(
        "flex flex-col flex-1 transition-all duration-300 ease-in-out",
        collapsed ? "md:pl-20" : "md:pl-64"
      )}>
        {/* Mobile header */}
        <div className="sticky top-0 z-20 flex-shrink-0 flex bg-white border-b border-gray-200 md:hidden">
          <div className="flex-1 flex justify-between items-center px-4 py-3">
            <Link to="/" className="flex items-center">
              <span className="text-xl font-bold text-fortunesly-primary">Fortunesly</span>
              <span className="text-xl font-bold text-fortunesly-secondary">.shop</span>
              <span className="ml-2 text-xs font-bold bg-fortunesly-secondary text-white px-2 py-0.5 rounded">ADMIN</span>
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
                        <span className="ml-2 text-xs font-bold bg-fortunesly-secondary text-white px-2 py-0.5 rounded">ADMIN</span>
                      </Link>
                      <Button variant="ghost" size="icon" onClick={closeMobileMenu}>
                        <X className="h-5 w-5" />
                      </Button>
                    </div>

                    <div className="bg-gray-50 rounded-lg p-4 mb-4 flex items-center">
                      <Avatar className="h-10 w-10 mr-3">
                        <AvatarImage src={user?.avatarUrl} alt={user?.username} />
                        <AvatarFallback>{getUserInitials()}</AvatarFallback>
                      </Avatar>
                      <div>
                        <div className="text-sm text-gray-500 mb-1">Admin Portal</div>
                        <div className="font-medium text-gray-900">{user?.username}</div>
                      </div>
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

        <main className="flex-1 pb-24 md:pb-8">
          <div className="py-6">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 md:px-8">
              {children}
            </div>
          </div>
        </main>
        
        {/* Mobile bottom navigation */}
        <MobileBottomNav />
      </div>
    </div>
  );
};

export default AdminLayout;
