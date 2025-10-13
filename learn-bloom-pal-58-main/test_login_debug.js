// 登录调试测试脚本
import { createClient } from '@supabase/supabase-js';

// Supabase 配置
const supabaseUrl = 'https://upwrgkhpuwxkbwndxxxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwd3Jna2hwdXd4a2J3bmR4eHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MzU4NzgsImV4cCI6MjA3MjMxMTg3OH0.NyJFFUG5B72cw99TAkmJMifxCM9tAKVN8OrCTBuHwAo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function testLogin() {
  console.log('=== 开始登录调试测试 ===');
  
  // 测试管理员账号
  const adminEmail = 'xiewenxuan001@51Talk.com';
  const adminPassword = 'Admin123456!';
  
  console.log('\n1. 测试网络连接...');
  try {
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    if (error) {
      console.error('网络连接测试失败:', error.message);
      return;
    }
    console.log('✓ 网络连接正常');
  } catch (err) {
    console.error('网络连接异常:', err.message);
    return;
  }
  
  console.log('\n2. 测试管理员登录...');
  try {
    console.log('尝试登录:', adminEmail);
    
    const { data: signInData, error: signInError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });
    
    if (signInError) {
      console.error('❌ 登录失败:', signInError.message);
      console.error('错误详情:', signInError);
      return;
    }
    
    console.log('✓ Supabase 认证成功');
    console.log('用户ID:', signInData.user?.id);
    console.log('用户邮箱:', signInData.user?.email);
    
    // 检查用户角色
    console.log('\n3. 检查用户角色...');
    const { data: profile, error: profileError } = await supabase
      .from('profiles')
      .select('role, full_name')
      .eq('id', signInData.user.id)
      .single();
    
    if (profileError) {
      console.error('❌ 获取用户角色失败:', profileError.message);
      console.error('错误详情:', profileError);
      return;
    }
    
    console.log('✓ 用户角色:', profile.role);
    console.log('✓ 用户姓名:', profile.full_name);
    
    if (profile.role === 'admin') {
      console.log('\n🎉 管理员登录测试成功！');
    } else {
      console.log('\n⚠️  用户角色不是管理员:', profile.role);
    }
    
  } catch (err) {
    console.error('❌ 登录过程异常:', err.message);
    console.error('异常详情:', err);
  }
  
  console.log('\n=== 登录调试测试完成 ===');
}

// 运行测试
testLogin().catch(console.error);