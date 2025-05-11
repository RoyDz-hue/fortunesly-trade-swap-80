
import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Coins, User, BadgePercent, BadgeCheck } from 'lucide-react';

const ProfileDropdown = () => {
  const { user, logout, isAuthenticated } = useAuth();
  const navigate = useNavigate();
  const [isOpen, setIsOpen] = useState(false);

  const handleLogout = async () => {
    try {
      await logout();
      navigate('/');
    } catch (error) {
      console.error('Logout error:', error);
    }
  };

  if (!isAuthenticated) {
    return null;
  }

  const getInitials = () => {
    if (!user) return 'U';
    if (user.username) {
      return user.username.substring(0, 2).toUpperCase();
    }
    return user.email?.substring(0, 2).toUpperCase() || 'U';
  };

  return (
    <DropdownMenu open={isOpen} onOpenChange={setIsOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" className="relative h-10 w-10 rounded-full">
          <Avatar className="h-10 w-10 border border-gray-700">
            <AvatarFallback className="bg-gray-800 text-gray-200">
              {getInitials()}
            </AvatarFallback>
          </Avatar>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56" align="end">
        <DropdownMenuLabel>
          <div className="flex flex-col space-y-1">
            <p className="text-sm font-medium">{user?.username || 'User'}</p>
            <p className="text-xs text-muted-foreground truncate">
              {user?.email}
            </p>
          </div>
        </DropdownMenuLabel>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          {/* Referral information */}
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link to="/dashboard/referrals" className="flex w-full">
              <Coins className="mr-2 h-4 w-4" />
              <span>TRD Balance: {user?.referralBalance || 0}</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link to="/dashboard/referrals" className="flex w-full">
              <BadgePercent className="mr-2 h-4 w-4" />
              <span>Referral Code: {user?.referralCode || 'N/A'}</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link to="/dashboard/referrals" className="flex w-full">
              <BadgeCheck className="mr-2 h-4 w-4" />
              <span>Referrals: {user?.referralCount || 0}</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuGroup>
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link to="/dashboard" className="flex w-full">
              <User className="mr-2 h-4 w-4" />
              <span>Dashboard</span>
            </Link>
          </DropdownMenuItem>
          
          <DropdownMenuItem className="cursor-pointer" asChild>
            <Link to="/dashboard/settings" className="flex w-full">
              <User className="mr-2 h-4 w-4" />
              <span>Profile Settings</span>
            </Link>
          </DropdownMenuItem>
        </DropdownMenuGroup>
        
        <DropdownMenuSeparator />
        
        <DropdownMenuItem 
          onClick={handleLogout}
          className="cursor-pointer text-red-500 hover:text-red-600 hover:bg-red-500/10"
        >
          Logout
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export default ProfileDropdown;
