
import { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '@/context/AuthContext';
import { Button } from '../ui/button';
import ProfileDropdown from './ProfileDropdown';

const Navbar = () => {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { isAuthenticated, isAdmin } = useAuth();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 10);
    };

    window.addEventListener('scroll', handleScroll);
    return () => {
      window.removeEventListener('scroll', handleScroll);
    };
  }, []);

  return (
    <nav
      className={`fixed w-full z-10 transition-all duration-300 ${
        isScrolled ? 'bg-gray-900 shadow-md py-2' : 'bg-transparent py-4'
      }`}
    >
      <div className="container mx-auto px-4 flex justify-between items-center">
        {/* Logo */}
        <Link to="/" className="flex items-center">
          <span className="text-xl sm:text-2xl font-bold text-fortunesly-primary">Fortunesly</span>
          <span className="text-xl sm:text-2xl font-bold text-fortunesly-secondary">.shop</span>
        </Link>

        {/* Desktop Navigation */}
        <div className="hidden md:flex items-center space-x-6">
          <Link to="/market" className="text-gray-300 hover:text-white transition-colors">
            Markets
          </Link>
          <Link to="/trade" className="text-gray-300 hover:text-white transition-colors">
            Trade
          </Link>
          <Link to="/orders" className="text-gray-300 hover:text-white transition-colors">
            Orders
          </Link>

          {isAuthenticated ? (
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                className="border-fortunesly-primary text-fortunesly-primary hover:bg-fortunesly-primary hover:text-white"
                asChild
              >
                <Link to={isAdmin ? '/admin' : '/dashboard'}>
                  {isAdmin ? 'Admin Panel' : 'Dashboard'}
                </Link>
              </Button>
              <ProfileDropdown />
            </div>
          ) : (
            <div className="flex items-center space-x-4">
              <Button
                variant="ghost"
                className="text-gray-200 hover:text-white hover:bg-gray-800"
                asChild
              >
                <Link to="/login">Login</Link>
              </Button>
              <Button
                className="bg-fortunesly-primary hover:bg-fortunesly-primary/90 text-white"
                asChild
              >
                <Link to="/register">Register</Link>
              </Button>
            </div>
          )}
        </div>

        {/* Mobile menu button */}
        <button
          className="md:hidden text-gray-300 hover:text-white"
          onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
        >
          <svg
            className="w-6 h-6"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            {isMobileMenuOpen ? (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            ) : (
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M4 6h16M4 12h16M4 18h16"
              />
            )}
          </svg>
        </button>
      </div>

      {/* Mobile menu */}
      {isMobileMenuOpen && (
        <div className="md:hidden bg-gray-900 shadow-lg">
          <div className="px-4 pt-2 pb-4 space-y-3">
            <Link
              to="/market"
              className="block text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Markets
            </Link>
            <Link
              to="/trade"
              className="block text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Trade
            </Link>
            <Link
              to="/orders"
              className="block text-gray-300 hover:text-white transition-colors py-2"
              onClick={() => setIsMobileMenuOpen(false)}
            >
              Orders
            </Link>

            {isAuthenticated ? (
              <>
                <Link
                  to={isAdmin ? '/admin' : '/dashboard'}
                  className="block text-fortunesly-primary hover:text-fortunesly-accent transition-colors py-2"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {isAdmin ? 'Admin Panel' : 'Dashboard'}
                </Link>
                <div className="flex items-center">
                  <ProfileDropdown />
                </div>
              </>
            ) : (
              <div className="flex flex-col space-y-2 pt-2">
                <Button
                  variant="ghost"
                  className="text-gray-200 hover:text-white hover:bg-gray-800 justify-start"
                  asChild
                >
                  <Link to="/login" onClick={() => setIsMobileMenuOpen(false)}>
                    Login
                  </Link>
                </Button>
                <Button
                  className="bg-fortunesly-primary hover:bg-fortunesly-primary/90 text-white"
                  asChild
                >
                  <Link to="/register" onClick={() => setIsMobileMenuOpen(false)}>
                    Register
                  </Link>
                </Button>
              </div>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
