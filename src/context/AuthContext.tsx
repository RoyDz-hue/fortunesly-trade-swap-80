
import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '@/types';
import { supabase } from '@/integrations/supabase/client';
import { toast } from 'sonner';
import { Session } from '@supabase/supabase-js';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => void;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
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
  const [session, setSession] = useState<Session | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  useEffect(() => {
    // Set up auth state listener first
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session?.user?.email);
        
        if (session && session.user) {
          setSession(session);
          
          // Get additional user data from public.users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('username, role, referral_code, referral_balance, referral_count')
            .eq('id', session.user.id)
            .single();
            
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            username: userData?.username || session.user.user_metadata.username || session.user.email?.split('@')[0] || '',
            role: session.user.email === 'cyntoremix@gmail.com' ? 'admin' : 'user',
            referralCode: userData?.referral_code,
            referralBalance: userData?.referral_balance,
            referralCount: userData?.referral_count
          });
          
          setIsAuthenticated(true);
        } else {
          setSession(null);
          setUser(null);
          setIsAuthenticated(false);
        }
        setIsLoading(false);
      }
    );

    // Check for existing session
    const initAuth = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        
        if (session && session.user) {
          setSession(session);
          
          // Get additional user data from public.users table
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('username, role, referral_code, referral_balance, referral_count')
            .eq('id', session.user.id)
            .single();
            
          setUser({
            id: session.user.id,
            email: session.user.email || '',
            username: userData?.username || session.user.user_metadata.username || session.user.email?.split('@')[0] || '',
            role: session.user.email === 'cyntoremix@gmail.com' ? 'admin' : 'user',
            referralCode: userData?.referral_code,
            referralBalance: userData?.referral_balance,
            referralCount: userData?.referral_count
          });
          
          setIsAuthenticated(true);
        }
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setIsLoading(false);
      }
    };

    initAuth();

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      setIsLoading(true);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) throw error;
      
      toast.success("Login successful!");
      return;
    } catch (error: any) {
      console.error('Login error:', error);
      toast.error(error.message || 'Failed to login');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const register = async (username: string, email: string, password: string, referralCode?: string) => {
    try {
      setIsLoading(true);
      
      // Validate referral code if provided
      if (referralCode) {
        const { data: referrerData, error: referrerError } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', referralCode)
          .single();
        
        if (referrerError || !referrerData) {
          throw new Error('Invalid referral code');
        }
      }
      
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            username,
            referral_code: referralCode,
          },
        },
      });

      if (error) throw error;
      
      // If a referral code was provided, store the relationship
      if (referralCode && data.user) {
        const { data: referrerData } = await supabase
          .from('users')
          .select('id')
          .eq('referral_code', referralCode)
          .single();
          
        if (referrerData) {
          // Update the user to link to their referrer
          await supabase
            .from('users')
            .update({ referred_by: referrerData.id })
            .eq('id', data.user.id);
            
          // Process the referral in the database
          await supabase.rpc('process_referral', {
            user_id: data.user.id,
            referrer_id: referrerData.id
          });
        }
      }
      
      toast.success('Registration successful! Please check your email for verification.');
      return;
    } catch (error: any) {
      console.error('Registration error:', error);
      toast.error(error.message || 'Failed to register');
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  const logout = async () => {
    try {
      await supabase.auth.signOut();
      // The auth state listener will handle updating the state
    } catch (error) {
      console.error('Logout error:', error);
      toast.error('Failed to logout');
    }
  };

  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        session,
        login,
        register,
        logout,
        isAuthenticated,
        isAdmin,
        isLoading,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
