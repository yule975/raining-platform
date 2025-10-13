// 清除认证状态脚本
// 用于解决登录状态验证问题和无效token错误

const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// 读取环境变量
require('dotenv').config();

const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少Supabase环境变量');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function clearAuthState() {
  console.log('🧹 开始清除认证状态...');
  
  try {
    // 1. 清除Supabase会话
    console.log('1. 清除Supabase会话...');
    const { error } = await supabase.auth.signOut();
    if (error) {
      console.warn('⚠️ 清除会话时出现警告:', error.message);
    } else {
      console.log('✅ Supabase会话已清除');
    }
    
    // 2. 提供浏览器清理指令
    console.log('\n2. 请在浏览器中执行以下操作:');
    console.log('   打开浏览器开发者工具 (F12)');
    console.log('   在Console中执行以下代码:');
    console.log('\n   // 清除localStorage');
    console.log('   localStorage.clear();');
    console.log('\n   // 清除sessionStorage');
    console.log('   sessionStorage.clear();');
    console.log('\n   // 清除所有cookies');
    console.log('   document.cookie.split(";").forEach(function(c) {');
    console.log('     document.cookie = c.replace(/^ +/, "").replace(/=.*/, "=;expires=" + new Date().toUTCString() + ";path=/");');
    console.log('   });');
    console.log('\n   // 刷新页面');
    console.log('   location.reload();');
    
    // 3. 检查当前认证状态
    console.log('\n3. 检查当前认证状态...');
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.log('✅ 认证状态已清除 (无用户会话)');
    } else if (!user) {
      console.log('✅ 认证状态已清除 (用户为null)');
    } else {
      console.log('⚠️ 仍有用户会话存在:', user.email);
    }
    
    // 4. 提供重新登录指导
    console.log('\n4. 重新登录指导:');
    console.log('   - 确保已清除浏览器缓存后');
    console.log('   - 访问: http://localhost:8080');
    console.log('   - 使用测试账号登录:');
    console.log('     学员账号: student@test.com / student123456');
    console.log('     管理员账号: admin@test.com / admin123456');
    
    console.log('\n🎉 认证状态清理完成!');
    
  } catch (error) {
    console.error('❌ 清理过程中出现错误:', error);
  }
}

// 执行清理
clearAuthState();