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

async function checkAssignmentsPermissions() {
  console.log('检查assignments表权限和RLS设置...');
  
  try {
    // 1. 检查表权限
    console.log('\n1. 检查表权限:');
    const { data: permissions, error: permError } = await supabase
      .from('information_schema.role_table_grants')
      .select('grantee, table_name, privilege_type')
      .eq('table_schema', 'public')
      .eq('table_name', 'assignments')
      .in('grantee', ['anon', 'authenticated']);
    
    if (permError) {
      console.error('权限查询错误:', permError);
    } else {
      console.log('表权限:', permissions);
    }
    
    // 2. 检查RLS状态
    console.log('\n2. 检查RLS状态:');
    const { data: rlsStatus, error: rlsError } = await supabase
      .from('pg_tables')
      .select('tablename, rowsecurity')
      .eq('schemaname', 'public')
      .eq('tablename', 'assignments');
    
    if (rlsError) {
      console.error('RLS状态查询错误:', rlsError);
    } else {
      console.log('RLS状态:', rlsStatus);
    }
    
    // 3. 尝试直接查询assignments表
    console.log('\n3. 尝试查询assignments表:');
    const { data: assignments, error: queryError } = await supabase
      .from('assignments')
      .select('*')
      .limit(5);
    
    if (queryError) {
      console.error('查询assignments表错误:', queryError);
    } else {
      console.log(`成功查询到 ${assignments?.length || 0} 条记录`);
      if (assignments && assignments.length > 0) {
        console.log('示例记录:', assignments[0]);
      }
    }
    
    // 4. 检查当前用户
    console.log('\n4. 检查当前用户:');
    const { data: user, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('获取用户信息错误:', userError);
    } else {
      console.log('当前用户:', user?.user ? '已登录' : '未登录');
      if (user?.user) {
        console.log('用户ID:', user.user.id);
        console.log('用户邮箱:', user.user.email);
      }
    }
    
  } catch (error) {
    console.error('检查过程中发生错误:', error);
  }
}

checkAssignmentsPermissions();