# הגדרת Supabase MCP

כדי שה-MCP של Supabase יעבוד, צריך להגדיר את המשתנים הבאים:

## משתנים נדרשים:

1. **SUPABASE_PROJECT_REF** - מזהה הפרויקט (יש לנו: `qjkofnsmtqgmqqnzmbxr`)
2. **SUPABASE_DB_PASSWORD** - סיסמת המסד נתונים
3. **SUPABASE_REGION** - האזור של הפרויקט (למשל: `us-east-1`, `eu-west-1`)
4. **SUPABASE_ACCESS_TOKEN** - Access Token של Supabase Management API ⚠️ **זה מה שחסר!**
5. **SUPABASE_SERVICE_ROLE_KEY** - Service Role Key (כבר עדכנת)

## איך להשיג את ה-Access Token:

1. היכנס ל-[Supabase Dashboard](https://app.supabase.com)
2. לחץ על האייקון של הפרופיל שלך (פינה ימנית עליונה)
3. בחר **Account Settings** או **Access Tokens**
4. או לך ישירות ל: https://supabase.com/dashboard/account/tokens
5. לחץ על **Generate New Token**
6. תן שם לטוקן (למשל: "MCP Access Token")
7. העתק את הטוקן שנוצר

## איך להגדיר את המשתנים:

### אופציה 1: בקובץ .env.local (למקרה שהמשתמש רוצה להשתמש בזה גם בקוד)
```env
VITE_SUPABASE_URL=https://qjkofnsmtqgmqqnzmbxr.supabase.co
VITE_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
SUPABASE_ACCESS_TOKEN=your_access_token
SUPABASE_PROJECT_REF=qjkofnsmtqgmqqnzmbxr
SUPABASE_REGION=your_region
SUPABASE_DB_PASSWORD=your_db_password
```

### אופציה 2: בהגדרות MCP של Cursor (מומלץ)

1. פתח את הגדרות Cursor
2. חפש "MCP" או "Model Context Protocol"
3. מצא את ההגדרות של Supabase MCP
4. הוסף את המשתנים הבאים:

```json
{
  "supabase": {
    "SUPABASE_PROJECT_REF": "qjkofnsmtqgmqqnzmbxr",
    "SUPABASE_ACCESS_TOKEN": "your_access_token_here",
    "SUPABASE_SERVICE_ROLE_KEY": "your_service_role_key_here",
    "SUPABASE_REGION": "your_region_here",
    "SUPABASE_DB_PASSWORD": "your_db_password_here"
  }
}
```

## איך למצוא את ה-Region:

1. לך ל-Supabase Dashboard
2. בחר את הפרויקט שלך
3. לך ל-Settings > General
4. חפש את ה-Region (למשל: `us-east-1`, `eu-west-1`, `ap-southeast-1`)

## איך למצוא את ה-DB Password:

1. לך ל-Supabase Dashboard
2. בחר את הפרויקט שלך
3. לך ל-Settings > Database
4. אם לא זוכר את הסיסמה, תוכל ליצור סיסמה חדשה ב-Reset Database Password

## אחרי ההגדרה:

אחרי שתגדיר את כל המשתנים, תוכל לרוץ:
```bash
# אני אריץ את הפקודה ליצירת הטבלה דרך MCP
```

ואז הטבלה תיווצר אוטומטית!


