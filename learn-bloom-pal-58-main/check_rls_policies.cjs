require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少Supabase配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  console.log('🔍 检查RLS策略和表权限...');
  
  try {
    // 检查表权限
    console.log('\n1. 检查表权限:');
    const { data: grants, error: grantsError } = await supabase
      .rpc('exec_sql', {
        sql: `SELECT grantee, table_name, privilege_type 
              FROM information_schema.role_table_grants 
              WHERE table_schema = 'public' 
              AND grantee IN ('anon', 'authenticated') 
              ORDER BY table_name, grantee;`
      });
    
    if (grantsError) {
      console.log('尝试直接查询权限信息...');
      // 如果RPC不可用，尝试直接查询
      const { data: tablesInfo } = await supabase
        .from('information_schema.tables')
        .select('*')
        .eq('table_schema', 'public');
      
      console.log('找到的表:', tablesInfo?.map(t => t.table_name) || []);
    } else {
      console.log('表权限:', grants);
    }
    
    // 检查RLS策略
    console.log('\n2. 检查RLS策略:');
    const { data: policies, error: policiesError } = await supabase
      .rpc('exec_sql', {
        sql: `SELECT schemaname, tablename, policyname, permissive, roles, cmd, qual 
              FROM pg_policies 
              WHERE schemaname = 'public' 
              ORDER BY tablename, policyname;`
      });
    
    if (policiesError) {
      console.log('❌ 无法查询RLS策略:', policiesError.message);
      
      // 尝试检查特定表的RLS状态
      console.log('\n3. 检查表的RLS状态:');
      const tables = ['profiles', 'authorized_users', 'courses', 'assignments'];
      
      for (const table of tables) {
        try {
          // 测试匿名用户访问
          const anonClient = createClient(supabaseUrl, process.env.VITE_SUPABASE_ANON_KEY);
          const { data, error } = await anonClient.from(table).select('*').limit(1);
          
          if (error) {
            console.log(`❌ 表 ${table} - 匿名访问失败:`, error.message);
          } else {
            console.log(`✅ 表 ${table} - 匿名访问成功`);
          }
        } catch (err) {
          console.log(`❌ 表 ${table} - 访问异常:`, err.message);
        }
      }
    } else {
      console.log('RLS策略:');
      policies.forEach(policy => {
        console.log(`  表: ${policy.tablename}`);
        console.log(`  策略: ${policy.policyname}`);
        console.log(`  角色: ${policy.roles}`);
        console.log(`  命令: ${policy.cmd}`);
        console.log(`  条件: ${policy.qual}`);
        console.log('  ---');
      });
    }
    
    // 测试认证功能
    console.log('\n4. 测试认证相关查询:');
    
    // 测试profiles表访问
    try {
      const { data: profilesData, error: profilesError } = await supabase
        .from('profiles')
        .select('*')
        .limit(5);
      
      if (profilesError) {
        console.log('❌ profiles表查询失败:', profilesError.message);
      } else {
        console.log(`✅ profiles表查询成功，找到 ${profilesData.length} 条记录`);
      }
    } catch (err) {
      console.log('❌ profiles表查询异常:', err.message);
    }
    
    // 测试authorized_users表访问
    try {
      const { data: authUsersData, error: authUsersError } = await supabase
        .from('authorized_users')
        .select('*')
        .limit(5);
      
      if (authUsersError) {
        console.log('❌ authorized_users表查询失败:', authUsersError.message);
      } else {
        console.log(`✅ authorized_users表查询成功，找到 ${authUsersData.length} 条记录`);
      }
    } catch (err) {
      console.log('❌ authorized_users表查询异常:', err.message);
    }
    
  } catch (error) {
    console.error('❌ 检查过程中出现错误:', error.message);
  }
}

checkRLSPolicies();