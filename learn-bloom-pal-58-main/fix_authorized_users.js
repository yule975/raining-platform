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

async function fixAuthorizedUsers() {
  console.log('🔧 修复authorized_users表...');
  
  try {
    // 1. 检查表结构
    console.log('\n1. 检查当前表结构:');
    const { data: columns, error: columnError } = await supabase
      .rpc('describe_table', { table_name: 'authorized_users' })
      .then(() => null)
      .catch(() => {
        // 如果RPC不存在，直接查询数据来推断结构
        return supabase.from('authorized_users').select('*').limit(1);
      });

    // 2. 直接插入管理员记录（使用简单字段）
    console.log('\n2. 插入管理员记录:');
    
    const { data: insertResult, error: insertError } = await supabase
      .from('authorized_users')
      .upsert({
        email: 'xiewenxuan001@51Talk.com',
        role: 'admin',
        name: '谢文轩',
        status: 'active'
      }, {
        onConflict: 'email'
      })
      .select();
    
    if (insertError) {
      console.error('插入管理员记录失败:', insertError);
      
      // 如果是字段不存在的错误，尝试只用基本字段
      if (insertError.message.includes('created_at') || insertError.message.includes('column')) {
        console.log('尝试使用基本字段插入...');
        const { data: basicInsert, error: basicError } = await supabase
          .from('authorized_users')
          .upsert({
            email: 'xiewenxuan001@51Talk.com',
            role: 'admin',
            name: '谢文轩'
          }, {
            onConflict: 'email'
          })
          .select();
        
        if (basicError) {
          console.error('基本字段插入也失败:', basicError);
        } else {
          console.log('✓ 管理员记录已插入（基本字段）:', basicInsert);
        }
      }
    } else {
      console.log('✓ 管理员记录已插入:', insertResult);
    }

    // 3. 同样插入学员记录
    console.log('\n3. 插入学员记录:');
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
      console.error('插入学员记录失败:', studentError);
    } else {
      console.log('✓ 学员记录已插入:', studentResult);
    }

    // 4. 验证结果
    console.log('\n4. 验证插入结果:');
    const { data: allUsers, error: queryError } = await supabase
      .from('authorized_users')
      .select('*');
    
    if (queryError) {
      console.error('查询失败:', queryError);
    } else {
      console.log('✓ 当前authorized_users表内容:');
      allUsers.forEach((user, index) => {
        console.log(`  ${index + 1}. ${user.email} - ${user.role} - ${user.name}`);
      });
    }

    console.log('\n🎉 authorized_users表修复完成！');
    
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error);
  }
}

fixAuthorizedUsers();
