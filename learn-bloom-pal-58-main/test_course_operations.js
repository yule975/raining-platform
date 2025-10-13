import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testCourseOperations() {
  console.log('🧪 测试课程操作权限...');
  
  try {
    // 1. 测试读取课程
    console.log('\n1. 测试读取课程:');
    const { data: courses, error: readError } = await supabase
      .from('courses')
      .select('*');
    
    if (readError) {
      console.error('❌ 读取课程失败:', readError);
    } else {
      console.log(`✅ 成功读取 ${courses?.length || 0} 个课程`);
      courses?.forEach((course, index) => {
        console.log(`  ${index + 1}. ${course.title} (ID: ${course.id})`);
      });
    }

    // 2. 测试创建课程
    console.log('\n2. 测试创建课程:');
    const testCourse = {
      title: '测试课程 ' + Date.now(),
      description: '这是一个测试课程',
      cover_url: 'https://via.placeholder.com/300x200',
      video_url: '',
      duration: '2小时',
      instructor: '测试讲师',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };
    
    const { data: newCourse, error: createError } = await supabase
      .from('courses')
      .insert(testCourse)
      .select()
      .single();
    
    if (createError) {
      console.error('❌ 创建课程失败:', createError);
    } else {
      console.log('✅ 课程创建成功:', newCourse.title, '(ID:', newCourse.id, ')');
      
      // 3. 测试删除刚创建的课程
      console.log('\n3. 测试删除课程:');
      const { error: deleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', newCourse.id);
      
      if (deleteError) {
        console.error('❌ 删除课程失败:', deleteError);
      } else {
        console.log('✅ 课程删除成功');
      }
    }

    // 4. 检查RLS策略
    console.log('\n4. 检查数据库策略:');
    const { data: policies, error: policyError } = await supabase
      .rpc('pg_policies', { table_name: 'courses' })
      .then(() => null)
      .catch(() => {
        // 如果RPC不存在，尝试直接查询
        return supabase
          .from('pg_policies')
          .select('*')
          .eq('tablename', 'courses');
      });

    if (policyError) {
      console.warn('⚠️ 无法检查RLS策略:', policyError.message);
    } else if (policies?.data) {
      console.log('📋 RLS策略:', policies.data.length, '个策略');
    }

    console.log('\n🎉 课程操作测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

testCourseOperations();
