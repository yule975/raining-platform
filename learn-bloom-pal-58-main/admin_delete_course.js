import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const adminSupabase = createClient(supabaseUrl, supabaseServiceKey);

// 管理员专用删除函数
async function adminDeleteCourse(courseId) {
  try {
    console.log('🔧 管理员删除课程:', courseId);
    
    // 1. 删除关联作业
    console.log('删除关联作业...');
    const { error: assignmentError } = await adminSupabase
      .from('assignments')
      .delete()
      .eq('course_id', courseId);
    
    if (assignmentError) {
      console.error('删除作业失败:', assignmentError);
      return false;
    }
    console.log('✅ 作业删除成功');

    // 2. 删除课程材料
    console.log('删除课程材料...');
    const { error: materialError } = await adminSupabase
      .from('course_materials')
      .delete()
      .eq('course_id', courseId);
    
    if (materialError && materialError.code !== 'PGRST116') {
      console.error('删除材料失败:', materialError);
      return false;
    }
    console.log('✅ 课程材料删除成功');

    // 3. 删除课程
    console.log('删除课程...');
    const { error: courseError } = await adminSupabase
      .from('courses')
      .delete()
      .eq('id', courseId);
    
    if (courseError) {
      console.error('删除课程失败:', courseError);
      return false;
    }
    console.log('✅ 课程删除成功');

    return true;
  } catch (error) {
    console.error('删除过程异常:', error);
    return false;
  }
}

// 从命令行参数获取课程ID
const courseId = process.argv[2];

if (!courseId) {
  console.log('用法: node admin_delete_course.js <课程ID>');
  console.log('例如: node admin_delete_course.js 550e8400-e29b-41d4-a716-446655440002');
  process.exit(1);
}

adminDeleteCourse(courseId).then(success => {
  if (success) {
    console.log('🎉 课程删除完成！');
  } else {
    console.log('❌ 课程删除失败！');
  }
  process.exit(success ? 0 : 1);
});
