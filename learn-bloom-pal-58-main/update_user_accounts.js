// 更新用户账号和重置密码
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 使用服务角色密钥，具有管理员权限
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 生成安全密码
function generatePassword(length = 12) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

async function updateUserAccount(email, name, role) {
  console.log(`\n🔄 更新用户 ${email} (${role === 'admin' ? '管理员' : '学员'})...`);
  
  try {
    // 生成新密码
    const password = generatePassword(12);
    
    // 1. 更新authorized_users表
    const { error: authError } = await supabase
      .from('authorized_users')
      .upsert({
        email: email,
        name: name,
        status: 'active'
      }, {
        onConflict: 'email'
      });
    
    if (authError) {
      console.error(`   ❌ 更新授权用户失败: ${authError.message}`);
      return null;
    }
    
    console.log(`   ✅ 授权用户信息已更新`);
    
    // 2. 获取认证用户
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error(`   ❌ 获取用户列表失败: ${listError.message}`);
      return null;
    }
    
    const authUser = users.find(u => u.email === email);
    
    if (!authUser) {
      console.log(`   ℹ️  认证用户不存在，创建新用户...`);
      
      // 创建新的认证用户
      const { data: newAuthData, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          role: role
        }
      });
      
      if (createError) {
        console.error(`   ❌ 创建认证用户失败: ${createError.message}`);
        return null;
      }
      
      console.log(`   ✅ 认证用户创建成功`);
      
      // 使用新创建的用户
      const newUser = newAuthData.user;
      
      // 创建profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: newUser.id,
          email: email,
          full_name: name,
          role: role,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        }, {
          onConflict: 'id'
        });
      
      if (profileError) {
        console.error(`   ❌ 创建用户档案失败: ${profileError.message}`);
      } else {
        console.log(`   ✅ 用户档案创建成功`);
      }
      
      return {
        email: email,
        name: name,
        role: role,
        password: password,
        userId: newUser.id
      };
      
    } else {
      console.log(`   ℹ️  认证用户已存在，更新信息和密码...`);
      
      // 更新现有用户
      const { error: updateError } = await supabase.auth.admin.updateUserById(authUser.id, {
        password: password,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          role: role
        }
      });
      
      if (updateError) {
        console.error(`   ❌ 更新认证用户失败: ${updateError.message}`);
        return null;
      }
      
      console.log(`   ✅ 认证用户信息已更新`);
      
      // 更新profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: authUser.id,
          email: email,
          full_name: name,
          role: role,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        }, {
          onConflict: 'id'
        });
      
      if (profileError) {
        console.error(`   ❌ 更新用户档案失败: ${profileError.message}`);
      } else {
        console.log(`   ✅ 用户档案已更新`);
      }
      
      // 如果是学员，确保添加到当前期次
      if (role === 'student') {
        console.log(`   🔄 检查期次注册状态...`);
        
        const { data: currentSession } = await supabase
          .from('training_sessions')
          .select('id')
          .eq('is_current', true)
          .single();
        
        if (currentSession) {
          const { error: enrollError } = await supabase
            .from('session_students')
            .upsert({
              session_id: currentSession.id,
              user_id: authUser.id,
              status: 'active'
            }, {
              onConflict: 'session_id,user_id'
            });
          
          if (enrollError) {
            console.error(`   ❌ 添加到期次失败: ${enrollError.message}`);
          } else {
            console.log(`   ✅ 期次注册状态已确认`);
          }
        }
      }
      
      return {
        email: email,
        name: name,
        role: role,
        password: password,
        userId: authUser.id
      };
    }
    
  } catch (error) {
    console.error(`❌ 更新用户 ${email} 失败:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 开始更新用户账号...');
  
  const results = [];
  
  // 更新管理员账号
  const admin = await updateUserAccount(
    'xiewenxuan001@51Talk.com',
    '谢文轩',
    'admin'
  );
  
  if (admin) {
    results.push(admin);
  }
  
  // 更新学员账号
  const student = await updateUserAccount(
    '2440164519@qq.com',
    '学员用户',
    'student'
  );
  
  if (student) {
    results.push(student);
  }
  
  // 显示结果
  console.log('\n' + '='.repeat(80));
  console.log('🎉 账号更新完成！');
  console.log('='.repeat(80));
  
  results.forEach((user, index) => {
    console.log(`\n${index + 1}. 👤 ${user.role === 'admin' ? '🔧 管理员' : '🎓 学员'}: ${user.name}`);
    console.log(`   📧 邮箱: ${user.email}`);
    console.log(`   🔑 密码: ${user.password}`);
    console.log(`   🆔 用户ID: ${user.userId}`);
    console.log(`   🔐 权限: ${user.role === 'admin' ? '管理员权限 (课程管理、学员管理、数据统计等)' : '学员权限 (课程学习、作业提交、进度查看等)'}`);
  });
  
  console.log('\n' + '='.repeat(80));
  console.log('📱 登录指南：');
  console.log('='.repeat(80));
  console.log('1. 🌐 访问培训平台: http://localhost:8080');
  console.log('2. 🔐 点击"登录"按钮');
  console.log('3. 📝 输入上述邮箱和密码');
  console.log('4. 🎯 首次登录后建议修改密码');
  
  console.log('\n💡 功能说明：');
  console.log('─'.repeat(40));
  console.log('👨‍💼 管理员功能：');
  console.log('   • 📚 课程管理 (创建、编辑、删除课程)');
  console.log('   • 👥 学员管理 (查看学员、导入学员)');
  console.log('   • 📊 数据统计 (学习进度、完成情况)');
  console.log('   • 🎯 期次管理 (创建培训期次)');
  console.log('   • 📝 作业管理 (创建作业、批改等)');
  
  console.log('\n👨‍🎓 学员功能：');
  console.log('   • 📖 课程学习 (观看视频、下载资料)');
  console.log('   • 📝 作业提交 (上传作业文件)');
  console.log('   • 📈 进度查看 (学习进度统计)');
  console.log('   • 👤 个人资料 (修改头像、信息等)');
  
  console.log('\n🔒 安全提醒：');
  console.log('─'.repeat(40));
  console.log('• 🔐 密码已随机生成，请妥善保管');
  console.log('• 🔄 建议首次登录后立即修改密码');
  console.log('• 📱 如需找回密码，请联系系统管理员');
  
  return results.length > 0;
}

main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
