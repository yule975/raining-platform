#!/usr/bin/env node

// 直接清除所有数据的脚本
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('❌ 缺少Supabase配置信息');
  console.error('请确保.env文件中包含VITE_SUPABASE_URL和SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseServiceKey);

async function clearAllData() {
  console.log('🚀 开始清除所有数据...');
  
  try {
    // 1. 清除测试账号数据
    console.log('📝 清除测试账号数据...');
    const testEmails = ['student@test.com', 'admin@test.com'];
    
    const { data: testUsers, error: fetchError } = await supabase
      .from('authorized_users')
      .select('id')
      .in('email', testEmails);
      
    if (fetchError) {
      throw fetchError;
    }
    
    if (testUsers && testUsers.length > 0) {
      const testUserIds = testUsers.map(user => user.id);
      
      // 删除相关的提交记录
      const { error: submissionsError } = await supabase
        .from('submissions')
        .delete()
        .in('user_id', testUserIds);
        
      if (submissionsError) {
        console.warn('⚠️ 删除提交记录时出错:', submissionsError.message);
      }
      
      // 删除测试用户
      const { error: deleteError } = await supabase
        .from('authorized_users')
        .delete()
        .in('id', testUserIds);
        
      if (deleteError) {
        throw deleteError;
      }
      
      console.log(`✅ 已删除 ${testUsers.length} 个测试账号`);
    } else {
      console.log('ℹ️ 没有找到测试账号');
    }
    
    // 2. 清除所有课程数据
    console.log('📚 清除所有课程数据...');
    
    // 先删除作业提交
    const { error: allSubmissionsError } = await supabase
      .from('submissions')
      .delete()
      .neq('id', 0); // 删除所有记录
      
    if (allSubmissionsError) {
      console.warn('⚠️ 删除所有提交记录时出错:', allSubmissionsError.message);
    }
    
    // 删除作业
    const { error: assignmentsError } = await supabase
      .from('assignments')
      .delete()
      .neq('id', 0);
      
    if (assignmentsError) {
      console.warn('⚠️ 删除作业时出错:', assignmentsError.message);
    }
    
    // 删除课程材料
    const { error: materialsError } = await supabase
      .from('course_materials')
      .delete()
      .neq('id', 0);
      
    if (materialsError) {
      console.warn('⚠️ 删除课程材料时出错:', materialsError.message);
    }
    
    // 删除课程
    const { error: coursesError } = await supabase
      .from('courses')
      .delete()
      .neq('id', 0);
      
    if (coursesError) {
      console.warn('⚠️ 删除课程时出错:', coursesError.message);
    }
    
    console.log('✅ 所有课程数据已清除');
    
    // 3. 清除所有用户数据（除了可能的管理员账号）
    console.log('👥 清除所有用户数据...');
    
    const { error: allUsersError } = await supabase
      .from('authorized_users')
      .delete()
      .neq('id', 0);
      
    if (allUsersError) {
      console.warn('⚠️ 删除用户数据时出错:', allUsersError.message);
    } else {
      console.log('✅ 所有用户数据已清除');
    }
    
    console.log('🎉 数据清除完成！系统已重置为初始状态。');
    console.log('💡 现在可以重新创建管理员账号和课程数据。');
    
  } catch (error) {
    console.error('❌ 清除数据时发生错误:', error.message);
    process.exit(1);
  }
}

// 执行清除操作
clearAllData();