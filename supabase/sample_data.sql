-- ============================================
-- Sample Data for Stash CRM
-- ============================================
-- Copy and paste this entire code into Supabase SQL Editor
-- Make sure to run complete_schema.sql first!
-- ============================================

-- ============================================
-- 1. CUSTOMERS - לקוחות
-- ============================================
INSERT INTO customers (id, customer_type, company_name, first_name, last_name, email, phone, address_city, orders_count, total_purchases, is_active, created_at) VALUES
('550e8400-e29b-41d4-a716-446655440001', 'business', 'חברת אירועים בע"מ', NULL, NULL, 'events@example.com', '050-1234567', 'תל אביב', 5, 45000.00, true, NOW() - INTERVAL '30 days'),
('550e8400-e29b-41d4-a716-446655440002', 'private', NULL, 'דני', 'כהן', 'danny@example.com', '052-2345678', 'ירושלים', 3, 12000.00, true, NOW() - INTERVAL '20 days'),
('550e8400-e29b-41d4-a716-446655440003', 'business', 'מסעדת השף', NULL, NULL, 'chef@example.com', '03-1234567', 'חיפה', 2, 8500.00, true, NOW() - INTERVAL '15 days'),
('550e8400-e29b-41d4-a716-446655440004', 'private', NULL, 'שרה', 'לוי', 'sara@example.com', '054-3456789', 'רמת גן', 1, 3500.00, true, NOW() - INTERVAL '10 days'),
('550e8400-e29b-41d4-a716-446655440005', 'business', 'אולמות יוקרה', NULL, NULL, 'halls@example.com', '09-9876543', 'נתניה', 4, 28000.00, true, NOW() - INTERVAL '25 days'),
('550e8400-e29b-41d4-a716-446655440006', 'private', NULL, 'יוסי', 'משה', 'yossi@example.com', '050-4567890', 'באר שבע', 2, 7500.00, true, NOW() - INTERVAL '12 days'),
('550e8400-e29b-41d4-a716-446655440007', 'business', 'אירועי VIP', NULL, NULL, 'vip@example.com', '02-1112222', 'ירושלים', 6, 55000.00, true, NOW() - INTERVAL '40 days'),
('550e8400-e29b-41d4-a716-446655440008', 'private', NULL, 'מיכל', 'דוד', 'michal@example.com', '053-7890123', 'אשדוד', 1, 4200.00, true, NOW() - INTERVAL '8 days');

-- ============================================
-- 2. LEADS - לידים
-- ============================================
INSERT INTO leads (id, contact_name, company_name, phone, email, source, status, event_type, event_date, estimated_quantity, notes, created_at) VALUES
('660e8400-e29b-41d4-a716-446655440001', 'רונן אברהם', NULL, '050-1111111', 'ronen@example.com', 'instagram', 'new', 'חתונה', '2024-06-15', 150, 'ליד חדש מאינסטגרם', NOW() - INTERVAL '2 days'),
('660e8400-e29b-41d4-a716-446655440002', 'ליאור כהן', 'חברת אירועים גדולה', '052-2222222', 'lior@example.com', 'website', 'contacted', 'בר מצווה', '2024-07-20', 200, 'צריך להחזיר טלפון', NOW() - INTERVAL '5 days'),
('660e8400-e29b-41d4-a716-446655440003', 'תמר לוי', NULL, '054-3333333', 'tamar@example.com', 'facebook', 'in_negotiation', 'יום הולדת', '2024-05-10', 50, 'במשא ומתן על מחיר', NOW() - INTERVAL '7 days'),
('660e8400-e29b-41d4-a716-446655440004', 'אורן דוד', 'אירועי יוקרה', '03-4444444', 'oren@example.com', 'referral', 'quoted', 'אירוע חברה', '2024-08-01', 300, 'נשלחה הצעת מחיר', NOW() - INTERVAL '3 days'),
('660e8400-e29b-41d4-a716-446655440005', 'נועה שרון', NULL, '050-5555555', 'noa@example.com', 'whatsapp', 'converted', 'חתונה', '2024-09-12', 180, 'הומר ללקוח', NOW() - INTERVAL '10 days'),
('660e8400-e29b-41d4-a716-446655440006', 'אלון גולן', NULL, '052-6666666', 'alon@example.com', 'phone', 'lost', 'בר מצווה', NULL, 100, 'לא ענה לטלפון', NOW() - INTERVAL '15 days'),
('660e8400-e29b-41d4-a716-446655440007', 'מיכל כהן', 'אירועי VIP', '054-7777777', 'michal@example.com', 'instagram', 'new', 'יום הולדת', '2024-06-25', 80, 'ליד חדש', NOW() - INTERVAL '1 day'),
('660e8400-e29b-41d4-a716-446655440008', 'יובל רוזן', NULL, '050-8888888', 'yuval@example.com', 'website', 'contacted', 'חתונה', '2024-07-30', 250, 'מחכה לתשובה', NOW() - INTERVAL '4 days');

