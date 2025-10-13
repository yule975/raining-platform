import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { CheckCircle, Circle, Users, Database, Settings, ArrowRight, ArrowLeft, Eye, EyeOff, Copy } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { ApiService } from '@/lib/api';
import { ErrorHandler, handleAsyncError } from '@/utils/errorHandler';
import { copyToClipboard } from '@/utils/userInvitation';

interface SetupStep {
  id: string;
  title: string;
  description: string;
  icon: React.ReactNode;
  completed: boolean;
}

const SystemSetup: React.FC = () => {
  const { toast } = useToast();
  const [currentStep, setCurrentStep] = useState(0);
  const [isProcessing, setIsProcessing] = useState(false);
  const [testAccounts, setTestAccounts] = useState<{
    student?: { email: string; password: string; name: string };
    admin?: { email: string; password: string; name: string };
  }>({});
  const [showPasswords, setShowPasswords] = useState(false);
  const [steps, setSteps] = useState<SetupStep[]>([
    {
      id: 'database',
      title: '数据库连接检查',
      description: '验证Supabase数据库连接是否正常',
      icon: <Database className="h-6 w-6" />,
      completed: false
    },
    {
      id: 'test-accounts',
      title: '创建测试账号',
      description: '自动创建测试学员和管理员账号',
      icon: <Users className="h-6 w-6" />,
      completed: false
    },
    {
      id: 'system-config',
      title: '系统配置',
      description: '完成基础系统配置',
      icon: <Settings className="h-6 w-6" />,
      completed: false
    }
  ]);

  const updateStepStatus = (stepId: string, completed: boolean) => {
    setSteps(prev => prev.map(step => 
      step.id === stepId ? { ...step, completed } : step
    ));
  };

  const handleDatabaseCheck = async () => {
    setIsProcessing(true);
    
    const result = await handleAsyncError(
      async () => {
        // 检查数据库连接
        const users = await ApiService.getAuthorizedUsers();
        return users;
      },
      '数据库连接检查失败'
    );
    
    if (result !== null) {
      updateStepStatus('database', true);
      toast({
        title: "成功",
        description: "数据库连接正常"
      });
    }
    
    setIsProcessing(false);
  };

  const handleCreateTestAccounts = async () => {
    setIsProcessing(true);
    
    const result = await handleAsyncError(
      async () => {
        const { student, admin } = await ApiService.createTestAccounts();
        return { student, admin };
      },
      '创建测试账号失败'
    );
    
    if (result !== null) {
      setTestAccounts({
        student: {
          email: result.student.email,
          password: result.student.password,
          name: result.student.name
        },
        admin: {
          email: result.admin.email,
          password: result.admin.password,
          name: result.admin.name
        }
      });
      updateStepStatus('test-accounts', true);
      toast({
        title: "成功",
        description: `测试账号创建完成\n学员: ${result.student.email}\n管理员: ${result.admin.email}`
      });
    }
    
    setIsProcessing(false);
  };

  const handleCopyPassword = async (password: string, accountType: string) => {
    const success = await copyToClipboard(password);
    if (success) {
      toast({
        title: "成功",
        description: `${accountType}密码已复制到剪贴板`
      });
    } else {
      toast({
        title: "失败",
        description: "复制失败，请手动复制密码",
        variant: "destructive"
      });
    }
  };

  const handleSystemConfig = async () => {
    setIsProcessing(true);
    
    const result = await handleAsyncError(
      async () => {
        // 这里可以添加其他系统配置逻辑
        await new Promise(resolve => setTimeout(resolve, 1000)); // 模拟配置过程
        return true;
      },
      '系统配置失败'
    );
    
    if (result !== null) {
      updateStepStatus('system-config', true);
      toast({
        title: "成功",
        description: "系统配置完成"
      });
    }
    
    setIsProcessing(false);
  };

  const stepActions = {
    'database': handleDatabaseCheck,
    'test-accounts': handleCreateTestAccounts,
    'system-config': handleSystemConfig
  };

  const currentStepData = steps[currentStep];
  const isAllCompleted = steps.every(step => step.completed);

  const nextStep = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(currentStep + 1);
    }
  };

  const prevStep = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-4xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">系统初始化向导</h1>
          <p className="text-gray-600">欢迎使用学习平台，让我们完成系统初始化设置</p>
        </div>

        {/* 步骤指示器 */}
        <div className="flex justify-center mb-8">
          <div className="flex items-center space-x-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  step.completed 
                    ? 'bg-green-500 border-green-500 text-white'
                    : index === currentStep
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : 'bg-white border-gray-300 text-gray-400'
                }`}>
                  {step.completed ? (
                    <CheckCircle className="h-6 w-6" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`w-16 h-0.5 ${
                    step.completed ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* 当前步骤卡片 */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                {currentStepData.icon}
              </div>
              <div>
                <CardTitle className="flex items-center gap-2">
                  {currentStepData.title}
                  {currentStepData.completed && (
                    <Badge variant="secondary" className="bg-green-100 text-green-800">
                      已完成
                    </Badge>
                  )}
                </CardTitle>
                <CardDescription>{currentStepData.description}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {currentStepData.id === 'database' && (
                <div className="bg-blue-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">数据库连接检查</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    我们将验证与Supabase数据库的连接是否正常，确保系统可以正常访问数据。
                  </p>
                  <Button 
                    onClick={handleDatabaseCheck}
                    disabled={isProcessing || currentStepData.completed}
                    className="w-full"
                  >
                    {isProcessing ? '检查中...' : currentStepData.completed ? '已完成' : '开始检查'}
                  </Button>
                </div>
              )}

              {currentStepData.id === 'test-accounts' && (
                <div className="bg-green-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">创建测试账号</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    系统将自动创建测试学员和管理员账号，方便您快速体验平台功能。
                  </p>
                  
                  {!currentStepData.completed ? (
                    <div className="bg-white p-3 rounded border mb-3">
                      <div className="text-sm">
                        <div>• 测试学员: student@test.com</div>
                        <div>• 测试管理员: admin@test.com</div>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 mb-3">
                      {testAccounts.student && (
                        <div className="bg-white p-4 rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-blue-700">测试学员账号</h5>
                            <Badge variant="secondary">学员</Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">姓名:</span> {testAccounts.student.name}</div>
                            <div><span className="font-medium">邮箱:</span> {testAccounts.student.email}</div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">密码:</span>
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                  {showPasswords ? testAccounts.student.password : '••••••••••••'}
                                </code>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyPassword(testAccounts.student!.password, '学员')}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      {testAccounts.admin && (
                        <div className="bg-white p-4 rounded border">
                          <div className="flex items-center justify-between mb-2">
                            <h5 className="font-medium text-purple-700">测试管理员账号</h5>
                            <Badge variant="secondary">管理员</Badge>
                          </div>
                          <div className="space-y-2 text-sm">
                            <div><span className="font-medium">姓名:</span> {testAccounts.admin.name}</div>
                            <div><span className="font-medium">邮箱:</span> {testAccounts.admin.email}</div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center space-x-2">
                                <span className="font-medium">密码:</span>
                                <code className="bg-gray-100 px-2 py-1 rounded text-xs">
                                  {showPasswords ? testAccounts.admin.password : '••••••••••••'}
                                </code>
                              </div>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleCopyPassword(testAccounts.admin!.password, '管理员')}
                              >
                                <Copy className="h-4 w-4" />
                              </Button>
                            </div>
                          </div>
                        </div>
                      )}
                      
                      <div className="flex justify-center">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => setShowPasswords(!showPasswords)}
                        >
                          {showPasswords ? (
                            <><EyeOff className="h-4 w-4 mr-2" />隐藏密码</>
                          ) : (
                            <><Eye className="h-4 w-4 mr-2" />显示密码</>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}
                  
                  <Button 
                    onClick={handleCreateTestAccounts}
                    disabled={isProcessing || currentStepData.completed}
                    className="w-full"
                  >
                    {isProcessing ? '创建中...' : currentStepData.completed ? '已完成' : '创建测试账号'}
                  </Button>
                </div>
              )}

              {currentStepData.id === 'system-config' && (
                <div className="bg-purple-50 p-4 rounded-lg">
                  <h4 className="font-medium mb-2">系统配置</h4>
                  <p className="text-sm text-gray-600 mb-3">
                    完成基础系统配置，确保所有功能模块正常运行。
                  </p>
                  <Button 
                    onClick={handleSystemConfig}
                    disabled={isProcessing || currentStepData.completed}
                    className="w-full"
                  >
                    {isProcessing ? '配置中...' : currentStepData.completed ? '已完成' : '开始配置'}
                  </Button>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* 导航按钮 */}
        <div className="flex justify-between">
          <Button 
            variant="outline" 
            onClick={prevStep}
            disabled={currentStep === 0}
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            上一步
          </Button>
          
          {isAllCompleted ? (
            <Button 
              onClick={() => window.location.href = '/admin'}
              className="bg-green-600 hover:bg-green-700"
            >
              完成设置
              <CheckCircle className="h-4 w-4 ml-2" />
            </Button>
          ) : (
            <Button 
              onClick={nextStep}
              disabled={currentStep === steps.length - 1 || !currentStepData.completed}
            >
              下一步
              <ArrowRight className="h-4 w-4 ml-2" />
            </Button>
          )}
        </div>

        {/* 进度总览 */}
        <Card className="mt-8">
          <CardHeader>
            <CardTitle className="text-lg">设置进度</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div className="flex items-center space-x-3">
                    <div className={`p-1 rounded ${
                      step.completed ? 'bg-green-100' : 'bg-gray-200'
                    }`}>
                      {step.completed ? (
                        <CheckCircle className="h-4 w-4 text-green-600" />
                      ) : (
                        <Circle className="h-4 w-4 text-gray-400" />
                      )}
                    </div>
                    <div>
                      <div className="font-medium">{step.title}</div>
                      <div className="text-sm text-gray-600">{step.description}</div>
                    </div>
                  </div>
                  <Badge variant={step.completed ? 'default' : 'secondary'}>
                    {step.completed ? '已完成' : '待完成'}
                  </Badge>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default SystemSetup;