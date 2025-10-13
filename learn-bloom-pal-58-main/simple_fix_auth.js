import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function simpleFixAuth() {
  console.log('🔧 简单修复authorized_users表...');
  
  try {
    // 直接插入管理员记录
    console.log('插入管理员记录...');
    const { data: adminResult, error: adminError } = await supabase
      .from('authorized_users')
      .upsert({
        email: 'xiewenxuan001@51Talk.com',
        role: 'admin',
        name: '谢文轩'
      }, {
        onConflict: 'email'
      })
      .select();
    
    if (adminError) {
      console.error('插入管理员失败:', adminError);
    } else {
      console.log('✓ 管理员记录:', adminResult);
    }

    // 插入学员记录
    console.log('插入学员记录...');
    const { data: studentResult, error: studentError } = await supabase
      .from('authorized_users')
      .upsert({
        email: '2440164519@qq.com',
        role: 'student',
        name: '测试学员'
      }, {
        onConflict: 'email'
      })
      .select();
    
    if (studentError) {
      console.error('插入学员失败:', studentError);
    } else {
      console.log('✓ 学员记录:', studentResult);
    }

    // 验证结果
    console.log('\n验证结果:');
    const { data: allUsers, error: queryError } = await supabase
      .from('authorized_users')
      .select('*');
    
    if (queryError) {
      console.error('查询失败:', queryError);
    } else {
      console.log('authorized_users表内容:');
      allUsers?.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} - ${user.role} - ${user.name || 'N/A'}`);
      });
    }

    console.log('\n🎉 修复完成！现在可以尝试登录了。');
    
  } catch (error) {
    console.error('❌ 错误:', error);
  }
}

simpleFixAuth();
