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
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY;

if (!supabaseKey) {
  console.error('❌ לא נמצא VITE_SUPABASE_ANON_KEY ב-.env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function createTable() {
  console.log('🚀 מנסה ליצור את הטבלה דרך Supabase...\n');

  // Read SQL file
  const sql = readFileSync(join(__dirname, '../supabase/create_stock_items.sql'), 'utf-8');

  // Split into individual statements
  const statements = sql
    .split(';')
    .map(s => s.trim())
    .filter(s => s.length > 0 && !s.startsWith('--'));

  console.log(`📝 נמצאו ${statements.length} פקודות SQL\n`);

  for (let i = 0; i < statements.length; i++) {
    const statement = statements[i];
    if (!statement) continue;

    console.log(`⚙️  מריץ פקודה ${i + 1}/${statements.length}...`);
    console.log(`   ${statement.substring(0, 80)}...`);

    try {
      // Try using RPC if available, otherwise use direct query
      const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
      
      if (error) {
        // If RPC doesn't work, the table creation needs to be done via Dashboard
        if (error.message.includes('function') || error.message.includes('does not exist')) {
          console.log('   ⚠️  לא ניתן להריץ דרך API - צריך להשתמש ב-SQL Editor');
          console.log('\n📝 אנא הרץ את השאילתה הבאה ב-Supabase SQL Editor:');
          console.log('   https://app.supabase.com/project/qjkofnsmtqgmqqnzmbxr/sql/new\n');
          console.log(sql);
          process.exit(1);
        } else {
          console.error(`   ❌ שגיאה: ${error.message}`);
        }
      } else {
        console.log('   ✅ הצליח!');
      }
    } catch (err) {
      console.error(`   ❌ שגיאה: ${err.message}`);
    }
  }

  // Verify table was created
  console.log('\n🔍 בודק אם הטבלה נוצרה...');
  const { data, error } = await supabase
    .from('stock_items')
    .select('*')
    .limit(1);

  if (error && error.message.includes('does not exist')) {
    console.log('❌ הטבלה עדיין לא קיימת.');
    console.log('\n📝 אנא הרץ את השאילתה הבאה ב-Supabase SQL Editor:');
    console.log('   https://app.supabase.com/project/qjkofnsmtqgmqqnzmbxr/sql/new\n');
    console.log(sql);
    process.exit(1);
  } else if (error) {
    console.error('❌ שגיאה:', error.message);
    process.exit(1);
  } else {
    console.log('✅ הטבלה stock_items נוצרה בהצלחה!');
    console.log('🎉 הכל מוכן! אתה יכול להתחיל להשתמש בטבלה.');
  }
}

createTable().catch(console.error);