-- ============================================
-- 3. PRODUCTS - מוצרים
-- ============================================
INSERT INTO products (id, sku, name, production_type, base_price, base_cost, current_stock, min_stock_alert, created_at) VALUES
('770e8400-e29b-41d4-a716-446655440001', 'PROD-001', 'כוסות חד פעמיים 250 מ"ל', 'import', 2.50, 1.20, 5000, 500, NOW() - INTERVAL '60 days'),
('770e8400-e29b-41d4-a716-446655440002', 'PROD-002', 'צלחות חד פעמיות', 'import', 3.00, 1.50, 3000, 300, NOW() - INTERVAL '60 days'),
('770e8400-e29b-41d4-a716-446655440003', 'PROD-003', 'מפיות נייר לבן', 'import', 1.50, 0.70, 10000, 1000, NOW() - INTERVAL '60 days'),
('770e8400-e29b-41d4-a716-446655440004', 'PROD-004', 'כוסות קרטון עם הדפסה', 'local', 4.50, 2.00, 2000, 200, NOW() - INTERVAL '45 days'),
('770e8400-e29b-41d4-a716-446655440005', 'PROD-005', 'שקיות מתנה', 'import', 5.00, 2.50, 1500, 150, NOW() - INTERVAL '50 days'),
('770e8400-e29b-41d4-a716-446655440006', 'PROD-006', 'מפיות עם הדפסה מותאמת', 'local', 3.50, 1.80, 4000, 400, NOW() - INTERVAL '40 days'),
('770e8400-e29b-41d4-a716-446655440007', 'PROD-007', 'כוסות זכוכית עם הדפסה', 'local', 8.00, 4.00, 800, 100, NOW() - INTERVAL '35 days'),
('770e8400-e29b-41d4-a716-446655440008', 'PROD-008', 'צלחות קרמיקה מותאמות', 'local', 12.00, 6.00, 500, 50, NOW() - INTERVAL '30 days'),
('770e8400-e29b-41d4-a716-446655440009', 'PROD-009', 'מפיות קלינקס', 'import', 2.00, 1.00, 6000, 600, NOW() - INTERVAL '55 days'),
('770e8400-e29b-41d4-a716-446655440010', 'PROD-010', 'כוסות פלסטיק צבעוניות', 'import', 3.50, 1.75, 2500, 250, NOW() - INTERVAL '48 days');

-- ============================================
-- 4. SUPPLIERS - ספקים
-- ============================================
INSERT INTO suppliers (id, name, country, contact_name, email, phone, lead_time_days, created_at) VALUES
('880e8400-e29b-41d4-a716-446655440001', 'China Packaging Co.', 'China', 'Li Wei', 'liwei@chinapack.com', '+86-138-0013-8000', 45, NOW() - INTERVAL '90 days'),
('880e8400-e29b-41d4-a716-446655440002', 'Global Supplies Ltd.', 'Turkey', 'Mehmet Yilmaz', 'mehmet@globalsupplies.com', '+90-212-555-1234', 30, NOW() - INTERVAL '80 days'),
('880e8400-e29b-41d4-a716-446655440003', 'Premium Packaging', 'USA', 'John Smith', 'john@premiumpack.com', '+1-555-123-4567', 60, NOW() - INTERVAL '70 days'),
('880e8400-e29b-41d4-a716-446655440004', 'Euro Disposables', 'Germany', 'Hans Mueller', 'hans@eurodisp.com', '+49-30-12345678', 25, NOW() - INTERVAL '65 days'),
('880e8400-e29b-41d4-a716-446655440005', 'Asia Materials', 'Thailand', 'Somsak Tan', 'somsak@asiamat.com', '+66-2-123-4567', 35, NOW() - INTERVAL '60 days');

