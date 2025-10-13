// 检查数据库表结构
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.VITE_SUPABASE_SERVICE_ROLE_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function checkSchema() {
  console.log('🔍 检查数据库表结构...');
  
  try {
    // 检查assignments表结构
    console.log('\n📋 检查assignments表:');
    const { data: assignments, error: assignError } = await supabase
      .from('assignments')
      .select('*')
      .limit(1);
    
    if (assignError) {
      console.log('❌ assignments表查询失败:', assignError.message);
    } else {
      console.log('✅ assignments表可以访问');
      if (assignments && assignments.length > 0) {
        console.log('📝 字段示例:', Object.keys(assignments[0]));
      } else {
        console.log('📝 表为空，无法显示字段');
      }
    }
    
    // 检查courses表
    console.log('\n📋 检查courses表:');
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .limit(1);
    
    if (courseError) {
      console.log('❌ courses表查询失败:', courseError.message);
    } else {
      console.log('✅ courses表可以访问');
      if (courses && courses.length > 0) {
        console.log('📝 字段示例:', Object.keys(courses[0]));
        console.log('📚 课程数量:', courses.length);
      }
    }
    
    // 检查其他关键表
    const tables = ['profiles', 'authorized_users', 'training_sessions'];
    for (const table of tables) {
      try {
        const { data, error } = await supabase
          .from(table)
          .select('*')
          .limit(1);
        
        if (error) {
          console.log(`❌ ${table}表: ${error.message}`);
        } else {
          console.log(`✅ ${table}表: 正常 (${data?.length || 0} 条记录)`);
        }
      } catch (err) {
        console.log(`❌ ${table}表: 检查失败`);
      }
    }
    
    // 尝试插入最简单的作业
    console.log('\n🔄 尝试插入简单作业...');
    try {
      const { error: insertError } = await supabase
        .from('assignments')
        .insert({
          course_id: '550e8400-e29b-41d4-a716-446655440001',
          title: '测试作业',
          description: '这是一个测试作业'
        });
      
      if (insertError) {
        console.log('❌ 作业插入失败:', insertError.message);
      } else {
        console.log('✅ 作业插入成功');
      }
    } catch (err) {
      console.log('❌ 作业插入异常:', err.message);
    }
    
  } catch (error) {
    console.error('❌ 检查失败:', error.message);
  }
}

checkSchema();
