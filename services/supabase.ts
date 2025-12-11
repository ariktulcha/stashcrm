import { createClient } from '@supabase/supabase-js';

// Project reference: qjkofnsmtqgmqqnzmbxr
const supabaseUrl = `https://qjkofnsmtqgmqqnzmbxr.supabase.co`;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseAnonKey) {
  console.warn('VITE_SUPABASE_ANON_KEY לא מוגדר. אנא הוסף את המפתח בקובץ .env.local');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey);


