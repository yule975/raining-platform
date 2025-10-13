// 添加更多测试作业
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function addAssignments() {
  console.log('🔄 添加更多测试作业...');
  
  try {
    // 获取现有的课程ID
    const { data: courses } = await supabase
      .from('courses')
      .select('id, title');
    
    if (!courses || courses.length === 0) {
      console.log('❌ 没有找到课程，请先创建课程');
      return false;
    }
    
    console.log('📚 找到课程:', courses.map(c => c.title).join(', '));
    
    // 为每个课程添加作业
    const assignmentsToAdd = [];
    
    for (const course of courses) {
      if (course.title.includes('大语言模型')) {
        assignmentsToAdd.push({
          course_id: course.id,
          title: '实现简单的Transformer模型',
          description: '使用PyTorch实现一个基础的Transformer编码器，包含多头注意力机制和位置编码。要求代码规范，注释详细。',
          due_date: '2024-12-31T23:59:59Z'
        });
      } else if (course.title.includes('AI绘画')) {
        assignmentsToAdd.push({
          course_id: course.id,
          title: 'AI绘画风格迁移项目',
          description: '选择一幅名画作为风格图片，使用神经风格迁移技术创作新作品。展示完整的创作过程和技术实现。',
          due_date: '2024-12-31T23:59:59Z'
        });
      } else if (course.title.includes('Python')) {
        assignmentsToAdd.push({
          course_id: course.id,
          title: 'Python数据分析实战',
          description: '使用Python进行真实数据集的分析，包含数据清洗、可视化和统计分析。提交完整的分析报告。',
          due_date: '2024-12-31T23:59:59Z'
        });
      } else {
        // 通用作业
        assignmentsToAdd.push({
          course_id: course.id,
          title: '课程学习总结',
          description: '请总结本课程的核心知识点，并结合实际案例说明应用场景。字数不少于1000字。',
          due_date: '2024-12-31T23:59:59Z'
        });
      }
    }
    
    // 插入作业
    if (assignmentsToAdd.length > 0) {
      const { error } = await supabase
        .from('assignments')
        .insert(assignmentsToAdd);
      
      if (error) {
        console.error('❌ 插入作业失败:', error.message);
        return false;
      }
      
      console.log(`✅ 成功添加 ${assignmentsToAdd.length} 个作业`);
    }
    
    // 验证插入结果
    const { data: allAssignments } = await supabase
      .from('assignments')
      .select('id, title, course_id');
    
    console.log(`📝 总共有 ${allAssignments?.length || 0} 个作业`);
    
    return true;
    
  } catch (error) {
    console.error('❌ 添加作业失败:', error.message);
    return false;
  }
}

addAssignments().then(success => {
  if (success) {
    console.log('🎉 作业数据添加完成!');
  }
  process.exit(success ? 0 : 1);
});
