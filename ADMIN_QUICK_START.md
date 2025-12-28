# Admin Panel - Quick Start Guide

## 🚀 Setup (2 Steps - Database Only)

### Step 1: Run Database Script
In Supabase SQL Editor:
```sql
-- Run: create_admin_system.sql
```

### Step 2: Create Admin User in Database
In Supabase SQL Editor:
```sql
-- First, create admin user in auth system
-- You need to do this in Supabase Dashboard → Authentication → Users:
-- 1. Click "Add User"
-- 2. Email: admin@skillswap.com
-- 3. Password: Admin@123456
-- 4. Toggle "Auto Confirm User" ON
-- 5. Click "Create User"
-- 6. Copy the user ID from the user list

-- Then run this SQL to set admin role:
UPDATE public.users 
SET role = 'admin',
    full_name = 'System Administrator',
    verification_status = 'verified'
WHERE email = 'admin@skillswap.com';

-- Verify admin user is set up:
SELECT id, email, role, full_name 
FROM public.users 
WHERE role = 'admin';
```

**⚠️ IMPORTANT**: Admin users can ONLY be created through the database. There is no frontend way to create admin accounts for security reasons.

## ✅ Done! Test It

### Access Admin Panel:
1. Go to: `http://localhost:5173/admin/login`
2. Login with:
   - Email: `admin@skillswap.com`
   - Password: `Admin@123456`
3. You'll see the Verification Requests dashboard

## 📋 What You Get

### Admin Features:
- ✅ Separate admin login page (NO registration - admins created in database only)
- ✅ Admin dashboard with sidebar (similar to user dashboard)
- ✅ View all verification requests
- ✅ Approve/Reject verifications
- ✅ Filter by status (Pending, Verified, Rejected, All)
- ✅ View uploaded documents
- ✅ Activity logging
- ✅ Responsive design (mobile + desktop)

### Admin Dashboard Sections:
1. **Verification Requests** (current)
   - View pending requests
   - Approve or reject with notes
   - View document images
   - Filter and search

2. **More sections can be added later**
   - User management
   - Swap disputes
   - Analytics
   - Settings

## 🔐 Admin Credentials

**Default Login:**
```
Email: admin@skillswap.com
Password: Admin@123456
```

⚠️ **Important**: Change these in production!

## 📍 Routes

- `/admin/login` - Admin login
- `/admin/verifications` - Manage verifications
- `/admin` or `/admin/dashboard` - Redirects to verifications

## 🎯 Common Tasks

### Approve a Verification:
1. Login to admin panel
2. Go to "Pending" tab
3. Click "View" to see document
4. Click "Approve" button
5. User status updates to "Verified"

### Reject a Verification:
1. Click "Reject" button
2. Enter rejection reason (optional)
3. Click OK
4. User can see rejection reason and re-upload

### View Activity Logs:
```sql
SELECT * FROM admin_activity_logs 
ORDER BY created_at DESC 
LIMIT 20;
```

## 🐛 Troubleshooting

**Can't login?**
- Check user exists: `SELECT * FROM users WHERE email = 'admin@skillswap.com'`
- Verify role is 'admin': `SELECT role FROM users WHERE email = 'admin@skillswap.com'`

**No pending requests showing?**
- Regular users need to upload documents first
- Check RLS policies are created (run `create_admin_system.sql` again)

**Getting "Access denied"?**
- Make sure you ran the UPDATE query to set role = 'admin'
- Try refreshing the page after setting admin role

## 📁 Files Created

```
Database:
└── create_admin_system.sql     # Run this first!

Frontend:
├── src/pages/admin/
│   ├── AdminLogin.jsx          # /admin/login
│   └── Verifications.jsx       # /admin/verifications
├── src/components/layout/
│   └── AdminLayout.jsx         # Admin sidebar
└── src/App.jsx                 # Updated with routes
```

## 🔄 Testing Flow

1. **As Regular User:**
   - Login to app
   - Go to Profile
   - Upload CNIC or Student ID
   - See status: "Pending Review"

2. **As Admin:**
   - Go to `/admin/login`
   - See pending request in table
   - Click "View" to see document
   - Click "Approve" or "Reject"

3. **Back to Regular User:**
   - Refresh profile page
   - See status updated to "Verified" or "Rejected"

## 🎨 UI Features

- ✅ Dark theme matching user dashboard
- ✅ Collapsible sidebar
- ✅ Mobile responsive
- ✅ Statistics cards
- ✅ Filter tabs
- ✅ Clean table layout
- ✅ Action buttons with loading states

## 📚 Full Documentation

See `ADMIN_PANEL_SETUP.md` for:
- Detailed feature list
- Security best practices
- Future enhancements
- Maintenance tasks
- Complete API reference

## Need Help?

1. Check `ADMIN_PANEL_SETUP.md` for detailed docs
2. Run SQL queries to verify setup:
   ```sql
   -- Check admin user
   SELECT * FROM users WHERE role = 'admin';
   
   -- Check pending verifications
   SELECT * FROM users WHERE verification_status = 'pending';
   ```
3. Check browser console for errors
4. Verify all migrations ran successfully

