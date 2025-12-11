import { createClient } from '@supabase/supabase-js';

// Project reference: qjkofnsmtqgmqqnzmbxr
const supabaseUrl = `https://qjkofnsmtqgmqqnzmbxr.supabase.co`;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.error('❌ VITE_SUPABASE_ANON_KEY לא מוגדר!');
  console.error('אנא הוסף את המפתח בקובץ .env.local');
  console.error('ראה FIX_ENV.md להוראות');
}

// Create client even if key is missing (will fail on actual requests)
export const supabase = createClient(supabaseUrl, supabaseAnonKey || 'dummy-key-for-initialization');


