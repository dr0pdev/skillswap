# Admin Panel Setup & Usage Guide

## Overview
A complete admin panel system for managing user verification requests with:
- Separate admin login
- Fixed admin credentials
- Verification request management (approve/reject)
- Similar sidebar layout to user dashboard
- Activity logging

## Setup Instructions

### 1. Run Database Migrations

In Supabase SQL Editor, run in this order:

#### Step 1: Create Admin System
```sql
-- Run: create_admin_system.sql
-- This adds:
-- - role column to users table
-- - Admin RLS policies
-- - Helper functions
-- - Admin activity logging
```

### 2. Create Admin User - DATABASE ONLY

**⚠️ CRITICAL SECURITY NOTE**: Admin users can ONLY be created through the database backend. There is no frontend registration or user creation for admin accounts.

#### Create Admin User via Supabase:

**Step A: Create Auth User**
1. Go to Supabase Dashboard → **Authentication** → **Users**
2. Click **"Add User"**
3. Fill in:
   - **Email**: `admin@skillswap.com`
   - **Password**: `Admin@123456`
   - **Auto Confirm User**: Toggle ON
4. Click **"Create User"**
5. Note the user ID from the list

**Step B: Set Admin Role in Database**
In Supabase SQL Editor, run:
```sql
UPDATE public.users 
SET role = 'admin',
    full_name = 'System Administrator',
    verification_status = 'verified'
WHERE email = 'admin@skillswap.com';
```

**Step C: Verify Admin Setup**
```sql
SELECT id, email, role, full_name 
FROM public.users 
WHERE role = 'admin';
```

**Important**: The admin login page (`/admin/login`) only authenticates existing admin users. It does NOT create new admin accounts.

## Admin Credentials

**Default Admin Login:**
- Email: `admin@skillswap.com`
- Password: `Admin@123456`

⚠️ **Security Note**: Change these credentials in production!

## Features

### 1. Admin Login Page
- Route: `/admin/login`
- Accessible from regular login page via "Admin Login" link
- **Authentication only** - does NOT allow admin registration
- Validates admin role after authentication
- Auto-redirects to admin dashboard
- **Security**: Admin accounts can only be created in the database

### 2. Admin Dashboard
- **Sidebar Navigation** (similar to user dashboard)
  - Collapsible sidebar
  - Verification Requests section
  - Sign Out option
- **Responsive Design**
  - Mobile hamburger menu
  - Desktop fixed sidebar

### 3. Verification Management (`/admin/verifications`)

#### Statistics Dashboard
- **Pending**: Count of verification requests awaiting review
- **Verified**: Total approved verifications
- **Rejected**: Total rejected verifications  
- **Total Users**: Overall user count

#### Filter Tabs
- **Pending**: Verification requests to review
- **Verified**: Approved verifications
- **Rejected**: Rejected verifications
- **All**: Complete overview

#### Request Table Columns
1. **User**: Name and email
2. **Document Type**: CNIC or Student ID
3. **Status**: Current verification state
4. **Submitted**: Submission date
5. **Document**: Link to view uploaded document
6. **Actions**: Approve/Reject buttons

#### Actions
- **Approve**: ✅ Marks verification as verified
- **Reject**: ❌ Prompts for rejection reason, marks as rejected

## User Flow

### Admin Login:
1. Navigate to `/admin/login` or click "Admin Login" on regular login page
2. Enter admin credentials
3. System validates admin role
4. Redirects to verification dashboard

### Managing Verifications:
1. View pending requests in the table
2. Click "View" to see uploaded document
3. Click **"Approve"** to verify the user
4. Click **"Reject"** to deny (optionally add rejection reason)
5. User receives updated status on their profile

### Logout:
- Click "Sign Out" in sidebar
- Redirects to admin login page

## Database Structure

### Users Table Additions
```sql
role TEXT DEFAULT 'user' ('user' | 'admin')
```

### Admin Activity Logs Table
```sql
CREATE TABLE admin_activity_logs (
  id UUID PRIMARY KEY,
  admin_id UUID REFERENCES users(id),
  action TEXT, -- 'approve_verification', 'reject_verification'
  target_user_id UUID REFERENCES users(id),
  details JSONB,
  created_at TIMESTAMPTZ
);
```

### Helper Functions
- `is_admin()`: Check if current user is admin
- `get_pending_verification_count()`: Get count of pending verifications

## RLS Policies

### Admin Permissions:
- ✅ View all users
- ✅ Update all users
- ✅ View all verification documents
- ✅ View and insert activity logs

### Security:
- Only users with `role = 'admin'` can access admin features
- Regular users cannot see or modify verification data
- Admin actions are logged for audit trail

## File Structure

```
src/
├── pages/
│   └── admin/
│       ├── AdminLogin.jsx        # Admin login page
│       └── Verifications.jsx     # Verification management
├── components/
│   └── layout/
│       └── AdminLayout.jsx       # Admin sidebar layout
└── App.jsx                        # Updated with admin routes

Database:
├── create_admin_system.sql        # Admin system setup
└── add_user_verification.sql     # Verification system (prerequisite)
```

## Routes

### Admin Routes:
- `/admin/login` - Admin login page
- `/admin/verifications` - Verification requests management
- `/admin/dashboard` - Redirects to verifications
- `/admin` - Redirects to verifications

