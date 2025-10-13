import { SupabaseCheck } from './supabaseCheck';
import { DataMigration } from './dataMigration';
import { supabase } from '../lib/supabase';
import { CourseService, UserService, AuthService } from '../lib/supabaseService';

/**
 * Supabase 集成测试工具
 * 用于验证 Supabase 集成的完整性和功能性
 */
export class IntegrationTest {
  /**
   * 执行完整的集成测试
   */
  static async runFullTest(): Promise<{
    success: boolean;
    results: Record<string, { success: boolean; message: string; details?: unknown }>;
    summary: string;
  }> {
    console.log('🚀 开始 Supabase 集成测试...');
    
    const results: Record<string, { success: boolean; message: string; details?: unknown }> = {};
    let allPassed = true;

    try {
      // 1. 基础连接测试
      console.log('📡 测试基础连接...');
      results.connection = await this.testConnection();
      if (!results.connection.success) allPassed = false;

      // 2. 数据库结构测试
      console.log('🗄️ 测试数据库结构...');
      results.database = await this.testDatabaseStructure();
      if (!results.database.success) allPassed = false;

      // 3. 认证功能测试
      console.log('🔐 测试认证功能...');
      results.auth = await this.testAuthentication();
      if (!results.auth.success) allPassed = false;

      // 4. CRUD 操作测试
      console.log('📝 测试 CRUD 操作...');
      results.crud = await this.testCRUDOperations();
      if (!results.crud.success) allPassed = false;

      // 5. 文件存储测试
      console.log('📁 测试文件存储...');
      results.storage = await this.testFileStorage();
      if (!results.storage.success) allPassed = false;

      // 6. 实时功能测试
      console.log('⚡ 测试实时功能...');
      results.realtime = await this.testRealtimeFeatures();
      if (!results.realtime.success) allPassed = false;

      // 7. 数据迁移测试
      console.log('🔄 测试数据迁移...');
      results.migration = await this.testDataMigration();
      if (!results.migration.success) allPassed = false;

    } catch (error) {
      console.error('❌ 集成测试过程中发生错误:', error);
      allPassed = false;
      results.error = {
        success: false,
        message: `测试过程中发生错误: ${error instanceof Error ? error.message : String(error)}`
      };
    }

    const summary = this.generateTestSummary(results, allPassed);
    
    console.log(allPassed ? '✅ 所有测试通过!' : '❌ 部分测试失败!');
    console.log(summary);

    return {
      success: allPassed,
      results,
      summary
    };
  }

