require('dotenv').config();
const { createClient } = require('@supabase/supabase-js');

// 从环境变量获取配置
const supabaseUrl = process.env.VITE_SUPABASE_URL;
const supabaseAnonKey = process.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  console.error('❌ 缺少Supabase配置');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseAnonKey);

async function fixMissingProfiles() {
  try {
    console.log('=== 修复缺失的用户Profile ===\n');
    
    // 测试用户列表
    const testUsers = [
      { email: 'admin@test.com', password: 'password123' },
      { email: 'student@test.com', password: 'password123' }
    ];
    
    for (const testUser of testUsers) {
      console.log(`处理用户: ${testUser.email}`);
      
      // 1. 登录获取用户ID
      const { data: loginData, error: loginError } = await supabase.auth.signInWithPassword({
        email: testUser.email,
        password: testUser.password
      });
      
      if (loginError) {
        console.error(`❌ 登录失败 ${testUser.email}:`, loginError.message);
        continue;
      }
      
      const user = loginData.user;
      console.log(`✅ 登录成功，用户ID: ${user.id}`);
      
      // 2. 检查profile是否存在
      const { data: existingProfile, error: profileError } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', user.id)
        .single();
      
      if (profileError && profileError.code === 'PGRST116') {
        // Profile不存在，创建新的
        console.log('❌ Profile不存在，正在创建...');
        
        // 从authorized_users表获取角色信息
        const { data: authUser, error: authError } = await supabase
          .from('authorized_users')
          .select('*')
          .eq('email', testUser.email)
          .single();
        
        if (authError) {
          console.error(`❌ 在authorized_users中未找到 ${testUser.email}:`, authError.message);
          continue;
        }
        
        // 创建profile记录
        const newProfile = {
          id: user.id,
          email: user.email,
          full_name: authUser.name || user.user_metadata?.full_name || '',
          avatar_url: user.user_metadata?.avatar_url || `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
          role: authUser.role || 'student',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
        
        const { data: createdProfile, error: createError } = await supabase
          .from('profiles')
          .insert(newProfile)
          .select()
          .single();
        
        if (createError) {
          console.error(`❌ 创建profile失败 ${testUser.email}:`, createError.message);
        } else {
          console.log(`✅ 成功创建profile:`, createdProfile);
        }
      } else if (profileError) {
        console.error(`❌ 查询profile失败 ${testUser.email}:`, profileError.message);
      } else {
        console.log(`✅ Profile已存在:`, existingProfile);
      }
      
      // 登出
      await supabase.auth.signOut();
      console.log('---');
    }
    
    console.log('\n=== 修复完成 ===');
    
  } catch (error) {
    console.error('❌ 修复过程中发生错误:', error.message);
    console.error('错误详情:', error);
  }
}

// 运行修复
fixMissingProfiles();