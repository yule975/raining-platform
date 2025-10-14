import React from "react";
import { Outlet, useNavigate } from "react-router-dom";
import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { StudentSidebar } from "./StudentSidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { Search, Settings, LogOut, User, Calendar, ChevronDown } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { useSession } from "@/contexts/SessionContext";
import { useToast } from "@/hooks/use-toast";

const StudentLayout = () => {
  const navigate = useNavigate();
  const { user, profile, signOut } = useAuth();
  const { currentSession, availableSessions, switchSession } = useSession();
  const { toast } = useToast();

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

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <StudentSidebar />
        
        <div className="flex-1 flex flex-col">
          {/* Header */}
          <header className="sticky top-0 z-40 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
            <div className="container flex h-14 items-center">
              <SidebarTrigger className="mr-4" />
              
              {/* Search */}
              <div className="flex-1 flex items-center space-x-4 lg:space-x-6">
                <div className="relative flex-1 max-w-md">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="搜索课程、笔记..."
                    className="pl-10 bg-muted/50"
                  />
                </div>
              </div>

              {/* Right side */}
              <div className="flex items-center space-x-4">
                {/* Session Selector */}
                {currentSession && (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="outline" className="h-8 px-3 text-sm">
                        <Calendar className="mr-2 h-4 w-4" />
                        <span className="max-w-32 truncate">{currentSession.name}</span>
                        <Badge 
                          variant={currentSession.status === 'active' ? 'default' : 'secondary'} 
                          className="ml-2 text-xs"
                        >
                          {currentSession.status === 'active' ? '进行中' : 
                           currentSession.status === 'upcoming' ? '即将开始' : '已结束'}
                        </Badge>
                        <ChevronDown className="ml-2 h-4 w-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent className="w-64" align="end">
                      <div className="px-2 py-1.5 text-sm font-semibold text-muted-foreground">
                        切换培训期次
                      </div>
                      <DropdownMenuSeparator />
                      {availableSessions.map((session) => (
                        <DropdownMenuItem 
                          key={session.id}
                          onClick={() => switchSession(session.id)}
                          className={currentSession.id === session.id ? 'bg-muted' : ''}
                        >
                          <div className="flex items-center justify-between w-full">
                            <div className="flex-1">
                              <div className="font-medium">{session.name}</div>
                              <div className="text-xs text-muted-foreground">
                                {new Date(session.start_date).toLocaleDateString()} - {new Date(session.end_date).toLocaleDateString()}
                              </div>
                            </div>
                            <Badge 
                              variant={session.status === 'active' ? 'default' : 'secondary'} 
                              className="ml-2 text-xs"
                            >
                              {session.status === 'active' ? '进行中' : 
                               session.status === 'upcoming' ? '即将开始' : '已结束'}
                            </Badge>
                          </div>
                        </DropdownMenuItem>
                      ))}
                      {availableSessions.length > 1 && (
                        <>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => navigate('/student/session-selection')}>
                            <Calendar className="mr-2 h-4 w-4" />
                            <span>选择其他期次</span>
                          </DropdownMenuItem>
                        </>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                )}
                
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                      <Avatar className="h-8 w-8">
                        <AvatarImage src={profile?.avatar_url || "/avatars/01.png"} alt="@user" />
                        <AvatarFallback>
                          {profile?.full_name?.charAt(0) || user?.email?.charAt(0) || '用'}
                        </AvatarFallback>
                      </Avatar>
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent className="w-56" align="end" forceMount>
                    <DropdownMenuItem onClick={() => navigate('/student/profile')}>
                      <User className="mr-2 h-4 w-4" />
                      <span>个人中心</span>
                    </DropdownMenuItem>
                    <DropdownMenuItem onClick={() => navigate('/student/settings')}>
                      <Settings className="mr-2 h-4 w-4" />
                      <span>设置</span>
                    </DropdownMenuItem>
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

          {/* Main Content */}
          <main className="flex-1">
            <Outlet />
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
};

export default StudentLayout;