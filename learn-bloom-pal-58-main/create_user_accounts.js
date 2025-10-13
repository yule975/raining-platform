// 创建用户账号脚本
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';
import crypto from 'crypto';

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

async function createUserAccount(email, name, role) {
  console.log(`\n🔄 为 ${email} 创建${role === 'admin' ? '管理员' : '学员'}账号...`);
  
  try {
    // 生成安全密码
    const password = generatePassword(12);
    
    // 1. 检查用户是否已存在于authorized_users表
    const { data: existingAuth } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (existingAuth) {
      console.log(`   ℹ️  用户已在授权列表中`);
    } else {
      // 添加到授权用户表
      const { error: authError } = await supabase
        .from('authorized_users')
        .insert({
          email: email,
          name: name,
          status: 'active'
        });
      
      if (authError) {
        console.error(`   ❌ 添加到授权列表失败: ${authError.message}`);
        return null;
      }
      
      console.log(`   ✅ 添加到授权用户列表成功`);
    }
    
    // 2. 创建Supabase Auth用户
    console.log(`   🔄 创建认证用户...`);
    
    const { data: authData, error: createError } = await supabase.auth.admin.createUser({
      email: email,
      password: password,
      email_confirm: true, // 自动确认邮箱
      user_metadata: {
        full_name: name,
        role: role
      }
    });
    
    if (createError) {
      if (createError.message.includes('already registered')) {
        console.log(`   ℹ️  认证用户已存在，更新密码...`);
        
        // 获取现有用户
        const { data: existingUser } = await supabase.auth.admin.listUsers();
        const user = existingUser.users.find(u => u.email === email);
        
        if (user) {
          // 更新密码
          const { error: updateError } = await supabase.auth.admin.updateUserById(user.id, {
            password: password,
            user_metadata: {
              full_name: name,
              role: role
            }
          });
          
          if (updateError) {
            console.error(`   ❌ 更新用户失败: ${updateError.message}`);
            return null;
          }
          
          console.log(`   ✅ 用户密码已更新`);
        }
      } else {
        console.error(`   ❌ 创建认证用户失败: ${createError.message}`);
        return null;
      }
    } else {
      console.log(`   ✅ 认证用户创建成功`);
    }
    
    // 3. 获取用户ID并创建/更新profile
    const { data: { users } } = await supabase.auth.admin.listUsers();
    const authUser = users.find(u => u.email === email);
    
    if (authUser) {
      console.log(`   🔄 创建用户档案...`);
      
      // 创建或更新profile
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
        console.error(`   ❌ 创建用户档案失败: ${profileError.message}`);
      } else {
        console.log(`   ✅ 用户档案创建成功`);
      }
      
      // 4. 如果是学员，添加到当前期次
      if (role === 'student') {
        console.log(`   🔄 添加到当前培训期次...`);
        
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
            console.log(`   ✅ 已添加到当前期次`);
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
    
    return null;
    
  } catch (error) {
    console.error(`❌ 创建用户 ${email} 失败:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 开始创建用户账号...');
  
  const results = [];
  
  // 创建管理员账号
  const admin = await createUserAccount(
    'xiewenxuan001@51Talk.com',
    '谢文轩',
    'admin'
  );
  
  if (admin) {
    results.push(admin);
  }
  
  // 创建学员账号
  const student = await createUserAccount(
    '2440164519@qq.com',
    '学员用户',
    'student'
  );
  
  if (student) {
    results.push(student);
  }
  
  // 显示结果
  console.log('\n🎉 账号创建完成！');
  console.log('\n📋 账号信息：');
  console.log('=' * 60);
  
  results.forEach(user => {
    console.log(`\n👤 ${user.role === 'admin' ? '管理员' : '学员'}: ${user.name}`);
    console.log(`📧 邮箱: ${user.email}`);
    console.log(`🔑 密码: ${user.password}`);
    console.log(`🆔 用户ID: ${user.userId}`);
    console.log(`🔐 权限: ${user.role === 'admin' ? '管理员 (可管理课程、学员、期次等)' : '学员 (可学习课程、提交作业等)'}`);
  });
  
  console.log('\n📱 登录步骤：');
  console.log('1. 访问 http://localhost:8080');
  console.log('2. 点击登录按钮');
  console.log('3. 使用上述邮箱和密码登录');
  console.log('4. 首次登录后建议修改密码');
  
  console.log('\n💡 提示：');
  console.log('- 管理员可以访问管理功能，创建课程、管理学员等');
  console.log('- 学员可以查看课程、学习视频、提交作业等');
  console.log('- 密码请妥善保管，建议首次登录后修改');
  
  return results.length > 0;
}

main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
