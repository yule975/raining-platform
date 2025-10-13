// 修复作业数据插入
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixAssignments() {
  console.log('🔄 修复作业数据...');
  
  try {
    // 检查现有作业
    const { data: existing } = await supabase
      .from('assignments')
      .select('id')
      .limit(1);
    
    if (existing && existing.length > 0) {
      console.log('✅ 作业数据已存在');
      return true;
    }
    
    // 插入简化的作业数据（不包含instructions字段）
    const { error } = await supabase
      .from('assignments')
      .insert([
        {
          course_id: '550e8400-e29b-41d4-a716-446655440001',
          title: '实现简单的Transformer模型',
          description: '使用PyTorch实现一个基础的Transformer编码器，包含多头注意力机制和位置编码。要求代码规范，注释详细。请按照课程中学到的理论知识，实现一个完整的Transformer编码器模块。',
          due_date: '2024-12-31T23:59:59Z',
          max_score: 100,
          requirements: ["实现多头注意力机制", "添加位置编码", "包含完整的前向传播", "提供详细代码注释"]
        },
        {
          course_id: '550e8400-e29b-41d4-a716-446655440002',
          title: 'AI绘画风格迁移项目',
          description: '选择一幅名画作为风格图片，使用神经风格迁移技术创作新作品。展示完整的创作过程和技术实现。运用课程中学习的生成模型技术，完成一个完整的风格迁移项目。',
          due_date: '2024-12-31T23:59:59Z',
          max_score: 100,
          requirements: ["提供原始内容图片", "提供风格参考图片", "展示最终生成结果", "撰写技术实现报告"]
        },
        {
          course_id: '550e8400-e29b-41d4-a716-446655440003',
          title: 'Python数据分析实战',
          description: '使用Python进行真实数据集的分析，包含数据清洗、可视化和统计分析。提交完整的分析报告。选择一个真实的数据集，进行全面的数据分析，并提供详细的分析报告。',
          due_date: '2024-12-31T23:59:59Z',
          max_score: 100,
          requirements: ["数据清洗和预处理", "统计分析和可视化", "结论和建议", "代码和文档"]
        }
      ]);
    
    if (error) {
      console.error('❌ 插入作业失败:', error.message);
      return false;
    }
    
    console.log('✅ 作业数据插入成功');
    return true;
    
  } catch (error) {
    console.error('❌ 修复作业数据失败:', error.message);
    return false;
  }
}

fixAssignments().then(success => {
  if (success) {
    console.log('🎉 作业数据修复完成!');
  }
  process.exit(success ? 0 : 1);
});
