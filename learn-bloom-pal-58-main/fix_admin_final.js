// 最终修复管理员登录问题
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

async function fixAdminFinal() {
  console.log('🔧 最终修复管理员登录问题...');
  
  // 正确的邮箱地址（从用户列表看到的实际邮箱）
  const actualAdminEmail = 'xiewenxuan001@51talk.com';  // 注意是小写的talk
  const requestedAdminEmail = 'xiewenxuan001@51Talk.com';  // 用户想要的邮箱
  const adminName = '谢文轩';
  const newPassword = 'Admin123456!';
  
  try {
    // 1. 获取所有用户
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error('❌ 获取用户列表失败:', listError.message);
      return false;
    }
    
    console.log(`✅ 找到 ${users.length} 个用户`);
    
    // 查找实际的管理员用户
    const adminUser = users.find(u => u.email === actualAdminEmail);
    
    if (adminUser) {
      console.log(`\n✅ 找到管理员用户: ${adminUser.email}`);
      console.log(`   用户ID: ${adminUser.id}`);
      
      // 2. 更新用户邮箱为正确的大小写格式并设置密码
      console.log(`🔄 更新用户信息...`);
      
      const { error: updateError } = await supabase.auth.admin.updateUserById(adminUser.id, {
        email: requestedAdminEmail,  // 更新为正确的邮箱格式
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          full_name: adminName,
          role: 'admin'
        }
      });
      
      if (updateError) {
        console.error(`❌ 更新用户失败: ${updateError.message}`);
        
        // 如果邮箱更新失败，至少更新密码
        console.log(`🔄 尝试只更新密码...`);
        const { error: passwordError } = await supabase.auth.admin.updateUserById(adminUser.id, {
          password: newPassword,
          email_confirm: true,
          user_metadata: {
            full_name: adminName,
            role: 'admin'
          }
        });
        
        if (passwordError) {
          console.error(`❌ 更新密码也失败: ${passwordError.message}`);
          return false;
        } else {
          console.log(`✅ 密码已更新（使用原邮箱格式）`);
        }
      } else {
        console.log(`✅ 用户信息已更新`);
      }
      
      // 3. 更新或创建profile
      console.log(`🔄 更新用户档案...`);
      
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: adminUser.id,
          email: requestedAdminEmail,  // 使用正确的邮箱格式
          full_name: adminName,
          role: 'admin',
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${requestedAdminEmail}`
        }, {
          onConflict: 'id'
        });
      
      if (profileError) {
        console.error(`❌ 更新档案失败: ${profileError.message}`);
      } else {
        console.log(`✅ 用户档案已更新`);
      }
      
      // 4. 更新授权用户表（两个邮箱格式都加入）
      console.log(`🔄 更新授权用户列表...`);
      
      // 删除旧格式的邮箱记录
      await supabase
        .from('authorized_users')
        .delete()
        .eq('email', actualAdminEmail);
      
      // 添加新格式的邮箱记录
      const { error: authError } = await supabase
        .from('authorized_users')
        .upsert({
          email: requestedAdminEmail,
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
      
      // 5. 验证登录（尝试两种邮箱格式）
      console.log(`\n🔐 验证登录...`);
      
      let loginSuccess = false;
      let workingEmail = '';
      
      // 尝试新邮箱格式
      const { error: loginError1 } = await supabase.auth.signInWithPassword({
        email: requestedAdminEmail,
        password: newPassword
      });
      
      if (!loginError1) {
        console.log(`✅ 新邮箱格式登录成功: ${requestedAdminEmail}`);
        loginSuccess = true;
        workingEmail = requestedAdminEmail;
        await supabase.auth.signOut();
      } else {
        console.log(`❌ 新邮箱格式登录失败: ${loginError1.message}`);
        
        // 尝试原邮箱格式
        const { error: loginError2 } = await supabase.auth.signInWithPassword({
          email: actualAdminEmail,
          password: newPassword
        });
        
        if (!loginError2) {
          console.log(`✅ 原邮箱格式登录成功: ${actualAdminEmail}`);
          loginSuccess = true;
          workingEmail = actualAdminEmail;
          await supabase.auth.signOut();
        } else {
          console.log(`❌ 原邮箱格式登录也失败: ${loginError2.message}`);
        }
      }
      
      // 显示结果
      console.log('\n' + '='.repeat(80));
      console.log('🎉 管理员账号修复完成！');
      console.log('='.repeat(80));
      console.log(`📧 登录邮箱: ${workingEmail || requestedAdminEmail}`);
      console.log(`👤 姓名: ${adminName}`);
      console.log(`🔑 密码: ${newPassword}`);
      console.log(`🆔 用户ID: ${adminUser.id}`);
      console.log(`🔐 权限: 管理员`);
      
      if (loginSuccess) {
        console.log(`\n✅ 登录验证成功！现在可以使用以上信息登录管理员后台`);
      } else {
        console.log(`\n⚠️  登录验证失败，但密码已设置。请尝试以下邮箱格式:`);
        console.log(`   1. ${requestedAdminEmail}`);
        console.log(`   2. ${actualAdminEmail}`);
      }
      
      console.log(`\n🌐 登录地址: http://localhost:8080/admin/login`);
      
      return loginSuccess;
      
    } else {
      console.log(`\n❌ 未找到管理员用户`);
      return false;
    }
    
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error.message);
    return false;
  }
}

async function showStudentInfo() {
  console.log('\n\n📚 学员账号信息:');
  console.log('='.repeat(50));
  console.log('📧 邮箱: 2440164519@qq.com');
  console.log('🔑 密码: iQzBF8#y@dM7');
  console.log('🔐 权限: 学员');
  console.log('🌐 登录地址: http://localhost:8080/student/login');
}

async function main() {
  const success = await fixAdminFinal();
  await showStudentInfo();
  
  console.log('\n💡 如果管理员登录仍有问题，请:');
  console.log('1. 清除浏览器缓存和Cookie');
  console.log('2. 尝试无痕模式登录');
  console.log('3. 检查网络连接');
  
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
