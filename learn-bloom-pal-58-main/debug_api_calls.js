import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAPICalls() {
  console.log('🔍 逐个测试API调用...');
  
  try {
    // 1. 测试课程获取
    console.log('\n1. 测试获取课程数据:');
    const coursesStart = Date.now();
    try {
      const { data: courses, error: coursesError } = await adminSupabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      const coursesTime = Date.now() - coursesStart;
      console.log(`✅ 课程数据获取成功 (${coursesTime}ms): ${courses?.length || 0} 个课程`);
      
      if (coursesError) {
        console.error('课程获取错误:', coursesError);
      }
    } catch (error) {
      console.error('❌ 课程获取异常:', error);
    }

    // 2. 测试作业获取
    console.log('\n2. 测试获取作业数据:');
    const assignmentsStart = Date.now();
    try {
      const { data: assignments, error: assignmentsError } = await adminSupabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false });
      
      const assignmentsTime = Date.now() - assignmentsStart;
      console.log(`✅ 作业数据获取成功 (${assignmentsTime}ms): ${assignments?.length || 0} 个作业`);
      
      if (assignmentsError) {
        console.error('作业获取错误:', assignmentsError);
      }
    } catch (error) {
      console.error('❌ 作业获取异常:', error);
    }

    // 3. 测试提交数据获取
    console.log('\n3. 测试获取提交数据:');
    const submissionsStart = Date.now();
    try {
      const { data: submissions, error: submissionsError } = await adminSupabase
        .from('submissions')
        .select(`
          *,
          assignments:assignment_id (title, course_id),
          profiles:student_id (full_name, email)
        `)
        .order('submitted_at', { ascending: false });
      
      const submissionsTime = Date.now() - submissionsStart;
      console.log(`✅ 提交数据获取成功 (${submissionsTime}ms): ${submissions?.length || 0} 个提交`);
      
      if (submissionsError) {
        console.error('提交数据获取错误:', submissionsError);
      }
    } catch (error) {
      console.error('❌ 提交数据获取异常:', error);
    }

    // 4. 测试简化的提交数据获取（不使用JOIN）
    console.log('\n4. 测试简化提交数据获取:');
    const simpleSubmissionsStart = Date.now();
    try {
      const { data: simpleSubmissions, error: simpleError } = await adminSupabase
        .from('submissions')
        .select('*')
        .order('submitted_at', { ascending: false });
      
      const simpleSubmissionsTime = Date.now() - simpleSubmissionsStart;
      console.log(`✅ 简化提交数据获取成功 (${simpleSubmissionsTime}ms): ${simpleSubmissions?.length || 0} 个提交`);
      
      if (simpleError) {
        console.error('简化提交数据获取错误:', simpleError);
      }
    } catch (error) {
      console.error('❌ 简化提交数据获取异常:', error);
    }

    // 5. 检查数据库表是否存在
    console.log('\n5. 检查数据库表结构:');
    try {
      const tables = ['courses', 'assignments', 'submissions', 'profiles'];
      
      for (const table of tables) {
        try {
          const { data, error } = await adminSupabase
            .from(table)
            .select('*')
            .limit(1);
          
          if (error) {
            console.error(`❌ 表 ${table} 查询失败:`, error);
          } else {
            console.log(`✅ 表 ${table} 存在，包含 ${data?.length || 0} 条示例数据`);
          }
        } catch (tableError) {
          console.error(`❌ 表 ${table} 访问异常:`, tableError);
        }
      }
    } catch (error) {
      console.error('❌ 表结构检查异常:', error);
    }

    console.log('\n🎉 API调用测试完成！');
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  }
}

debugAPICalls();
