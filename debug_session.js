// Paste this in browser console (F12) to debug session issues
// Run this RIGHT AFTER closing and reopening browser

console.log('=== SESSION DEBUG ===');

// 1. Check localStorage
console.log('📦 localStorage keys:', Object.keys(localStorage));
const authKey = Object.keys(localStorage).find(k => k.includes('auth'));
if (authKey) {
  console.log('🔑 Auth key found:', authKey);
  try {
    const authData = JSON.parse(localStorage.getItem(authKey));
    console.log('✅ Session data exists:', {
      hasAccessToken: !!authData?.access_token,
      hasRefreshToken: !!authData?.refresh_token,
      expiresAt: new Date(authData?.expires_at * 1000).toLocaleString(),
      email: authData?.user?.email
    });
  } catch (e) {
    console.error('❌ Failed to parse auth data:', e);
  }
} else {
  console.log('❌ No auth key found in localStorage');
}

// 2. Check if Supabase client exists
console.log('🔌 Supabase client loaded:', typeof supabase !== 'undefined');

// 3. Try to get session
if (typeof supabase !== 'undefined') {
  supabase.auth.getSession().then(({ data, error }) => {
    if (error) {
      console.error('❌ getSession error:', error);
    } else {
      console.log('✅ getSession result:', {
        hasSession: !!data.session,
        email: data.session?.user?.email,
        expiresAt: data.session?.expires_at ? new Date(data.session.expires_at * 1000).toLocaleString() : 'N/A'
      });
    }
  });
  
  // 4. Check auth state
  setTimeout(() => {
    supabase.auth.getUser().then(({ data, error }) => {
      if (error) {
        console.error('❌ getUser error:', error);
      } else {
        console.log('✅ Current user:', data.user?.email || 'None');
      }
    });
  }, 1000);
}

console.log('=== END DEBUG ===');
console.log('ℹ️ If session exists but app is stuck, check console for auth state logs');

