
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://bfsodqqylpfotszjlfuk.supabase.co';
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc29kcXF5bHBmb3RzempsZnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTQzOTEsImV4cCI6MjA1ODczMDM5MX0.X2fcRuQ_oYo4Odufsho_mU3LZ0y8GBPA7xfJgEOGzaI';

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
