
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://your-supabase-project-url.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'your-anon-key';

export const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  }
});

// Helper function for demo/development purposes
export const setupDemoEnvironment = async () => {
  if (process.env.NODE_ENV !== 'production') {
    console.log('Setting up demo environment...');
    
    // You can add mock data setup here if needed
    
    console.log('Demo environment setup complete.');
  }
};
