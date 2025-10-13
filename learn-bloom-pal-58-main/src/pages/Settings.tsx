import React, { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { 
  User, 
  Settings as SettingsIcon, 
  Shield, 
  Eye, 
  EyeOff, 
  Lock,
  Save
} from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";
import { toast } from "sonner";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { user, profile, loading } = useAuth();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState('profile');
  
  // 从localStorage获取备用用户信息
  const authToken = localStorage.getItem('auth_token');
  const userRole = localStorage.getItem('user_role') as 'student' | 'admin' | null;
  const userEmail = localStorage.getItem('user_email');
  
  // 调试：打印用户数据
  console.log('Settings页面 - 当前用户数据:', { user, profile, authToken: !!authToken, userRole, userEmail });
  

 
  // 个人信息状态
  const [profileData, setProfileData] = useState({
    name: '',
    email: '',
    phone: '',
    bio: '',
    avatar: '',
    location: ''
  });
      
  // 当profile或user变化时更新表单数据
  React.useEffect(() => {
    setProfileData({
      name: profile?.full_name || '',
      email: user?.email || userEmail || '',
      phone: profile?.phone || '',
      bio: profile?.bio || '',
      avatar: profile?.avatar_url || '',
      location: (profile as any)?.location || ''
    });
  }, [profile, user, userEmail]);
  
  const [isUpdatingProfile, setIsUpdatingProfile] = useState(false);
  
  // 密码修改状态
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
  




  // 密码验证函数
  const validatePassword = (password: string) => {
    if (password.length < 8) {
      return '密码长度至少8位';
    }
    if (!/(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/.test(password)) {
      return '密码必须包含大小写字母和数字';
    }
    return '';
  };

  // 更新个人信息
  const handleProfileUpdate = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsUpdatingProfile(true);

    try {
      const { error } = await supabase
        .from('profiles')
        .update({
          name: profileData.name,
          phone: profileData.phone,
          location: profileData.location,
          updated_at: new Date().toISOString()
        })
        .eq('id', user?.id);

      if (error) {
        throw error;
      }

      toast.success('个人信息更新成功');
    } catch (error: any) {
      console.error('更新个人信息失败:', error);
      toast.error('更新失败，请重试');
    } finally {
      setIsUpdatingProfile(false);
    }
  };

  // 修改密码
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

  // 切换密码可见性
  const togglePasswordVisibility = (field: 'current' | 'new' | 'confirm') => {
    setShowPasswords(prev => ({
      ...prev,
      [field]: !prev[field]
    }));
  };



  // 头像上传处理
  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // 验证文件类型
    if (!file.type.startsWith('image/')) {
      toast.error('请选择图片文件');
      return;
    }

    // 验证文件大小（5MB）
    if (file.size > 5 * 1024 * 1024) {
      toast.error('图片大小不能超过5MB');
      return;
    }

    try {
      // 创建本地预览URL
      const avatarUrl = URL.createObjectURL(file);
      
      // 更新状态
      setProfileData(prev => ({
        ...prev,
        avatar: avatarUrl
      }));

      toast.success('头像上传成功');
    } catch (error) {
      console.error('头像上传失败:', error);
      toast.error('头像上传失败，请重试');
    }
  };

  // 如果正在加载或没有用户数据，显示加载状态
  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">加载中...</p>
          </div>
        </div>
      </div>
    );
  }

  // 如果没有用户数据且没有localStorage备用数据，显示错误状态
  if (!user && !profile && !authToken) {
    return (
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <p className="text-muted-foreground mb-4">无法加载用户数据</p>
            <Button onClick={() => window.location.reload()}>刷新页面</Button>
          </div>
        </div>
      </div>
    );
  }

  // 使用AuthContext数据或localStorage备用数据
  const displayProfile = profile || {
    role: userRole || 'student',
    email: userEmail
  };

  const isAdmin = (profile?.role === 'admin' || userRole === 'admin');

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {isAdmin ? (
        <>
      <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">安全设置</h1>
            <p className="text-muted-foreground">仅用于安全设置：邮箱只读，下面可直接修改密码</p>
      </div>
          <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <User className="h-5 w-5" />
                基本信息
              </CardTitle>
            </CardHeader>
            <CardContent>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <Label>邮箱</Label>
                    <Input value={user?.email || userEmail || ''} disabled className="bg-muted" />
                  </div>
                </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Lock className="h-5 w-5" />
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
                      <Input id="new-password" type={showPasswords.new ? "text" : "password"} value={passwordData.newPassword} onChange={(e) => setPasswordData(prev => ({ ...prev, newPassword: e.target.value }))} placeholder="请输入新密码" required />
                      <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={() => togglePasswordVisibility('new')}>
                        {showPasswords.new ? (<EyeOff className="h-4 w-4" />) : (<Eye className="h-4 w-4" />)}
                    </Button>
                    </div>
                    <p className="text-sm text-muted-foreground">密码长度至少8位，包含大小写字母和数字</p>
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
                  <Button type="submit" disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword} className="w-full">
                    <Lock className="h-4 w-4 mr-2" />
                    {isChangingPassword ? '修改中...' : '修改密码'}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>
        </>
      ) : (
        <>
          <div className="mb-8">
            <h1 className="text-3xl font-bold mb-2">个人中心</h1>
            <p className="text-muted-foreground">管理您的账号设置和个人信息</p>
          </div>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="flex flex-nowrap gap-2 p-2 overflow-x-auto">
              <TabsTrigger value="profile" className="flex items-center gap-2 shrink-0"><User className="h-4 w-4" />个人信息</TabsTrigger>
              <TabsTrigger value="security" className="flex items-center gap-2 shrink-0"><Shield className="h-4 w-4" />账号安全</TabsTrigger>
            </TabsList>

            <TabsContent value="profile" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold flex items-center gap-2"><User className="h-5 w-5" />基本信息</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center gap-4 mb-6">
                    <Avatar className="h-20 w-20">
                      <AvatarImage src={profileData.avatar} />
                      <AvatarFallback className="text-lg">{profile?.full_name?.charAt(0) || user?.email?.charAt(0) || userEmail?.charAt(0) || 'U'}</AvatarFallback>
                    </Avatar>
                    <div>
                      <Input type="file" accept="image/*" onChange={handleAvatarUpload} />
                    </div>
                  </div>
                  <form onSubmit={handleProfileUpdate} className="space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div className="space-y-2">
                        <Label htmlFor="name">姓名</Label>
                        <Input id="name" value={profileData.name} onChange={(e)=>setProfileData(prev=>({...prev, name:e.target.value}))} placeholder="请输入姓名" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="email">邮箱</Label>
                        <Input id="email" value={user?.email || userEmail || ''} disabled className="bg-muted" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="phone">手机号</Label>
                        <Input id="phone" value={profileData.phone} onChange={(e)=>setProfileData(prev=>({...prev, phone:e.target.value}))} placeholder="请输入手机号" />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="location">所在地区</Label>
                        <Input id="location" value={profileData.location} onChange={(e)=>setProfileData(prev=>({...prev, location:e.target.value}))} placeholder="请输入所在地区" />
                      </div>
                    </div>
                    <Button type="submit" disabled={isUpdatingProfile} className="w-full">
                      <Save className="h-4 w-4 mr-2" />
                      {isUpdatingProfile ? '保存中...' : '保存信息'}
                    </Button>
                  </form>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="security" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle className="text-xl font-semibold flex items-center gap-2"><Lock className="h-5 w-5" />修改密码</CardTitle>
                </CardHeader>
                <CardContent>
                  <form onSubmit={handlePasswordChange} className="space-y-4">
                    {passwordError && (<Alert variant="destructive"><AlertDescription>{passwordError}</AlertDescription></Alert>)}
                    <div className="space-y-2">
                      <Label htmlFor="current-password">当前密码</Label>
                      <div className="relative">
                        <Input id="current-password" type={showPasswords.current ? 'text' : 'password'} value={passwordData.currentPassword} onChange={(e)=>setPasswordData(prev=>({...prev, currentPassword:e.target.value}))} placeholder="请输入当前密码" required />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={()=>togglePasswordVisibility('current')}>
                          {showPasswords.current ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="new-password">新密码</Label>
                      <div className="relative">
                        <Input id="new-password" type={showPasswords.new ? 'text' : 'password'} value={passwordData.newPassword} onChange={(e)=>setPasswordData(prev=>({...prev, newPassword:e.target.value}))} placeholder="请输入新密码" required />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={()=>togglePasswordVisibility('new')}>
                          {showPasswords.new ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                        </Button>
                      </div>
                      <p className="text-sm text-muted-foreground">密码长度至少8位，包含大小写字母和数字</p>
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="confirm-password">确认新密码</Label>
                      <div className="relative">
                        <Input id="confirm-password" type={showPasswords.confirm ? 'text' : 'password'} value={passwordData.confirmPassword} onChange={(e)=>setPasswordData(prev=>({...prev, confirmPassword:e.target.value}))} placeholder="请再次输入新密码" required />
                        <Button type="button" variant="ghost" size="sm" className="absolute right-0 top-0 h-full px-3 py-2 hover:bg-transparent" onClick={()=>togglePasswordVisibility('confirm')}>
                          {showPasswords.confirm ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                    </Button>
                  </div>
                </div>
                    <Button type="submit" disabled={isChangingPassword || !passwordData.currentPassword || !passwordData.newPassword || !passwordData.confirmPassword} className="w-full">
                  <Lock className="h-4 w-4 mr-2" />
                  {isChangingPassword ? '修改中...' : '修改密码'}
                </Button>
              </form>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
        </>
      )}
    </div>
  );
}