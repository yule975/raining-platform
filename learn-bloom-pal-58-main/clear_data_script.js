import { supabase } from './supabase-node.js';

// 完整数据清理脚本
async function clearAllDataForFreshStart() {
  console.log('🧹 开始清理所有数据...');
  
  // 定义管理员用户ID（如果需要保留特定用户）
  const adminUserId = 'admin-user-id'; // 可以根据需要修改
  
  try {
    // 1. 清除所有业务数据表（按依赖关系顺序）
    console.log('清除作业提交记录...');
    const { error: submissionError } = await supabase
      .from('submissions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (submissionError) {
      console.error('清除作业提交记录失败:', submissionError);
    } else {
      console.log('✓ 作业提交记录已清除');
    }

    console.log('清除作业记录...');
    const { error: assignmentError } = await supabase
      .from('assignments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (assignmentError) {
      console.error('清除作业记录失败:', assignmentError);
    } else {
      console.log('✓ 作业记录已清除');
    }

    console.log('清理课程注册记录...');
    const { error: enrollmentError } = await supabase
      .from('course_enrollments')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (enrollmentError) {
      console.error('清理课程注册记录失败:', enrollmentError);
    } else {
      console.log('✓ 课程注册记录已清除');
    }

    console.log('清除培训期次记录...');
    const { error: sessionError } = await supabase
      .from('training_sessions')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (sessionError) {
      console.error('清除培训期次记录失败:', sessionError);
    } else {
      console.log('✓ 培训期次记录已清除');
    }

    console.log('清除课程记录...');
    const { error: courseError } = await supabase
      .from('courses')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (courseError) {
      console.error('清除课程记录失败:', courseError);
    } else {
      console.log('✓ 课程记录已清除');
    }

    // 2. 清理所有用户资料（简化处理）
    console.log('清理用户资料...');
    const { error: profilesError } = await supabase
      .from('profiles')
      .delete()
      .neq('id', '00000000-0000-0000-0000-000000000000');
    
    if (profilesError) {
      console.error('清理用户资料失败:', profilesError);
    } else {
      console.log('✓ 用户资料已清除');
    }

    // 4. 验证清理结果
    console.log('\n验证清理结果:');
    
    const tables = [
      'submissions',
      'assignments', 
      'course_enrollments',
      'training_sessions',
      'course_materials',
      'courses'
    ];
    
    for (const table of tables) {
      const { count, error } = await supabase
        .from(table)
        .select('*', { count: 'exact', head: true });
      
      if (error) {
        console.error(`检查表 ${table} 失败:`, error);
      } else {
        console.log(`${table}: ${count} 条记录`);
      }
    }
    
    // 检查用户资料
    const { count: profileCount, error: profileCountError } = await supabase
      .from('profiles')
      .select('*', { count: 'exact', head: true });
    
    if (profileCountError) {
      console.error('检查用户资料失败:', profileCountError);
    } else {
      console.log(`profiles: ${profileCount} 条记录`);
    }

    console.log('🎉 数据清理完成！现在可以通过管理员界面创建全新数据。');
    
    return {
      success: true,
      message: '数据清理完成'
    };

  } catch (error) {
    console.error('❌ 数据清理过程中发生错误:', error);
    return {
      success: false,
      message: '数据清理失败',
      error: error.message
    };
  }
}

// 执行清理
clearAllDataForFreshStart()
  .then(result => {
    console.log('清理结果:', result);
  })
  .catch(error => {
    console.error('执行失败:', error);
  });
