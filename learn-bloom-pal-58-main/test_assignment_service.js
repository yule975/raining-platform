// 测试 AssignmentService 性能
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 从环境变量读取配置
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('Missing Supabase environment variables');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function testAssignmentService() {
  console.log('开始测试 AssignmentService...');
  console.log('Supabase URL:', supabaseUrl);
  
  try {
    // 测试获取作业列表
    console.log('\n1. 测试获取作业列表...');
    const startTime1 = Date.now();
    
    const { data: assignments, error: assignmentsError } = await supabase
      .from('assignments')
      .select(`
        *,
        courses(title),
        submissions:submissions(count)
      `)
      .order('created_at', { ascending: false });
    
    const endTime1 = Date.now();
    console.log(`获取作业列表耗时: ${endTime1 - startTime1}ms`);
    
    if (assignmentsError) {
      console.error('获取作业列表错误:', assignmentsError);
    } else {
      console.log(`成功获取 ${assignments?.length || 0} 条作业记录`);
    }
    
    // 测试获取统计信息
    console.log('\n2. 测试获取统计信息...');
    const startTime2 = Date.now();
    
    // 获取作业总数
    const { count: totalAssignments, error: countError1 } = await supabase
      .from('assignments')
      .select('*', { count: 'exact', head: true });
    
    // 获取提交总数
    const { count: totalSubmissions, error: countError2 } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true });
    
    // 获取已完成提交数
    const { count: completedSubmissions, error: countError3 } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'completed');
    
    // 获取待批改数
    const { count: pendingReview, error: countError4 } = await supabase
      .from('submissions')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'submitted');
    
    const endTime2 = Date.now();
    console.log(`获取统计信息耗时: ${endTime2 - startTime2}ms`);
    
    if (countError1 || countError2 || countError3 || countError4) {
      console.error('获取统计信息错误:', {
        countError1,
        countError2,
        countError3,
        countError4
      });
    } else {
      console.log('统计信息:', {
        totalAssignments,
        totalSubmissions,
        completedSubmissions,
        pendingReview
      });
    }
    
    // 测试数据库连接
    console.log('\n3. 测试数据库连接...');
    const { data: tables, error: tablesError } = await supabase
      .from('information_schema.tables')
      .select('table_name')
      .eq('table_schema', 'public')
      .limit(5);
    
    if (tablesError) {
      console.error('数据库连接错误:', tablesError);
    } else {
      console.log('数据库连接正常，找到表:', tables?.map(t => t.table_name));
    }
    
  } catch (error) {
    console.error('测试过程中发生错误:', error);
  }
}

testAssignmentService();