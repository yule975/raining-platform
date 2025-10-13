import { useState, useEffect } from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "./AppSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { 
  DropdownMenu, 
  DropdownMenuContent, 
  DropdownMenuItem, 
  DropdownMenuSeparator, 
  DropdownMenuTrigger 
} from "@/components/ui/dropdown-menu";
import { Search, User, Settings, LogOut, Shield, Loader2 } from "lucide-react";

import { LoadingOverlay } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

const Layout = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { user, profile, signOut } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [isGlobalLoading, setIsGlobalLoading] = useState(false);

  // 监听网络状态
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast({
        title: "网络已连接",
        description: "您的网络连接已恢复",
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      toast({
        title: "网络连接断开",
        description: "请检查您的网络连接",
        variant: "destructive",
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [toast]);

  // 全局加载状态管理
  useEffect(() => {
    const handleLoadingStart = () => setIsGlobalLoading(true);
    const handleLoadingEnd = () => setIsGlobalLoading(false);

    // 监听路由变化
    window.addEventListener('beforeunload', handleLoadingStart);
    
    return () => {
      window.removeEventListener('beforeunload', handleLoadingStart);
    };
  }, []);

  const handleLogout = async () => {
    try {
      await signOut();
      navigate('/login');
      toast({
        title: "已退出登录",
        description: "您已成功退出登录",
      });
    } catch (error) {
      console.error('Logout error:', error);
      toast({
        title: "退出登录失败",
        description: "请重试",
        variant: "destructive",
      });
    }
  };

  // 角色判定：在 /admin 路径下强制展示为管理员，避免 force_student_role 干扰
  const pathname = window.location.pathname || '';
  const cachedRole = (localStorage.getItem('user_role') as 'student' | 'admin' | null) || null;
  const resolvedRole: 'student' | 'admin' = pathname.startsWith('/admin')
    ? 'admin'
    : (profile?.role as any) || cachedRole || 'student';

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Top Header */}
          <header className="h-16 border-b border-border bg-card/95 backdrop-blur-sm sticky top-0 z-40">
            <div className="flex items-center justify-between h-full px-6">
              <div className="flex items-center space-x-4">
                <SidebarTrigger />
                
                {/* Search */}
                <div className="relative hidden sm:block">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="搜索课程..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 w-64"
                  />
                </div>
              </div>
              
              {/* Right side actions */}
              <div className="flex items-center space-x-4">

                {/* User Menu */}
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-10 w-10 rounded-full">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={profile?.avatar_url || "/placeholder-avatar.jpg"} alt="用户头像" />
                        <AvatarFallback className="bg-primary text-primary-foreground">
                          {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || '用'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <div className="flex flex-col space-y-1 p-2">
                      <p className="text-sm font-medium">{profile?.full_name || user?.email || '用户'}</p>
                      <p className="text-xs text-muted-foreground">{resolvedRole === 'admin' ? '管理员' : '学员'}</p>
                    </div>
                    <DropdownMenuSeparator />
                    {resolvedRole === 'admin' ? (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/admin/settings')}>
                          <Settings className="mr-2 h-4 w-4" />
                          <span>系统设置</span>
                        </DropdownMenuItem>
                      </>
                    ) : (
                      <>
                        <DropdownMenuItem onClick={() => navigate('/profile')}>
                          <User className="mr-2 h-4 w-4" />
                          <span>个人中心</span>
                        </DropdownMenuItem>
                        <DropdownMenuItem onClick={() => navigate('/settings')}>
                          <Settings className="mr-2 h-4 w-4" />
                          <span>设置</span>
                        </DropdownMenuItem>
                      </>
                    )}
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout}>
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>退出登录</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </div>
            </div>
          </header>
          
          {/* Main content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
      
      {/* Global Loading Overlay */}
       {isGlobalLoading && (
         <LoadingOverlay isLoading={true}>
           <div className="text-center">
             <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
             <p className="text-muted-foreground">加载中...</p>
           </div>
         </LoadingOverlay>
       )}
    </SidebarProvider>
  );
};

export default Layout;