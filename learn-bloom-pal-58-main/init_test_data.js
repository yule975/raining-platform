// 初始化测试数据脚本
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少 Supabase 环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function initializeTestData() {
  console.log('🚀 开始初始化测试数据...');
  
  try {
    // 1. 创建默认培训期次
    console.log('\n🔄 创建默认培训期次...');
    const { data: existingSession } = await supabase
      .from('training_sessions')
      .select('id')
      .eq('is_current', true)
      .limit(1);
    
    if (!existingSession || existingSession.length === 0) {
      const { data: newSession, error: sessionError } = await supabase
        .from('training_sessions')
        .insert({
          name: '第一期',
          description: '首期AI技术培训',
          start_date: new Date().toISOString().split('T')[0],
          status: 'active',
          is_current: true
        })
        .select()
        .single();
      
      if (sessionError) {
        console.error('❌ 创建培训期次失败:', sessionError.message);
      } else {
        console.log('✅ 创建培训期次成功:', newSession.name);
      }
    } else {
      console.log('✅ 培训期次已存在');
    }

    // 2. 检查是否已有课程数据
    console.log('\n🔄 检查课程数据...');
    const { data: existingCourses } = await supabase
      .from('courses')
      .select('id')
      .limit(1);
    
    if (!existingCourses || existingCourses.length === 0) {
      console.log('📝 插入示例课程...');
      const { error: courseError } = await supabase
        .from('courses')
        .insert([
          {
            id: '550e8400-e29b-41d4-a716-446655440001',
            title: '大语言模型基础',
            description: '深入学习大语言模型的原理、架构和应用，掌握Transformer、GPT等核心技术。包含理论讲解、代码实践和项目应用。',
            cover_url: '/assets/course-llm.jpg',
            video_url: 'https://www.youtube.com/embed/jNQXAC9IVRw',
            duration: '2小时30分钟',
            instructor: 'AI研究院'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440002',
            title: 'AI绘画与创意设计',
            description: '学习AI绘画技术，掌握GAN、扩散模型等生成技术，探索AI在创意设计中的应用。通过实际项目掌握AI创作工具。',
            cover_url: '/assets/course-ai-art.jpg',
            video_url: 'https://www.youtube.com/embed/jNQXAC9IVRw',
            duration: '3小时15分钟',
            instructor: '创意设计团队'
          },
          {
            id: '550e8400-e29b-41d4-a716-446655440003',
            title: 'Python编程进阶',
            description: '从基础语法到高级特性，全面掌握Python编程。包含数据结构、面向对象编程、异步编程等核心概念。',
            cover_url: '/assets/course-python.jpg',
            video_url: 'https://www.youtube.com/embed/jNQXAC9IVRw',
            duration: '4小时45分钟',
            instructor: '技术开发部'
          }
        ]);
      
      if (courseError) {
        console.error('❌ 插入课程数据失败:', courseError.message);
      } else {
        console.log('✅ 插入示例课程成功');
      }
    } else {
      console.log('✅ 课程数据已存在');
    }

    // 3. 检查并插入作业数据
    console.log('\n🔄 检查作业数据...');
    const { data: existingAssignments } = await supabase
      .from('assignments')
      .select('id')
      .limit(1);
    
    if (!existingAssignments || existingAssignments.length === 0) {
      console.log('📝 插入示例作业...');
      const { error: assignmentError } = await supabase
        .from('assignments')
        .insert([
          {
            course_id: '550e8400-e29b-41d4-a716-446655440001',
            title: '实现简单的Transformer模型',
            description: '使用PyTorch实现一个基础的Transformer编码器，包含多头注意力机制和位置编码。要求代码规范，注释详细。',
            due_date: '2024-12-31T23:59:59Z',
            max_score: 100,
            instructions: '请按照课程中学到的理论知识，实现一个完整的Transformer编码器模块。',
            requirements: ["实现多头注意力机制", "添加位置编码", "包含完整的前向传播", "提供详细代码注释"]
          },
          {
            course_id: '550e8400-e29b-41d4-a716-446655440002',
            title: 'AI绘画风格迁移项目',
            description: '选择一幅名画作为风格图片，使用神经风格迁移技术创作新作品。展示完整的创作过程和技术实现。',
            due_date: '2024-12-31T23:59:59Z',
            max_score: 100,
            instructions: '运用课程中学习的生成模型技术，完成一个完整的风格迁移项目。',
            requirements: ["提供原始内容图片", "提供风格参考图片", "展示最终生成结果", "撰写技术实现报告"]
          },
          {
            course_id: '550e8400-e29b-41d4-a716-446655440003',
            title: 'Python数据分析实战',
            description: '使用Python进行真实数据集的分析，包含数据清洗、可视化和统计分析。提交完整的分析报告。',
            due_date: '2024-12-31T23:59:59Z',
            max_score: 100,
            instructions: '选择一个真实的数据集，进行全面的数据分析，并提供详细的分析报告。',
            requirements: ["数据清洗和预处理", "统计分析和可视化", "结论和建议", "代码和文档"]
          }
        ]);
      
      if (assignmentError) {
        console.error('❌ 插入作业数据失败:', assignmentError.message);
      } else {
        console.log('✅ 插入示例作业成功');
      }
    } else {
      console.log('✅ 作业数据已存在');
    }

    // 4. 创建授权用户
    console.log('\n🔄 创建授权用户...');
    const { data: existingUsers } = await supabase
      .from('authorized_users')
      .select('email')
      .in('email', ['admin@test.com', 'student@test.com']);
    
    const existingEmails = existingUsers?.map(u => u.email) || [];
    
    const usersToCreate = [
      { email: 'admin@test.com', name: '系统管理员', status: 'active' },
      { email: 'student@test.com', name: '测试学员', status: 'active' }
    ].filter(user => !existingEmails.includes(user.email));
    
    if (usersToCreate.length > 0) {
      const { error: usersError } = await supabase
        .from('authorized_users')
        .insert(usersToCreate);
      
      if (usersError) {
        console.error('❌ 创建授权用户失败:', usersError.message);
      } else {
        console.log(`✅ 创建授权用户成功: ${usersToCreate.map(u => u.email).join(', ')}`);
      }
    } else {
      console.log('✅ 授权用户已存在');
    }
    
    console.log('\n🎉 测试数据初始化完成!');
    console.log('\n📋 已创建的数据:');
    console.log('   📚 课程: 大语言模型基础、AI绘画与创意设计、Python编程进阶');
    console.log('   📝 作业: 每门课程都有对应的实践作业');
    console.log('   👥 用户: admin@test.com (管理员), student@test.com (学员)');
    console.log('   🎯 期次: 第一期 (当前活跃期次)');
    console.log('\n🚀 下一步: 访问 http://localhost:8080 开始使用平台');
    
    return true;
    
  } catch (error) {
    console.error('❌ 初始化测试数据失败:', error.message);
    return false;
  }
}

