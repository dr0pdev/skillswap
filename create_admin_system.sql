-- ============================================
-- CREATE ADMIN SYSTEM
-- ============================================

-- Add role column to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'user' CHECK (
  role IN ('user', 'admin')
);

-- Create index for role queries
CREATE INDEX IF NOT EXISTS idx_users_role ON public.users(role);

-- ============================================
-- CREATE ADMIN USER
-- ============================================
-- This creates a special admin account with fixed credentials
-- Email: admin@skillswap.com
-- Password: Admin@123456

-- First, you need to create this user in Supabase Auth Dashboard:
-- 1. Go to Authentication → Users
-- 2. Click "Add User"
-- 3. Email: admin@skillswap.com
-- 4. Password: Admin@123456
-- 5. Email Confirm: Yes (toggle to confirmed)
-- 6. After creating, copy the user ID

-- Then run this to set their role to admin:
-- UPDATE public.users 
-- SET role = 'admin',
--     full_name = 'System Administrator',
--     verification_status = 'verified'
-- WHERE email = 'admin@skillswap.com';

-- ============================================
-- ADMIN RLS POLICIES
-- ============================================

-- Create policy for admins to view all users
DROP POLICY IF EXISTS "Admins can view all users" ON public.users;
CREATE POLICY "Admins can view all users"
ON public.users FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- Create policy for admins to update all users
DROP POLICY IF EXISTS "Admins can update all users" ON public.users;
CREATE POLICY "Admins can update all users"
ON public.users FOR UPDATE
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

-- Admin can view all verification documents
DROP POLICY IF EXISTS "Admins can view all verification documents" ON storage.objects;
CREATE POLICY "Admins can view all verification documents"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'verification-documents'
  AND EXISTS (
    SELECT 1 FROM public.users
    WHERE users.id = auth.uid()
    AND users.role = 'admin'
  )
);

-- ============================================
-- HELPER FUNCTIONS FOR ADMIN
-- ============================================

-- Function to check if current user is admin
CREATE OR REPLACE FUNCTION public.is_admin()
RETURNS BOOLEAN AS $$
BEGIN
  RETURN EXISTS (
    SELECT 1 FROM public.users
    WHERE id = auth.uid()
    AND role = 'admin'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Function to get pending verification count
CREATE OR REPLACE FUNCTION public.get_pending_verification_count()
RETURNS INTEGER AS $$
BEGIN
  IF NOT public.is_admin() THEN
    RETURN 0;
  END IF;
  
  RETURN (
    SELECT COUNT(*)::INTEGER
    FROM public.users
    WHERE verification_status = 'pending'
  );
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- ============================================
-- VERIFICATION STATISTICS VIEW
-- ============================================

CREATE OR REPLACE VIEW public.verification_stats AS
SELECT
  COUNT(*) FILTER (WHERE verification_status = 'unverified') as unverified_count,
  COUNT(*) FILTER (WHERE verification_status = 'pending') as pending_count,
  COUNT(*) FILTER (WHERE verification_status = 'verified') as verified_count,
  COUNT(*) FILTER (WHERE verification_status = 'rejected') as rejected_count,
  COUNT(*) as total_users
FROM public.users;

-- Grant access to admins
GRANT SELECT ON public.verification_stats TO authenticated;

-- ============================================
-- ADMIN ACTIVITY LOG (Optional)
-- ============================================

CREATE TABLE IF NOT EXISTS public.admin_activity_logs (
  id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
  admin_id UUID REFERENCES public.users(id) NOT NULL,
  action TEXT NOT NULL, -- 'approve_verification', 'reject_verification', etc.
  target_user_id UUID REFERENCES public.users(id),
  details JSONB,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create index
CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_admin_id 
ON public.admin_activity_logs(admin_id);

CREATE INDEX IF NOT EXISTS idx_admin_activity_logs_created_at 
ON public.admin_activity_logs(created_at DESC);

-- RLS for admin activity logs
ALTER TABLE public.admin_activity_logs ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can view activity logs"
ON public.admin_activity_logs FOR SELECT
TO authenticated
USING (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
);

CREATE POLICY "Admins can insert activity logs"
ON public.admin_activity_logs FOR INSERT
TO authenticated
WITH CHECK (
  auth.uid() IN (
    SELECT id FROM public.users WHERE role = 'admin'
  )
  AND admin_id = auth.uid()
);

-- ============================================
-- TESTING QUERIES
-- ============================================

-- Check if admin user exists
-- SELECT id, email, role, full_name FROM public.users WHERE role = 'admin';

-- View all pending verifications
-- SELECT id, email, full_name, verification_document_type, 
--        verification_submitted_at, verification_document_url
-- FROM public.users
-- WHERE verification_status = 'pending'
-- ORDER BY verification_submitted_at ASC;

-- Get verification statistics
-- SELECT * FROM public.verification_stats;

-- View admin activity
-- SELECT 
--   al.created_at,
--   al.action,
--   admin.full_name as admin_name,
--   target.email as target_user_email,
--   al.details
-- FROM public.admin_activity_logs al
-- LEFT JOIN public.users admin ON al.admin_id = admin.id
-- LEFT JOIN public.users target ON al.target_user_id = target.id
-- ORDER BY al.created_at DESC
-- LIMIT 50;

