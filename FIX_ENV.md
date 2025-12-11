# תיקון בעיות סביבה

## בעיה: VITE_SUPABASE_ANON_KEY לא מוגדר

אם אתה מקבל שגיאה שהמפתח לא מוגדר, ודא שקובץ `.env.local` קיים ונראה כך:

```env
GEMINI_API_KEY=PLACEHOLDER_API_KEY
VITE_SUPABASE_URL=https://qjkofnsmtqgmqqnzmbxr.supabase.co
VITE_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InFqa29mbnNtdHFnbXFxbnptYnhyIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NjU0NDI4NTksImV4cCI6MjA4MTAxODg1OX0.xgXsNdirf88OXF1Y4kiQJcx_uaiTuBqpi7B0WiaNfcM
```

**חשוב:**
- אין רווחים לפני שמות המשתנים
- כל שורה מתחילה ישירות עם שם המשתנה
- אין רווחים לפני או אחרי ה-`=`

אם יש בעיה, מחק את `.env.local` וצור אותו מחדש עם התוכן למעלה.

## איך למצוא את המפתח:

1. היכנס ל-[Supabase Dashboard](https://app.supabase.com)
2. בחר את הפרויקט שלך (qjkofnsmtqgmqqnzmbxr)
3. לך ל-Settings > API
4. העתק את ה-`anon` `public` key
