import { supabase } from '../lib/supabase';

// Supabase连接测试函数
export const testSupabaseConnection = async () => {
  console.log('🔍 开始Supabase连接测试...');
  
  try {
    // 1. 测试基本连接
    console.log('📡 测试基本连接...');
    const { data: healthCheck, error: healthError } = await supabase
      .from('profiles')
      .select('count')
      .limit(1);
    
    if (healthError) {
      console.error('❌ 基本连接失败:', healthError);
      return false;
    }
    
    console.log('✅ Supabase连接正常');
    return true;
  } catch (error) {
    console.error('❌ Supabase连接测试失败:', error);
    return false;
  }
};