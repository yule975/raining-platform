import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('缺少Supabase配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkAdminUser() {
  console.log('🔍 检查管理员用户状态...');
  
  try {
    // 1. 检查authorized_users表
    console.log('\n1. 检查authorized_users表:');
    const { data: authorizedUsers, error: authError } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('email', 'xiewenxuan001@51Talk.com');
    
    if (authError) {
      console.error('查询authorized_users失败:', authError);
    } else if (authorizedUsers && authorizedUsers.length > 0) {
      console.log('✓ authorized_users记录:', authorizedUsers[0]);
    } else {
      console.log('❌ authorized_users中没有找到管理员记录');
    }

    // 2. 检查auth.users表（Supabase的认证用户）
    console.log('\n2. 检查auth.users表:');
    const { data: authUsers, error: userError } = await supabase.auth.admin.listUsers();
    
    if (userError) {
      console.error('查询auth.users失败:', userError);
    } else {
      const adminUser = authUsers.users.find(user => user.email === 'xiewenxuan001@51Talk.com');
      if (adminUser) {
        console.log('✓ auth.users记录:', {
          id: adminUser.id,
          email: adminUser.email,
          email_confirmed_at: adminUser.email_confirmed_at,
          created_at: adminUser.created_at,
          last_sign_in_at: adminUser.last_sign_in_at
        });
      } else {
        console.log('❌ auth.users中没有找到管理员记录');
      }
    }

    // 3. 检查profiles表
    console.log('\n3. 检查profiles表:');
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*')
      .eq('email', 'xiewenxuan001@51Talk.com');
    
    if (profileError) {
      console.error('查询profiles失败:', profileError);
    } else if (profiles && profiles.length > 0) {
      console.log('✓ profiles记录:', profiles[0]);
    } else {
      console.log('❌ profiles中没有找到管理员记录');
    }

    // 4. 尝试创建或更新管理员用户
    console.log('\n4. 确保管理员用户存在:');
    
    // 先确保authorized_users中有记录
    const { data: upsertAuth, error: upsertAuthError } = await supabase
      .from('authorized_users')
      .upsert({
        email: 'xiewenxuan001@51Talk.com',
        role: 'admin',
        name: '谢文轩',
        status: 'active',
        created_at: new Date().toISOString()
      }, {
        onConflict: 'email'
      })
      .select();
    
    if (upsertAuthError) {
      console.error('创建/更新authorized_users失败:', upsertAuthError);
    } else {
      console.log('✓ authorized_users记录已确保存在');
    }

    // 检查是否需要创建auth用户
    if (!authUsers.users.find(user => user.email === 'xiewenxuan001@51Talk.com')) {
      console.log('正在创建auth用户...');
      const { data: newUser, error: createUserError } = await supabase.auth.admin.createUser({
        email: 'xiewenxuan001@51Talk.com',
        password: 'Admin123456!',
        email_confirm: true
      });
      
      if (createUserError) {
        console.error('创建auth用户失败:', createUserError);
      } else {
        console.log('✓ auth用户已创建:', newUser.user.email);
      }
    }

    console.log('\n🎉 管理员用户检查完成！');
    
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error);
  }
}

checkAdminUser();
