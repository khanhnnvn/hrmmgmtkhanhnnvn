import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  throw new Error('Supabase configuration is missing');
}

if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.error('Please replace placeholder values in .env file with your actual Supabase project credentials');
  throw new Error('Please update Supabase configuration with real values');
}

// Create Supabase client
export const supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    autoRefreshToken: false,
    detectSessionInUrl: false,
    flowType: 'implicit'
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'recruitment-system@1.0.0'
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Test connection
console.log('✅ Supabase client initialized');

export const isUsingMockClient = false;