-- ============================================
-- 5. ORDERS - הזמנות
-- ============================================
INSERT INTO orders (id, order_number, customer_id, customer_name, status, production_type, event_name, event_date, subtotal, tax_amount, total_amount, payment_status, shipping_type, deadline, local_production_status, created_at) VALUES
('990e8400-e29b-41d4-a716-446655440001', '24-00001', '550e8400-e29b-41d4-a716-446655440001', 'חברת אירועים בע"מ', 'in_production', 'local', 'חתונה גדולה', '2024-06-01', 15000.00, 2550.00, 17550.00, 'paid', 'delivery', '2024-05-25', 'printing', NOW() - INTERVAL '10 days'),
('990e8400-e29b-41d4-a716-446655440002', '24-00002', '550e8400-e29b-41d4-a716-446655440002', 'דני כהן', 'ready', 'local', 'בר מצווה', '2024-05-20', 5000.00, 850.00, 5850.00, 'paid', 'pickup', '2024-05-18', 'ready_ship', NOW() - INTERVAL '8 days'),
('990e8400-e29b-41d4-a716-446655440003', '24-00003', '550e8400-e29b-41d4-a716-446655440003', 'מסעדת השף', 'shipped', 'import', 'אירוע פתיחה', '2024-05-15', 8000.00, 1360.00, 9360.00, 'paid', 'delivery', '2024-05-10', NULL, NOW() - INTERVAL '15 days'),
('990e8400-e29b-41d4-a716-446655440004', '24-00004', '550e8400-e29b-41d4-a716-446655440004', 'שרה לוי', 'pending_payment', 'local', 'יום הולדת', '2024-06-10', 3500.00, 595.00, 4095.00, 'pending', 'pickup', '2024-06-05', 'queued', NOW() - INTERVAL '5 days'),
('990e8400-e29b-41d4-a716-446655440005', '24-00005', '550e8400-e29b-41d4-a716-446655440005', 'אולמות יוקרה', 'approved', 'import', 'כנס עסקי', '2024-07-01', 12000.00, 2040.00, 14040.00, 'pending', 'delivery', '2024-06-25', NULL, NOW() - INTERVAL '3 days'),
('990e8400-e29b-41d4-a716-446655440006', '24-00006', '550e8400-e29b-41d4-a716-446655440002', 'דני כהן', 'completed', 'local', 'יום הולדת', '2024-04-20', 7000.00, 1190.00, 8190.00, 'paid', 'pickup', '2024-04-18', NULL, NOW() - INTERVAL '30 days'),
('990e8400-e29b-41d4-a716-446655440007', '24-00007', '550e8400-e29b-41d4-a716-446655440007', 'אירועי VIP', 'paid', 'local', 'אירוע VIP', '2024-06-05', 20000.00, 3400.00, 23400.00, 'paid', 'express', '2024-05-30', 'quality_check', NOW() - INTERVAL '12 days'),
('990e8400-e29b-41d4-a716-446655440008', '24-00008', '550e8400-e29b-41d4-a716-446655440006', 'יוסי משה', 'delivered', 'import', 'חתונה', '2024-05-01', 7500.00, 1275.00, 8775.00, 'paid', 'delivery', '2024-04-28', NULL, NOW() - INTERVAL '20 days'),
('990e8400-e29b-41d4-a716-446655440009', '24-00009', '550e8400-e29b-41d4-a716-446655440001', 'חברת אירועים בע"מ', 'draft', 'local', 'אירוע קיץ', '2024-08-15', 0.00, 0.00, 0.00, 'pending', 'pickup', NULL, NULL, NOW() - INTERVAL '1 day'),
('990e8400-e29b-41d4-a716-446655440010', '24-00010', '550e8400-e29b-41d4-a716-446655440003', 'מסעדת השף', 'in_production', 'local', 'אירוע עובדים', '2024-05-25', 4500.00, 765.00, 5265.00, 'paid', 'pickup', '2024-05-22', 'ready_pack', NOW() - INTERVAL '6 days');

