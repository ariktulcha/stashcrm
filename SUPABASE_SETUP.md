# הגדרת Supabase

## שלב 1: התקנת התלויות

הרץ את הפקודה הבאה להתקנת Supabase client:

```bash
npm install
```

## שלב 2: הגדרת משתני סביבה

צור קובץ `.env.local` בתיקיית הפרויקט והוסף את המפתחות הבאים:

```env
VITE_SUPABASE_URL=https://qjkofnsmtqgmqqnzmbxr.supabase.co
VITE_SUPABASE_ANON_KEY=YOUR_ANON_KEY_HERE
```

**איך למצוא את ה-ANON_KEY:**
1. היכנס ל-[Supabase Dashboard](https://app.supabase.com)
2. בחר את הפרויקט שלך (stash)
3. לך ל-Settings > API
4. העתק את ה-`anon` `public` key

## שלב 3: יצירת טבלת stock_items

1. היכנס ל-[Supabase Dashboard](https://app.supabase.com)
2. בחר את הפרויקט שלך
3. לך ל-SQL Editor
4. העתק את התוכן מקובץ `supabase/create_stock_items.sql`
5. הרץ את השאילתה

או הרץ את השאילתה הבאה:

```sql
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

-- Create policy to allow all operations
CREATE POLICY "Allow all operations on stock_items" ON stock_items
  FOR ALL
  USING (true)
  WITH CHECK (true);
```

## שלב 4: בדיקת החיבור

1. הרץ את הפרויקט:
```bash
npm run dev
```

2. לך לדף המלאי (Inventory)
3. נסה להוסיף פריט חדש
4. אם הכל עובד, תראה את הפריט נשמר במסד הנתונים!

## פתרון בעיות

### שגיאת "Missing Supabase environment variables"
- ודא שיצרת את קובץ `.env.local`
- ודא שהמשתנים מתחילים ב-`VITE_`
- הפעל מחדש את שרת הפיתוח

### שגיאת "relation stock_items does not exist"
- ודא שיצרת את הטבלה ב-Supabase Dashboard
- בדוק שהשאילתה רצה בהצלחה

### שגיאת RLS (Row Level Security)
- ודא שיצרת את ה-policy כמו בקובץ SQL
- או השב את RLS זמנית: `ALTER TABLE stock_items DISABLE ROW LEVEL SECURITY;`


