import { supabase } from '../lib/supabase';
import { CourseService, UserService } from '../lib/supabaseService';

// Supabase连接和配置检查工具
export class SupabaseCheck {
  // 检查Supabase连接
  static async checkConnection(): Promise<{ success: boolean; message: string }> {
    try {
      const { data, error } = await supabase.from('courses').select('count', { count: 'exact', head: true });
      
      if (error) {
        return {
          success: false,
          message: `Supabase连接失败: ${error.message}`
        };
      }
      
      return {
        success: true,
        message: 'Supabase连接正常'
      };
    } catch (error) {
      return {
        success: false,
        message: `连接检查失败: ${(error as Error).message}`
      };
    }
  }
  
  // 检查环境变量配置
  static checkEnvironmentVariables(): { success: boolean; message: string; details: { missing: string[]; present: string[] } } {
    const requiredVars = {
      VITE_SUPABASE_URL: import.meta.env.VITE_SUPABASE_URL,
      VITE_SUPABASE_ANON_KEY: import.meta.env.VITE_SUPABASE_ANON_KEY
    };
    
    const missing = [];
    const present = [];
    
    for (const [key, value] of Object.entries(requiredVars)) {
      if (!value) {
        missing.push(key);
      } else {
        present.push(key);
      }
    }
    
    if (missing.length > 0) {
      return {
        success: false,
        message: `缺少必要的环境变量: ${missing.join(', ')}`,
        details: { missing, present }
      };
    }
    
    return {
      success: true,
      message: '环境变量配置正确',
      details: { missing, present }
    };
  }
  
  // 检查数据库表结构
  static async checkDatabaseTables(): Promise<{ success: boolean; message: string; details: Record<string, string> }> {
    const requiredTables = ['profiles', 'authorized_users', 'courses', 'assignments'];
    const tableStatus: Record<string, string> = {};
    
    try {
      for (const table of requiredTables) {
        try {
          const { error } = await supabase.from(table).select('*', { count: 'exact', head: true });
          tableStatus[table] = error ? `错误: ${error.message}` : '正常';
        } catch (error) {
          tableStatus[table] = `检查失败: ${(error as Error).message}`;
        }
      }
      
      const hasErrors = Object.values(tableStatus).some(status => status !== '正常');
      
      return {
        success: !hasErrors,
        message: hasErrors ? '部分数据库表存在问题' : '数据库表结构正常',
        details: tableStatus
      };
    } catch (error) {
      return {
        success: false,
        message: `数据库表检查失败: ${(error as Error).message}`,
        details: tableStatus
      };
    }
  }
  
  // 检查RLS策略
  static async checkRLSPolicies(): Promise<{ success: boolean; message: string }> {
    try {
      // 尝试访问需要RLS策略的表
      const { error: coursesError } = await supabase.from('courses').select('id').limit(1);
      
      if (coursesError && coursesError.code === '42501') {
        return {
          success: false,
          message: 'RLS策略配置有问题，请检查数据库权限设置'
        };
      }
      
      return {
        success: true,
        message: 'RLS策略配置正常'
      };
    } catch (error) {
      return {
        success: false,
        message: `RLS策略检查失败: ${(error as Error).message}`
      };
    }
  }
  
  // 测试基本CRUD操作
  static async testBasicOperations(): Promise<{ success: boolean; message: string; details: Record<string, string> }> {
    const results: Record<string, string> = {};
    
    try {
      // 测试读取课程
      try {
        const courses = await CourseService.getCourses();
        results['读取课程'] = `成功 (${courses.length} 条记录)`;
      } catch (error) {
        results['读取课程'] = `失败: ${(error as Error).message}`;
      }
      
      // 测试用户服务
      try {
        const user = await UserService.getCurrentUser();
        results['获取用户信息'] = user ? '成功' : '无当前用户';
      } catch (error) {
        results['获取用户信息'] = `失败: ${(error as Error).message}`;
      }
      
      const hasErrors = Object.values(results).some(result => typeof result === 'string' && result.includes('失败'));
      
      return {
        success: !hasErrors,
        message: hasErrors ? '部分操作测试失败' : '基本操作测试通过',
        details: results
      };
    } catch (error) {
      return {
        success: false,
        message: `操作测试失败: ${(error as Error).message}`,
        details: results
      };
    }
  }
  
  // 完整的系统检查
  static async performFullCheck(): Promise<{ success: boolean; message: string; details: Record<string, { success: boolean; message: string; details?: unknown }> }> {
    console.log('开始Supabase系统检查...');
    
    const results = {
      environmentVariables: this.checkEnvironmentVariables(),
      connection: await this.checkConnection(),
      databaseTables: await this.checkDatabaseTables(),
      rlsPolicies: await this.checkRLSPolicies(),
      basicOperations: await this.testBasicOperations()
    };
    
    const allSuccess = Object.values(results).every(result => result && typeof result === 'object' && 'success' in result && result.success);
    
    const summary = {
      success: allSuccess,
      message: allSuccess ? 'Supabase配置和连接正常' : '发现配置或连接问题',
      details: results
    };
    
    console.log('Supabase检查结果:', summary);
    return summary;
  }
  
  // 生成配置报告
  static async generateConfigReport(): Promise<string> {
    const checkResult = await this.performFullCheck();
    
    let report = '# Supabase配置检查报告\n\n';
    report += `**总体状态**: ${checkResult.success ? '✅ 正常' : '❌ 存在问题'}\n\n`;
    
    for (const [category, result] of Object.entries(checkResult.details)) {
      if (result && typeof result === 'object' && 'success' in result && 'message' in result) {
        const status = result.success ? '✅' : '❌';
        report += `## ${category} ${status}\n`;
        report += `**状态**: ${result.message}\n`;
        
        if ('details' in result && result.details) {
          report += '**详情**:\n';
          for (const [key, value] of Object.entries(result.details)) {
            report += `- ${key}: ${value}\n`;
          }
        }
        report += '\n';
      }
    }
    
    if (!checkResult.success) {
      report += '## 解决建议\n\n';
      report += '1. 检查 `.env` 文件中的 Supabase 配置\n';
      report += '2. 确保 Supabase 项目已正确设置\n';
      report += '3. 运行数据库迁移脚本创建必要的表结构\n';
      report += '4. 检查 RLS 策略配置\n';
      report += '5. 确保网络连接正常\n';
    }
    
    return report;
  }
}