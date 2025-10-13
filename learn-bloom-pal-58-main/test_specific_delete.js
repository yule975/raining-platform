import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY || process.env.VITE_SUPABASE_ANON_KEY;

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function testSpecificDelete() {
  console.log('🧪 测试删除特定课程...');
  
  const targetId = '550e8400-e29b-41d4-a716-446655440001';
  
  try {
    // 1. 先检查这个课程是否存在
    console.log('\n1. 检查课程是否存在:');
    const { data: existingCourse, error: checkError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', targetId)
      .single();
    
    if (checkError) {
      console.error('❌ 查询课程失败:', checkError);
      return;
    }
    
    if (!existingCourse) {
      console.log('❌ 课程不存在:', targetId);
      return;
    }
    
    console.log('✅ 课程存在:', existingCourse.title);

    // 2. 检查是否有关联数据需要先删除
    console.log('\n2. 检查关联数据:');
    
    // 检查作业
    const { data: assignments, error: assignError } = await supabase
      .from('assignments')
      .select('*')
      .eq('course_id', targetId);
    
    if (assignments && assignments.length > 0) {
      console.log(`⚠️ 发现 ${assignments.length} 个关联作业`);
      assignments.forEach((assignment, i) => {
        console.log(`  ${i + 1}. ${assignment.title} (ID: ${assignment.id})`);
      });
    } else {
      console.log('✅ 没有关联作业');
    }

    // 检查课程材料
    const { data: materials, error: materialError } = await supabase
      .from('course_materials')
      .select('*')
      .eq('course_id', targetId);
    
    if (materials && materials.length > 0) {
      console.log(`⚠️ 发现 ${materials.length} 个课程材料`);
    } else {
      console.log('✅ 没有课程材料');
    }

    // 3. 如果有关联数据，先删除
    if (assignments && assignments.length > 0) {
      console.log('\n3. 先删除关联作业:');
      for (const assignment of assignments) {
        const { error: delAssignError } = await supabase
          .from('assignments')
          .delete()
          .eq('id', assignment.id);
        
        if (delAssignError) {
          console.error(`❌ 删除作业失败 ${assignment.title}:`, delAssignError);
        } else {
          console.log(`✅ 删除作业成功: ${assignment.title}`);
        }
      }
    }

    if (materials && materials.length > 0) {
      console.log('\n4. 删除课程材料:');
      const { error: delMaterialError } = await supabase
        .from('course_materials')
        .delete()
        .eq('course_id', targetId);
      
      if (delMaterialError) {
        console.error('❌ 删除课程材料失败:', delMaterialError);
      } else {
        console.log('✅ 删除课程材料成功');
      }
    }

    // 5. 最后删除课程
    console.log('\n5. 删除课程本身:');
    const { error: deleteCourseError } = await supabase
      .from('courses')
      .delete()
      .eq('id', targetId);
    
    if (deleteCourseError) {
      console.error('❌ 删除课程失败:', deleteCourseError);
    } else {
      console.log('✅ 课程删除成功！');
    }

    // 6. 验证删除结果
    console.log('\n6. 验证删除结果:');
    const { data: verifyData, error: verifyError } = await supabase
      .from('courses')
      .select('*')
      .eq('id', targetId)
      .single();
    
    if (verifyError && verifyError.code === 'PGRST116') {
      console.log('✅ 确认：课程已被删除');
    } else if (verifyData) {
      console.log('❌ 问题：课程仍然存在');
    } else {
      console.error('❌ 验证查询失败:', verifyError);
    }

    console.log('\n🎉 测试完成！');
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
  }
}

testSpecificDelete();
