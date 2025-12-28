-- ============================================
-- CHECK AND FIX VERIFICATION DOCUMENT URLs
-- ============================================

-- Step 1: Check what format the URLs are in
SELECT 
  id,
  email,
  verification_status,
  verification_document_url,
  CASE 
    WHEN verification_document_url LIKE 'http%' THEN 'Full URL (old format)'
    WHEN verification_document_url LIKE '%/%' THEN 'File path (new format)'
    ELSE 'Unknown format'
  END as url_format
FROM public.users
WHERE verification_document_url IS NOT NULL
ORDER BY verification_submitted_at DESC;

-- ============================================
-- OPTIONAL: Convert old URLs to new file paths
-- ============================================
-- Only run this if you want to convert old URLs to new format
-- (Not required - the code now handles both formats)

-- UPDATE public.users
-- SET verification_document_url = regexp_replace(
--   verification_document_url, 
--   '.*\/storage\/v1\/object\/public\/verification-documents\/', 
--   ''
-- )
-- WHERE verification_document_url LIKE '%/storage/v1/object/public/verification-documents/%';

-- Verify the conversion (optional)
-- SELECT 
--   email,
--   verification_document_url
-- FROM public.users
-- WHERE verification_document_url IS NOT NULL;

-- ============================================
-- NOTES
-- ============================================
/*
The updated code now handles BOTH formats:
1. Old format: Full URLs like "https://xyz.supabase.co/storage/v1/object/public/verification-documents/user-id/file.jpg"
2. New format: File paths like "user-id/file.jpg"

So you DON'T need to run the UPDATE query unless you want to clean up the database.
The "View Document" button will work with both formats automatically.
*/

