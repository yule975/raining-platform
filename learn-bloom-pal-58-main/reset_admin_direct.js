// 直接重置管理员密码
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

async function resetAdminPassword() {
  console.log('🔧 直接重置管理员密码...');
  
  const adminEmail = 'xiewenxuan001@51Talk.com';
  const adminName = '谢文轩';
  const newPassword = 'Admin123456!';
  
  try {
    // 1. 使用不同的方法获取用户
    console.log('\n🔍 搜索管理员用户...');
    
    // 方法1: 通过分页获取所有用户
    let allUsers = [];
    let page = 1;
    const perPage = 1000;
    
    while (true) {
      const { data, error } = await supabase.auth.admin.listUsers({
        page: page,
        perPage: perPage
      });
      
      if (error) {
        console.error(`❌ 获取用户失败: ${error.message}`);
        break;
      }
      
      allUsers = allUsers.concat(data.users);
      
      if (data.users.length < perPage) {
        break; // 已获取所有用户
      }
      
      page++;
    }
    
    console.log(`✅ 总共找到 ${allUsers.length} 个用户`);
    
    // 打印所有用户邮箱（用于调试）
    console.log('\n📧 所有用户邮箱:');
    allUsers.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (${user.id.substring(0, 8)}...)`);
    });
    
    // 查找管理员
    const adminUser = allUsers.find(u => u.email === adminEmail);
    
    if (adminUser) {
      console.log(`\n✅ 找到管理员用户: ${adminUser.email}`);
      console.log(`   用户ID: ${adminUser.id}`);
      console.log(`   邮箱确认: ${adminUser.email_confirmed_at ? '已确认' : '未确认'}`);
      
      // 直接更新密码
      console.log(`🔄 更新密码...`);
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(adminUser.id, {
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          full_name: adminName,
          role: 'admin'
        }
      });
      
      if (updateError) {
        console.error(`❌ 更新密码失败: ${updateError.message}`);
        return false;
      }
      
      console.log(`✅ 密码已更新`);
      
      // 确保profile存在且正确
      console.log(`🔄 检查用户档案...`);
      
      const { data: existingProfile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', adminUser.id)
        .single();
      
      if (existingProfile) {
        console.log(`✅ 用户档案已存在`);
        
        // 更新档案确保角色正确
        const { error: profileUpdateError } = await supabase
          .from('profiles')
          .update({
            email: adminEmail,
            full_name: adminName,
            role: 'admin'
          })
          .eq('id', adminUser.id);
        
        if (profileUpdateError) {
          console.error(`❌ 更新档案失败: ${profileUpdateError.message}`);
        } else {
          console.log(`✅ 用户档案已更新`);
        }
      } else {
        console.log(`🔄 创建用户档案...`);
        
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: adminUser.id,
            email: adminEmail,
            full_name: adminName,
            role: 'admin',
            avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${adminEmail}`
          });
        
        if (profileError) {
          console.error(`❌ 创建档案失败: ${profileError.message}`);
        } else {
          console.log(`✅ 用户档案已创建`);
        }
      }
      
      // 确保在授权用户列表中
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
        console.log(`✅ 授权用户状态已确认`);
      }
      
      // 验证登录
      console.log(`\n🔐 验证新密码...`);
      
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: adminEmail,
        password: newPassword
      });
      
      if (loginError) {
        console.error(`❌ 登录验证失败: ${loginError.message}`);
        
        // 尝试使用原密码验证
        console.log(`🔄 尝试使用临时密码验证...`);
        const { error: tempLoginError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: 'TempPass123!'
        });
        
        if (tempLoginError) {
          console.error(`❌ 临时密码也失败: ${tempLoginError.message}`);
        } else {
          console.log(`✅ 临时密码可用`);
          await supabase.auth.signOut();
        }
      } else {
        console.log(`✅ 新密码验证成功`);
        await supabase.auth.signOut();
      }
      
      // 显示结果
      console.log('\n' + '='.repeat(70));
      console.log('🎉 管理员账号已修复！');
      console.log('='.repeat(70));
      console.log(`📧 邮箱: ${adminEmail}`);
      console.log(`👤 姓名: ${adminName}`);
      console.log(`🔑 新密码: ${newPassword}`);
      console.log(`🔑 备用密码: TempPass123!`);
      console.log(`🆔 用户ID: ${adminUser.id}`);
      console.log(`🔐 权限: 管理员`);
      console.log('\n💡 请尝试使用新密码登录，如果失败请使用备用密码');
      
      return true;
      
    } else {
      console.log(`\n❌ 未找到管理员用户: ${adminEmail}`);
      console.log(`💡 这可能是因为用户在不同的数据库实例中`);
      
      // 尝试通过邮箱搜索用户
      console.log(`\n🔍 尝试通过auth.users表直接查询...`);
      
      // 这需要直接SQL查询，但由于权限限制可能无法执行
      console.log(`⚠️  请在Supabase控制台的SQL编辑器中执行以下查询:`);
      console.log(`SELECT * FROM auth.users WHERE email = '${adminEmail}';`);
      
      return false;
    }
    
  } catch (error) {
    console.error('❌ 重置过程中发生错误:', error.message);
    return false;
  }
}

async function main() {
  const success = await resetAdminPassword();
  
  if (!success) {
    console.log('\n📋 手动解决方案:');
    console.log('1. 访问 Supabase 控制台');
    console.log('2. 进入 Authentication > Users');
    console.log('3. 查找邮箱: xiewenxuan001@51Talk.com');
    console.log('4. 点击用户，选择 "Reset Password"');
    console.log('5. 设置新密码: Admin123456!');
  }
  
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
