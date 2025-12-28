-- ============================================
-- ADD USER VERIFICATION SYSTEM
-- ============================================
-- This migration adds verification status and document upload functionality

-- Add verification columns to users table
ALTER TABLE public.users
ADD COLUMN IF NOT EXISTS verification_status TEXT DEFAULT 'unverified' CHECK (
  verification_status IN ('unverified', 'pending', 'verified', 'rejected')
),
ADD COLUMN IF NOT EXISTS verification_document_url TEXT,
ADD COLUMN IF NOT EXISTS verification_document_type TEXT CHECK (
  verification_document_type IN ('cnic', 'student_id', NULL)
),
ADD COLUMN IF NOT EXISTS verification_submitted_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_reviewed_at TIMESTAMPTZ,
ADD COLUMN IF NOT EXISTS verification_notes TEXT;

-- Create index for verification status queries
CREATE INDEX IF NOT EXISTS idx_users_verification_status 
ON public.users(verification_status);

-- Create storage bucket for verification documents (if not exists)
-- This needs to be run in Supabase Dashboard under Storage
-- Or use the Supabase client to create it

-- RLS policies for verification documents will be handled by storage bucket policies

-- Add comment
COMMENT ON COLUMN public.users.verification_status IS 'User verification status: unverified, pending, verified, rejected';
COMMENT ON COLUMN public.users.verification_document_url IS 'URL to uploaded verification document (CNIC or Student ID)';
COMMENT ON COLUMN public.users.verification_document_type IS 'Type of document uploaded: cnic or student_id';
COMMENT ON COLUMN public.users.verification_submitted_at IS 'When verification was submitted';
COMMENT ON COLUMN public.users.verification_reviewed_at IS 'When verification was reviewed by admin';
COMMENT ON COLUMN public.users.verification_notes IS 'Admin notes about verification';

-- ============================================
-- VERIFICATION QUERIES FOR TESTING
-- ============================================

-- View all users with verification status
-- SELECT id, email, full_name, verification_status, verification_document_type, verification_submitted_at
-- FROM public.users
-- ORDER BY verification_submitted_at DESC NULLS LAST;

-- View pending verifications
-- SELECT id, email, full_name, verification_document_type, verification_submitted_at
-- FROM public.users
-- WHERE verification_status = 'pending'
-- ORDER BY verification_submitted_at ASC;

-- Count by verification status
-- SELECT verification_status, COUNT(*) as count
-- FROM public.users
-- GROUP BY verification_status;