### Protected:
All admin routes (except login) require authentication and admin role.

## Testing

### 1. Test Admin Login
```bash
# Navigate to: http://localhost:5173/admin/login
# Login with: admin@skillswap.com / Admin@123456
# Should redirect to /admin/verifications
```

### 2. Test Non-Admin Login
```bash
# Try logging in as regular user at /admin/login
# Should show error: "Access denied. Admin credentials required."
```

### 3. Test Verification Management
1. Login as regular user
2. Upload verification document on Profile page
3. Login as admin
4. See pending request in verification dashboard
5. Approve or reject the verification
6. Logout and login as regular user
7. Check profile - verification status should be updated

### 4. Test Activity Logging
```sql
-- View recent admin actions
SELECT 
  al.created_at,
  al.action,
  admin.full_name as admin_name,
  target.email as target_user_email,
  al.details
FROM public.admin_activity_logs al
LEFT JOIN public.users admin ON al.admin_id = admin.id
LEFT JOIN public.users target ON al.target_user_id = target.id
ORDER BY al.created_at DESC
LIMIT 10;
```

## Future Enhancements

### Planned Features:
1. **Dashboard Analytics**
   - Total users graph
   - Verification rate trends
   - Monthly statistics

2. **User Management**
   - View all users
   - Ban/unban users
   - View user activity

3. **Swap Management**
   - View all swaps
   - Resolve disputes
   - Swap statistics

4. **Content Moderation**
   - Review reported profiles
   - Skill validation
   - Content flagging system

5. **System Settings**
   - Configure platform settings
   - Email templates
   - Feature flags

## Security Best Practices

### Production Deployment:
1. **Change Default Credentials**
   ```sql
   -- Create new admin with strong password
   -- Then delete or disable default admin
   ```

2. **Enable 2FA for Admin Accounts**
   - Configure in Supabase Auth settings
   - Require for all admin users

3. **Audit Logs**
   - Regularly review admin_activity_logs
   - Set up alerts for suspicious activity

4. **Rate Limiting**
   - Implement login rate limiting
   - Protect against brute force attacks

5. **HTTPS Only**
   - Enforce HTTPS in production
   - No admin access over HTTP

## Troubleshooting

### Issue: Can't login as admin
**Solution**: 
1. Check user exists: `SELECT * FROM users WHERE email = 'admin@skillswap.com'`
2. Check role: Ensure `role = 'admin'`
3. Check password: Reset in Supabase Auth Dashboard

### Issue: Pending verifications not showing
**Solution**:
1. Check RLS policies are created
2. Verify admin role is set correctly
3. Check browser console for errors

### Issue: Can't approve/reject verifications
**Solution**:
1. Check admin RLS policies for UPDATE permission
2. Verify `admin_activity_logs` table exists
3. Check browser console for detailed error

### Issue: Document links not working
**Solution**:
1. Check storage bucket RLS policies
2. Verify documents exist in storage
3. Check public URL generation

## Support & Maintenance

### Regular Maintenance Tasks:
1. Review admin activity logs weekly
2. Monitor pending verification queue
3. Clean up old activity logs (>6 months)
4. Update admin credentials regularly
5. Review and update RLS policies as needed

### Monitoring Queries:
```sql
-- Get admin activity summary
SELECT 
  action,
  COUNT(*) as count,
  DATE(created_at) as date
FROM admin_activity_logs
WHERE created_at > NOW() - INTERVAL '30 days'
GROUP BY action, DATE(created_at)
ORDER BY date DESC;

-- Get average verification processing time
SELECT 
  AVG(EXTRACT(EPOCH FROM (verification_reviewed_at - verification_submitted_at))/3600) as avg_hours
FROM users
WHERE verification_status IN ('verified', 'rejected')
AND verification_submitted_at IS NOT NULL;
```

## Complete Setup Checklist

- [ ] Run `create_admin_system.sql` in Supabase
- [ ] Create admin user in Supabase Auth Dashboard
- [ ] Update user role to 'admin' via SQL
- [ ] Verify admin login works at `/admin/login`
- [ ] Test verification approval/rejection flow
- [ ] Check activity logging is working
- [ ] Change default admin credentials (production)
- [ ] Set up 2FA for admin accounts (production)
- [ ] Configure rate limiting (production)
- [ ] Set up monitoring alerts (production)

## Quick Reference

### Admin Access
- **URL**: `http://localhost:5173/admin/login`
- **Email**: `admin@skillswap.com`
- **Password**: `Admin@123456`

### Key Files
- Database: `create_admin_system.sql`
- Login Page: `src/pages/admin/AdminLogin.jsx`
- Dashboard: `src/pages/admin/Verifications.jsx`
- Layout: `src/components/layout/AdminLayout.jsx`

### SQL Quick Commands
```sql
-- Make user admin
UPDATE users SET role = 'admin' WHERE email = 'user@example.com';

-- Remove admin role
UPDATE users SET role = 'user' WHERE email = 'admin@example.com';

-- View pending verifications
SELECT * FROM users WHERE verification_status = 'pending';

-- View admin actions
SELECT * FROM admin_activity_logs ORDER BY created_at DESC LIMIT 20;
```

