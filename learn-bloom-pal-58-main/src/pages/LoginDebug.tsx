import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';

const LoginDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  
  const checkDebugInfo = () => {
    const info = {
      localStorage: {
        auth_token: localStorage.getItem('auth_token'),
        user_role: localStorage.getItem('user_role'),
        user_email: localStorage.getItem('user_email'),
        login_time: localStorage.getItem('login_time'),
        demo_user: localStorage.getItem('demo_user'),
      },
      sessionStorage: {
        keys: Object.keys(sessionStorage),
        values: Object.keys(sessionStorage).reduce((acc, key) => {
          acc[key] = sessionStorage.getItem(key);
          return acc;
        }, {} as any)
      },
      currentUrl: window.location.href,
      userAgent: navigator.userAgent,
    };
    
    setDebugInfo(info);
    console.log('Debug Info:', info);
  };
  
  const clearAllStorage = () => {
    localStorage.clear();
    sessionStorage.clear();
    toast.success('已清除所有本地存储数据');
    checkDebugInfo();
  };
  
  const clearAuthData = () => {
    const authKeys = ['auth_token', 'user_role', 'user_email', 'login_time', 'demo_user'];
    authKeys.forEach(key => localStorage.removeItem(key));
    toast.success('已清除认证相关数据');
    checkDebugInfo();
  };
  
  const setTestStudent = () => {
    localStorage.setItem('auth_token', 'student_auth_token');
    localStorage.setItem('user_role', 'student');
    localStorage.setItem('user_email', 'student@test.com');
    localStorage.setItem('login_time', new Date().toISOString());
    toast.success('已设置为测试学员状态');
    checkDebugInfo();
  };
  
  const setTestAdmin = () => {
    localStorage.setItem('auth_token', 'admin_auth_token');
    localStorage.setItem('user_role', 'admin');
    localStorage.setItem('user_email', 'admin@test.com');
    localStorage.setItem('login_time', new Date().toISOString());
    toast.success('已设置为测试管理员状态');
    checkDebugInfo();
  };
  
  React.useEffect(() => {
    checkDebugInfo();
  }, []);
  
  return (
    <div className="container mx-auto p-6">
      <Card>
        <CardHeader>
          <CardTitle>🔧 登录调试工具</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
            <Button onClick={checkDebugInfo} variant="outline">
              刷新信息
            </Button>
            <Button onClick={clearAllStorage} variant="destructive">
              清除所有数据
            </Button>
            <Button onClick={clearAuthData} variant="secondary">
              清除认证数据
            </Button>
            <Button onClick={() => window.location.reload()}>
              重新加载页面
            </Button>
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <Button onClick={setTestStudent} variant="outline" className="bg-green-50">
              设置为测试学员
            </Button>
            <Button onClick={setTestAdmin} variant="outline" className="bg-blue-50">
              设置为测试管理员
            </Button>
          </div>
          
          {debugInfo && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-semibold mb-2">💾 localStorage 数据:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(debugInfo.localStorage, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">📅 sessionStorage 数据:</h3>
                <pre className="bg-gray-100 p-3 rounded text-sm overflow-auto">
                  {JSON.stringify(debugInfo.sessionStorage, null, 2)}
                </pre>
              </div>
              
              <div>
                <h3 className="text-lg font-semibold mb-2">🌐 环境信息:</h3>
                <div className="bg-gray-100 p-3 rounded text-sm">
                  <p><strong>当前URL:</strong> {debugInfo.currentUrl}</p>
                  <p><strong>用户代理:</strong> {debugInfo.userAgent}</p>
                </div>
              </div>
            </div>
          )}
          
          <div className="bg-yellow-50 p-4 rounded border-l-4 border-yellow-400">
            <h3 className="text-lg font-semibold mb-2">🔍 诊断步骤:</h3>
            <ol className="list-decimal list-inside space-y-1 text-sm">
              <li>点击"刷新信息"查看当前状态</li>
              <li>如果角色不正确，点击"清除认证数据"</li>
              <li>访问对应的登录页面重新登录</li>
              <li>确认使用正确的测试账号：</li>
              <ul className="list-disc list-inside ml-4 mt-1 space-y-1">
                <li><strong>学员账号:</strong> student@test.com</li>
                <li><strong>管理员账号:</strong> admin@test.com</li>
                <li><strong>密码:</strong> testpass123</li>
              </ul>
            </ol>
          </div>
          
          <div className="bg-blue-50 p-4 rounded border-l-4 border-blue-400">
            <h3 className="text-lg font-semibold mb-2">🚀 快速链接:</h3>
            <div className="space-y-2">
              <a href="/student-login" className="block text-blue-600 hover:underline">
                → 学员登录页面
              </a>
              <a href="/admin-login" className="block text-blue-600 hover:underline">
                → 管理员登录页面
              </a>
              <a href="/student" className="block text-blue-600 hover:underline">
                → 学员面板
              </a>
              <a href="/admin" className="block text-blue-600 hover:underline">
                → 管理员面板
              </a>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default LoginDebug;
