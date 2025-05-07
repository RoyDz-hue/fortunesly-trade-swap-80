
import React, { createContext, useContext, useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { User } from '@/types';

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (username: string, email: string, password: string, referralCode?: string) => Promise<void>;
  logout: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  isAuthenticated: false,
  isAdmin: false,
  isLoading: true,
  login: async () => {},
  register: async () => {},
  logout: async () => {},
});

export const useAuth = () => useContext(AuthContext);

const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for existing session
    const checkUser = async () => {
      try {
        console.log("Checking for existing session...");
        const { data, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error("Session error:", error);
          setIsLoading(false);
          return;
        }
        
        if (data.session) {
          console.log("Session found:", data.session.user.email);
          const { data: userData, error: userError } = await supabase
            .from('users')
            .select('*')
            .eq('id', data.session.user.id)
            .single();

          if (userError) {
            console.error("User data error:", userError);
            setIsLoading(false);
            return;
          }

          if (userData) {
            setUser({
              id: userData.id,
              username: userData.username,
              email: userData.email,
              role: userData.role || 'user',
              status: userData.status || 'active',
              referralCode: userData.referral_code,
              referralBalance: userData.referral_balance || 0,
              referralCount: userData.referral_count || 0,
            });
          }
        } else {
          console.log("No active session found");
        }
      } catch (error) {
        console.error("Auth check error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkUser();
    
    // Subscribe to auth changes
    const { data: authListener } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("Auth state changed:", event, session);
        if (session) {
          // Fetch user data from users table
          const { data: userData, error } = await supabase
            .from('users')
            .select('*')
            .eq('id', session.user.id)
            .single();

          if (error) {
            console.error("User data fetch error:", error);
            return;
          }

          if (userData) {
            setUser({
              id: userData.id,
              username: userData.username,
              email: userData.email,
              role: userData.role || 'user',
              status: userData.status || 'active',
              referralCode: userData.referral_code,
              referralBalance: userData.referral_balance || 0,
              referralCount: userData.referral_count || 0,
            });
          }
        } else {
          setUser(null);
        }
      }
    );

    return () => {
      // Clean up subscription when component unmounts
      if (authListener && authListener.subscription) {
        authListener.subscription.unsubscribe();
      }
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      console.log("Attempting login for:", email);
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });
      
      if (error) {
        console.error("Login error:", error);
        throw new Error(error.message);
      }
      
      console.log("Login successful:", data);
      // Auth state listener will update the user state
    } catch (error) {
      console.error("Login catch error:", error);
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Failed to login');
    }
  };

  const register = async (username: string, email: string, password: string, referralCode?: string) => {
    try {
      // Handle sign up with Supabase Auth
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

      if (error) {
        throw new Error(error.message);
      }

      // Now create a record in the users table
      if (data.user) {
        const { error: profileError } = await supabase.from('users').insert([
          {
            id: data.user.id,
            username,
            email,
            role: email === 'cyntoremix@gmail.com' ? 'admin' : 'user',
            referral_code: `TRAD${Math.floor(10 + Math.random() * 90)}`, // Generate a random code like TRAD##
            referred_by: referralCode ? await getReferrerId(referralCode) : null,
          },
        ]);

        if (profileError) {
          throw new Error(profileError.message);
        }

        // If there's a referral code, process the referral
        if (referralCode) {
          await processReferral(data.user.id, referralCode);
        }
      }
    } catch (error) {
      if (error instanceof Error) {
        throw new Error(error.message);
      }
      throw new Error('Failed to register');
    }
  };

  const getReferrerId = async (referralCode: string) => {
    // Get the user ID associated with this referral code
    const { data, error } = await supabase
      .from('users')
      .select('id')
      .eq('referral_code', referralCode)
      .single();
      
    if (error || !data) {
      return null;
    }
    
    return data.id;
  };

  const processReferral = async (newUserId: string, referralCode: string) => {
    // Get the referrer's user ID
    const { data: referrer, error: referrerError } = await supabase
      .from('users')
      .select('id')
      .eq('referral_code', referralCode)
      .single();
      
    if (referrerError || !referrer) {
      console.error("Referrer not found:", referrerError);
      return;
    }
    
    // Get the current referral settings
    const { data: settings, error: settingsError } = await supabase
      .from('referral_settings')
      .select('*')
      .order('created_at', { ascending: false })
      .limit(1)
      .single();
      
    if (settingsError || !settings) {
      console.error("Referral settings not found:", settingsError);
      return;
    }
    
    // Update referrer's referral count and balance
    const { error: updateError } = await supabase
      .from('users')
      .update({ 
        referral_count: supabase.rpc('increment', { row_id: referrer.id, table_name: 'users', column_name: 'referral_count' }),
        referral_balance: supabase.rpc('add', { 
          row_id: referrer.id, 
          table_name: 'users', 
          column_name: 'referral_balance', 
          amount: settings.coins_per_referral 
        })
      })
      .eq('id', referrer.id);
      
    if (updateError) {
      console.error("Failed to update referrer:", updateError);
      return;
    }
    
    // Add a referral transaction record
    const { error: transactionError } = await supabase
      .from('referral_transactions')
      .insert({
        user_id: referrer.id,
        transaction_type: 'referral_reward',
        amount: settings.coins_per_referral,
        reason: 'Direct referral reward for new user',
        status: 'completed'
      });
      
    if (transactionError) {
      console.error("Failed to create referral transaction:", transactionError);
    }
    
    // Process level 2 referral if applicable
    const { data: level1Referrer, error: level1Error } = await supabase
      .from('users')
      .select('referred_by')
      .eq('id', referrer.id)
      .single();
      
    if (!level1Error && level1Referrer && level1Referrer.referred_by) {
      const level2Amount = settings.coins_per_referral * (settings.level2_rate_percent / 100);
      
      // Update level 2 referrer's balance
      const { error: level2UpdateError } = await supabase
        .from('users')
        .update({ 
          referral_balance: supabase.rpc('add', { 
            row_id: level1Referrer.referred_by, 
            table_name: 'users', 
            column_name: 'referral_balance', 
            amount: level2Amount 
          })
        })
        .eq('id', level1Referrer.referred_by);
        
      if (level2UpdateError) {
        console.error("Failed to update level 2 referrer:", level2UpdateError);
        return;
      }
      
      // Add a level 2 referral transaction record
      const { error: level2TransactionError } = await supabase
        .from('referral_transactions')
        .insert({
          user_id: level1Referrer.referred_by,
          transaction_type: 'referral_reward_l2',
          amount: level2Amount,
          reason: 'Indirect referral reward (level 2)',
          status: 'completed'
        });
        
      if (level2TransactionError) {
        console.error("Failed to create level 2 referral transaction:", level2TransactionError);
      }
    }
  };

  const logout = async () => {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) {
        console.error("Logout error:", error);
        throw new Error(error.message);
      }
      setUser(null);
    } catch (error) {
      console.error("Logout error:", error);
      throw error;
    }
  };

  const isAuthenticated = !!user;
  const isAdmin = user?.role === 'admin';

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated,
        isAdmin,
        isLoading,
        login,
        register,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthProvider;
