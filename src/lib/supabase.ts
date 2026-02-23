import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// We only initialize if we have the required keys to avoid throwing "supabaseUrl is required"
export const supabase = (supabaseUrl && supabaseAnonKey) 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

if (!supabase) {
  console.warn('Supabase client-side variables (VITE_SUPABASE_URL, VITE_SUPABASE_ANON_KEY) are missing. Google Login will be disabled.');
}
