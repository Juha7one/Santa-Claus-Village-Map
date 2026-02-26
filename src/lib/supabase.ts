import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

export const hasSupabaseConfig = !!(supabaseUrl && supabaseAnonKey);

if (!hasSupabaseConfig) {
    console.warn('Supabase URL or Anon Key is missing. Check your .env file. Falling back to local data.');
}

// Initialize with dummy values to prevent crash, if variables are missing
export const supabase = createClient(
    supabaseUrl || 'https://xyz.supabase.co',
    supabaseAnonKey || 'dummy-key'
);
