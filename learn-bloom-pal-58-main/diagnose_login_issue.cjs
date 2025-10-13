require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取配置
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

console.log('=== 登录问题诊断脚本 ===\n');

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少Supabase配置');
  console.log('VITE_SUPABASE_URL:', supabaseUrl ? '已配置' : '未配置');
  console.log('VITE_SUPABASE_ANON_KEY:', supabaseAnonKey ? '已配置' : '未配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function diagnoseLoginIssue() {
  try {
    console.log('1. 测试Supabase连接...');
    const { data: connectionTest, error: connectionError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (connectionError) {
      console.error('❌ Supabase连接失败:', connectionError.message);
      return;
    }
    console.log('✅ Supabase连接正常');

    console.log('\n2. 检查测试用户是否存在于Auth中...');
    const testEmail = 'admin@test.com';
    const testPassword = 'password123';
    
    // 尝试登录测试用户
    console.log('尝试登录测试用户:', testEmail);
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: testEmail,
      password: testPassword
    });
    
    if (loginError) {
      console.error('❌ 登录失败:', loginError.message);
      console.log('错误代码:', loginError.status);
      
      // 检查是否是凭据错误
      if (loginError.message.includes('Invalid login credentials')) {
        console.log('\n3. 检查用户是否存在于Auth表中...');
        // 由于无法直接查询auth.users，我们检查profiles表
        const { data: profileData, error: profileError } = await supabase
          .from('profiles')
          .select('*')
          .eq('email', testEmail)
          .single();
        
        if (profileError) {
          console.log('❌ 在profiles表中未找到用户:', profileError.message);
        } else {
          console.log('✅ 在profiles表中找到用户:', profileData);
        }
        
        // 检查authorized_users表
        const { data: authData, error: authError } = await supabase
          .from('authorized_users')
          .select('*')
          .eq('email', testEmail)
          .single();
        
        if (authError) {
          console.log('❌ 在authorized_users表中未找到用户:', authError.message);
        } else {
          console.log('✅ 在authorized_users表中找到用户:', authData);
        }
        
        console.log('\n建议解决方案:');
        console.log('1. 运行 node scripts/create_test_users.js 重新创建测试用户');
        console.log('2. 检查Supabase Auth面板中是否存在该用户');
        console.log('3. 确认用户邮箱已验证');
      }
      return;
    }
    
    console.log('✅ 登录成功!');
    console.log('用户信息:', {
      id: loginData.user?.id,
      email: loginData.user?.email,
      email_confirmed_at: loginData.user?.email_confirmed_at,
      created_at: loginData.user?.created_at
    });
    
    console.log('\n4. 检查用户profile...');
    const { data: profileData, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', loginData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ 获取用户profile失败:', profileError.message);
    } else {
      console.log('✅ 用户profile:', profileData);
    }
    
    console.log('\n5. 检查用户授权状态...');
    const { data: authData, error: authError } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (authError) {
      console.error('❌ 用户未在授权列表中:', authError.message);
    } else {
      console.log('✅ 用户授权状态:', authData);
    }
    
    // 登出
    await supabase.auth.signOut();
    console.log('\n✅ 诊断完成，登录流程正常');
    
  } catch (error) {
    console.error('❌ 诊断过程中发生错误:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行诊断
diagnoseLoginIssue();