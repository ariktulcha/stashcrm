import { createClient } from '@supabase/supabase-js';
import { readFileSync } from 'fs';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env.local
let envVars = {};
try {
  const envFile = readFileSync(join(__dirname, '../.env.local'), 'utf-8');
  envFile.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split('=');
    if (key && valueParts.length > 0) {
      envVars[key.trim()] = valueParts.join('=').trim();
    }
  });
} catch (error) {
  console.error('❌ לא נמצא קובץ .env.local');
  process.exit(1);
}

const supabaseUrl = envVars.VITE_SUPABASE_URL || 'https://qjkofnsmtqgmqqnzmbxr.supabase.co';
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY || envVars.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseKey) {
  console.error('❌ לא נמצא VITE_SUPABASE_ANON_KEY ב-.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function setupStockItems() {
  console.log('🔍 בודק חיבור ל-Supabase...\n');

  // Check if table exists by trying to query it
  const { data, error } = await supabase
    .from('stock_items')
    .select('*')
    .limit(1);

  if (error) {
    if (error.message.includes('does not exist') || error.code === '42P01') {
      console.log('❌ הטבלה stock_items לא קיימת.\n');
      console.log('📝 אנא הרץ את השאילתה הבאה ב-Supabase SQL Editor:');
      console.log('   1. לך ל: https://app.supabase.com/project/qjkofnsmtqgmqqnzmbxr/sql/new');
      console.log('   2. העתק והדבק את השאילתה הבאה:\n');
      
      const sql = readFileSync(join(__dirname, '../supabase/create_stock_items.sql'), 'utf-8');
      console.log(sql);
      console.log('\n   3. לחץ על "Run"');
      process.exit(1);
    } else {
      console.error('❌ שגיאה:', error.message);
      console.error('   Code:', error.code);
      process.exit(1);
    }
  } else {
    console.log('✅ הטבלה stock_items קיימת!');
    console.log('✅ החיבור ל-Supabase עובד מצוין!\n');
    
    // Try to insert a test record
    console.log('🧪 בודק כתיבה לטבלה...');
    const testItem = {
      sku: 'TEST-' + Date.now(),
      name: 'פריט בדיקה',
      type: 'raw_material',
      current_quantity: 0,
      min_quantity: 0,
      unit: 'units',
      unit_cost: 0
    };

    const { data: insertData, error: insertError } = await supabase
      .from('stock_items')
      .insert(testItem)
      .select();

    if (insertError) {
      console.error('❌ שגיאה בכתיבה:', insertError.message);
      if (insertError.message.includes('policy') || insertError.message.includes('RLS')) {
        console.log('\n💡 נראה שיש בעיה עם RLS policies.');
        console.log('   ודא שהשאילתה ב-supabase/create_stock_items.sql רצה בהצלחה.');
      }
      process.exit(1);
    } else {
      console.log('✅ כתיבה עובדת!');
      
      // Delete test record
      await supabase
        .from('stock_items')
        .delete()
        .eq('id', insertData[0].id);
      
      console.log('✅ מחיקה עובדת!');
      console.log('\n🎉 הכל מוכן! אתה יכול להתחיל להשתמש בטבלה.');
    }
  }
}

setupStockItems().catch(console.error);


