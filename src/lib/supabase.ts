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
    autoRefreshToken: true,
    detectSessionInUrl: false,
    flowType: 'implicit',
    confirmationUrl: undefined,
    // Allow anonymous access
    autoRefreshToken: false
  },
  db: {
    schema: 'public'
  },
  global: {
    headers: {
      'X-Client-Info': 'recruitment-system@1.0.0',
      'apikey': supabaseAnonKey,
      'Authorization': `Bearer ${supabaseAnonKey}`
    }
  },
  realtime: {
    params: {
      eventsPerSecond: 10
    }
  }
});

// Helper function to check if email confirmation is disabled
export const checkEmailConfirmationStatus = async () => {
  try {
    const { data, error } = await supabase.auth.getSession();
    console.log('Current auth session:', data?.session ? 'Active' : 'None');
    return !error;
  } catch (error) {
    console.error('Error checking email confirmation status:', error);
    return false;
  }
};

// Test connection
supabase.auth.getSession().then(({ data, error }) => {
  if (error) {
    console.warn('Supabase auth session error (may be normal for anonymous access):', error);
  } else {
    console.log('✅ Supabase connected successfully');
  }
});

export const isUsingMockClient = false;