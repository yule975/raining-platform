import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://upwrgkhpuwxkbwndxxxs.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwd3Jna2hwdXd4a2J3bmR4eHhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjczNTg3OCwiZXhwIjoyMDcyMzExODc4fQ._4vm3xYlPdweWxagLryniOmw2Xgs45icnFfiYxPd_V4';

// Use service role key for admin operations
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createAuthUser() {
  try {
    console.log('Creating auth user for admin@example.com...');
    
    // Create user in Supabase Auth
    const { data, error } = await supabase.auth.admin.createUser({
      email: 'admin@example.com',
      password: 'admin123',
      email_confirm: true
    });
    
    if (error) {
      console.error('Failed to create auth user:', error.message);
      return;
    }
    
    console.log('Auth user created successfully!');
    console.log('User ID:', data.user.id);
    console.log('Email:', data.user.email);
    
  } catch (err) {
    console.error('Error:', err.message);
  }
}

createAuthUser();