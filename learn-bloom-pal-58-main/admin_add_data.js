// 使用管理员权限添加测试数据
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

// 使用服务角色密钥，绕过RLS
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

async function addTestData() {
  console.log('🔄 使用管理员权限添加测试数据...');
  
  try {
    // 1. 检查并添加课程
    console.log('\n📚 检查课程数据...');
    const { data: existingCourses } = await supabase
      .from('courses')
      .select('id, title');
    
    console.log(`已有课程: ${existingCourses?.length || 0} 个`);
    
    // 2. 检查并添加作业
    console.log('\n📝 检查作业数据...');
    const { data: existingAssignments } = await supabase
      .from('assignments')
      .select('id, title');
    
    console.log(`已有作业: ${existingAssignments?.length || 0} 个`);
    
    // 如果作业数量少于课程数量，添加更多作业
    if (existingCourses && existingCourses.length > 0 && (!existingAssignments || existingAssignments.length < existingCourses.length)) {
      console.log('🔄 添加作业...');
      
      const assignmentsToAdd = [];
      
      for (const course of existingCourses) {
        // 检查该课程是否已有作业
        const courseAssignments = existingAssignments?.filter(a => a.course_id === course.id) || [];
        
        if (courseAssignments.length === 0) {
          if (course.title.includes('大语言模型')) {
            assignmentsToAdd.push({
              course_id: course.id,
              title: '实现简单的Transformer模型',
              description: '使用PyTorch实现一个基础的Transformer编码器，包含多头注意力机制和位置编码。要求代码规范，注释详细。'
            });
          } else if (course.title.includes('AI绘画')) {
            assignmentsToAdd.push({
              course_id: course.id,
              title: 'AI绘画风格迁移项目',
              description: '选择一幅名画作为风格图片，使用神经风格迁移技术创作新作品。展示完整的创作过程和技术实现。'
            });
          } else {
            assignmentsToAdd.push({
              course_id: course.id,
              title: '课程学习总结',
              description: '请总结本课程的核心知识点，并结合实际案例说明应用场景。字数不少于1000字。'
            });
          }
        }
      }
      
      if (assignmentsToAdd.length > 0) {
        const { error: assignmentError } = await supabase
          .from('assignments')
          .insert(assignmentsToAdd);
        
        if (assignmentError) {
          console.error('❌ 插入作业失败:', assignmentError.message);
        } else {
          console.log(`✅ 成功添加 ${assignmentsToAdd.length} 个作业`);
        }
      }
    }
    
    // 3. 验证数据
    console.log('\n🔍 验证数据...');
    
    const { data: finalCourses } = await supabase
      .from('courses')
      .select('id, title');
    
    const { data: finalAssignments } = await supabase
      .from('assignments')
      .select('id, title, course_id');
    
    const { data: sessions } = await supabase
      .from('training_sessions')
      .select('id, name, is_current');
    
    const { data: users } = await supabase
      .from('authorized_users')
      .select('email, name, status');
    
    console.log('📊 最终数据统计:');
    console.log(`   📚 课程: ${finalCourses?.length || 0} 个`);
    console.log(`   📝 作业: ${finalAssignments?.length || 0} 个`);
    console.log(`   🎯 期次: ${sessions?.length || 0} 个`);
    console.log(`   👥 用户: ${users?.length || 0} 个`);
    
    if (finalCourses && finalCourses.length > 0) {
      console.log('\n📚 课程列表:');
      finalCourses.forEach(course => {
        const courseAssignments = finalAssignments?.filter(a => a.course_id === course.id) || [];
        console.log(`   - ${course.title} (${courseAssignments.length} 个作业)`);
      });
    }
    
    if (sessions && sessions.length > 0) {
      console.log('\n🎯 培训期次:');
      sessions.forEach(session => {
        console.log(`   - ${session.name} ${session.is_current ? '(当前)' : ''}`);
      });
    }
    
    console.log('\n🎉 数据初始化完成! 现在可以使用培训平台了。');
    console.log('🚀 访问地址: http://localhost:8080');
    
    return true;
    
  } catch (error) {
    console.error('❌ 添加测试数据失败:', error.message);
    return false;
  }
}

addTestData().then(success => {
  process.exit(success ? 0 : 1);
});