-- ============================================
-- 6. ORDER ITEMS - פריטי הזמנה
-- ============================================
INSERT INTO order_items (id, order_id, product_name, quantity, unit_price, total, created_at) VALUES
-- Order 24-00001
('aa0e8400-e29b-41d4-a716-446655440001', '990e8400-e29b-41d4-a716-446655440001', 'כוסות קרטון עם הדפסה', 2000, 4.50, 9000.00, NOW() - INTERVAL '10 days'),
('aa0e8400-e29b-41d4-a716-446655440002', '990e8400-e29b-41d4-a716-446655440001', 'מפיות עם הדפסה מותאמת', 3000, 3.50, 10500.00, NOW() - INTERVAL '10 days'),
-- Order 24-00002
('aa0e8400-e29b-41d4-a716-446655440003', '990e8400-e29b-41d4-a716-446655440002', 'כוסות קרטון עם הדפסה', 500, 4.50, 2250.00, NOW() - INTERVAL '8 days'),
('aa0e8400-e29b-41d4-a716-446655440004', '990e8400-e29b-41d4-a716-446655440002', 'מפיות עם הדפסה מותאמת', 800, 3.50, 2800.00, NOW() - INTERVAL '8 days'),
-- Order 24-00003
('aa0e8400-e29b-41d4-a716-446655440005', '990e8400-e29b-41d4-a716-446655440003', 'כוסות חד פעמיים 250 מ"ל', 2000, 2.50, 5000.00, NOW() - INTERVAL '15 days'),
('aa0e8400-e29b-41d4-a716-446655440006', '990e8400-e29b-41d4-a716-446655440003', 'צלחות חד פעמיות', 1500, 3.00, 4500.00, NOW() - INTERVAL '15 days'),
-- Order 24-00004
('aa0e8400-e29b-41d4-a716-446655440007', '990e8400-e29b-41d4-a716-446655440004', 'כוסות קרטון עם הדפסה', 300, 4.50, 1350.00, NOW() - INTERVAL '5 days'),
('aa0e8400-e29b-41d4-a716-446655440008', '990e8400-e29b-41d4-a716-446655440004', 'מפיות עם הדפסה מותאמת', 500, 3.50, 1750.00, NOW() - INTERVAL '5 days'),
('aa0e8400-e29b-41d4-a716-446655440009', '990e8400-e29b-41d4-a716-446655440004', 'שקיות מתנה', 200, 5.00, 1000.00, NOW() - INTERVAL '5 days'),
-- Order 24-00005
('aa0e8400-e29b-41d4-a716-446655440010', '990e8400-e29b-41d4-a716-446655440005', 'כוסות חד פעמיים 250 מ"ל', 3000, 2.50, 7500.00, NOW() - INTERVAL '3 days'),
('aa0e8400-e29b-41d4-a716-446655440011', '990e8400-e29b-41d4-a716-446655440005', 'צלחות חד פעמיות', 2000, 3.00, 6000.00, NOW() - INTERVAL '3 days'),
-- Order 24-00006
('aa0e8400-e29b-41d4-a716-446655440012', '990e8400-e29b-41d4-a716-446655440006', 'כוסות זכוכית עם הדפסה', 500, 8.00, 4000.00, NOW() - INTERVAL '30 days'),
('aa0e8400-e29b-41d4-a716-446655440013', '990e8400-e29b-41d4-a716-446655440006', 'צלחות קרמיקה מותאמות', 200, 12.00, 2400.00, NOW() - INTERVAL '30 days'),
-- Order 24-00007
('aa0e8400-e29b-41d4-a716-446655440014', '990e8400-e29b-41d4-a716-446655440007', 'כוסות זכוכית עם הדפסה', 1500, 8.00, 12000.00, NOW() - INTERVAL '12 days'),
('aa0e8400-e29b-41d4-a716-446655440015', '990e8400-e29b-41d4-a716-446655440007', 'צלחות קרמיקה מותאמות', 800, 12.00, 9600.00, NOW() - INTERVAL '12 days'),
-- Order 24-00008
('aa0e8400-e29b-41d4-a716-446655440016', '990e8400-e29b-41d4-a716-446655440008', 'כוסות חד פעמיים 250 מ"ל', 1500, 2.50, 3750.00, NOW() - INTERVAL '20 days'),
('aa0e8400-e29b-41d4-a716-446655440017', '990e8400-e29b-41d4-a716-446655440008', 'צלחות חד פעמיות', 1000, 3.00, 3000.00, NOW() - INTERVAL '20 days'),
-- Order 24-00010
('aa0e8400-e29b-41d4-a716-446655440018', '990e8400-e29b-41d4-a716-446655440010', 'כוסות קרטון עם הדפסה', 400, 4.50, 1800.00, NOW() - INTERVAL '6 days'),
('aa0e8400-e29b-41d4-a716-446655440019', '990e8400-e29b-41d4-a716-446655440010', 'מפיות עם הדפסה מותאמת', 600, 3.50, 2100.00, NOW() - INTERVAL '6 days'),
('aa0e8400-e29b-41d4-a716-446655440020', '990e8400-e29b-41d4-a716-446655440010', 'שקיות מתנה', 150, 5.00, 750.00, NOW() - INTERVAL '6 days');

