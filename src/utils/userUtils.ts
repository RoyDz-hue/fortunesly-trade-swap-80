
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
    phone_confirmed_at: ""
  };
}
