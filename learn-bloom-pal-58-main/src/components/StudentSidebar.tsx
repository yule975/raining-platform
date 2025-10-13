import { NavLink, useLocation } from "react-router-dom";
import {
  Home,
  BookOpen,
  GraduationCap,
  FileText,
  User
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";
import monkeyMascot from "@/assets/monkey-mascot.png";

const navigationItems = [
  { title: "首页", url: "/student", icon: Home },
  { title: "课程中心", url: "/student/courses", icon: BookOpen },
  { title: "我的作业", url: "/student/assignments", icon: FileText },
  { title: "个人中心", url: "/student/profile", icon: User },
];

export function StudentSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => currentPath === path;
  const getNavCls = ({ isActive }: { isActive: boolean }) =>
    isActive 
      ? "bg-primary/10 text-primary font-medium border-r-2 border-primary" 
      : "text-muted-foreground hover:text-foreground hover:bg-muted/50";

  return (
    <Sidebar className={isCollapsed ? "w-16" : "w-64"} collapsible="icon">
      <SidebarContent>
        {/* Logo Section */}
        <div className="p-4 border-b border-border">
          <div className="flex items-center space-x-3">
            <div className="relative">
              <img 
                src={monkeyMascot} 
                alt="AI Training Platform" 
                className="w-8 h-8 object-contain"
              />
              <div className="absolute -bottom-1 -right-1 w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                <span className="text-primary-foreground text-xs font-bold">AI</span>
              </div>
            </div>
            {!isCollapsed && (
              <div>
                <h2 className="text-lg font-bold text-foreground">训战营学习平台</h2>
                <p className="text-xs text-muted-foreground">学员版</p>
              </div>
            )}
          </div>
        </div>

        {/* Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      end 
                      className={getNavCls}
                    >
                      <item.icon className="mr-3 h-5 w-5 text-foreground" />
                      {!isCollapsed && <span className="text-foreground">{item.title}</span>}
                    </NavLink>
                  </SidebarMenuButton>
                </SidebarMenuItem>
              ))}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}