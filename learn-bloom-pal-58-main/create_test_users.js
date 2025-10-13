import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少Supabase配置');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '✅ 已设置' : '❌ 未设置');
  console.log('SUPABASE_SERVICE_ROLE_KEY:', supabaseServiceKey ? '✅ 已设置' : '❌ 未设置');
  process.exit(1);
}

// 使用service role key创建admin客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function createTestUsers() {
  console.log('🚀 开始创建测试用户...');
  
  const testUsers = [
    {
      email: 'student@test.com',
      password: 'student123456',
      role: 'student',
      name: '测试学员'
    },
    {
      email: 'admin@test.com', 
      password: 'admin123456',
      role: 'admin',
      name: '测试管理员'
    }
  ];

  for (const user of testUsers) {
    console.log(`\n📧 创建用户: ${user.email}`);
    
    try {
      // 使用Admin API创建用户
      const { data, error } = await supabase.auth.admin.createUser({
        email: user.email,
        password: user.password,
        email_confirm: true, // 自动确认邮箱
        user_metadata: {
          name: user.name,
          role: user.role
        }
      });

      if (error) {
        console.error(`❌ 创建用户失败: ${error.message}`);
        continue;
      }

      console.log(`✅ 用户创建成功: ${data.user.email}`);
      console.log(`   用户ID: ${data.user.id}`);
      console.log(`   邮箱确认: ${data.user.email_confirmed_at ? '✅' : '❌'}`);
      
    } catch (err) {
      console.error(`❌ 创建用户异常:`, err.message);
    }
  }

  // 验证创建的用户
  console.log('\n🔍 验证创建的用户...');
  try {
    const { data: users, error } = await supabase.auth.admin.listUsers();
    
    if (error) {
      console.error('❌ 获取用户列表失败:', error.message);
      return;
    }

    console.log(`\n📊 总用户数: ${users.users.length}`);
    
    const testEmails = ['student@test.com', 'admin@test.com'];
    testEmails.forEach(email => {
      const user = users.users.find(u => u.email === email);
      if (user) {
        console.log(`✅ ${email}: 存在 (ID: ${user.id.substring(0, 8)}...)`);
        console.log(`   邮箱确认: ${user.email_confirmed_at ? '✅' : '❌'}`);
        console.log(`   创建时间: ${user.created_at}`);
      } else {
        console.log(`❌ ${email}: 不存在`);
      }
    });
    
  } catch (err) {
    console.error('❌ 验证用户异常:', err.message);
  }
}

// 测试登录功能
async function testLogin() {
  console.log('\n🧪 测试登录功能...');
  
  // 创建普通客户端用于测试登录
  const testClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
  
  const testCredentials = [
    { email: 'student@test.com', password: 'student123456' },
    { email: 'admin@test.com', password: 'admin123456' }
  ];

  for (const cred of testCredentials) {
    console.log(`\n🔐 测试登录: ${cred.email}`);
    
    try {
      const { data, error } = await testClient.auth.signInWithPassword({
        email: cred.email,
        password: cred.password
      });

      if (error) {
        console.error(`❌ 登录失败: ${error.message}`);
      } else {
        console.log(`✅ 登录成功: ${data.user.email}`);
        
        // 登出
        await testClient.auth.signOut();
      }
    } catch (err) {
      console.error(`❌ 登录异常:`, err.message);
    }
  }
}

// 主函数
async function main() {
  try {
    await createTestUsers();
    await testLogin();
    console.log('\n🎉 测试用户创建和验证完成!');
  } catch (error) {
    console.error('❌ 脚本执行失败:', error);
    process.exit(1);
  }
}

main();