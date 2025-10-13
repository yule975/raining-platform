import { NavLink, useLocation } from "react-router-dom";
import {
  BarChart3,
  BookOpen,
  Users,
  Megaphone,
  TrendingUp,
  Settings,
  Database,
  FileText,
  Calendar
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

const adminMenuItems = [
  {
    title: "课程管理",
    url: "/admin/courses",
    icon: BookOpen
  },
  {
    title: "期次管理",
    url: "/admin/sessions",
    icon: Calendar
  },
  {
    title: "作业管理",
    url: "/admin/assignments",
    icon: FileText
  },
  {
    title: "学生管理",
    url: "/admin/students",
    icon: Users
  },
  {
    title: "系统设置",
    url: "/admin/settings",
    icon: Settings
  }
]

export function AppSidebar() {
  const { state } = useSidebar();
  const location = useLocation();
  const currentPath = location.pathname;
  const isCollapsed = state === "collapsed";

  const isActive = (path: string) => {
    if (path === "/admin") {
      return currentPath === "/admin";
    }
    return currentPath.startsWith(path);
  };

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
                <p className="text-xs text-muted-foreground">管理后台</p>
              </div>
            )}
          </div>
        </div>

        {/* Admin Navigation */}
        <SidebarGroup>
          <SidebarGroupContent>
            <SidebarMenu>
              {adminMenuItems.map((item) => (
                <SidebarMenuItem key={item.title}>
                  <SidebarMenuButton asChild>
                    <NavLink 
                      to={item.url} 
                      className={({ isActive: navIsActive }) => getNavCls({ isActive: navIsActive || isActive(item.url) })}
                    >
                      <item.icon className="mr-3 h-5 w-5" />
                      {!isCollapsed && <span>{item.title}</span>}
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