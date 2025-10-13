import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testWithLogin() {
  console.log('测试登录后的数据访问...');
  
  try {
    // 1. 先尝试登录管理员账号
    console.log('\n1. 尝试登录管理员账号:');
    const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
      email: 'admin@example.com',
      password: 'admin123'
    });
    
    if (loginError) {
      console.error('登录失败:', loginError);
      return;
    }
    
    console.log('登录成功!');
    console.log('用户ID:', loginData.user?.id);
    console.log('用户邮箱:', loginData.user?.email);
    
    // 等待一下确保session生效
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // 2. 再次尝试查询assignments表
    console.log('\n2. 登录后查询assignments表:');
    const startTime = Date.now();
    const { data: assignments, error: queryError } = await supabase
      .from('assignments')
      .select('*')
      .limit(10);
    const queryTime = Date.now() - startTime;
    
    if (queryError) {
      console.error('查询assignments表错误:', queryError);
    } else {
      console.log(`查询耗时: ${queryTime}ms`);
      console.log(`成功查询到 ${assignments?.length || 0} 条记录`);
      if (assignments && assignments.length > 0) {
        console.log('示例记录:', assignments[0]);
      }
    }
    
    // 3. 查询统计信息
    console.log('\n3. 查询统计信息:');
    const statsStartTime = Date.now();
    
    // 待批改数量
    const { count: pendingCount, error: pendingError } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted');
    
    const statsTime = Date.now() - statsStartTime;
    
    if (pendingError) {
      console.error('查询待批改数量错误:', pendingError);
    } else {
      console.log(`统计查询耗时: ${statsTime}ms`);
      console.log(`待批改数量: ${pendingCount || 0}`);
    }
    
    // 4. 检查是否有测试数据
    console.log('\n4. 检查所有表的数据量:');
    const tables = ['assignments', 'submissions', 'courses', 'profiles'];
    
    for (const table of tables) {
      try {
        const { count, error } = await supabase
          .from(table)
          .select('*', { count: 'exact', head: true });
        
        if (error) {
          console.log(`${table}: 查询错误 - ${error.message}`);
        } else {
          console.log(`${table}: ${count || 0} 条记录`);
        }
      } catch (err) {
        console.log(`${table}: 查询异常 - ${err.message}`);
      }
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

testWithLogin();