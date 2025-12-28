-- ============================================
-- CREATE ADMIN USER
-- ============================================
-- This script creates an admin user for the SkillSwap platform
-- Admin credentials: admin@skillswap.com / Admin@123456

-- ============================================
-- METHOD 1: Using Supabase Auth API (Recommended)
-- ============================================
-- You need to create the auth user first through Supabase Dashboard:
-- 1. Go to Authentication → Users → Add User
-- 2. Email: admin@skillswap.com
-- 3. Password: Admin@123456
-- 4. Auto Confirm User: ON
-- 5. Then run this SQL to set admin role:

-- Set admin role for existing user
UPDATE public.users 
SET role = 'admin',
    full_name = 'System Administrator',
    bio = 'Platform Administrator',
    verification_status = 'verified',
    reputation_score = 100
WHERE email = 'admin@skillswap.com';

-- Verify admin user was created
SELECT id, email, role, full_name, verification_status
FROM public.users 
WHERE role = 'admin';

-- ============================================
-- METHOD 2: Direct Insert (If user doesn't exist in public.users)
-- ============================================
-- First, get the auth user ID from Supabase Auth:
-- SELECT id, email FROM auth.users WHERE email = 'admin@skillswap.com';

-- Then insert/update in public.users with that ID:
-- Replace 'YOUR-AUTH-USER-ID-HERE' with actual ID from above query

-- INSERT INTO public.users (
--   id,
--   email,
--   full_name,
--   bio,
--   role,
--   verification_status,
--   reputation_score,
--   created_at
-- ) VALUES (
--   'YOUR-AUTH-USER-ID-HERE'::uuid,  -- Replace with actual auth user ID
--   'admin@skillswap.com',
--   'System Administrator',
--   'Platform Administrator',
--   'admin',
--   'verified',
--   100,
--   NOW()
-- )
-- ON CONFLICT (id) DO UPDATE SET
--   role = 'admin',
--   full_name = 'System Administrator',
--   verification_status = 'verified',
--   reputation_score = 100;

-- ============================================
-- METHOD 3: Complete Automated Solution (Advanced)
-- ============================================
-- This creates the auth user AND sets admin role
-- Note: This requires admin API key and may not work in SQL Editor

-- You'll need to use Supabase Management API or create via dashboard first

-- ============================================
-- VERIFICATION QUERIES
-- ============================================

-- Check if admin user exists in auth
SELECT id, email, email_confirmed_at, created_at
FROM auth.users 
WHERE email = 'admin@skillswap.com';

-- Check admin user in public.users
SELECT id, email, role, full_name, verification_status, reputation_score
FROM public.users 
WHERE email = 'admin@skillswap.com';

-- List all admin users
SELECT id, email, full_name, role, created_at
FROM public.users 
WHERE role = 'admin'
ORDER BY created_at DESC;

-- ============================================
-- MANAGEMENT QUERIES
-- ============================================

-- Make an existing regular user an admin
-- UPDATE public.users 
-- SET role = 'admin',
--     verification_status = 'verified',
--     reputation_score = 100
-- WHERE email = 'user@example.com';

-- Remove admin role (make regular user)
-- UPDATE public.users 
-- SET role = 'user'
-- WHERE email = 'admin@skillswap.com';

-- Delete admin user (if needed)
-- DELETE FROM public.users WHERE email = 'admin@skillswap.com';
-- Note: Also delete from auth.users in Supabase Dashboard

-- ============================================
-- QUICK SETUP INSTRUCTIONS
-- ============================================

/*
STEP-BY-STEP SETUP:

1. Create Auth User in Supabase Dashboard:
   - Go to: Authentication → Users → Add User
   - Email: admin@skillswap.com
   - Password: Admin@123456
   - Auto Confirm User: Toggle ON
   - Click "Create User"

2. Run this SQL in Supabase SQL Editor:

UPDATE public.users 
SET role = 'admin',
    full_name = 'System Administrator',
    verification_status = 'verified'
WHERE email = 'admin@skillswap.com';

3. Verify:

SELECT * FROM public.users WHERE role = 'admin';

4. Test Login:
   - Go to: http://localhost:5173/admin/login
   - Email: admin@skillswap.com
   - Password: Admin@123456

DONE! ✅
*/

-- ============================================
-- SECURITY NOTES
-- ============================================

/*
🔒 SECURITY BEST PRACTICES:

1. Change default password immediately in production
2. Use strong passwords (min 12 characters, mixed case, numbers, symbols)
3. Enable 2FA for admin accounts in Supabase
4. Regularly audit admin activity logs
5. Limit number of admin accounts (principle of least privilege)
6. Never expose admin credentials in code or documentation
7. Use environment variables for sensitive data
8. Rotate admin passwords regularly (every 90 days)
9. Monitor failed login attempts
10. Set up alerts for admin activities

⚠️ WARNING:
- Default credentials (admin@skillswap.com / Admin@123456) are for DEVELOPMENT ONLY
- MUST be changed before production deployment
- Never commit admin credentials to version control
*/

