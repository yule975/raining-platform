// 修复管理员登录问题
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 使用服务角色密钥
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function fixAdminLogin() {
  console.log('🔧 修复管理员登录问题...');
  
  const adminEmail = 'xiewenxuan001@51Talk.com';
  const adminName = '谢文轩';
  const newPassword = 'Admin123456!';
  
  try {
    // 1. 检查并清理现有用户
    console.log('\n🔍 检查现有用户状态...');
    
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ 获取用户列表失败:', listError.message);
      return false;
    }
    
    console.log(`✅ 找到 ${users.length} 个用户`);
    
    // 查找管理员用户
    const adminUser = users.find(u => u.email === adminEmail);
    
    if (adminUser) {
      console.log(`✅ 找到管理员用户: ${adminUser.email}`);
      console.log(`   用户ID: ${adminUser.id}`);
      console.log(`   创建时间: ${adminUser.created_at}`);
      console.log(`   邮箱确认: ${adminUser.email_confirmed_at ? '已确认' : '未确认'}`);
      
      // 删除现有用户
      console.log(`🗑️  删除现有用户...`);
      const { error: deleteError } = await supabase.auth.admin.deleteUser(adminUser.id);
      
      if (deleteError) {
        console.error(`❌ 删除用户失败: ${deleteError.message}`);
      } else {
        console.log(`✅ 用户已删除`);
      }
      
      // 同时删除profile
      const { error: profileDeleteError } = await supabase
        .from('profiles')
        .delete()
        .eq('id', adminUser.id);
      
      if (profileDeleteError) {
        console.log(`⚠️  删除profile失败: ${profileDeleteError.message}`);
      } else {
        console.log(`✅ Profile已删除`);
      }
    } else {
      console.log(`ℹ️  未找到现有管理员用户`);
    }
    
    // 2. 创建新的管理员用户
    console.log(`\n👤 创建新的管理员用户...`);
    
    const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
      email: adminEmail,
      password: newPassword,
      email_confirm: true,
      user_metadata: {
        full_name: adminName,
        role: 'admin'
      }
    });
    
    if (createError) {
      console.error(`❌ 创建用户失败: ${createError.message}`);
      return false;
    }
    
    console.log(`✅ 新用户创建成功`);
    console.log(`   用户ID: ${newUser.user.id}`);
    console.log(`   邮箱: ${newUser.user.email}`);
    
    // 3. 创建profile
    console.log(`\n📋 创建用户档案...`);
    
    const { error: profileError } = await supabase
      .from('profiles')
      .insert({
        id: newUser.user.id,
        email: adminEmail,
        full_name: adminName,
        role: 'admin',
        avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminEmail}`
      });
    
    if (profileError) {
      console.error(`❌ 创建档案失败: ${profileError.message}`);
    } else {
      console.log(`✅ 用户档案创建成功`);
    }
    
    // 4. 确保在授权用户列表中
    console.log(`\n📝 更新授权用户列表...`);
    
    const { error: authError } = await supabase
      .from('authorized_users')
      .upsert({
        email: adminEmail,
        name: adminName,
        status: 'active'
      }, {
        onConflict: 'email'
      });
    
    if (authError) {
      console.error(`❌ 更新授权用户失败: ${authError.message}`);
    } else {
      console.log(`✅ 授权用户列表已更新`);
    }
    
    // 5. 验证登录
    console.log(`\n🔐 验证登录...`);
    
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: newPassword
    });
    
    if (loginError) {
      console.error(`❌ 登录验证失败: ${loginError.message}`);
      return false;
    } else {
      console.log(`✅ 登录验证成功`);
      
      // 登出以避免会话冲突
      await supabase.auth.signOut();
    }
    
    // 显示结果
    console.log('\n' + '='.repeat(60));
    console.log('🎉 管理员账号修复完成！');
    console.log('='.repeat(60));
    console.log(`📧 邮箱: ${adminEmail}`);
    console.log(`👤 姓名: ${adminName}`);
    console.log(`🔑 密码: ${newPassword}`);
    console.log(`🔐 权限: 管理员`);
    console.log('\n🚀 现在可以使用这些信息登录了！');
    
    return true;
    
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error.message);
    return false;
  }
}

// 同时检查学员账号
async function checkStudentAccount() {
  console.log('\n\n🔍 检查学员账号状态...');
  
  const studentEmail = '2440164519@qq.com';
  
  try {
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const studentUser = users.find(u => u.email === studentEmail);
    
    if (studentUser) {
      console.log(`✅ 学员账号正常: ${studentUser.email}`);
      console.log(`   邮箱确认: ${studentUser.email_confirmed_at ? '已确认' : '未确认'}`);
      
      // 如果邮箱未确认，进行确认
      if (!studentUser.email_confirmed_at) {
        const { error } = await supabase.auth.admin.updateUserById(studentUser.id, {
          email_confirm: true
        });
        
        if (error) {
          console.error(`❌ 确认邮箱失败: ${error.message}`);
        } else {
          console.log(`✅ 邮箱已确认`);
        }
      }
      
      console.log(`🔑 学员密码: iQzBF8#y@dM7`);
    } else {
      console.log(`❌ 未找到学员账号`);
    }
  } catch (error) {
    console.error('❌ 检查学员账号失败:', error.message);
  }
}

async function main() {
  const success = await fixAdminLogin();
  await checkStudentAccount();
  
  if (success) {
    console.log('\n✨ 所有账号问题已修复，现在可以正常登录了！');
  }
  
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
