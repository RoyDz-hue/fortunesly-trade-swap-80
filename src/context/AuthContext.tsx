
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  
  useEffect(() => {
    // Check if user is logged in from localStorage
    const storedUser = localStorage.getItem('fortunesly_user');
    if (storedUser) {
      setUser(JSON.parse(storedUser));
      setIsAuthenticated(true);
    }
  }, []);

  const login = async (email: string, password: string) => {
    // Mock login function - in a real app, this would be an API call
    if (email === 'cyntoremix@gmail.com' && password === 'admin123') {
      const adminUser: User = {
        id: 'admin-1',
        username: 'admin',
        email: 'cyntoremix@gmail.com',
        role: 'admin',
      };
      setUser(adminUser);
      setIsAuthenticated(true);
      localStorage.setItem('fortunesly_user', JSON.stringify(adminUser));
      return;
    }
    
    if (email && password) {
      // Mock user login
      const mockUser: User = {
        id: 'user-' + Math.floor(Math.random() * 1000),
        username: email.split('@')[0],
        email,
        role: 'user',
      };
      setUser(mockUser);
      setIsAuthenticated(true);
      localStorage.setItem('fortunesly_user', JSON.stringify(mockUser));
    } else {
      throw new Error('Invalid email or password');
    }
  };

  const register = async (username: string, email: string, password: string) => {
    // Mock register function - in a real app, this would be an API call
    if (email === 'cyntoremix@gmail.com') {
      const adminUser: User = {
        id: 'admin-1',
        username,
        email,
        role: 'admin',
      };
      setUser(adminUser);
      setIsAuthenticated(true);
      localStorage.setItem('fortunesly_user', JSON.stringify(adminUser));
    } else {
      const newUser: User = {
        id: 'user-' + Math.floor(Math.random() * 1000),
        username,
        email,
        role: 'user',
      };
      setUser(newUser);
      setIsAuthenticated(true);
      localStorage.setItem('fortunesly_user', JSON.stringify(newUser));
    }
  };

  const logout = () => {
    setUser(null);
    setIsAuthenticated(false);
    localStorage.removeItem('fortunesly_user');
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
