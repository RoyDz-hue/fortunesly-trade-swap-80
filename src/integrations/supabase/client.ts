// This file is automatically generated. Do not edit it directly.
import { createClient } from '@supabase/supabase-js';
import type { Database } from './types';

const SUPABASE_URL = "https://bfsodqqylpfotszjlfuk.supabase.co";
const SUPABASE_PUBLISHABLE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJmc29kcXF5bHBmb3RzempsZnVrIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDMxNTQzOTEsImV4cCI6MjA1ODczMDM5MX0.X2fcRuQ_oYo4Odufsho_mU3LZ0y8GBPA7xfJgEOGzaI";

// Import the supabase client like this:
// import { supabase } from "@/integrations/supabase/client";

export const supabase = createClient<Database>(SUPABASE_URL, SUPABASE_PUBLISHABLE_KEY);