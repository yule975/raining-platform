import React from 'react';
import { useNavigate } from 'react-router-dom';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar } from 'recharts';
import { Users, BookOpen, Clock, TrendingUp, AlertCircle, Plus, Bell, Upload, Download, Sparkles, BarChart3, FileText } from 'lucide-react';
import AssignmentDashboard from './AssignmentDashboard';

// Mock data for charts
const userActivityData = [
  { date: '2024-01-01', dau: 120, wau: 450 },
  { date: '2024-01-02', dau: 135, wau: 480 },
  { date: '2024-01-03', dau: 145, wau: 520 },
  { date: '2024-01-04', dau: 128, wau: 510 },
  { date: '2024-01-05', dau: 160, wau: 540 },
  { date: '2024-01-06', dau: 142, wau: 530 },
  { date: '2024-01-07', dau: 155, wau: 560 },
];

const topCoursesData = [
  { name: 'AI基础入门', enrollment: 340, hours: 1250 },
  { name: 'Python编程', enrollment: 280, hours: 980 },
  { name: '数据分析', enrollment: 220, hours: 820 },
  { name: '机器学习', enrollment: 180, hours: 750 },
  { name: '深度学习', enrollment: 150, hours: 650 },
];

const AdminDashboard = () => {
  const navigate = useNavigate();
  const [isImportDialogOpen, setIsImportDialogOpen] = React.useState(false);
  const [showAssignmentDashboard, setShowAssignmentDashboard] = React.useState(false);

  const handleUserCardClick = () => {
    navigate('/admin/users');
  };

  if (showAssignmentDashboard) {
    return <AssignmentDashboard />;
  }

  return (
    <div className="space-y-8 animate-fade-in">
      {/* 欢迎横幅 - 重新设计 */}
      <div className="card-elevated p-8 bg-gradient-card border-0 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-primary opacity-10 rounded-full transform translate-x-16 -translate-y-16"></div>
        <div className="absolute bottom-0 left-0 w-24 h-24 bg-gradient-primary opacity-10 rounded-full transform -translate-x-12 translate-y-12"></div>
        <div className="relative z-10">
          <div className="flex items-center space-x-3 mb-4">
            <div className="icon-enhanced">
              <Sparkles className="h-5 w-5 text-primary" />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-foreground">管理后台总览</h1>
              <p className="text-muted-foreground">实时监控平台运营状况与核心数据</p>
            </div>
          </div>
        </div>
      </div>

      {/* 核心KPI概览 - 使用新的卡片样式 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stat-card cursor-pointer group hover:scale-[1.02] transition-all duration-300" onClick={handleUserCardClick}>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">总用户数</CardTitle>
            <div className="icon-enhanced group-hover:scale-110 transition-transform">
              <Users className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="stat-value">2,345</div>
            <p className="stat-label">+12% 较上月 • 点击查看用户管理</p>
          </CardContent>
        </Card>
        
        
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">课程总数</CardTitle>
            <div className="icon-enhanced">
              <BookOpen className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="stat-value">68</div>
            <p className="stat-label">+3 本月新增</p>
          </CardContent>
        </Card>
        
        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">总学习时长</CardTitle>
            <div className="icon-enhanced">
              <Clock className="h-5 w-5 text-primary" />
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="stat-value">12,450</div>
            <p className="stat-label">小时</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* 用户活跃度曲线 - 增强版 */}
        <Card className="lg:col-span-2 card-elevated border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <TrendingUp className="h-5 w-5 text-primary" />
              <span>用户活跃度趋势</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="pt-0">
            <ResponsiveContainer width="100%" height={320}>
              <AreaChart data={userActivityData}>
                <defs>
                  <linearGradient id="dauGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(45, 100%, 58%)" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="hsl(45, 100%, 58%)" stopOpacity={0.1}/>
                  </linearGradient>
                  <linearGradient id="wauGradient" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="0%" stopColor="hsl(208, 25%, 45%)" stopOpacity={0.8}/>
                    <stop offset="100%" stopColor="hsl(208, 25%, 45%)" stopOpacity={0.1}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--border))" opacity={0.3} />
                <XAxis 
                  dataKey="date" 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                />
                <YAxis 
                  tick={{ fontSize: 12, fill: 'hsl(var(--muted-foreground))' }}
                  axisLine={false}
                />
                <Tooltip 
                  contentStyle={{ 
                    backgroundColor: 'hsl(var(--popover))',
                    border: '1px solid hsl(var(--border))',
                    borderRadius: '12px',
                    boxShadow: 'var(--shadow-medium)'
                  }}
                />
                <Area 
                  type="monotone" 
                  dataKey="dau" 
                  stroke="hsl(45, 100%, 58%)" 
                  fill="url(#dauGradient)"
                  strokeWidth={2}
                />
                <Area 
                  type="monotone" 
                  dataKey="wau" 
                  stroke="hsl(208, 25%, 45%)" 
                  fill="url(#wauGradient)"
                  strokeWidth={2}
                />
              </AreaChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* 待办事项与快捷入口 - 重新设计 */}
        <Card className="card-elevated border-0">
          <CardHeader className="pb-4">
            <CardTitle className="flex items-center space-x-2">
              <AlertCircle className="h-5 w-5 text-primary" />
              <span>待办事项</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-4">
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl border border-orange-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
                    <AlertCircle className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-orange-900">5门课程待审核</span>
                </div>
                <Badge className="bg-orange-500 text-white">5</Badge>
              </div>
              
              <div className="flex items-center justify-between p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl border border-blue-200">
                <div className="flex items-center space-x-3">
                  <div className="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
                    <Bell className="h-4 w-4 text-white" />
                  </div>
                  <span className="text-sm font-medium text-blue-900">12条用户反馈待处理</span>
                </div>
                <Badge className="bg-blue-500 text-white">12</Badge>
              </div>
            </div>

            <div className="space-y-3 pt-4 border-t divider-subtle">
              <p className="text-sm font-semibold text-foreground">快捷操作</p>
              <Button className="btn-primary-gradient w-full justify-start">
                <Plus className="mr-2 h-4 w-4" />
                发布新课程
              </Button>
              <Button variant="outline" size="sm" className="w-full justify-start rounded-xl border-primary/20 text-primary hover:bg-primary/5">
                <Bell className="mr-2 h-4 w-4" />
                发送公告
              </Button>
              <Dialog open={isImportDialogOpen} onOpenChange={setIsImportDialogOpen}>
                <DialogTrigger asChild>
                  <Button variant="outline" size="sm" className="w-full justify-start rounded-xl border-secondary/20 text-secondary hover:bg-secondary/5">
                    <Upload className="mr-2 h-4 w-4" />
                    批量导入用户
                  </Button>
                </DialogTrigger>
                <DialogContent className="dialog-enhanced max-w-2xl">
                  <DialogHeader className="p-6 pb-4">
                    <DialogTitle className="text-xl">批量导入用户</DialogTitle>
                    <DialogDescription>
                      支持Excel文件导入，请先下载模板文件填写用户信息。
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-6 p-6 pt-0">
                    <div className="flex items-center space-x-4">
                      <Button variant="outline" className="rounded-xl">
                        <Download className="mr-2 h-4 w-4" />
                        下载Excel模板
                      </Button>
                      <span className="text-sm text-muted-foreground">请按模板格式填写用户信息</span>
                    </div>
                    
                    <div className="border-2 border-dashed border-primary/20 rounded-2xl p-8 text-center bg-primary/5">
                      <Upload className="mx-auto h-12 w-12 text-primary mb-4" />
                      <p className="text-sm text-foreground mb-2">拖拽Excel文件到此处，或点击选择文件</p>
                      <p className="text-xs text-muted-foreground mb-4">支持 .xlsx, .xls 格式，最大10MB</p>
                      <Button variant="outline" className="rounded-xl">
                        选择文件
                      </Button>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-xl border border-blue-200">
                      <h4 className="font-medium text-blue-900 mb-3">导入说明：</h4>
                      <ul className="text-sm text-blue-800 space-y-2">
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>必填字段：姓名、工号、部门、邮箱</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>工号不能重复，重复数据将被跳过</span>
                        </li>
                        <li className="flex items-start space-x-2">
                          <span className="text-blue-500 mt-0.5">•</span>
                          <span>导入后系统将自动发送欢迎邮件</span>
                        </li>
                      </ul>
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-4">
                      <Button variant="outline" onClick={() => setIsImportDialogOpen(false)} className="rounded-xl">
                        取消
                      </Button>
                      <Button onClick={() => setIsImportDialogOpen(false)} className="btn-primary-gradient">
                        开始导入
                      </Button>
                    </div>
                  </div>
                </DialogContent>
              </Dialog>
            </div>
          </CardContent>
        </Card>
      </div>

    </div>
  );
};

export default AdminDashboard;