-- ============================================
-- 7. STOCK ITEMS - פריטי מלאי
-- ============================================
INSERT INTO stock_items (id, sku, name, type, current_quantity, min_quantity, unit, unit_cost, created_at) VALUES
('bb0e8400-e29b-41d4-a716-446655440001', 'STOCK-001', 'דיו שחור', 'raw_material', 500, 100, 'ליטר', 45.00, NOW() - INTERVAL '60 days'),
('bb0e8400-e29b-41d4-a716-446655440002', 'STOCK-002', 'דיו כחול', 'raw_material', 300, 50, 'ליטר', 45.00, NOW() - INTERVAL '60 days'),
('bb0e8400-e29b-41d4-a716-446655440003', 'STOCK-003', 'דיו אדום', 'raw_material', 250, 50, 'ליטר', 45.00, NOW() - INTERVAL '60 days'),
('bb0e8400-e29b-41d4-a716-446655440004', 'STOCK-004', 'קרטון גלי', 'raw_material', 2000, 500, 'מ"ר', 8.50, NOW() - INTERVAL '50 days'),
('bb0e8400-e29b-41d4-a716-446655440005', 'STOCK-005', 'שקיות אריזה', 'packaging', 5000, 1000, 'יחידה', 0.30, NOW() - INTERVAL '45 days'),
('bb0e8400-e29b-41d4-a716-446655440006', 'STOCK-006', 'סרט הדבקה', 'consumable', 200, 50, 'גליל', 12.00, NOW() - INTERVAL '40 days'),
('bb0e8400-e29b-41d4-a716-446655440007', 'STOCK-007', 'פוליאתילן', 'raw_material', 1500, 300, 'מ"ר', 5.00, NOW() - INTERVAL '55 days'),
('bb0e8400-e29b-41d4-a716-446655440008', 'STOCK-008', 'קרטון דק', 'raw_material', 3000, 600, 'מ"ר', 6.00, NOW() - INTERVAL '48 days'),
('bb0e8400-e29b-41d4-a716-446655440009', 'STOCK-009', 'שקיות בועות', 'packaging', 800, 200, 'יחידה', 0.50, NOW() - INTERVAL '35 days'),
('bb0e8400-e29b-41d4-a716-446655440010', 'STOCK-010', 'דבק תעשייתי', 'consumable', 100, 20, 'ק"ג', 35.00, NOW() - INTERVAL '42 days');

