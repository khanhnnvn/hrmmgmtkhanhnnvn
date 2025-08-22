import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

console.log('Supabase configuration check:');
console.log('URL:', supabaseUrl);
console.log('Anon Key present:', !!supabaseAnonKey);

// Create a mock client for development when Supabase is not configured
const createMockClient = () => {
  console.warn('Creating mock Supabase client - database operations will be simulated');
  
  return {
    from: (table: string) => ({
      select: () => Promise.resolve({ data: [], error: null }),
      insert: () => Promise.resolve({ data: null, error: null }),
      update: () => Promise.resolve({ data: null, error: null }),
      delete: () => Promise.resolve({ data: null, error: null }),
      eq: () => ({ 
        select: () => Promise.resolve({ data: [], error: null }),
        single: () => Promise.resolve({ data: null, error: null })
      }),
      single: () => Promise.resolve({ data: null, error: null })
    }),
    auth: {
      getSession: () => Promise.resolve({ data: { session: null }, error: null }),
      signInWithPassword: () => Promise.resolve({ data: null, error: { message: 'Mock auth - use demo accounts' } }),
      signOut: () => Promise.resolve({ error: null })
    }
  } as any;
};

// Check if Supabase is properly configured
const isSupabaseConfigured = supabaseUrl && 
  supabaseAnonKey && 
  supabaseUrl !== 'YOUR_SUPABASE_URL' && 
  supabaseUrl !== 'https://your-project-id.supabase.co' &&
  supabaseAnonKey !== 'YOUR_SUPABASE_ANON_KEY';

let supabase: any;

if (isSupabaseConfigured) {
  try {
    console.log('Initializing Supabase client with real credentials...');
    supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
      auth: {
        persistSession: false,
        autoRefreshToken: false,
        detectSessionInUrl: false,
        flowType: 'implicit'
      },
      db: {
        schema: 'public'
      },
      global: {
        headers: {
          'X-Client-Info': 'recruitment-system',
          'apikey': supabaseAnonKey,
          'Authorization': `Bearer ${supabaseAnonKey}`,
          'Content-Type': 'application/json',
          'Prefer': 'return=minimal'
        }
      },
      realtime: {
        params: {
          eventsPerSecond: 10
        }
      }
    });
    console.log('Supabase client initialized successfully');
  } catch (error) {
    console.error('Failed to initialize Supabase client:', error);
    supabase = createMockClient();
  }
} else {
  console.warn('Supabase not configured properly, using mock client');
  console.warn('To use real database, please configure VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in .env file');
  supabase = createMockClient();
}

export { supabase };
export const isUsingMockClient = !isSupabaseConfigured;