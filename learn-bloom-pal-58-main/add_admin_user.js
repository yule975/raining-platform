import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://upwrgkhpuwxkbwndxxxs.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwd3Jna2hwdXd4a2J3bmR4eHhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjczNTg3OCwiZXhwIjoyMDcyMzExODc4fQ._4vm3xYlPdweWxagLryniOmw2Xgs45icnFfiYxPd_V4';

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function addAdminUser() {
  try {
    console.log('正在添加管理员用户 admin@example.com...');
    
    // 添加到authorized_users表
    const { data, error } = await supabase
      .from('authorized_users')
      .insert([
        {
          email: 'admin@example.com',
          name: '管理员',
          status: 'active'
        }
      ]);
    
    if (error) {
      console.error('添加用户失败:', error);
      return;
    }
    
    console.log('✅ 成功添加管理员用户 admin@example.com');
    
    // 验证添加结果
    const { data: users, error: queryError } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('email', 'admin@example.com');
    
    if (queryError) {
      console.error('查询用户失败:', queryError);
      return;
    }
    
    console.log('验证结果:', users);
    
  } catch (error) {
    console.error('操作异常:', error.message);
  }
}

addAdminUser();