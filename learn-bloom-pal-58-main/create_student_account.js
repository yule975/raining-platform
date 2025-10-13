// 为学员重置密码的脚本（修复表结构问题）
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';

const supabaseUrl = 'https://upwrgkhpuwxkbwndxxxs.supabase.co';
const supabaseServiceKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InVwd3Jna2hwdXd4a2J3bmR4eHhzIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc1NjczNTg3OCwiZXhwIjoyMDcyMzExODc4fQ._4vm3xYlPdweWxagLryniOmw2Xgs45icnFfiYxPd_V4';

// 使用服务密钥创建管理员客户端
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 生成安全的随机密码
function generateSecurePassword(length = 12) {
  const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789!@#$%^&*';
  let password = '';
  
  // 确保包含至少一个大写字母、小写字母、数字和特殊字符
  password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)];
  password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)];
  password += '0123456789'[Math.floor(Math.random() * 10)];
  password += '!@#$%^&*'[Math.floor(Math.random() * 8)];
  
  // 填充剩余长度
  for (let i = 4; i < length; i++) {
    password += charset[Math.floor(Math.random() * charset.length)];
  }
  
  // 打乱密码字符顺序
  return password.split('').sort(() => Math.random() - 0.5).join('');
}

async function resetStudentPassword() {
  const email = 'xiewenxuan001@51Talk.com';
  const name = 'wenxuan';
  const password = generateSecurePassword();
  
  console.log('开始为学员重置密码...');
  console.log('邮箱:', email);
  console.log('姓名:', name);
  
  try {
    // 1. 首先确保用户在authorized_users表中
    console.log('\n1. 检查并更新authorized_users表...');
    const { data: existingAuthorizedUser, error: checkError } = await supabase
      .from('authorized_users')
      .select('*')
      .eq('email', email)
      .single();
    
    if (checkError && checkError.code !== 'PGRST116') {
      console.error('检查authorized_users表失败:', checkError.message);
      return;
    }
    
    if (!existingAuthorizedUser) {
      // 如果不存在，先添加到authorized_users表
      const { error: insertDbError } = await supabase
        .from('authorized_users')
        .insert({
          email: email,
          name: name,
          role: 'student',
          status: 'active'
        });
      
      if (insertDbError) {
        console.error('添加到authorized_users表失败:', insertDbError.message);
        return;
      }
      
      console.log('✅ 用户已添加到authorized_users表');
    } else {
      // 更新现有记录（只更新存在的字段）
      const { error: updateDbError } = await supabase
        .from('authorized_users')
        .update({
          name: name,
          role: 'student',
          status: 'active'
        })
        .eq('email', email);
      
      if (updateDbError) {
        console.error('更新authorized_users表失败:', updateDbError.message);
        return;
      }
      
      console.log('✅ authorized_users表记录已更新');
    }
    
    // 2. 尝试通过生成重置链接来获取用户信息
    console.log('\n2. 尝试生成密码重置链接获取用户信息...');
    let userId = null;
    
    try {
      const { data: resetData, error: resetError } = await supabase.auth.admin.generateLink({
        type: 'recovery',
        email: email
      });
      
      if (resetError) {
        console.log('生成重置链接失败:', resetError.message);
        
        // 3. 如果重置链接失败，尝试创建用户（如果失败说明用户存在）
        console.log('\n3. 尝试创建用户以确认用户存在...');
        const { data: createResult, error: createError } = await supabase.auth.admin.createUser({
          email: email,
          password: 'temp_password_123',
          email_confirm: true
        });
        
        if (createError && createError.message.includes('already been registered')) {
          console.log('✅ 确认用户已存在，但无法获取用户ID');
          console.log('❌ 由于Supabase API限制，无法直接重置现有用户密码');
          
          // 提供备用方案
          console.log('\n🔄 备用方案：');
          console.log('1. 请学员使用"忘记密码"功能重置密码');
          console.log('2. 或者请管理员在Supabase控制台手动重置密码');
          console.log('3. 学员邮箱:', email);
          console.log('4. 建议新密码:', password);
          
          return {
            success: false,
            error: '无法通过API重置现有用户密码',
            suggestion: {
              email: email,
              suggestedPassword: password,
              alternatives: [
                '使用忘记密码功能',
                '管理员手动重置',
                '删除用户后重新创建'
              ]
            }
          };
        } else if (createResult) {
          console.log('✅ 成功创建新用户');
          userId = createResult.user.id;
        } else {
          console.error('创建用户失败:', createError?.message);
          return {
            success: false,
            error: createError?.message || '未知错误'
          };
        }
      } else {
        console.log('✅ 成功生成密码重置链接');
        console.log('用户信息:', resetData.user);
        userId = resetData.user.id;
      }
    } catch (linkError) {
      console.error('生成链接时发生错误:', linkError.message);
      return {
        success: false,
        error: linkError.message
      };
    }
    
    // 4. 如果找到了用户ID，更新密码
    if (userId) {
      console.log('\n4. 更新用户密码...');
      const { data: updatedUser, error: updateError } = await supabase.auth.admin.updateUserById(
        userId,
        {
          password: password,
          email_confirm: true,
          user_metadata: {
            name: name,
            role: 'student'
          }
        }
      );
      
      if (updateError) {
        console.error('更新用户密码失败:', updateError.message);
        return {
          success: false,
          error: updateError.message
        };
      }
      
      console.log('✅ 用户密码更新成功');
      
      // 5. 返回登录凭据
      console.log('\n🎉 学员密码重置完成！');
      console.log('==========================================');
      console.log('📧 登录邮箱:', email);
      console.log('🔑 新密码:', password);
      console.log('👤 用户姓名:', name);
      console.log('🎯 用户角色: 学员');
      console.log('✅ 账号状态: 已激活');
      console.log('🆔 用户ID:', userId);
      console.log('==========================================');
      console.log('\n学员现在可以使用上述邮箱和新密码直接登录系统！');
      
      return {
        success: true,
        credentials: {
          email: email,
          password: password,
          name: name,
          role: 'student',
          status: 'active',
          userId: userId
        }
      };
    } else {
      console.error('❌ 无法获取用户ID，密码重置失败');
      return {
        success: false,
        error: '无法获取用户ID'
      };
    }
    
  } catch (error) {
    console.error('重置密码过程中发生错误:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

// 执行密码重置
resetStudentPassword().then(result => {
  if (result && result.success) {
    console.log('\n✅ 密码重置流程完成');
  } else {
    console.log('\n❌ 密码重置失败');
    if (result && result.suggestion) {
      console.log('\n💡 建议的解决方案:');
      console.log('邮箱:', result.suggestion.email);
      console.log('建议密码:', result.suggestion.suggestedPassword);
      console.log('备用方案:', result.suggestion.alternatives.join(', '));
    }
  }
  process.exit(0);
}).catch(error => {
  console.error('脚本执行失败:', error);
  process.exit(1);
});