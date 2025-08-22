import { createClient } from '@supabase/supabase-js';
import type { Database } from '../types/database';

let supabase: ReturnType<typeof createClient<Database>>;
let isUsingMockClient: boolean;

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

// Validate Supabase configuration
if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file');
  // Use placeholder values to prevent app crash
  const placeholderUrl = 'https://placeholder.supabase.co';
  const placeholderKey = 'placeholder-key';
  
  supabase = createClient(placeholderUrl, placeholderKey);
  isUsingMockClient = true;
} else if (supabaseUrl === 'YOUR_SUPABASE_URL' || supabaseAnonKey === 'YOUR_SUPABASE_ANON_KEY') {
  console.warn('Please replace placeholder values in .env file with your actual Supabase project credentials');
  // Use placeholder values to prevent app crash
  const placeholderUrl = 'https://placeholder.supabase.co';
  const placeholderKey = 'placeholder-key';
  
  supabase = createClient(placeholderUrl, placeholderKey);
  isUsingMockClient = true;
} else {
  // Create Supabase client with real credentials
  supabase = createClient<Database>(supabaseUrl, supabaseAnonKey, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: false,
      flowType: 'implicit'
    },
    db: {
      schema: 'public'
    },
    global: {
      headers: {
        'X-Client-Info': 'recruitment-system@1.0.0',
      }
    },
    realtime: {
      params: {
        eventsPerSecond: 10
      }
    }
  });
  
  isUsingMockClient = false;
}

export { supabase, isUsingMockClient };