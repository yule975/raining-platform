// 检查Supabase Auth中的用户
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

async function checkAuthUsers() {
  console.log('检查Supabase Auth中的用户...');
  
  try {
    // 获取所有用户
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('获取用户列表失败:', error.message);
      return;
    }
    
    console.log(`\n找到 ${users.users.length} 个用户:`);
    
    // 查找测试账号
    const testEmails = ['admin@test.com', 'student@test.com'];
    const foundUsers = [];
    
    users.users.forEach((user, index) => {
      console.log(`\n${index + 1}. 用户ID: ${user.id}`);
      console.log(`   邮箱: ${user.email}`);
      console.log(`   邮箱已验证: ${user.email_confirmed_at ? '是' : '否'}`);
      console.log(`   创建时间: ${user.created_at}`);
      console.log(`   最后登录: ${user.last_sign_in_at || '从未登录'}`);
      console.log(`   用户元数据: ${JSON.stringify(user.user_metadata, null, 2)}`);
      
      if (testEmails.includes(user.email)) {
        foundUsers.push(user.email);
      }
    });
    
    console.log('\n测试账号检查:');
    testEmails.forEach(email => {
      if (foundUsers.includes(email)) {
        console.log(`✓ ${email} 存在于Auth系统中`);
      } else {
        console.log(`✗ ${email} 不存在于Auth系统中`);
      }
    });
    
    // 如果测试账号不存在，尝试创建
    const missingUsers = testEmails.filter(email => !foundUsers.includes(email));
    if (missingUsers.length > 0) {
      console.log('\n尝试创建缺失的测试账号...');
      
      for (const email of missingUsers) {
        try {
          const password = 'password123';
          const { data, error } = await supabase.auth.admin.createUser({
            email: email,
            password: password,
            email_confirm: true,
            user_metadata: {
              full_name: email === 'admin@test.com' ? '测试管理员' : '测试学员'
            }
          });
          
          if (error) {
            console.log(`✗ 创建 ${email} 失败:`, error.message);
          } else {
            console.log(`✓ 成功创建 ${email}`);
          }
        } catch (createError) {
          console.log(`✗ 创建 ${email} 异常:`, createError.message);
        }
      }
    }
    
  } catch (error) {
    console.error('检查用户时发生错误:', error.message);
  }
}

// 测试登录功能
async function testLogin() {
  console.log('\n测试登录功能...');
  
  const testCredentials = [
    { email: 'admin@test.com', password: 'password123' },
    { email: 'student@test.com', password: 'password123' }
  ];
  
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
        
        // 登出
        await testClient.auth.signOut();
      }
    } catch (loginError) {
      console.log(`✗ 登录异常: ${loginError.message}`);
    }
  }
}

// 执行检查
async function main() {
  await checkAuthUsers();
  await testLogin();
}

main().catch(console.error);