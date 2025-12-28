# User Verification System Implementation

## Overview
Added a complete identity verification system that allows users to upload CNIC or Student ID documents for manual review and verification.

## Database Changes

### 1. New Columns in `users` Table
Run `add_user_verification.sql` in Supabase SQL Editor:

```sql
- verification_status: TEXT ('unverified', 'pending', 'verified', 'rejected')
- verification_document_url: TEXT (URL to uploaded document)
- verification_document_type: TEXT ('cnic', 'student_id')
- verification_submitted_at: TIMESTAMPTZ
- verification_reviewed_at: TIMESTAMPTZ
- verification_notes: TEXT (admin notes for rejection reasons)
```

### 2. Storage Bucket for Documents
Run `create_verification_storage_bucket.sql` to:
- Create a private storage bucket: `verification-documents`
- Set up RLS policies for secure access
- Configure file size limit (5MB) and allowed MIME types

## Frontend Changes

### Profile Page (`src/pages/Profile.jsx`)

#### New Features:
1. **Document Upload Section**
   - Radio buttons to select document type (CNIC or Student ID)
   - File input with validation (max 5MB, images/PDF only)
   - Upload button with loading state

2. **Verification Status Display**
   - **Unverified**: Shows upload form with benefits explanation
   - **Pending**: Shows "under review" message with submission date
   - **Verified**: Shows success message with verification date
   - **Rejected**: Shows rejection reason and allows re-upload

3. **Status Badges**
   - Color-coded badges for each verification state
   - Icons matching the status

## User Flow

### For Users:
1. Navigate to Profile page
2. Scroll to "Identity Verification" section
3. Select document type (CNIC or Student ID)
4. Choose image/PDF file (max 5MB)
5. Click "Upload & Submit"
6. Status changes to "Pending"
7. Wait for admin review

### For Admins (Manual Process):
1. Query pending verifications:
```sql
SELECT id, email, full_name, verification_document_url, 
       verification_document_type, verification_submitted_at
FROM public.users
WHERE verification_status = 'pending'
ORDER BY verification_submitted_at ASC;
```

2. Review documents and update status:
```sql
-- Approve
UPDATE public.users
SET verification_status = 'verified',
    verification_reviewed_at = NOW()
WHERE id = 'user-id-here';

-- Reject
UPDATE public.users
SET verification_status = 'rejected',
    verification_reviewed_at = NOW(),
    verification_notes = 'Document is unclear/invalid/etc'
WHERE id = 'user-id-here';
```

## Security Features

1. **Private Storage Bucket**
   - Documents are not publicly accessible
   - Only the document owner can view their own files

2. **File Validation**
   - Client-side validation for file type and size
   - Allowed types: JPEG, PNG, WebP, PDF
   - Max size: 5MB

3. **RLS Policies**
   - Users can only upload to their own folder
   - Users can only view their own documents
   - Admin policies can be added for review dashboard

## Storage Structure

Documents are stored with this path format:
```
verification-documents/
  └── {user_id}/
      └── {timestamp}.{extension}
```

Example: `verification-documents/abc123-def456/1703123456789.jpg`

## Benefits Display

The system shows users why they should verify:
- Increased visibility in search results
- Access to premium swap opportunities
- Build trust with potential swap partners

## Testing

### 1. Run Database Migrations
```bash
# In Supabase SQL Editor:
# 1. Run add_user_verification.sql
# 2. Run create_verification_storage_bucket.sql
```

### 2. Test Upload Flow
1. Login as a user
2. Go to Profile page
3. Try uploading different file types
4. Check that status changes to "pending"

### 3. Verify Storage
In Supabase Dashboard → Storage → verification-documents:
- Check that file was uploaded
- Verify file is in correct user folder
- Test that file is not publicly accessible

### 4. Test Admin Review (SQL Editor)
```sql
-- View pending
SELECT * FROM users WHERE verification_status = 'pending';

-- Approve
UPDATE users SET verification_status = 'verified', 
                 verification_reviewed_at = NOW()
WHERE id = 'test-user-id';

-- Refresh profile page to see verified status
```

## Future Enhancements

1. **Admin Dashboard**
   - Create a dedicated admin page for reviewing verifications
   - Show document preview
   - One-click approve/reject buttons

2. **Automated Verification**
   - Integrate with OCR/AI service for document validation
   - Automatic approval for clear documents

3. **Notification System**
   - Email notifications when verification is approved/rejected
   - In-app notifications

4. **Verification Badge**
   - Display verified badge on user profiles
   - Show in Browse and Find Swaps sections

## Notes

- Verification status remains "pending" until manually reviewed
- Users can re-upload if rejected
- Only one active verification document per user
- Documents are stored securely and privately
- The system is ready for production use

