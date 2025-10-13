import { createClient } from '@supabase/supabase-js';

// Supabase配置
const supabaseUrl = 'https://upwrgkhpuwxkbwndxxxs.supabase.co';
const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwd3Jna2hwdXd4a2J3bmR4eHhzIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTY3MzU4NzgsImV4cCI6MjA3MjMxMTg3OH0.NyJFFUG5B72cw99TAkmJMifxCM9tAKVN8OrCTBuHwAo';

const supabase = createClient(supabaseUrl, supabaseKey);

async function checkAuthorizedUsers() {
  try {
    console.log('正在查询authorized_users表...');
    
    // 查询所有授权用户
    const { data, error } = await supabase
      .from('authorized_users')
      .select('*');
    
    if (error) {
      console.error('查询失败:', error);
      return;
    }
    
    console.log('授权用户列表:');
    console.log('总数:', data?.length || 0);
    
    if (data && data.length > 0) {
      data.forEach((user, index) => {
        console.log(`${index + 1}. 邮箱: ${user.email}, 姓名: ${user.name}, 角色: ${user.role}, 状态: ${user.status}`);
      });
    } else {
      console.log('没有找到任何授权用户');
    }
    
    // 检查特定邮箱（如果需要）
    const testEmail = 'admin@example.com'; // 可以修改为实际测试的邮箱
    console.log(`\n检查邮箱 ${testEmail} 是否在授权列表中...`);
    
    const { data: specificUser, error: specificError } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('email', testEmail)
      .single();
    
    if (specificError && specificError.code !== 'PGRST116') {
      console.error('查询特定用户失败:', specificError);
    } else if (specificUser) {
      console.log('找到用户:', specificUser);
    } else {
      console.log('用户不在授权列表中');
    }
    
  } catch (error) {
    console.error('执行失败:', error);
  }
}

checkAuthorizedUsers();