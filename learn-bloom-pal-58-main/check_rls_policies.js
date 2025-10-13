import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkRLSPolicies() {
  console.log('🔍 检查RLS策略...');
  
  try {
    // 检查assignments表的RLS策略
    console.log('\n1. 检查assignments表的RLS策略:');
    
    // 首先检查RLS是否启用
    const { data: tableInfo, error: tableError } = await supabase
      .from('pg_tables')
      .select('*')
      .eq('tablename', 'assignments')
      .single();
    
    if (tableError) {
      console.log('无法查询表信息，尝试其他方法...');
    } else {
      console.log('✅ assignments表存在');
    }

    // 查询RLS策略
    try {
      const { data: policies, error: policyError } = await supabase
        .rpc('get_policies', { table_name: 'assignments' })
        .catch(() => {
          // 如果RPC不存在，尝试直接查询
          return supabase
            .from('pg_policies')
            .select('*')
            .eq('tablename', 'assignments');
        });

      if (policyError) {
        console.log('⚠️ 无法查询RLS策略:', policyError.message);
      } else if (policies) {
        console.log(`📋 找到 ${policies.length} 个RLS策略`);
        policies.forEach((policy, i) => {
          console.log(`  ${i + 1}. ${policy.policyname}: ${policy.cmd} - ${policy.roles?.join(', ') || 'ALL'}`);
        });
      }
    } catch (rlsError) {
      console.log('⚠️ RLS策略查询失败:', rlsError.message);
    }

    // 2. 测试当前用户能否删除assignments
    console.log('\n2. 测试删除权限:');
    
    // 创建一个测试作业
    console.log('创建测试作业...');
    const testAssignment = {
      course_id: '00000000-0000-0000-0000-000000000000', // 不存在的课程ID
      title: '测试删除权限作业',
      description: '用于测试删除权限',
      assignment_type: 'general',
      due_date: new Date().toISOString(),
      max_score: 100,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: createdAssignment, error: createError } = await supabase
      .from('assignments')
      .insert(testAssignment)
      .select()
      .single();

    if (createError) {
      console.error('❌ 创建测试作业失败:', createError);
      return;
    }

    console.log('✅ 测试作业创建成功:', createdAssignment.id);

    // 尝试删除
    console.log('尝试删除测试作业...');
    const deleteStartTime = Date.now();
    const { error: deleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('id', createdAssignment.id);

    const deleteTime = Date.now() - deleteStartTime;
    console.log(`删除操作耗时: ${deleteTime}ms`);

    if (deleteError) {
      console.error('❌ 删除测试作业失败:', deleteError);
      console.error('错误详情:', {
        code: deleteError.code,
        message: deleteError.message,
        details: deleteError.details,
        hint: deleteError.hint
      });
    } else {
      console.log('✅ 删除测试作业成功');
    }

    // 3. 检查courses表的RLS
    console.log('\n3. 检查courses表的RLS策略:');
    
    try {
      const { data: coursePolicies } = await supabase
        .from('pg_policies')
        .select('*')
        .eq('tablename', 'courses')
        .catch(() => ({ data: [] }));

      if (coursePolicies && coursePolicies.length > 0) {
        console.log(`📋 courses表有 ${coursePolicies.length} 个RLS策略`);
        coursePolicies.forEach((policy, i) => {
          console.log(`  ${i + 1}. ${policy.policyname}: ${policy.cmd}`);
        });
      } else {
        console.log('⚠️ 无法查询courses表的RLS策略');
      }
    } catch (error) {
      console.log('⚠️ courses表RLS查询失败:', error.message);
    }

    console.log('\n🎉 RLS策略检查完成！');
    
  } catch (error) {
    console.error('❌ 检查过程中发生错误:', error);
  }
}

checkRLSPolicies();
