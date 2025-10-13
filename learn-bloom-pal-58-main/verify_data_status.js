// 验证数据状态和恢复脚本
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config();

const supabase = createClient(
  process.env.VITE_SUPABASE_URL,
  process.env.VITE_SUPABASE_SERVICE_ROLE_KEY
);

async function verifyDataStatus() {
  console.log('🔍 验证数据状态...');
  console.log('=' .repeat(50));
  
  try {
    // 检查课程数据
    const { data: courses, error: courseError } = await supabase
      .from('courses')
      .select('*');
    
    console.log('\n📚 课程数据状态:');
    if (courseError) {
      console.log('❌ 课程数据查询错误:', courseError.message);
    } else {
      console.log(`✅ 找到 ${courses?.length || 0} 个课程`);
      courses?.forEach((course, i) => {
        console.log(`   ${i + 1}. ${course.title} (ID: ${course.id})`);
      });
    }
    
    // 检查作业数据
    const { data: assignments, error: assignError } = await supabase
      .from('assignments')
      .select('*');
    
    console.log('\n📋 作业数据状态:');
    if (assignError) {
      console.log('❌ 作业数据查询错误:', assignError.message);
    } else {
      console.log(`✅ 找到 ${assignments?.length || 0} 个作业`);
      assignments?.forEach((assignment, i) => {
        console.log(`   ${i + 1}. ${assignment.title} (课程ID: ${assignment.course_id})`);
      });
    }
    
    // 检查期次数据
    const { data: sessions, error: sessionError } = await supabase
      .from('training_sessions')
      .select('*');
    
    console.log('\n🎯 期次数据状态:');
    if (sessionError) {
      console.log('❌ 期次数据查询错误:', sessionError.message);
    } else {
      console.log(`✅ 找到 ${sessions?.length || 0} 个期次`);
      sessions?.forEach((session, i) => {
        console.log(`   ${i + 1}. ${session.name} (${session.start_date} - ${session.end_date}) ${session.is_current ? '[当前期次]' : ''}`);
      });
    }
    
    // 检查用户数据
    const { data: profiles, error: profileError } = await supabase
      .from('profiles')
      .select('*');
    
    console.log('\n👥 用户数据状态:');
    if (profileError) {
      console.log('❌ 用户数据查询错误:', profileError.message);
    } else {
      console.log(`✅ 找到 ${profiles?.length || 0} 个用户`);
      profiles?.forEach((profile, i) => {
        console.log(`   ${i + 1}. ${profile.full_name || profile.email} (${profile.role})`);
      });
    }
    
    // 检查授权用户
    const { data: authUsers, error: authError } = await supabase
      .from('authorized_users')
      .select('*');
    
    console.log('\n🔐 授权用户状态:');
    if (authError) {
      console.log('❌ 授权用户查询错误:', authError.message);
    } else {
      console.log(`✅ 找到 ${authUsers?.length || 0} 个授权用户`);
      authUsers?.forEach((user, i) => {
        console.log(`   ${i + 1}. ${user.name || user.email} (${user.status})`);
      });
    }
    
    console.log('\n' + '=' .repeat(50));
    console.log('📊 数据状态总结:');
    console.log(`   课程: ${courses?.length || 0} 个`);
    console.log(`   作业: ${assignments?.length || 0} 个`);
    console.log(`   期次: ${sessions?.length || 0} 个`);
    console.log(`   用户: ${profiles?.length || 0} 个`);
    console.log(`   授权: ${authUsers?.length || 0} 个`);
    
    if ((courses?.length || 0) > 0 && (assignments?.length || 0) > 0 && (sessions?.length || 0) > 0) {
      console.log('\n✅ 数据完整性检查通过！所有数据都存在。');
      console.log('\n💡 如果前端看不到数据，可能的原因:');
      console.log('   1. 用户权限问题 - 检查RLS策略');
      console.log('   2. 前端查询错误 - 检查API调用');
      console.log('   3. 缓存问题 - 尝试刷新页面');
      console.log('   4. 认证状态 - 重新登录');
    } else {
      console.log('\n⚠️  部分数据缺失，需要重新创建。');
    }
    
  } catch (error) {
    console.error('❌ 验证过程中出现错误:', error.message);
  }
}

verifyDataStatus();