-- ============================================
-- 8. EXPENSES - הוצאות
-- ============================================
INSERT INTO expenses (id, category, description, amount, date, supplier_name, created_at) VALUES
('cc0e8400-e29b-41d4-a716-446655440001', 'materials', 'רכישת דיו וצבעים', 2500.00, CURRENT_DATE - INTERVAL '5 days', 'China Packaging Co.', NOW() - INTERVAL '5 days'),
('cc0e8400-e29b-41d4-a716-446655440002', 'utilities', 'חשבון חשמל', 1200.00, CURRENT_DATE - INTERVAL '10 days', NULL, NOW() - INTERVAL '10 days'),
('cc0e8400-e29b-41d4-a716-446655440003', 'rent', 'שכר דירה למחסן', 5000.00, CURRENT_DATE - INTERVAL '1 day', NULL, NOW() - INTERVAL '1 day'),
('cc0e8400-e29b-41d4-a716-446655440004', 'materials', 'רכישת קרטון', 1800.00, CURRENT_DATE - INTERVAL '8 days', 'Global Supplies Ltd.', NOW() - INTERVAL '8 days'),
('cc0e8400-e29b-41d4-a716-446655440005', 'utilities', 'חשבון מים', 350.00, CURRENT_DATE - INTERVAL '12 days', NULL, NOW() - INTERVAL '12 days'),
('cc0e8400-e29b-41d4-a716-446655440006', 'materials', 'רכישת שקיות אריזה', 600.00, CURRENT_DATE - INTERVAL '3 days', 'Euro Disposables', NOW() - INTERVAL '3 days'),
('cc0e8400-e29b-41d4-a716-446655440007', 'marketing', 'פרסום בפייסבוק', 800.00, CURRENT_DATE - INTERVAL '7 days', NULL, NOW() - INTERVAL '7 days'),
('cc0e8400-e29b-41d4-a716-446655440008', 'materials', 'רכישת דבק וסרטים', 450.00, CURRENT_DATE - INTERVAL '4 days', 'Asia Materials', NOW() - INTERVAL '4 days'),
('cc0e8400-e29b-41d4-a716-446655440009', 'utilities', 'חשבון גז', 280.00, CURRENT_DATE - INTERVAL '15 days', NULL, NOW() - INTERVAL '15 days'),
('cc0e8400-e29b-41d4-a716-446655440010', 'other', 'תיקון מכונת הדפסה', 1200.00, CURRENT_DATE - INTERVAL '6 days', NULL, NOW() - INTERVAL '6 days'),
('cc0e8400-e29b-41d4-a716-446655440011', 'materials', 'רכישת פוליאתילן', 900.00, CURRENT_DATE - INTERVAL '9 days', 'China Packaging Co.', NOW() - INTERVAL '9 days'),
('cc0e8400-e29b-41d4-a716-446655440012', 'marketing', 'פרסום באינסטגרם', 500.00, CURRENT_DATE - INTERVAL '2 days', NULL, NOW() - INTERVAL '2 days');

