
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/context/AuthContext";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { User, LogOut } from "lucide-react";

const Navbar = () => {
  const { isAuthenticated, logout, user, isAdmin } = useAuth();

  return (
    <nav className="bg-gray-900 border-b border-gray-800 fixed w-full z-30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="flex items-center">
              <span className="text-2xl font-bold text-fortunesly-primary">Fortunesly</span>
              <span className="text-2xl font-bold text-fortunesly-secondary">.shop</span>
            </Link>
          </div>
          <div className="flex items-center">
            {isAuthenticated ? (
              <div className="flex items-center space-x-4">
                <Button asChild variant="ghost" className="text-white hover:text-gray-300">
                  <Link to={isAdmin ? "/admin" : "/dashboard"}>
                    Dashboard
                  </Link>
                </Button>
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" className="flex items-center gap-2 bg-gray-800 text-white border-gray-700 hover:bg-gray-700">
                      <User className="h-4 w-4" />
                      <span>{user?.username}</span>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="bg-gray-800 border-gray-700">
                    <DropdownMenuItem onClick={logout} className="flex items-center gap-2 text-red-500 focus:bg-gray-700 focus:text-red-500">
                      <LogOut className="h-4 w-4" />
                      <span>Logout</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            ) : (
              <div className="flex items-center space-x-4">
                <Button asChild variant="outline" className="border-gray-700 text-white hover:bg-gray-800">
                  <Link to="/login">Login</Link>
                </Button>
                <Button asChild className="bg-fortunesly-primary text-fortunesly-dark hover:bg-fortunesly-accent">
                  <Link to="/register">Register</Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navbar;
