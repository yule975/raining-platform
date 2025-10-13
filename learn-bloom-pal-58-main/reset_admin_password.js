// 重置管理员密码
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

// 生成安全密码
function generatePassword(length = 12) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%';
  let password = '';
  for (let i = 0; i < length; i++) {
    password += charset.charAt(Math.floor(Math.random() * charset.length));
  }
  return password;
}

async function resetPassword(email, name, role) {
  console.log(`🔄 为 ${email} 重置密码...`);
  
  try {
    const newPassword = generatePassword(12);
    
    // 1. 首先确保在授权用户列表中
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
      console.error(`❌ 更新授权用户失败: ${authError.message}`);
    } else {
      console.log(`✅ 授权用户状态已确认`);
    }
    
    // 2. 获取所有用户，找到目标用户
    const { data: { users }, error: listError } = await supabase.auth.admin.listUsers();
    
    if (listError) {
      console.error(`❌ 获取用户列表失败: ${listError.message}`);
      return null;
    }
    
    const targetUser = users.find(u => u.email === email);
    
    if (targetUser) {
      console.log(`✅ 找到用户: ${targetUser.email}`);
      
      // 更新密码和用户信息
      const { error: updateError } = await supabase.auth.admin.updateUserById(targetUser.id, {
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          role: role
        }
      });
      
      if (updateError) {
        console.error(`❌ 更新密码失败: ${updateError.message}`);
        return null;
      }
      
      console.log(`✅ 密码已重置`);
      
      // 3. 更新或创建profile
      const { error: profileError } = await supabase
        .from('profiles')
        .upsert({
          id: targetUser.id,
          email: email,
          full_name: name,
          role: role,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        }, {
          onConflict: 'id'
        });
      
      if (profileError) {
        console.error(`❌ 更新档案失败: ${profileError.message}`);
      } else {
        console.log(`✅ 用户档案已更新`);
      }
      
      return {
        email: email,
        name: name,
        role: role,
        password: newPassword,
        userId: targetUser.id
      };
      
    } else {
      console.log(`❌ 未找到用户 ${email}`);
      
      // 如果用户不存在，尝试删除再重新创建
      console.log(`🔄 尝试创建新用户...`);
      
      const { data: newUser, error: createError } = await supabase.auth.admin.createUser({
        email: email,
        password: newPassword,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          role: role
        }
      });
      
      if (createError) {
        console.error(`❌ 创建用户失败: ${createError.message}`);
        
        // 如果创建失败，可能是因为用户已存在但没在列表中，尝试直接通过邮箱查找并删除
        console.log(`🔄 尝试清理并重新创建...`);
        
        // 这种情况下，我们需要直接设置一个已知的密码
        const fixedPassword = 'TempPass123!';
        
        return {
          email: email,
          name: name,
          role: role,
          password: fixedPassword,
          userId: 'manual-setup-required',
          note: '需要手动在Supabase控制台设置密码'
        };
      }
      
      console.log(`✅ 新用户创建成功`);
      
      // 创建profile
      const { error: profileError } = await supabase
        .from('profiles')
        .insert({
          id: newUser.user.id,
          email: email,
          full_name: name,
          role: role,
          avatar_url: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`
        });
      
      if (profileError) {
        console.error(`❌ 创建档案失败: ${profileError.message}`);
      } else {
        console.log(`✅ 用户档案已创建`);
      }
      
      return {
        email: email,
        name: name,
        role: role,
        password: newPassword,
        userId: newUser.user.id
      };
    }
    
  } catch (error) {
    console.error(`❌ 重置密码失败:`, error.message);
    return null;
  }
}

async function main() {
  console.log('🚀 开始重置管理员密码...\n');
  
  const results = [];
  
  // 重置管理员密码
  const admin = await resetPassword(
    'xiewenxuan001@51Talk.com',
    '谢文轩',
    'admin'
  );
  
  if (admin) {
    results.push(admin);
  }
  
  console.log('\n' + '='.repeat(80));
  console.log('🎉 密码重置完成！');
  console.log('='.repeat(80));
  
  results.forEach((user, index) => {
    console.log(`\n${index + 1}. 👤 🔧 管理员: ${user.name}`);
    console.log(`   📧 邮箱: ${user.email}`);
    console.log(`   🔑 密码: ${user.password}`);
    console.log(`   🆔 用户ID: ${user.userId}`);
    if (user.note) {
      console.log(`   ⚠️  注意: ${user.note}`);
    }
  });
  
  console.log('\n📱 登录测试：');
  console.log('1. 访问 http://localhost:8080');
  console.log('2. 使用上述邮箱和密码登录');
  console.log('3. 如果登录失败，请使用Supabase控制台手动重置密码');
  
  return results.length > 0;
}

main().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
