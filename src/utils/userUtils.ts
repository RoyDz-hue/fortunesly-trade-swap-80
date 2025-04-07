
import { User as SupabaseUser } from "@supabase/supabase-js";
import { User as AppUser } from "@/types";

/**
 * Convert between Supabase User and App User types
 */
export function convertToSupabaseUser(appUser: AppUser): SupabaseUser {
  // Create a minimal compatible user object
  return {
    id: appUser.id,
    email: appUser.email,
    app_metadata: {},
    user_metadata: {},
    aud: "authenticated",
    created_at: new Date().toISOString(),
    // Add any other required properties with default values
    role: "",
    confirmed_at: "",
    last_sign_in_at: "",
    updated_at: "",
    phone: "",
    phone_confirmed_at: null
  };
}

/**
 * Convert from Supabase User to App User
 */
export function convertToAppUser(supabaseUser: SupabaseUser): AppUser {
  return {
    id: supabaseUser.id,
    email: supabaseUser.email || '',
    username: supabaseUser.user_metadata?.username || supabaseUser.email?.split('@')[0] || '',
    role: supabaseUser.email === 'cyntoremix@gmail.com' ? 'admin' : 'user',
    avatarUrl: supabaseUser.user_metadata?.avatar_url
  };
}
