# 🔑 Test Credentials

## ⚠️ Important Note

This application uses **Supabase Authentication**, which means:
- **NO pre-seeded user accounts exist**
- You must create accounts through the signup process
- Passwords are hashed and stored securely by Supabase

## 📝 How to Create Test Accounts

### Option 1: Quick Test Setup (Recommended)

1. **Open your app** at `http://localhost:5173`
2. **Click "Sign Up"**
3. **Create these test accounts:**

```
Test User 1:
Email: alice@example.com
Password: TestPass123!

Test User 2:
Email: bob@example.com
Password: TestPass123!

Test User 3:
Email: charlie@example.com
Password: TestPass123!
```

4. **Add sample data** (optional):
   - After creating the users above
   - Go to your Supabase project → SQL Editor
   - Run the script from `seed_test_users.sql`
   - This adds profile info and skills for realistic testing

### Option 2: Create Your Own Account

Just use any email and password:
```
Email: your.email@example.com
Password: YourSecurePassword123!
```

## ✅ What You Can Test

Once logged in, you can:

1. **Add Skills**
   - Go to "Skills" page
   - Add skills you can teach (e.g., Python, JavaScript)
   - Add skills you want to learn (e.g., Spanish, Guitar)

2. **Find Matches**
   - Go to "Find Swaps" page
   - See AI-powered fair matches with other users
   - View fairness scores and explanations

3. **Propose Swaps**
   - Click "Propose Swap" on any match
   - Set start date and duration
   - Other user can accept/decline

4. **View Profile**
   - Check your reputation score
   - See completed swaps
   - Update your bio and info

## 🎯 Example Skill Combinations for Testing

To see the matching algorithm work, create users with complementary skills:

**Alice** (User 1):
- Teaches: Python (Advanced), React (Intermediate)
- Wants to learn: Spanish, Guitar

**Bob** (User 2):
- Teaches: Graphic Design (Advanced), Photoshop (Advanced)
- Wants to learn: Python, Photography

**Charlie** (User 3):
- Teaches: Spanish (Advanced), Guitar (Intermediate)
- Wants to learn: React, JavaScript

With these combinations:
- Alice and Charlie should have a high fairness match (Python/Spanish swap)
- Bob and Alice could swap Python for Graphic Design
- Charlie and Alice could swap Guitar for React

## 🔒 Security Note

- All passwords are hashed by Supabase Auth
- Row Level Security (RLS) protects user data
- Users can only see/modify their own data
- Swap details visible only to participants

## 🐛 Troubleshooting

### "Email already registered"
- Use a different email address
- Or use the existing credentials if you created them

### "Invalid login credentials"
- Check your email/password spelling
- Passwords are case-sensitive
- Make sure you signed up first

### "Can't find any matches"
- Make sure you have at least one "teach" skill AND one "learn" skill
- Create a second test user with complementary skills
- The fairness score threshold is 60+ (very low scores won't show)

## 💡 Pro Tips

1. **Test with multiple browsers** - Use Chrome for User 1, Firefox for User 2
2. **Use incognito mode** - Open multiple incognito windows for different users
3. **Check Supabase Dashboard** - View real-time data in Table Editor
4. **Enable RLS debugging** - Check Supabase logs for permission errors

---

**Happy testing! 🚀**

