import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { auth } from '@/lib/auth';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff, Wifi } from 'lucide-react';
import { networkTester } from '@/utils/networkTest';

export default function StudentLogin() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [isTestingNetwork, setIsTestingNetwork] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: ''
  });
  const [errors, setErrors] = useState({
    email: '',
    password: '',
    submit: ''
  });

  const validateForm = () => {
    const newErrors = { email: '', password: '', submit: '' };
    let isValid = true;

    if (!formData.email.trim()) {
      newErrors.email = '请输入邮箱地址';
      isValid = false;
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      newErrors.email = '请输入有效的邮箱地址';
      isValid = false;
    }

    if (!formData.password.trim()) {
      newErrors.password = '请输入密码';
      isValid = false;
    } else if (formData.password.length < 6) {
      newErrors.password = '密码至少需要6位字符';
      isValid = false;
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleNetworkTest = async () => {
    setIsTestingNetwork(true);
    try {
      console.log('🔍 开始网络诊断测试...');
      
      // 获取网络环境信息
      networkTester.getNetworkInfo();
      
      // 运行所有网络测试
      const results = await networkTester.runAllTests();
      
      // 分析结果并给出建议
      const failedTests = results.filter(r => !r.success);
      
      if (failedTests.length === 0) {
        toast.success('网络连接正常，所有测试通过！');
      } else {
        const suggestions = [];
        
        if (failedTests.some(t => t.test === '基本网络连接')) {
          suggestions.push('请检查您的网络连接');
        }
        
        if (failedTests.some(t => t.test.includes('Supabase'))) {
          suggestions.push('Supabase服务访问异常，建议：');
          suggestions.push('1. 尝试使用VPN（推荐新加坡节点）');
          suggestions.push('2. 检查防火墙设置');
          suggestions.push('3. 联系技术支持');
        }
        
        toast.error(`网络诊断发现问题：\n${suggestions.join('\n')}`);
      }
      
    } catch (error) {
      console.error('网络测试失败:', error);
      toast.error('网络诊断失败，请重试');
    } finally {
      setIsTestingNetwork(false);
    }
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    
    console.log('开始登录流程...')
    console.log('表单数据:', { email: formData.email, password: '***' })
    
    const isValid = validateForm()
    if (!isValid) {
      console.log('表单验证失败')
      return
    }
    
    setIsLoading(true)
    setErrors({ email: '', password: '', submit: '' })
    console.log('设置loading状态为true')
    
    try {
      console.log('调用auth.signIn...')
      const { user, error } = await auth.signIn(formData.email, formData.password)
      console.log('auth.signIn返回结果:', { user: user ? { ...user, id: '***' } : null, error })
      
      if (error) {
        console.error('登录错误:', error)
        setErrors(prev => ({ ...prev, submit: error }))
        return
      }
      
      if (user) {
        console.log('用户登录成功，后端返回角色:', user.role, '，按入口兜底：student')
        // 按入口兜底：学员登录入口一律视为学员，避免远端慢或误判
        // 设置登录状态到localStorage
        localStorage.setItem('auth_token', 'student_auth_token');
        localStorage.setItem('user_role', 'student'); // 入口优先
        localStorage.setItem('user_email', formData.email);
        localStorage.setItem('login_time', new Date().toISOString());
        // 强制学员角色标记，避免后续被授权表覆盖为admin
        localStorage.setItem('force_student_role', 'true');
        // 写入完整的 user_profile，供 AuthContext 立即使用
        localStorage.setItem('user_profile', JSON.stringify({
          id: user.id,
          email: user.email,
          full_name: user.fullName || user.email.split('@')[0],
          avatar_url: user.avatarUrl || null,
          role: 'student'
        }));
        console.log('已设置localStorage认证信息')
        
        console.log('准备跳转到学员面板')
        toast.success('登录成功！正在跳转...')
        
        // 使用延迟跳转，确保localStorage设置完成
        setTimeout(() => {
          // 跳转到学员首页，路由会自动重定向到期次选择页面
          navigate('/student', { replace: true })
        }, 1000)
      } else {
        console.log('登录失败：未返回用户信息')
        setErrors(prev => ({ ...prev, submit: '登录失败，请检查邮箱和密码' }))
      }
    } catch (error) {
      console.error('登录异常:', error)
      setErrors(prev => ({ ...prev, submit: '登录失败，请重试' }))
    } finally {
      console.log('设置loading状态为false')
      setIsLoading(false)
    }
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    
    // 清除对应字段的错误信息
    if (errors[name as keyof typeof errors]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-2xl font-bold text-center">学员登录</CardTitle>
          <CardDescription className="text-center">
            请输入您的登录凭据
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="email">邮箱地址</Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  placeholder="请输入您的邮箱地址"
                  value={formData.email}
                  onChange={handleInputChange}
                  className={errors.email ? 'border-red-500' : ''}
                  required
                />
                {errors.email && (
                  <p className="text-sm text-red-500">{errors.email}</p>
                )}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">密码</Label>
                <div className="relative">
                  <Input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    placeholder="请输入您的密码"
                    value={formData.password}
                    onChange={handleInputChange}
                    className={errors.password ? 'border-red-500 pr-10' : 'pr-10'}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700"
                  >
                    {showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-sm text-red-500">{errors.password}</p>
                )}
              </div>
            </div>
            
            {errors.submit && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm text-red-600">{errors.submit}</p>
              </div>
            )}
            
            <div className="space-y-4">
              <Button 
                type="submit" 
                className="w-full" 
                disabled={isLoading}
              >
                {isLoading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    登录中...
                  </>
                ) : (
                  '学员登录'
                )}
              </Button>
              
              <Button 
                type="button"
                variant="outline"
                className="w-full" 
                onClick={handleNetworkTest}
                disabled={isTestingNetwork}
              >
                {isTestingNetwork ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    网络诊断中...
                  </>
                ) : (
                  <>
                    <Wifi className="mr-2 h-4 w-4" />
                    网络连接诊断
                  </>
                )}
              </Button>
              
              <div className="text-center text-sm text-gray-600">
                <p>还没有账号？请联系管理员获取登录凭据</p>
                <p className="mt-1 text-xs text-gray-500">如遇登录问题，可点击上方按钮进行网络诊断</p>
              </div>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}