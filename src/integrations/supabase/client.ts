// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://dlfgfypzmpirbpfzmzsp.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRsZmdmeXB6bXBpcmJwZnptenNwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNDQ2OTYsImV4cCI6MjA1ODcyMDY5Nn0.-dr4M-bz0KvQYMGHL1qE_eBUHI-SCU7kXjQnuoTYHI8";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);