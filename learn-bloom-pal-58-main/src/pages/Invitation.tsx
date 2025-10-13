import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Eye, EyeOff, Mail, Clock, UserCheck, UserX, AlertCircle, CheckCircle, Loader2, Shield } from 'lucide-react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';
import PasswordStrengthIndicator, { calculatePasswordStrength } from '@/components/ui/PasswordStrengthIndicator';
import { useAuth } from '@/contexts/AuthContext';

const Invitation = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { signUp } = useAuth();
  
  const [inviteStatus, setInviteStatus] = useState<'verifying' | 'valid' | 'invalid' | 'expired' | 'used'>('verifying');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');

  const [inviteData, setInviteData] = useState<{email: string, token: string, expiresAt: Date} | null>(null);
  const [success, setSuccess] = useState(false);
  const [inviteValid, setInviteValid] = useState(false);
  const [validating, setValidating] = useState(true);





  // Verify invitation token
  useEffect(() => {
    const verifyInvitation = async () => {
      const token = searchParams.get('token');
      const emailParam = searchParams.get('email');
      
      if (!token || !emailParam) {
        setInviteStatus('invalid');
        setValidating(false);
        return;
      }
      
      try {
        // Simulate API call to verify invitation
        // In real implementation, this would call your backend
        await new Promise(resolve => setTimeout(resolve, 1500));
        
        // Decode and validate token (simplified validation)
        const decodedToken = atob(token);
        const tokenParts = decodedToken.split('-');
        const tokenEmail = tokenParts[0];
        const tokenTimestamp = parseInt(tokenParts[1]);
        
        // Check if token matches email
        if (tokenEmail !== decodeURIComponent(emailParam)) {
          setInviteStatus('invalid');
          setValidating(false);
          return;
        }
        
        // Check if token is expired (7 days)
        const expirationTime = tokenTimestamp + (7 * 24 * 60 * 60 * 1000);
        const now = Date.now();
        
        if (now > expirationTime) {
          setInviteStatus('expired');
          setValidating(false);
          return;
        }
        
        // Check if invitation has already been used (simulate)
        // In real implementation, check against database
        const isUsed = localStorage.getItem(`invite_used_${token}`);
        if (isUsed) {
          setInviteStatus('used');
          setValidating(false);
          return;
        }
        
        setEmail(decodeURIComponent(emailParam));
        setInviteData({
          email: decodeURIComponent(emailParam),
          token,
          expiresAt: new Date(expirationTime)
        });
        setInviteStatus('valid');
        setInviteValid(true);
        setValidating(false);
      } catch (error) {
        console.error('Invitation verification failed:', error);
        setInviteStatus('invalid');
        setValidating(false);
      }
    };
    
    verifyInvitation();
  }, [searchParams]);



  const isPasswordStrong = () => {
    const strength = calculatePasswordStrength(password);
    return strength.score >= 70;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (password !== confirmPassword) {
      setError('密码确认不匹配');
      return;
    }
    
    // 验证密码强度
    const strength = calculatePasswordStrength(password);
    if (strength.score < 70) {
      setError('密码强度不足，请参考密码要求进行改进');
      return;
    }
    
    setIsSubmitting(true);
    setError('');
    
    try {
      // 使用Supabase Auth创建账号
      const { data, error } = await supabase.auth.signUp({
        email: inviteData!.email,
        password: password,
        options: {
          emailRedirectTo: `${window.location.origin}/login`
        }
      });

      if (error) {
        throw error;
      }

      // 标记邀请为已使用
      if (inviteData) {
        localStorage.setItem(`invite_used_${inviteData.token}`, 'true');
      }

      // 创建用户档案
      if (data.user) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: data.user.id,
            email: data.user.email,
            name: data.user.email?.split('@')[0] || '新用户',
            role: 'student',
            created_at: new Date().toISOString()
          });

        if (profileError) {
          console.warn('创建用户档案失败:', profileError);
        }
      }

      toast.success('账号设置成功！请查收邮箱验证邮件');
      setSuccess(true);
      
      // 延迟跳转到登录页面
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (error) {
      console.error('Account setup failed:', error);
      setError('账号设置失败，请重试');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (validating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardContent className="flex items-center justify-center py-8">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
              <p className="text-gray-600">验证邀请链接...</p>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!inviteValid) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-red-600">
              <AlertCircle className="h-5 w-5" />
              <span>邀请链接无效</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              邀请链接无效或已过期，请联系管理员重新发送邀请。
            </p>
            <Button 
              onClick={() => navigate('/login')} 
              className="w-full"
            >
              返回登录页面
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (success) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Card className="w-full max-w-md">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2 text-green-600">
              <CheckCircle className="h-5 w-5" />
              <span>账号创建成功</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-gray-600 mb-4">
              您的账号已成功创建，即将跳转到登录页面...
            </p>
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            <div className="flex items-center justify-center space-x-2 mb-2">
              <Mail className="h-6 w-6 text-primary" />
              <span>完成账号设置</span>
            </div>
            <p className="text-sm text-gray-600 font-normal">
              欢迎加入训战营学习平台，请设置您的登录密码
            </p>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Email (read-only) */}
            <div className="space-y-2">
              <label className="text-sm font-medium">邮箱地址</label>
              <Input
                type="email"
                value={email}
                readOnly
                className="bg-gray-50"
              />
            </div>

            {/* Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">设置密码</label>
              <div className="relative">
                <Input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="请输入密码"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Password Strength Indicator */}
            {password && (
              <PasswordStrengthIndicator 
                password={password}
                showRequirements={true}
                showSecurityTips={true}
                className="mt-2"
              />
            )}

            {/* Confirm Password */}
            <div className="space-y-2">
              <label className="text-sm font-medium">确认密码</label>
              <div className="relative">
                <Input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  placeholder="请再次输入密码"
                  className="pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                >
                  {showConfirmPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            {/* Error Message */}
            {error && (
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
            )}

            {/* Submit Button */}
            <Button
              type="submit"
              className="w-full"
              disabled={isSubmitting || !password || !confirmPassword || !isPasswordStrong()}
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  设置中...
                </>
              ) : (
                '完成设置'
              )}
            </Button>
          </form>
        </CardContent>
        {inviteData && (
          <div className="mt-6 p-4 bg-blue-50 rounded-lg">
            <div className="flex items-center space-x-2 text-sm text-blue-700">
              <Shield className="h-4 w-4" />
              <span>邀请信息</span>
            </div>
            <div className="mt-2 text-xs text-blue-600">
              <p>邀请邮箱: {inviteData.email}</p>
              <p>过期时间: {inviteData.expiresAt.toLocaleString('zh-CN')}</p>
            </div>
          </div>
        )}
      </Card>
    </div>
  );
};

export default Invitation;