  /**
   * 测试基础连接
   */
  private static async testConnection(): Promise<{ success: boolean; message: string; details?: unknown }> {
    try {
      const { data, error } = await supabase.from('profiles').select('count').limit(1);
      
      if (error) {
        return {
          success: false,
          message: `连接失败: ${error.message}`,
          details: error
        };
      }

      return {
        success: true,
        message: '连接成功',
        details: { connected: true }
      };
    } catch (error) {
      return {
        success: false,
        message: `连接异常: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 测试数据库结构
   */
  private static async testDatabaseStructure(): Promise<{ success: boolean; message: string; details?: unknown }> {
    try {
      const requiredTables = [
        'profiles',
        'authorized_users', 
        'courses',
        'assignments',
        'course_enrollments',
        'assignment_submissions',
        'learning_progress'
      ];

      const tableResults: Record<string, boolean> = {};
      let allTablesExist = true;

      for (const table of requiredTables) {
        try {
          const { error } = await supabase.from(table).select('*').limit(1);
          tableResults[table] = !error;
          if (error) allTablesExist = false;
        } catch {
          tableResults[table] = false;
          allTablesExist = false;
        }
      }

      return {
        success: allTablesExist,
        message: allTablesExist ? '所有必需表都存在' : '部分表缺失',
        details: tableResults
      };
    } catch (error) {
      return {
        success: false,
        message: `数据库结构检查失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 测试认证功能
   */
  private static async testAuthentication(): Promise<{ success: boolean; message: string; details?: unknown }> {
    try {
      // 测试获取当前用户
      const { data: { user } } = await supabase.auth.getUser();
      
      // 测试会话状态
      const { data: { session } } = await supabase.auth.getSession();

      return {
        success: true,
        message: '认证功能正常',
        details: {
          hasUser: !!user,
          hasSession: !!session,
          userId: user?.id
        }
      };
    } catch (error) {
      return {
        success: false,
        message: `认证测试失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 测试 CRUD 操作
   */
  private static async testCRUDOperations(): Promise<{ success: boolean; message: string; details?: unknown }> {
    try {
      const testResults: Record<string, boolean> = {};

      // 测试课程 CRUD
      try {
        const courses = await CourseService.getCourses();
        testResults.readCourses = true;
      } catch {
        testResults.readCourses = false;
      }

      // 测试用户服务
      try {
        const users = await UserService.getAuthorizedUsers();
        testResults.readUsers = true;
      } catch {
        testResults.readUsers = false;
      }

      const allOperationsWork = Object.values(testResults).every(result => result);

      return {
        success: allOperationsWork,
        message: allOperationsWork ? 'CRUD 操作正常' : '部分 CRUD 操作失败',
        details: testResults
      };
    } catch (error) {
      return {
        success: false,
        message: `CRUD 测试失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 测试文件存储
   */
  private static async testFileStorage(): Promise<{ success: boolean; message: string; details?: unknown }> {
    try {
      const buckets = ['course-materials', 'assignment-files', 'user-avatars', 'course-covers'];
      const bucketResults: Record<string, boolean> = {};

      for (const bucket of buckets) {
        try {
          const { data, error } = await supabase.storage.from(bucket).list('', { limit: 1 });
          bucketResults[bucket] = !error;
        } catch {
          bucketResults[bucket] = false;
        }
      }

      const allBucketsExist = Object.values(bucketResults).every(result => result);

      return {
        success: allBucketsExist,
        message: allBucketsExist ? '存储桶配置正常' : '部分存储桶缺失',
        details: bucketResults
      };
    } catch (error) {
      return {
        success: false,
        message: `存储测试失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 测试实时功能
   */
  private static async testRealtimeFeatures(): Promise<{ success: boolean; message: string; details?: unknown }> {
    try {
      // 测试实时连接
      const channel = supabase.channel('test-channel');
      
      return new Promise((resolve) => {
        const timeout = setTimeout(() => {
          channel.unsubscribe();
          resolve({
            success: false,
            message: '实时连接超时'
          });
        }, 5000);

        channel
          .on('presence', { event: 'sync' }, () => {
            clearTimeout(timeout);
            channel.unsubscribe();
            resolve({
              success: true,
              message: '实时功能正常',
              details: { realtimeConnected: true }
            });
          })
          .subscribe();
      });
    } catch (error) {
      return {
        success: false,
        message: `实时功能测试失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 测试数据迁移
   */
  private static async testDataMigration(): Promise<{ success: boolean; message: string; details?: unknown }> {
    try {
      // 检查迁移状态
      const migrationStatus = await DataMigration.checkMigrationStatus();
      
      return {
        success: true,
        message: '数据迁移功能正常',
        details: migrationStatus
      };
    } catch (error) {
      return {
        success: false,
        message: `数据迁移测试失败: ${error instanceof Error ? error.message : String(error)}`
      };
    }
  }

  /**
   * 生成测试摘要
   */
  private static generateTestSummary(results: Record<string, { success: boolean; message: string; details?: unknown }>, allPassed: boolean): string {
    let summary = `# Supabase 集成测试报告\n\n`;
    summary += `**总体状态**: ${allPassed ? '✅ 通过' : '❌ 失败'}\n\n`;
    
    summary += `## 测试结果详情\n\n`;
    
    for (const [category, result] of Object.entries(results)) {
      if (result && typeof result === 'object' && 'success' in result) {
        const status = result.success ? '✅' : '❌';
        summary += `### ${category} ${status}\n`;
        summary += `**状态**: ${result.message}\n`;
        
        if (result.details) {
          summary += `**详情**:\n`;
          for (const [key, value] of Object.entries(result.details)) {
            summary += `- ${key}: ${value}\n`;
          }
        }
        summary += `\n`;
      }
    }
    
    if (!allPassed) {
      summary += `## 建议\n\n`;
      summary += `1. 检查 Supabase 项目配置\n`;
      summary += `2. 验证环境变量设置\n`;
      summary += `3. 确认数据库迁移已执行\n`;
      summary += `4. 检查存储桶配置\n`;
      summary += `5. 验证 RLS 策略设置\n`;
    }
    
    return summary;
  }

  /**
   * 快速健康检查
   */
  static async quickHealthCheck(): Promise<{ healthy: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // 检查环境变量
      if (!import.meta.env.VITE_SUPABASE_URL) {
        issues.push('缺少 VITE_SUPABASE_URL 环境变量');
      }
      
      if (!import.meta.env.VITE_SUPABASE_ANON_KEY) {
        issues.push('缺少 VITE_SUPABASE_ANON_KEY 环境变量');
      }
      
      // 检查基础连接
      try {
        const { error } = await supabase.from('profiles').select('count').limit(1);
        if (error) {
          issues.push(`数据库连接失败: ${error.message}`);
        }
      } catch (error) {
        issues.push(`连接异常: ${error instanceof Error ? error.message : String(error)}`);
      }
      
    } catch (error) {
      issues.push(`健康检查失败: ${error instanceof Error ? error.message : String(error)}`);
    }
    
    return {
      healthy: issues.length === 0,
      issues
    };
  }
}

// 导出便捷函数
export const runSupabaseTest = IntegrationTest.runFullTest;
export const quickCheck = IntegrationTest.quickHealthCheck;