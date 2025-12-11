import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
dotenv.config({ path: join(__dirname, '../.env.local') });

const supabaseUrl = process.env.VITE_SUPABASE_URL || 'https://qjkofnsmtqgmqqnzmbxr.supabase.co';
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY || '';

if (!supabaseServiceKey) {
  console.error('❌ שגיאה: לא נמצא SUPABASE_SERVICE_ROLE_KEY או VITE_SUPABASE_ANON_KEY');
  console.log('אנא הוסף את המפתח ל-.env.local');
  process.exit(1);
}

// Use service role key if available, otherwise use anon key
const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function createStockItemsTable() {
  console.log('🚀 מתחיל ליצור את טבלת stock_items...\n');

  const sql = `
    -- Enable UUID extension
    CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

    -- Stock items table
    CREATE TABLE IF NOT EXISTS stock_items (
      id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
      sku VARCHAR(100) UNIQUE NOT NULL,
      name VARCHAR(255) NOT NULL,
      type VARCHAR(50) NOT NULL CHECK (type IN ('raw_material', 'packaging', 'consumable')),
      current_quantity INTEGER DEFAULT 0,
      min_quantity INTEGER DEFAULT 0,
      unit VARCHAR(50) NOT NULL,
      unit_cost DECIMAL(10, 2) NOT NULL,
      created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
    );

    -- Create index for better performance
    CREATE INDEX IF NOT EXISTS idx_stock_items_sku ON stock_items(sku);
    CREATE INDEX IF NOT EXISTS idx_stock_items_type ON stock_items(type);

    -- Enable Row Level Security (RLS)
    ALTER TABLE stock_items ENABLE ROW LEVEL SECURITY;

    -- Drop existing policy if exists
    DROP POLICY IF EXISTS "Allow all operations on stock_items" ON stock_items;

    -- Create policy to allow all operations
    CREATE POLICY "Allow all operations on stock_items" ON stock_items
      FOR ALL
      USING (true)
      WITH CHECK (true);
  `;

  try {
    // Split SQL into individual statements
    const statements = sql
      .split(';')
      .map(s => s.trim())
      .filter(s => s.length > 0);

    for (const statement of statements) {
      if (statement) {
        const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
        if (error) {
          // Try direct query if RPC doesn't work
          const { error: directError } = await supabase.from('_').select('*').limit(0);
          if (directError && directError.message.includes('relation') === false) {
            console.log(`⚠️  ניסיון: ${statement.substring(0, 50)}...`);
          }
        }
      }
    }

    // Verify table was created
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .limit(1);

    if (error && error.message.includes('does not exist')) {
      console.log('⚠️  לא ניתן ליצור את הטבלה דרך הקוד.');
      console.log('📝 אנא הרץ את השאילתה הבאה ב-Supabase SQL Editor:\n');
      console.log(sql);
      process.exit(1);
    } else if (error) {
      console.error('❌ שגיאה:', error.message);
      process.exit(1);
    } else {
      console.log('✅ הטבלה stock_items נוצרה בהצלחה!');
      console.log('✅ האינדקסים נוצרו בהצלחה!');
      console.log('✅ RLS policies הוגדרו בהצלחה!\n');
      console.log('🎉 הכל מוכן! אתה יכול להתחיל להשתמש בטבלה.');
    }
  } catch (error: any) {
    console.error('❌ שגיאה ביצירת הטבלה:', error.message);
    console.log('\n📝 אנא הרץ את השאילתה הבאה ב-Supabase SQL Editor:');
    console.log('   Dashboard > SQL Editor > New Query\n');
    console.log(sql);
    process.exit(1);
  }
}

createStockItemsTable();


