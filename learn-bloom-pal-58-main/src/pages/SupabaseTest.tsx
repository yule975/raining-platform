import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Loader2, CheckCircle, XCircle, Play, Database, Users, FileText } from 'lucide-react';
import { IntegrationTest, quickCheck } from '@/utils/integrationTest';
import { SupabaseCheck } from '@/utils/supabaseCheck';
import { DataMigration } from '@/utils/dataMigration';
import { useAuth } from '@/contexts/AuthContext';

interface TestResult {
  success: boolean;
  message: string;
  details?: any;
}

interface TestResults {
  [key: string]: TestResult;
}

const SupabaseTest: React.FC = () => {
  const [isRunning, setIsRunning] = useState(false);
  const [testResults, setTestResults] = useState<TestResults>({});
  const [healthStatus, setHealthStatus] = useState<{ healthy: boolean; issues: string[] } | null>(null);
  const [configReport, setConfigReport] = useState<string>('');
  const [migrationStatus, setMigrationStatus] = useState<any>(null);
  const { user, isAuthorized } = useAuth();

  // 快速健康检查
  const runHealthCheck = async () => {
    try {
      const result = await quickCheck();
      setHealthStatus(result);
    } catch (error) {
      setHealthStatus({
        healthy: false,
        issues: [`健康检查失败: ${error instanceof Error ? error.message : String(error)}`]
      });
    }
  };

  // 运行完整集成测试
  const runFullTest = async () => {
    setIsRunning(true);
    try {
      const result = await IntegrationTest.runFullTest();
      setTestResults(result.results);
    } catch (error) {
      setTestResults({
        error: {
          success: false,
          message: `测试失败: ${error instanceof Error ? error.message : String(error)}`
        }
      });
    } finally {
      setIsRunning(false);
    }
  };

  // 生成配置报告
  const generateReport = async () => {
    try {
      const report = await SupabaseCheck.generateConfigReport();
      setConfigReport(report);
    } catch (error) {
      setConfigReport(`报告生成失败: ${error instanceof Error ? error.message : String(error)}`);
    }
  };

  // 检查迁移状态
  const checkMigration = async () => {
    try {
      const status = await DataMigration.checkMigrationStatus();
      setMigrationStatus(status);
    } catch (error) {
      setMigrationStatus({
        error: `迁移检查失败: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  // 执行数据迁移
  const runMigration = async () => {
    try {
      const result = await DataMigration.performFullMigration();
      setMigrationStatus(result);
    } catch (error) {
      setMigrationStatus({
        error: `迁移失败: ${error instanceof Error ? error.message : String(error)}`
      });
    }
  };

  // 页面加载时运行健康检查
  useEffect(() => {
    runHealthCheck();
  }, []);

  const renderTestResult = (result: TestResult) => {
    const icon = result.success ? (
      <CheckCircle className="h-4 w-4 text-green-500" />
    ) : (
      <XCircle className="h-4 w-4 text-red-500" />
    );

    return (
      <div className="flex items-start gap-2 p-3 border rounded-lg">
        {icon}
        <div className="flex-1">
          <p className="font-medium">{result.message}</p>
          {result.details && (
            <div className="mt-2 text-sm text-gray-600">
              <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
                {JSON.stringify(result.details, null, 2)}
              </pre>
            </div>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Supabase 集成测试</h1>
          <p className="text-gray-600 mt-2">验证 Supabase 后端服务的集成状态和功能</p>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <Badge variant={isAuthorized ? 'default' : 'secondary'}>
              {isAuthorized ? '已授权' : '未授权'}
            </Badge>
          )}
          {healthStatus && (
            <Badge variant={healthStatus.healthy ? 'default' : 'destructive'}>
              {healthStatus.healthy ? '健康' : '异常'}
            </Badge>
          )}
        </div>
      </div>

      {/* 快速状态概览 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            系统状态概览
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {healthStatus?.healthy ? '✅' : '❌'}
              </div>
              <div className="text-sm text-gray-600">连接状态</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {user ? '✅' : '❌'}
              </div>
              <div className="text-sm text-gray-600">用户认证</div>
            </div>
            <div className="text-center p-4 border rounded-lg">
              <div className="text-2xl font-bold text-purple-600">
                {Object.keys(testResults).length > 0 ? '✅' : '⏳'}
              </div>
              <div className="text-sm text-gray-600">功能测试</div>
            </div>
          </div>

          {healthStatus && healthStatus.issues.length > 0 && (
            <Alert className="mt-4">
              <XCircle className="h-4 w-4" />
              <AlertDescription>
                <div className="font-medium mb-2">发现以下问题:</div>
                <ul className="list-disc list-inside space-y-1">
                  {healthStatus.issues.map((issue, index) => (
                    <li key={index} className="text-sm">{issue}</li>
                  ))}
                </ul>
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      <Tabs defaultValue="test" className="space-y-4">
        <TabsList>
          <TabsTrigger value="test">功能测试</TabsTrigger>
          <TabsTrigger value="config">配置检查</TabsTrigger>
          <TabsTrigger value="migration">数据迁移</TabsTrigger>
        </TabsList>

        {/* 功能测试 */}
        <TabsContent value="test" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Play className="h-5 w-5" />
                集成测试
              </CardTitle>
              <CardDescription>
                运行完整的 Supabase 集成测试，验证所有功能模块
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button 
                  onClick={runFullTest} 
                  disabled={isRunning}
                  className="flex items-center gap-2"
                >
                  {isRunning ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4" />
                  )}
                  {isRunning ? '测试中...' : '运行完整测试'}
                </Button>
                <Button 
                  variant="outline" 
                  onClick={runHealthCheck}
                >
                  快速检查
                </Button>
              </div>

              {Object.keys(testResults).length > 0 && (
                <div className="space-y-3">
                  <h3 className="font-medium">测试结果:</h3>
                  {Object.entries(testResults).map(([category, result]) => (
                    <div key={category}>
                      <h4 className="font-medium capitalize mb-2">{category}</h4>
                      {renderTestResult(result)}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 配置检查 */}
        <TabsContent value="config" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5" />
                配置报告
              </CardTitle>
              <CardDescription>
                生成详细的 Supabase 配置检查报告
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <Button onClick={generateReport}>
                生成配置报告
              </Button>

              {configReport && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">配置报告:</h3>
                  <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto whitespace-pre-wrap">
                    {configReport}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* 数据迁移 */}
        <TabsContent value="migration" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5" />
                数据迁移
              </CardTitle>
              <CardDescription>
                管理从内存存储到 Supabase 的数据迁移
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex gap-2">
                <Button onClick={checkMigration} variant="outline">
                  检查迁移状态
                </Button>
                <Button onClick={runMigration}>
                  执行数据迁移
                </Button>
              </div>

              {migrationStatus && (
                <div className="border rounded-lg p-4">
                  <h3 className="font-medium mb-2">迁移状态:</h3>
                  <pre className="text-sm bg-gray-50 p-4 rounded overflow-auto">
                    {JSON.stringify(migrationStatus, null, 2)}
                  </pre>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 使用说明 */}
      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent className="space-y-2 text-sm text-gray-600">
          <p>1. <strong>快速检查</strong>: 验证基本的连接和配置</p>
          <p>2. <strong>完整测试</strong>: 运行所有功能模块的集成测试</p>
          <p>3. <strong>配置报告</strong>: 生成详细的系统配置检查报告</p>
          <p>4. <strong>数据迁移</strong>: 将现有数据从内存存储迁移到 Supabase</p>
          <p className="mt-4 p-3 bg-blue-50 rounded-lg">
            <strong>注意</strong>: 确保已正确配置 .env 文件中的 Supabase 环境变量，并在 Supabase 控制台中运行了数据库迁移脚本。
          </p>
        </CardContent>
      </Card>
    </div>
  );
};

export default SupabaseTest;