-- ============================================
-- 9. TASKS - משימות
-- ============================================
INSERT INTO tasks (id, title, status, priority, due_date, related_order, created_at) VALUES
('dd0e8400-e29b-41d4-a716-446655440001', 'לסיים הדפסת הזמנה 24-00001', 'in_progress', 'urgent', CURRENT_DATE + INTERVAL '3 days', '24-00001', NOW() - INTERVAL '2 days'),
('dd0e8400-e29b-41d4-a716-446655440002', 'לבדוק איכות הזמנה 24-00007', 'todo', 'high', CURRENT_DATE + INTERVAL '1 day', '24-00007', NOW() - INTERVAL '1 day'),
('dd0e8400-e29b-41d4-a716-446655440003', 'לארוז הזמנה 24-00010', 'in_progress', 'medium', CURRENT_DATE + INTERVAL '2 days', '24-00010', NOW() - INTERVAL '1 day'),
('dd0e8400-e29b-41d4-a716-446655440004', 'להכין הצעת מחיר ללקוח חדש', 'todo', 'high', CURRENT_DATE + INTERVAL '5 days', NULL, NOW() - INTERVAL '3 days'),
('dd0e8400-e29b-41d4-a716-446655440005', 'לעדכן מלאי דיו', 'todo', 'medium', CURRENT_DATE + INTERVAL '7 days', NULL, NOW() - INTERVAL '5 days'),
('dd0e8400-e29b-41d4-a716-446655440006', 'לשוחח עם ספק על מחירים', 'todo', 'low', CURRENT_DATE + INTERVAL '10 days', NULL, NOW() - INTERVAL '4 days'),
('dd0e8400-e29b-41d4-a716-446655440007', 'לסיים הדפסת הזמנה 24-00002', 'completed', 'high', CURRENT_DATE - INTERVAL '2 days', '24-00002', NOW() - INTERVAL '5 days'),
('dd0e8400-e29b-41d4-a716-446655440008', 'לבדוק איכות הזמנה 24-00006', 'completed', 'medium', CURRENT_DATE - INTERVAL '5 days', '24-00006', NOW() - INTERVAL '8 days'),
('dd0e8400-e29b-41d4-a716-446655440009', 'לעדכן לקוח על סטטוס הזמנה', 'todo', 'urgent', CURRENT_DATE, '24-00004', NOW() - INTERVAL '1 day'),
('dd0e8400-e29b-41d4-a716-446655440010', 'להזמין חומרי גלם', 'todo', 'high', CURRENT_DATE + INTERVAL '4 days', NULL, NOW() - INTERVAL '2 days');

-- ============================================
-- 10. IMPORT ORDERS - הזמנות יבוא
-- ============================================
INSERT INTO import_orders (id, supplier_name, status, order_numbers, total_cost, estimated_arrival, tracking_number, created_at) VALUES
('ee0e8400-e29b-41d4-a716-446655440001', 'China Packaging Co.', 'in_transit', ARRAY['24-00003', '24-00008'], 15000.00, CURRENT_DATE + INTERVAL '15 days', 'CN123456789', NOW() - INTERVAL '20 days'),
('ee0e8400-e29b-41d4-a716-446655440002', 'Global Supplies Ltd.', 'shipped', ARRAY['24-00005'], 12000.00, CURRENT_DATE + INTERVAL '25 days', 'TR987654321', NOW() - INTERVAL '10 days'),
('ee0e8400-e29b-41d4-a716-446655440003', 'Euro Disposables', 'in_production', ARRAY[], 8000.00, CURRENT_DATE + INTERVAL '40 days', NULL, NOW() - INTERVAL '5 days'),
('ee0e8400-e29b-41d4-a716-446655440004', 'Asia Materials', 'quote_received', ARRAY[], 5000.00, CURRENT_DATE + INTERVAL '50 days', NULL, NOW() - INTERVAL '2 days'),
('ee0e8400-e29b-41d4-a716-446655440005', 'China Packaging Co.', 'customs', ARRAY[], 18000.00, CURRENT_DATE + INTERVAL '10 days', 'CN987654321', NOW() - INTERVAL '30 days'),
('ee0e8400-e29b-41d4-a716-446655440006', 'Premium Packaging', 'graphics_approved', ARRAY[], 22000.00, CURRENT_DATE + INTERVAL '60 days', NULL, NOW() - INTERVAL '8 days');

-- ============================================
-- COMPLETE!
-- ============================================
-- Sample data has been inserted:
-- - 8 customers (לקוחות)
-- - 8 leads (לידים)
-- - 10 products (מוצרים)
-- - 5 suppliers (ספקים)
-- - 10 orders (הזמנות)
-- - 20 order items (פריטי הזמנה)
-- - 10 stock items (פריטי מלאי)
-- - 12 expenses (הוצאות)
-- - 10 tasks (משימות)
-- - 6 import orders (הזמנות יבוא)
-- ============================================
