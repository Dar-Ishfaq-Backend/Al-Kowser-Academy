import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL?.trim();
const supabaseKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();

export const missingSupabaseEnv = [
  !supabaseUrl && 'VITE_SUPABASE_URL',
  !supabaseKey && 'VITE_SUPABASE_ANON_KEY',
].filter(Boolean);

export const supabaseConfigError = missingSupabaseEnv.length
  ? `Missing Supabase environment variables: ${missingSupabaseEnv.join(', ')}. Copy .env.example to .env and fill in the real values.`
  : null;

export const supabase = supabaseConfigError
  ? null
  : createClient(supabaseUrl, supabaseKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true,
      },
    });
