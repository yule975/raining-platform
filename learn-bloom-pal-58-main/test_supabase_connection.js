// 快速测试 Supabase 连接
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

// 加载环境变量
dotenv.config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ 缺少 Supabase 环境变量');
  console.log('请检查 .env 文件中的配置:');
  console.log('- VITE_SUPABASE_URL');
  console.log('- VITE_SUPABASE_ANON_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey);

async function testConnection() {
  console.log('🚀 开始测试 Supabase 连接...');
  console.log(`📡 连接到: ${supabaseUrl}`);
  
  try {
    // 测试基本连接
    console.log('\n1. 测试基本连接...');
    const { data, error } = await supabase.from('profiles').select('count').limit(1);
    
    if (error) {
      console.error('❌ 连接失败:', error.message);
      
      if (error.message.includes('relation "profiles" does not exist')) {
        console.log('\n💡 提示: 数据库表不存在，需要运行迁移脚本');
        console.log('请在 Supabase 控制台的 SQL 编辑器中运行:');
        console.log('supabase/migrations/001_initial_schema.sql');
      }
      
      return false;
    }
    
    console.log('✅ 基本连接成功');
    
    // 测试表结构
    console.log('\n2. 检查数据库表结构...');
    const tables = ['profiles', 'authorized_users', 'courses', 'assignments'];
    
    for (const table of tables) {
      try {
        const { error: tableError } = await supabase.from(table).select('*').limit(1);
        if (tableError) {
          console.log(`❌ 表 ${table} 不存在或无法访问`);
        } else {
          console.log(`✅ 表 ${table} 存在`);
        }
      } catch (err) {
        console.log(`❌ 表 ${table} 检查失败:`, err.message);
      }
    }
    
    // 测试存储桶
    console.log('\n3. 检查存储桶...');
    const buckets = ['course-materials', 'assignment-files', 'user-avatars', 'course-covers'];
    
    for (const bucket of buckets) {
      try {
        const { data: bucketData, error: bucketError } = await supabase.storage.from(bucket).list('', { limit: 1 });
        if (bucketError) {
          console.log(`❌ 存储桶 ${bucket} 不存在或无法访问`);
        } else {
          console.log(`✅ 存储桶 ${bucket} 存在`);
        }
      } catch (err) {
        console.log(`❌ 存储桶 ${bucket} 检查失败:`, err.message);
      }
    }
    
    // 测试认证
    console.log('\n4. 测试认证功能...');
    try {
      const { data: { user } } = await supabase.auth.getUser();
      const { data: { session } } = await supabase.auth.getSession();
      
      console.log('✅ 认证功能正常');
      console.log(`   当前用户: ${user ? user.email || user.id : '未登录'}`);
      console.log(`   会话状态: ${session ? '有效' : '无会话'}`);
    } catch (err) {
      console.log('❌ 认证功能测试失败:', err.message);
    }
    
    console.log('\n🎉 Supabase 连接测试完成!');
    console.log('\n📋 下一步操作:');
    console.log('1. 如果表不存在，请在 Supabase 控制台运行迁移脚本');
    console.log('2. 如果存储桶不存在，请在 Storage 部分创建相应的存储桶');
    console.log('3. 访问 http://localhost:8080/admin/supabase-test 进行完整测试');
    
    return true;
    
  } catch (error) {
    console.error('❌ 测试过程中发生错误:', error);
    return false;
  }
}

// 运行测试
testConnection().then(success => {
  process.exit(success ? 0 : 1);
}).catch(error => {
  console.error('❌ 测试脚本执行失败:', error);
  process.exit(1);
});