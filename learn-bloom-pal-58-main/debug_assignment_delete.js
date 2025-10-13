import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function debugAssignmentDelete() {
  console.log('🔍 调试作业删除问题...');
  
  const targetCourseId = '550e8400-e29b-41d4-a716-446655440002';
  
  try {
    // 1. 检查课程信息
    console.log('\n1. 检查目标课程:');
    const { data: course, error: courseError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', targetCourseId)
      .single();
    
    if (courseError) {
      console.error('❌ 查询课程失败:', courseError);
      return;
    }
    
    console.log('✅ 课程信息:', {
      id: course.id,
      title: course.title,
      created_at: course.created_at
    });

    // 2. 查询关联的作业
    console.log('\n2. 查询关联作业:');
    const startTime = Date.now();
    const { data: assignments, error: assignError } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', targetCourseId);
    
    const queryTime = Date.now() - startTime;
    console.log(`查询耗时: ${queryTime}ms`);
    
    if (assignError) {
      console.error('❌ 查询作业失败:', assignError);
      return;
    }
    
    console.log(`✅ 找到 ${assignments?.length || 0} 个关联作业:`);
    assignments?.forEach((assignment, i) => {
      console.log(`  ${i + 1}. ${assignment.title} (ID: ${assignment.id})`);
    });

    if (!assignments || assignments.length === 0) {
      console.log('✅ 没有关联作业，可以直接删除课程');
      
      // 直接删除课程
      console.log('\n3. 直接删除课程:');
      const { error: directDeleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', targetCourseId);
      
      if (directDeleteError) {
        console.error('❌ 直接删除课程失败:', directDeleteError);
      } else {
        console.log('✅ 课程删除成功！');
      }
      return;
    }

    // 3. 尝试删除单个作业进行测试
    console.log('\n3. 测试删除单个作业:');
    const testAssignment = assignments[0];
    console.log(`测试删除作业: ${testAssignment.title}`);
    
    const deleteStartTime = Date.now();
    const { error: singleDeleteError } = await supabase
      .from('assignments')
      .delete()
      .eq('id', testAssignment.id);
    
    const deleteTime = Date.now() - deleteStartTime;
    console.log(`删除耗时: ${deleteTime}ms`);
    
    if (singleDeleteError) {
      console.error('❌ 删除单个作业失败:', singleDeleteError);
      console.error('错误详情:', {
        code: singleDeleteError.code,
        message: singleDeleteError.message,
        details: singleDeleteError.details,
        hint: singleDeleteError.hint
      });
    } else {
      console.log('✅ 单个作业删除成功');
      
      // 4. 删除剩余作业
      if (assignments.length > 1) {
        console.log('\n4. 删除剩余作业:');
        const remainingIds = assignments.slice(1).map(a => a.id);
        
        const { error: batchDeleteError } = await supabase
          .from('assignments')
          .delete()
          .in('id', remainingIds);
        
        if (batchDeleteError) {
          console.error('❌ 批量删除作业失败:', batchDeleteError);
        } else {
          console.log('✅ 批量删除作业成功');
        }
      }
      
      // 5. 最后删除课程
      console.log('\n5. 删除课程:');
      const { error: finalDeleteError } = await supabase
        .from('courses')
        .delete()
        .eq('id', targetCourseId);
      
      if (finalDeleteError) {
        console.error('❌ 删除课程失败:', finalDeleteError);
      } else {
        console.log('✅ 课程删除成功！');
      }
    }

    // 6. 检查当前认证状态
    console.log('\n6. 检查当前认证状态:');
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      console.error('❌ 获取认证状态失败:', authError);
    } else if (user) {
      console.log('✅ 当前用户:', user.email);
    } else {
      console.log('⚠️ 未认证状态 - 使用服务密钥');
    }

    console.log('\n🎉 调试完成！');
    
  } catch (error) {
    console.error('❌ 调试过程中发生错误:', error);
  }
}

debugAssignmentDelete();