async function checkStorageBuckets() {
  console.log('\n🔄 检查存储桶状态...');
  
  const buckets = ['assignments', 'course-materials', 'user-avatars', 'course-covers'];
  
  for (const bucket of buckets) {
    try {
      const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });
      if (error) {
        console.log(`❌ 存储桶 ${bucket}: ${error.message}`);
      } else {
        console.log(`✅ 存储桶 ${bucket}: 正常`);
      }
    } catch (err) {
      console.log(`❌ 存储桶 ${bucket}: 检查失败`);
    }
  }
  
  console.log('\n💡 存储桶权限配置提示:');
  console.log('   如果存在权限问题，请在Supabase控制台的Storage部分设置以下策略:');
  console.log('   1. assignments: 学生可以上传和查看自己的文件');
  console.log('   2. course-materials: 所有认证用户可以查看');
  console.log('   3. user-avatars: 用户可以上传和查看自己的头像');
  console.log('   4. course-covers: 管理员可以上传，所有用户可以查看');
}

// 运行初始化
async function main() {
  const success = await initializeTestData();
  await checkStorageBuckets();
  
  if (success) {
    console.log('\n🎉 系统初始化完成! 现在可以正常使用培训平台了。');
  } else {
    console.log('\n⚠️  初始化过程中有部分错误，请检查日志。');
  }
  
  process.exit(success ? 0 : 1);
}

main().catch(error => {
  console.error('❌ 初始化脚本执行失败:', error);
  process.exit(1);
});
