// 快速修复登录问题
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

// 创建Supabase客户端进行登录测试
const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testDirectLogin() {
  console.log('🔐 直接测试Supabase登录...');
  
  const adminEmail = 'xiewenxuan001@51Talk.com';
  const adminPassword = 'Admin123456!';
  
  try {
    console.log('🔄 尝试登录:', adminEmail);
    
    const { data, error } = await supabase.auth.signInWithPassword({
      email: adminEmail,
      password: adminPassword
    });
    
    if (error) {
      console.error('❌ 直接登录失败:', error.message);
      
      // 尝试其他可能的密码
      const passwords = ['TempPass123!', 'admin123', 'Admin123456'];
      
      for (const pwd of passwords) {
        console.log(`🔄 尝试密码: ${pwd}`);
        
        const { data: testData, error: testError } = await supabase.auth.signInWithPassword({
          email: adminEmail,
          password: pwd
        });
        
        if (!testError && testData.user) {
          console.log(`✅ 密码 ${pwd} 登录成功!`);
          
          // 检查用户profile
          const { data: profile } = await supabase
            .from('profiles')
            .select('*')
            .eq('id', testData.user.id)
            .single();
          
          console.log('👤 用户profile:', profile);
          
          await supabase.auth.signOut();
          
          return {
            success: true,
            email: adminEmail,
            password: pwd,
            user: testData.user,
            profile: profile
          };
        } else {
          console.log(`❌ 密码 ${pwd} 登录失败:`, testError?.message);
        }
      }
      
      return {
        success: false,
        error: '所有密码尝试都失败了'
      };
    } else {
      console.log('✅ 默认密码登录成功!');
      
      // 检查用户profile
      const { data: profile } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', data.user.id)
        .single();
      
      console.log('👤 用户profile:', profile);
      
      await supabase.auth.signOut();
      
      return {
        success: true,
        email: adminEmail,
        password: adminPassword,
        user: data.user,
        profile: profile
      };
    }
    
  } catch (error) {
    console.error('❌ 登录测试异常:', error.message);
    return {
      success: false,
      error: error.message
    };
  }
}

async function checkUserData() {
  console.log('\n📊 检查用户数据...');
  
  try {
    // 检查profiles表
    const { data: profiles, error: profilesError } = await supabase
      .from('profiles')
      .select('*');
    
    if (profilesError) {
      console.error('❌ 获取profiles失败:', profilesError.message);
    } else {
      console.log(`✅ Profiles表: ${profiles?.length || 0} 个用户`);
      profiles?.forEach(profile => {
        console.log(`   - ${profile.email} (${profile.role}) - ID: ${profile.id.substring(0, 8)}...`);
      });
    }
    
    // 检查authorized_users表
    const { data: authUsers, error: authError } = await supabase
      .from('authorized_users')
      .select('*');
    
    if (authError) {
      console.error('❌ 获取authorized_users失败:', authError.message);
    } else {
      console.log(`✅ Authorized_users表: ${authUsers?.length || 0} 个用户`);
      authUsers?.forEach(user => {
        console.log(`   - ${user.email} (${user.name}) - 状态: ${user.status}`);
      });
    }
    
  } catch (error) {
    console.error('❌ 检查用户数据失败:', error.message);
  }
}

async function createQuickSolution() {
  console.log('\n🛠️  创建快速解决方案...');
  
  const result = await testDirectLogin();
  
  if (result.success) {
    console.log('\n' + '='.repeat(70));
    console.log('🎉 登录测试成功！');
    console.log('='.repeat(70));
    console.log(`📧 邮箱: ${result.email}`);
    console.log(`🔑 密码: ${result.password}`);
    console.log(`👤 姓名: ${result.profile?.full_name || 'N/A'}`);
    console.log(`🔐 角色: ${result.profile?.role || 'N/A'}`);
    console.log(`🆔 用户ID: ${result.user?.id}`);
    
    console.log('\n📱 现在可以使用以下信息登录:');
    console.log('1. 访问: http://localhost:8080/admin/login');
    console.log(`2. 邮箱: ${result.email}`);
    console.log(`3. 密码: ${result.password}`);
    
    // 检查角色是否正确
    if (result.profile?.role !== 'admin') {
      console.log('\n⚠️  检测到角色不是admin，正在修复...');
      
      const { error: updateError } = await supabase
        .from('profiles')
        .update({ role: 'admin' })
        .eq('id', result.user.id);
      
      if (updateError) {
        console.error('❌ 更新角色失败:', updateError.message);
      } else {
        console.log('✅ 用户角色已更新为admin');
      }
    }
    
  } else {
    console.log('\n❌ 登录测试失败');
    console.log('错误:', result.error);
    
    console.log('\n🔧 建议的解决方案:');
    console.log('1. 检查Supabase控制台的Authentication > Users');
    console.log('2. 查找邮箱: xiewenxuan001@51Talk.com');
    console.log('3. 重置密码为: Admin123456!');
    console.log('4. 确保邮箱已验证');
  }
}

async function main() {
  await checkUserData();
  await createQuickSolution();
}

main().catch(error => {
  console.error('❌ 脚本执行失败:', error);
  process.exit(1);
});
