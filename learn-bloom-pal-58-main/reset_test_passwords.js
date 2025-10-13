// 重置测试账号密码
import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = 'https://upwrgkhpuwxkbwndxxxs.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwd3Jna2hwdXd4a2J3bmR4eHhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjczNTg3OCwiZXhwIjoyMDcyMzExODc4fQ._4vm3xYlPdweWxagLryniOmw2Xgs45icnFfiYxPd_V4';

// 创建Supabase客户端（使用service role key）
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function resetTestPasswords() {
  console.log('重置测试账号密码...');
  
  const testAccounts = [
    { email: 'admin@test.com', name: '测试管理员', role: 'admin' },
    { email: 'student@test.com', name: '测试学员', role: 'student' }
  ];
  
  for (const account of testAccounts) {
    try {
      console.log(`\n处理账号: ${account.email}`);
      
      // 首先获取用户信息
      const { data: users, error: listError } = await supabase.auth.admin.listUsers();
      if (listError) {
        console.log(`✗ 获取用户列表失败: ${listError.message}`);
        continue;
      }
      
      const user = users.users.find(u => u.email === account.email);
      if (!user) {
        console.log(`✗ 用户不存在: ${account.email}`);
        continue;
      }
      
      console.log(`找到用户ID: ${user.id}`);
      
      // 重置密码
      const { data, error } = await supabase.auth.admin.updateUserById(
        user.id,
        {
          password: 'password123',
          user_metadata: {
            email_verified: true,
            name: account.name,
            role: account.role
          }
        }
      );
      
      if (error) {
        console.log(`✗ 重置密码失败: ${error.message}`);
      } else {
        console.log(`✓ 成功重置密码`);
      }
      
    } catch (error) {
      console.log(`✗ 处理 ${account.email} 时发生异常:`, error.message);
    }
  }
}

// 测试登录功能
async function testLoginAfterReset() {
  console.log('\n测试重置后的登录功能...');
  
  const testCredentials = [
    { email: 'admin@test.com', password: 'password123' },
    { email: 'student@test.com', password: 'password123' }
  ];
  
  // 等待一下让密码更新生效
  await new Promise(resolve => setTimeout(resolve, 2000));
  
  for (const { email, password } of testCredentials) {
    try {
      console.log(`\n测试登录: ${email}`);
      
      // 使用普通客户端测试登录
      const testClient = createClient(supabaseUrl, 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwd3Jna2hwdXd4a2J3bmR4eHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MzU4NzgsImV4cCI6MjA3MjMxMTg3OH0.NyJFFUG5B72cw99TAkmJMifxCM9tAKVN8OrCTBuHwAo');
      
      const { data, error } = await testClient.auth.signInWithPassword({
        email: email,
        password: password
      });
      
      if (error) {
        console.log(`✗ 登录失败: ${error.message}`);
      } else {
        console.log(`✓ 登录成功`);
        console.log(`  用户ID: ${data.user?.id}`);
        console.log(`  邮箱: ${data.user?.email}`);
        console.log(`  用户元数据: ${JSON.stringify(data.user?.user_metadata, null, 2)}`);
        
        // 登出
        await testClient.auth.signOut();
      }
    } catch (loginError) {
      console.log(`✗ 登录异常: ${loginError.message}`);
    }
  }
}

// 执行重置
async function main() {
  await resetTestPasswords();
  await testLoginAfterReset();
}

main().catch(console.error);