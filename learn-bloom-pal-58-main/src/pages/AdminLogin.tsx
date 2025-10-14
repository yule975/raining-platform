import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { toast } from 'sonner';
import { Loader2, Eye, EyeOff } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { auth } from '@/lib/auth';

export default function AdminLogin() {
  const navigate = useNavigate();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    email: 'xiewenxuan001@51Talk.com',
    password: 'Admin123456!'
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
    }

    setErrors(newErrors);
    return isValid;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validateForm()) {
      return;
    }

    setIsLoading(true);
    setErrors({ email: '', password: '', submit: '' });

    try {
      console.log('AdminLogin: 开始登录流程...');
      
      // 先清除任何现有的session
      console.log('AdminLogin: 清除现有session...');
      await supabase.auth.signOut();
      
      // 通过Supabase进行真正的登录
      console.log('AdminLogin: 尝试Supabase登录...');
      const { data, error } = await supabase.auth.signInWithPassword({
        email: formData.email,
        password: formData.password
      });
      
      if (error) {
        console.error('AdminLogin: Supabase登录失败:', error);
        setErrors(prev => ({ ...prev, submit: error.message || '邮箱或密码错误' }));
        toast.error('邮箱或密码错误');
        return;
      }
      
      if (!data.user) {
        console.error('AdminLogin: 登录成功但无用户数据');
        setErrors(prev => ({ ...prev, submit: '登录失败，请重试' }));
        toast.error('登录失败，请重试');
        return;
      }
      
      console.log('AdminLogin: Supabase登录成功，用户:', data.user.email);
      
      // 验证是否为管理员
      const { data: authUser, error: authError } = await supabase
        .from('authorized_users')
        .select('role')
        .eq('email', data.user.email)
        .single();
      
      if (authError || !authUser || authUser.role !== 'admin') {
        console.error('AdminLogin: 非管理员账号');
        await supabase.auth.signOut();
        setErrors(prev => ({ ...prev, submit: '此账号无管理员权限' }));
        toast.error('此账号无管理员权限');
        return;
      }
      
      console.log('AdminLogin: 管理员身份验证通过');
      
      // 设置登录状态
      localStorage.setItem('auth_token', data.session?.access_token || 'admin_token');
      localStorage.setItem('user_role', 'admin');
      localStorage.setItem('user_email', data.user.email!);
      localStorage.setItem('login_time', new Date().toISOString());
      
      toast.success('登录成功！正在跳转到管理员面板...');
      
      // 使用React Router导航
      setTimeout(() => {
        navigate('/admin', { replace: true });
      }, 1000);

    } catch (error: any) {
      console.error('AdminLogin: 登录异常:', error);
      const errorMsg = error.message || '登录失败，请重试';
      setErrors(prev => ({ ...prev, submit: errorMsg }));
      toast.error(errorMsg);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    setErrors(prev => ({ ...prev, [name]: '', submit: '' }));
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader className="space-y-1 text-center">
          <CardTitle className="text-2xl">管理员登录</CardTitle>
          <CardDescription>
            使用您的管理员邮箱和密码登录
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleLogin} className="space-y-4">
            <div className="grid gap-2">
              <Label htmlFor="email">邮箱</Label>
              <Input
                id="email"
                name="email"
                type="email"
                placeholder="admin@example.com"
                value={formData.email}
                onChange={handleInputChange}
                disabled={isLoading}
              />
              {errors.email && <p className="text-red-500 text-sm">{errors.email}</p>}
            </div>
            <div className="grid gap-2">
              <Label htmlFor="password">密码</Label>
              <div className="relative">
                <Input
                  id="password"
                  name="password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Admin123456!"
                  value={formData.password}
                  onChange={handleInputChange}
                  disabled={isLoading}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent"
                  onClick={() => setShowPassword(prev => !prev)}
                  disabled={isLoading}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4 text-muted-foreground" />
                  ) : (
                    <Eye className="h-4 w-4 text-muted-foreground" />
                  )}
                </Button>
              </div>
              {errors.password && <p className="text-red-500 text-sm">{errors.password}</p>}
            </div>
            {errors.submit && <p className="text-red-500 text-sm text-center">{errors.submit}</p>}
            <Button type="submit" className="w-full" disabled={isLoading}>
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  登录中...
                </>
              ) : (
                '管理员登录'
              )}
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
