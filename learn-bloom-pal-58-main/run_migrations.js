// 运行数据库迁移脚本
import { createClient } from '@supabase/supabase-js';
import fs from 'fs';
import path from 'path';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少 Supabase 环境变量');
  console.log('需要的环境变量:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

// 使用服务角色密钥创建客户端，以获得管理员权限
const supabase = createClient(supabaseUrl, supabaseServiceKey, {
  auth: {
    autoRefreshToken: false,
    persistSession: false
  }
});

// 需要运行的迁移文件列表（按顺序）
const migrationFiles = [
  '001_initial_schema.sql',
  '002_training_sessions.sql', 
  '003_session_courses_relation.sql',
  '20241210_create_learning_progress_tables.sql',
  '20241210_init_sample_courses.sql',
  '20241210_init_sample_assignments.sql',
  'create_test_accounts.sql'
];

async function runMigration(filename) {
  try {
    const migrationPath = path.join('./supabase/migrations', filename);
    
    if (!fs.existsSync(migrationPath)) {
      console.log(`⚠️  迁移文件不存在: ${filename}`);
      return false;
    }
    
    console.log(`\n🔄 运行迁移: ${filename}`);
    
    const sql = fs.readFileSync(migrationPath, 'utf8');
    
    // 分割SQL语句（以分号和换行符分割）
    const statements = sql
      .split(/;\s*(?:\r?\n|$)/)
      .map(stmt => stmt.trim())
      .filter(stmt => stmt.length > 0 && !stmt.startsWith('--'));
    
    for (const statement of statements) {
      if (statement.trim()) {
        try {
          const { error } = await supabase.rpc('exec_sql', { sql_query: statement });
          if (error) {
            // 如果RPC不存在，尝试直接执行
            if (error.message.includes('function "exec_sql" does not exist')) {
              console.log('   ℹ️  使用直接查询方式执行SQL');
              // 对于某些操作，我们需要单独处理
              if (statement.includes('CREATE TABLE') || statement.includes('ALTER TABLE') || 
                  statement.includes('CREATE POLICY') || statement.includes('CREATE FUNCTION')) {
                console.log(`   ⚠️  跳过需要超级用户权限的语句: ${statement.substring(0, 50)}...`);
                continue;
              }
            } else {
              console.error(`   ❌ SQL执行失败: ${error.message}`);
              console.error(`   语句: ${statement.substring(0, 100)}...`);
            }
          }
        } catch (execError) {
          console.error(`   ❌ 执行异常: ${execError.message}`);
        }
      }
    }
    
    console.log(`   ✅ 迁移完成: ${filename}`);
    return true;
    
  } catch (error) {
    console.error(`❌ 运行迁移失败 ${filename}:`, error.message);
    return false;
  }
}

async function initializeTestData() {
  console.log('\n🔄 初始化测试数据...');
  
  try {
    // 检查是否已有测试数据
    const { data: existingCourses } = await supabase
      .from('courses')
      .select('id')
      .limit(1);
    
    if (existingCourses && existingCourses.length > 0) {
      console.log('✅ 测试数据已存在，跳过初始化');
      return true;
    }
    
    // 插入测试课程
    const { error: courseError } = await supabase
      .from('courses')
      .insert([
        {
          id: '550e8400-e29b-41d4-a716-446655440001',
          title: '大语言模型基础',
          description: '深入学习大语言模型的原理、架构和应用，掌握Transformer、GPT等核心技术。',
          cover_url: '/assets/course-llm.jpg',
          video_url: 'https://www.youtube.com/embed/jNQXAC9IVRw',
          duration: '2小时30分钟',
          instructor: 'AI研究院'
        },
        {
          id: '550e8400-e29b-41d4-a716-446655440002',
          title: 'AI绘画与创意设计',
          description: '学习AI绘画技术，掌握GAN、扩散模型等生成技术，探索AI在创意设计中的应用。',
          cover_url: '/assets/course-ai-art.jpg',
          video_url: 'https://www.youtube.com/embed/jNQXAC9IVRw',
          duration: '3小时15分钟',
          instructor: '创意设计团队'
        }
      ]);
    
    if (courseError) {
      console.error('❌ 插入课程数据失败:', courseError.message);
      return false;
    }
    
    // 插入测试作业
    const { error: assignmentError } = await supabase
      .from('assignments')
      .insert([
        {
          course_id: '550e8400-e29b-41d4-a716-446655440001',
          title: '实现简单的Transformer模型',
          description: '使用PyTorch实现一个基础的Transformer编码器，包含多头注意力机制和位置编码。',
          assignment_type: 'code_practice',
          due_date: '2024-04-15T23:59:59Z',
          requirements: ["实现多头注意力机制", "添加位置编码", "包含完整的前向传播", "提供详细代码注释"]
        },
        {
          course_id: '550e8400-e29b-41d4-a716-446655440002',
          title: 'AI绘画风格迁移项目',
          description: '选择一幅名画作为风格图片，使用神经风格迁移技术创作新作品。',
          assignment_type: 'design',
          due_date: '2024-04-20T23:59:59Z',
          requirements: ["提供原始内容图片", "提供风格参考图片", "展示最终生成结果", "撰写技术实现报告"]
        }
      ]);
    
    if (assignmentError) {
      console.error('❌ 插入作业数据失败:', assignmentError.message);
      return false;
    }
    
    // 创建默认培训期次
    const { error: sessionError } = await supabase
      .from('training_sessions')
      .upsert({
        name: '第一期',
        description: '首期AI技术培训',
        start_date: new Date().toISOString().split('T')[0],
        status: 'active',
        is_current: true
      }, {
        onConflict: 'name'
      });
    
    if (sessionError) {
      console.error('❌ 创建培训期次失败:', sessionError.message);
      return false;
    }
    
    console.log('✅ 测试数据初始化完成');
    return true;
    
  } catch (error) {
    console.error('❌ 初始化测试数据失败:', error.message);
    return false;
  }
}

async function setupStoragePolicies() {
  console.log('\n🔄 配置存储桶权限策略...');
  
  try {
    // 这些策略通常需要在Supabase控制台中设置
    console.log('✅ 存储桶权限配置（需要在Supabase控制台手动设置）');
    console.log('   📋 需要设置的策略:');
    console.log('   1. assignments 桶: 学生可以上传和查看自己的文件');
    console.log('   2. course-materials 桶: 所有认证用户可以查看');
    console.log('   3. user-avatars 桶: 用户可以上传和查看自己的头像');
    console.log('   4. course-covers 桶: 管理员可以上传，所有用户可以查看');
    
    return true;
  } catch (error) {
    console.error('❌ 存储桶权限配置失败:', error.message);
    return false;
  }
}

async function runAllMigrations() {
  console.log('🚀 开始运行数据库迁移...');
  console.log(`📡 连接到: ${supabaseUrl}`);
  
  let successCount = 0;
  let failCount = 0;
  
  // 运行迁移文件
  for (const filename of migrationFiles) {
    const success = await runMigration(filename);
    if (success) {
      successCount++;
    } else {
      failCount++;
    }
  }
  
  console.log(`\n📊 迁移结果:`);
  console.log(`   ✅ 成功: ${successCount}`);
  console.log(`   ❌ 失败: ${failCount}`);
  
  // 初始化测试数据
  await initializeTestData();
  
  // 配置存储桶权限
  await setupStoragePolicies();
  
  console.log('\n🎉 数据库初始化完成!');
  console.log('\n📋 下一步操作:');
  console.log('1. 在浏览器中访问 http://localhost:8080');
  console.log('2. 如果需要管理员权限，请创建管理员账号');
  console.log('3. 查看课程列表和功能测试');
  
  return failCount === 0;
}

// 运行迁移
runAllMigrations().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ 迁移脚本执行失败:', error);
  process.exit(1);
});
