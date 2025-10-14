import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { User, Shield, Eye, EyeOff } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";

export default function Profile() {
  const { user, profile } = useAuth();
  const [studentName, setStudentName] = useState('');
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });
  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [passwordError, setPasswordError] = useState('');

  // 获取学员真实姓名
  useEffect(() => {
    const fetchStudentName = async () => {
      if (!user?.email) return;
      
      try {
        // 从authorized_users表获取学员姓名
        const { data, error } = await supabase
          .from('authorized_users')
          .select('name')
          .eq('email', user.email)
          .single();
        
        if (data && !error) {
          setStudentName(data.name);
        } else {
          // 如果没找到，使用profile中的full_name或邮箱前缀
          setStudentName(profile?.full_name || user.user_metadata?.full_name || user.email.split('@')[0]);
        }
      } catch (e) {
        console.error('获取学员姓名失败:', e);
        setStudentName(profile?.full_name || user?.email?.split('@')[0] || '');
      }
    };

    fetchStudentName();
  }, [user, profile]);

  const validatePassword = (password: string) => {
    // 简化验证：至少8位，包含大小写字母和数字或特殊符号
    if (password.length < 8) {
      return '密码长度至少8位';
    }
    
    const hasUpperCase = /[A-Z]/.test(password);
    const hasLowerCase = /[a-z]/.test(password);
    const hasNumber = /[0-9]/.test(password);
    const hasSpecial = /[!@#$%^&*(),.?":{}|<>]/.test(password);
    
    if (!hasUpperCase || !hasLowerCase) {
      return '密码必须包含大小写字母';
    }
    
    if (!hasNumber && !hasSpecial) {
      return '密码必须包含数字或特殊符号';
    }
    
    return '';
  };

  const handlePasswordChange = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError('');

    // 验证新密码
    const passwordValidation = validatePassword(passwordData.newPassword);
    if (passwordValidation) {
      setPasswordError(passwordValidation);
      return;
    }

    // 验证密码确认
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      setPasswordError('新密码和确认密码不匹配');
      return;
    }

    setIsChangingPassword(true);

    try {
      // 使用Supabase Auth更新密码
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        throw error;
      }

      toast.success('密码修改成功');
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error: any) {
      console.error('密码修改失败:', error);
      setPasswordError(error.message || '密码修改失败，请重试');
      toast.error('密码修改失败');
    } finally {
      setIsChangingPassword(false);
    }
  };

  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };


  return (
    <div className="container mx-auto py-8 px-4 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">个人中心</h1>
      </div>

      {/* 合并后的单页：基本信息（只读） + 账号安全 */}
      <Alert>
        <AlertDescription>仅用于安全设置：邮箱只读；姓名为固定资料，仅管理员可修改。</AlertDescription>
      </Alert>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <User className="h-5 w-5" />
            基本信息
          </CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <div className="space-y-2">
            <Label>邮箱</Label>
            <Input value={user?.email || ''} disabled />
          </div>
          <div className="space-y-2">
            <Label>姓名（仅管理员可修改）</Label>
            <Input value={studentName} disabled />
          </div>
          
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            修改密码
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordError && (
              <Alert variant="destructive">
                <AlertDescription>{passwordError}</AlertDescription>
              </Alert>
            )}
            <div className="space-y-2">
              <Label htmlFor="current-password">当前密码</Label>
              <div className="relative">
                <Input id="current-password" type={showPasswords.current ? "text" : "password"} value={passwordData.currentPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, currentPassword: e.target.value }))} placeholder="请输入当前密码" required />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => togglePasswordVisibility('current')}>
                  {showPasswords.current ? (<EyeOff className="h-4 w-4" />) : (<Eye className="h-4 w-4" />)}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="new-password">新密码</Label>
              <div className="relative">
                <Input id="new-password" type={showPasswords.new ? "text" : "password"} value={passwordData.newPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))} placeholder="至少8位，包含大小写字母+数字或特殊符号" required />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => togglePasswordVisibility('new')}>
                  {showPasswords.new ? (<EyeOff className="h-4 w-4" />) : (<Eye className="h-4 w-4" />)}
                </Button>
              </div>
            </div>
            <div className="space-y-2">
              <Label htmlFor="confirm-password">确认新密码</Label>
              <div className="relative">
                <Input id="confirm-password" type={showPasswords.confirm ? "text" : "password"} value={passwordData.confirmPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, confirmPassword: e.target.value }))} placeholder="请再次输入新密码" required />
                <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => togglePasswordVisibility('confirm')}>
                  {showPasswords.confirm ? (<EyeOff className="h-4 w-4" />) : (<Eye className="h-4 w-4" />)}
                </Button>
              </div>
            </div>
            <Button type="submit" disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword} className="w-full">{isChangingPassword ? '修改中...' : '修改密码'}</Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}