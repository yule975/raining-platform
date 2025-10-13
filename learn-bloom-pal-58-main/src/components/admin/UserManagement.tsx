import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { UserPlus, Download, Upload, Search, Eye, Edit, Trash2, Plus, Shield, RefreshCw, BookOpen, Clock, Award, Copy, Calendar } from 'lucide-react';
import { toast } from 'sonner';
import { UserService } from '@/lib/supabaseService';
import { generateTempPassword, generateInvitationLink, createInvitationInfo, formatInvitationText, copyToClipboard } from '@/lib/userInvitation';
import { exportUsers, ExportFormat, ExportOptions } from '../../lib/userExport';
import { parseCSVFile, batchCreateUsers, BatchImportResult, downloadCSVTemplate, downloadBatchInvitations } from '../../lib/batchUserImport';

// Mock user data
const mockUsers = [
  {
    id: 1,
    name: "张三",
    employeeId: "EMP001",
    department: "技术部",
    role: "学员",
    source: "飞书同步",
    status: "active",
    email: "zhangsan@company.com",
    lastLogin: "2024-01-25"
  },
  {
    id: 2,
    name: "李四",
    employeeId: "EMP002",
    department: "产品部",
    role: "课程管理员",
    source: "手动创建",
    status: "active",
    email: "lisi@company.com",
    lastLogin: "2024-01-24"
  },
  {
    id: 3,
    name: "王五",
    employeeId: "EMP003",
    department: "运营部",
    role: "学员",
    source: "飞书同步",
    status: "inactive",
    email: "wangwu@company.com",
    lastLogin: "2024-01-20"
  }
];

const mockRoles = [
  { id: 1, name: "超级管理员", description: "拥有所有权限", userCount: 2 },
  { id: 2, name: "课程管理员", description: "管理课程和用户", userCount: 5 },
  { id: 3, name: "部门学习助理", description: "管理部门学习", userCount: 12 },
  { id: 4, name: "学员", description: "普通学员权限", userCount: 1500 }
];

// Mock detailed user learning data
const mockUserLearningDetail = {
  1: {
    name: "张三",
    avatar: "https://images.unsplash.com/photo-1472099645785-5658abf4ff4e?w=100&h=100&fit=crop&crop=face",
    employeeId: "EMP001",
    department: "技术部",
    joinDate: "2023-06-15",
    totalHours: 125,
    completedCourses: 8,
    inProgressCourses: 2,
    certificates: 3,
    averageScore: 92,
    coursesDetail: [
      {
        id: 1,
        name: "AI基础入门",
        progress: 100,
        hours: 24,
        score: 95,
        status: "completed",
        completedAt: "2024-01-15"
      },
      {
        id: 2,
        name: "Python编程实战",
        progress: 75,
        hours: 18,
        score: null,
        status: "in-progress",
        completedAt: null
      },
      {
        id: 3,
        name: "数据分析方法",
        progress: 100,
        hours: 32,
        score: 88,
        status: "completed",
        completedAt: "2024-01-20"
      }
    ],
    weeklyActivity: [
      { week: "第1周", hours: 8 },
      { week: "第2周", hours: 12 },
      { week: "第3周", hours: 15 },
      { week: "第4周", hours: 10 }
    ]
  }
};

const UserManagement = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterDepartment, setFilterDepartment] = useState('all');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUsers, setSelectedUsers] = useState<number[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<number | null>(null);
  const [isUserDetailOpen, setIsUserDetailOpen] = useState(false);
  const [isAddUserOpen, setIsAddUserOpen] = useState(false);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [exportFormat, setExportFormat] = useState<ExportFormat>('excel');
  const [exportOptions, setExportOptions] = useState<ExportOptions>({
    includeInvitationInfo: true,
    includeLoginStatus: true,
    includePersonalInfo: true
  });
  const [importFile, setImportFile] = useState<File | null>(null);
  const [importResult, setImportResult] = useState<BatchImportResult | null>(null);
  const [generateInvitations, setGenerateInvitations] = useState(true);
  const [newUser, setNewUser] = useState({
    email: '',
    name: '',
    role: 'student' as 'student' | 'admin',
    department: '',
    notes: ''
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800">活跃</Badge>;
      case 'inactive':
        return <Badge variant="secondary">未激活</Badge>;
      case 'disabled':
        return <Badge variant="destructive">已禁用</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getSourceBadge = (source: string) => {
    switch (source) {
      case '飞书同步':
        return <Badge variant="outline">飞书同步</Badge>;
      case '手动创建':
        return <Badge className="bg-blue-100 text-blue-800">手动创建</Badge>;
      default:
        return <Badge variant="outline">{source}</Badge>;
    }
  };

  const filteredUsers = mockUsers.filter(user => {
    const matchesSearch = user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         user.employeeId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesDepartment = filterDepartment === "all" || user.department === filterDepartment;
    const matchesRole = filterRole === "all" || user.role === filterRole;
    
    return matchesSearch && matchesDepartment && matchesRole;
  });

  const handleSelectUser = (userId: number) => {
    setSelectedUsers(prev => 
      prev.includes(userId) 
        ? prev.filter(id => id !== userId)
        : [...prev, userId]
    );
  };

  const handleSelectAll = () => {
    setSelectedUsers(
      selectedUsers.length === filteredUsers.length 
        ? [] 
        : filteredUsers.map(user => user.id)
    );
  };

  const handleUserDetailClick = (userId: number) => {
    setSelectedUserId(userId);
    setIsUserDetailOpen(true);
  };

  const handleAddUser = async () => {
    if (!newUser.email || !newUser.name) {
      toast.error('请填写必填字段');
      return;
    }

    setIsLoading(true);
    try {
      // 添加用户到白名单
      const success = await UserService.addAuthorizedUser(
        newUser.email, 
        newUser.name,
        newUser.role,
        newUser.department || undefined,
        newUser.notes || undefined
      );
      
      if (success) {
        // 生成临时密码和邀请链接
        const tempPassword = generateTempPassword();
        const invitationLink = generateInvitationLink(newUser.email, tempPassword);
        const invitationInfo = createInvitationInfo(newUser.name, newUser.email, tempPassword, invitationLink);
        const invitationText = formatInvitationText(invitationInfo);
        
        // 复制邀请信息到剪贴板
        const copied = await copyToClipboard(invitationText);
        
        if (copied) {
          toast.success('用户添加成功！邀请信息已复制到剪贴板');
        } else {
          toast.success('用户添加成功！请手动复制邀请信息');
          console.log('邀请信息:', invitationText);
        }
        
        setIsAddUserOpen(false);
        resetForm();
        // 这里可以刷新用户列表
      } else {
        toast.error('添加用户失败，请重试');
      }
    } catch (error) {
      console.error('添加用户错误:', error);
      toast.error('添加用户失败');
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      setImportFile(file);
      setImportResult(null);
    }
  };

  const handleBatchImport = async () => {
    if (!importFile) {
      toast({
        title: "请选择文件",
        description: "请先选择要导入的CSV文件",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // 解析文件
      const users = await parseCSVFile(importFile);
      
      if (users.length === 0) {
        toast({
          title: "文件为空",
          description: "CSV文件中没有有效的用户数据",
          variant: "destructive",
        });
        return;
      }
      
      // 批量创建用户
      const result = await batchCreateUsers(users, generateInvitations);
      setImportResult(result);
      
      toast({
        title: "导入完成",
        description: `成功创建 ${result.success.length} 个用户，失败 ${result.failed.length} 个`,
      });
      
      // 刷新用户列表
      // 这里应该调用获取用户列表的函数来刷新数据
      
    } catch (error) {
      console.error('批量导入失败:', error);
      toast({
        title: "导入失败",
        description: error instanceof Error ? error.message : "导入过程中发生错误",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadTemplate = () => {
    downloadCSVTemplate();
    toast({
      title: "模板下载",
      description: "CSV导入模板已下载",
    });
  };

  const handleDownloadInvitations = () => {
    if (importResult?.invitations) {
      downloadBatchInvitations(importResult.invitations);
      toast({
        title: "邀请信息下载",
        description: "批量邀请信息已下载",
      });
    }
  };

  const resetForm = () => {
    setNewUser({
      email: '',
      name: '',
      role: 'student',
      department: '',
      notes: ''
    });
  };

  const handleExportUsers = async () => {
    try {
      setIsLoading(true);
      
      // 获取要导出的用户数据
      const usersToExport = selectedUsers.length > 0 
        ? filteredUsers.filter(user => selectedUsers.includes(user.id))
        : filteredUsers;
      
      // 执行导出
      await exportUsers(usersToExport, exportFormat, exportOptions);
      
      toast({
        title: "导出成功",
        description: `已成功导出 ${usersToExport.length} 个用户的信息`,
      });
      
      setIsExportOpen(false);
    } catch (error) {
      console.error('导出用户失败:', error);
      toast({
        title: "导出失败",
        description: "导出用户信息时发生错误，请重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const selectedUserDetail = selectedUserId ? mockUserLearningDetail[selectedUserId] : null;

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-2xl font-bold">用户管理</h2>
        <div className="flex space-x-2">
          <Dialog open={isExportOpen} onOpenChange={setIsExportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Download className="mr-2 h-4 w-4" />
                导出用户
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>导出用户信息</DialogTitle>
                <DialogDescription>
                  {selectedUsers.length > 0 
                    ? `导出已选择的 ${selectedUsers.length} 个用户信息`
                    : `导出全部 ${filteredUsers.length} 个用户信息`
                  }
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="format" className="text-right">
                    导出格式
                  </Label>
                  <Select value={exportFormat} onValueChange={(value: ExportFormat) => setExportFormat(value)}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="excel">Excel (.xlsx)</SelectItem>
                      <SelectItem value="csv">CSV (.csv)</SelectItem>
                      <SelectItem value="json">JSON (.json)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-3">
                  <Label>导出内容</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="personalInfo"
                        checked={exportOptions.includePersonalInfo}
                        onCheckedChange={(checked) => 
                          setExportOptions({...exportOptions, includePersonalInfo: !!checked})
                        }
                      />
                      <Label htmlFor="personalInfo">基本信息（姓名、邮箱、部门等）</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="loginStatus"
                        checked={exportOptions.includeLoginStatus}
                        onCheckedChange={(checked) => 
                          setExportOptions({...exportOptions, includeLoginStatus: !!checked})
                        }
                      />
                      <Label htmlFor="loginStatus">登录状态和最后登录时间</Label>
                    </div>
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="invitationInfo"
                        checked={exportOptions.includeInvitationInfo}
                        onCheckedChange={(checked) => 
                          setExportOptions({...exportOptions, includeInvitationInfo: !!checked})
                        }
                      />
                      <Label htmlFor="invitationInfo">邀请信息（临时密码、邀请链接）</Label>
                    </div>
                  </div>
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsExportOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleExportUsers} disabled={isLoading}>
                  {isLoading ? '导出中...' : '导出'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
           <Dialog open={isBatchImportOpen} onOpenChange={setIsBatchImportOpen}>
             <DialogTrigger asChild>
               <Button variant="outline">
                 <Upload className="mr-2 h-4 w-4" />
                 批量导入
               </Button>
             </DialogTrigger>
             <DialogContent className="sm:max-w-[600px]">
               <DialogHeader>
                 <DialogTitle>批量导入用户</DialogTitle>
                 <DialogDescription>
                   通过CSV文件批量创建用户账号
                 </DialogDescription>
               </DialogHeader>
               <div className="grid gap-4 py-4">
                 <div className="space-y-4">
                   <div className="flex items-center justify-between">
                     <Label>选择CSV文件</Label>
                     <Button variant="outline" size="sm" onClick={handleDownloadTemplate}>
                       <Download className="mr-2 h-4 w-4" />
                       下载模板
                     </Button>
                   </div>
                   <Input
                     type="file"
                     accept=".csv"
                     onChange={handleFileSelect}
                     className="cursor-pointer"
                   />
                   {importFile && (
                     <div className="text-sm text-muted-foreground">
                       已选择文件: {importFile.name}
                     </div>
                   )}
                 </div>
                 
                 <div className="flex items-center space-x-2">
                   <Checkbox 
                     id="generateInvitations"
                     checked={generateInvitations}
                     onCheckedChange={(checked) => setGenerateInvitations(!!checked)}
                   />
                   <Label htmlFor="generateInvitations">为新用户生成邀请信息</Label>
                 </div>
                 
                 {importResult && (
                   <div className="space-y-3 p-4 bg-muted rounded-lg">
                     <h4 className="font-medium">导入结果</h4>
                     <div className="grid grid-cols-2 gap-4 text-sm">
                       <div className="text-green-600">
                         成功: {importResult.success.length} 个用户
                       </div>
                       <div className="text-red-600">
                         失败: {importResult.failed.length} 个用户
                       </div>
                     </div>
                     
                     {importResult.failed.length > 0 && (
                       <div className="space-y-2">
                         <Label className="text-sm font-medium">失败详情:</Label>
                         <div className="max-h-32 overflow-y-auto space-y-1">
                           {importResult.failed.map((item, index) => (
                             <div key={index} className="text-xs text-red-600">
                               {item.user.email}: {item.error}
                             </div>
                           ))}
                         </div>
                       </div>
                     )}
                     
                     {importResult.invitations.length > 0 && (
                       <Button 
                         variant="outline" 
                         size="sm" 
                         onClick={handleDownloadInvitations}
                         className="w-full"
                       >
                         <Download className="mr-2 h-4 w-4" />
                         下载邀请信息 ({importResult.invitations.length}个)
                       </Button>
                     )}
                   </div>
                 )}
               </div>
               <div className="flex justify-end space-x-2">
                 <Button variant="outline" onClick={() => {
                   setIsBatchImportOpen(false);
                   setImportFile(null);
                   setImportResult(null);
                 }}>
                   {importResult ? '关闭' : '取消'}
                 </Button>
                 {!importResult && (
                   <Button onClick={handleBatchImport} disabled={isLoading || !importFile}>
                     {isLoading ? '导入中...' : '开始导入'}
                   </Button>
                 )}
               </div>
             </DialogContent>
           </Dialog>
          <Dialog open={isAddUserOpen} onOpenChange={setIsAddUserOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="mr-2 h-4 w-4" />
                添加用户
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>添加新用户</DialogTitle>
                <DialogDescription>
                  添加用户到系统白名单，用户将能够使用系统功能。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="email" className="text-right">
                    邮箱 *
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    placeholder="user@example.com"
                    className="col-span-3"
                    value={newUser.email}
                    onChange={(e) => setNewUser({...newUser, email: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="name" className="text-right">
                    姓名 *
                  </Label>
                  <Input
                    id="name"
                    placeholder="用户姓名"
                    className="col-span-3"
                    value={newUser.name}
                    onChange={(e) => setNewUser({...newUser, name: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="role" className="text-right">
                    角色
                  </Label>
                  <Select value={newUser.role} onValueChange={(value: 'student' | 'admin') => setNewUser({...newUser, role: value})}>
                    <SelectTrigger className="col-span-3">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="student">学员</SelectItem>
                      <SelectItem value="admin">管理员</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="department" className="text-right">
                    部门
                  </Label>
                  <Input
                    id="department"
                    placeholder="所属部门"
                    className="col-span-3"
                    value={newUser.department}
                    onChange={(e) => setNewUser({...newUser, department: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                  <Label htmlFor="notes" className="text-right">
                    备注
                  </Label>
                  <Textarea
                    id="notes"
                    placeholder="备注信息（可选）"
                    className="col-span-3"
                    value={newUser.notes}
                    onChange={(e) => setNewUser({...newUser, notes: e.target.value})}
                  />
                </div>
              </div>
              <div className="flex justify-end space-x-2">
                <Button variant="outline" onClick={() => setIsAddUserOpen(false)}>
                  取消
                </Button>
                <Button onClick={handleAddUser} disabled={isLoading}>
                  {isLoading ? '添加中...' : '添加用户'}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Tabs defaultValue="users" className="space-y-4">
        <TabsList>
          <TabsTrigger value="users">用户列表</TabsTrigger>
          <TabsTrigger value="roles">角色权限</TabsTrigger>
          <TabsTrigger value="sync">SSO同步</TabsTrigger>
        </TabsList>

        <TabsContent value="users" className="space-y-4">
          {/* 批量操作栏 */}
          {selectedUsers.length > 0 && (
            <Card className="bg-blue-50">
              <CardContent className="pt-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm">已选择 {selectedUsers.length} 个用户</span>
                  <div className="flex space-x-2">
                    <Button variant="outline" size="sm">批量修改角色</Button>
                    <Button variant="outline" size="sm">批量分配课程</Button>
                    <Button variant="outline" size="sm">批量启用/禁用</Button>
                    <Button variant="outline" size="sm">批量发送通知</Button>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          <Card>
            <CardHeader>
              <CardTitle>用户列表</CardTitle>
              <div className="flex items-center space-x-4">
                <div className="relative flex-1 max-w-sm">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                  <Input
                    placeholder="搜索姓名或工号..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={filterDepartment} onValueChange={setFilterDepartment}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="部门筛选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部部门</SelectItem>
                    <SelectItem value="技术部">技术部</SelectItem>
                    <SelectItem value="产品部">产品部</SelectItem>
                    <SelectItem value="运营部">运营部</SelectItem>
                  </SelectContent>
                </Select>
                <Select value={filterRole} onValueChange={setFilterRole}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="角色筛选" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">全部角色</SelectItem>
                    <SelectItem value="学员">学员</SelectItem>
                    <SelectItem value="课程管理员">课程管理员</SelectItem>
                    <SelectItem value="超级管理员">超级管理员</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-12">
                      <Checkbox 
                        checked={selectedUsers.length === filteredUsers.length}
                        onCheckedChange={handleSelectAll}
                      />
                    </TableHead>
                    <TableHead>姓名</TableHead>
                    <TableHead>工号</TableHead>
                    <TableHead>部门</TableHead>
                    <TableHead>角色</TableHead>
                    <TableHead>来源</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>最后登录</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredUsers.map((user) => (
                    <TableRow key={user.id}>
                      <TableCell>
                        <Checkbox 
                          checked={selectedUsers.includes(user.id)}
                          onCheckedChange={() => handleSelectUser(user.id)}
                        />
                      </TableCell>
                      <TableCell className="font-medium">{user.name}</TableCell>
                      <TableCell>{user.employeeId}</TableCell>
                      <TableCell>{user.department}</TableCell>
                      <TableCell>{user.role}</TableCell>
                      <TableCell>{getSourceBadge(user.source)}</TableCell>
                      <TableCell>{getStatusBadge(user.status)}</TableCell>
                      <TableCell>{user.lastLogin}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => handleUserDetailClick(user.id)}
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="roles">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>角色与权限管理</CardTitle>
                <Button>
                  <Plus className="mr-2 h-4 w-4" />
                  创建角色
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>角色名称</TableHead>
                    <TableHead>描述</TableHead>
                    <TableHead>用户数量</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockRoles.map((role) => (
                    <TableRow key={role.id}>
                      <TableCell className="font-medium">{role.name}</TableCell>
                      <TableCell>{role.description}</TableCell>
                      <TableCell>{role.userCount}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Shield className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="sync">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>SSO同步管理</CardTitle>
                <Button>
                  <RefreshCw className="mr-2 h-4 w-4" />
                  手动同步
                </Button>
              </div>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="grid grid-cols-3 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">2,345</div>
                      <p className="text-sm text-muted-foreground">飞书用户总数</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">2,340</div>
                      <p className="text-sm text-muted-foreground">已同步用户</p>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-2xl font-bold">5</div>
                      <p className="text-sm text-muted-foreground">同步失败</p>
                    </CardContent>
                  </Card>
                </div>
                <div className="text-sm text-muted-foreground">
                  <p>最后同步时间: 2024-01-25 14:30:00</p>
                  <p>同步状态: 正常</p>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* 用户学习详情对话框 */}
      <Dialog open={isUserDetailOpen} onOpenChange={setIsUserDetailOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>学员学习详情</DialogTitle>
            <DialogDescription>
              查看学员的详细学习进度和成就
            </DialogDescription>
          </DialogHeader>
          
          {selectedUserDetail && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="flex items-start space-x-6 p-4 bg-gray-50 rounded-lg">
                <div className="w-20 h-20 rounded-full overflow-hidden bg-gray-200">
                  <img 
                    src={selectedUserDetail.avatar} 
                    alt={selectedUserDetail.name}
                    className="w-full h-full object-cover"
                  />
                </div>
                <div className="flex-1">
                  <h3 className="text-xl font-bold">{selectedUserDetail.name}</h3>
                  <p className="text-muted-foreground">工号: {selectedUserDetail.employeeId}</p>
                  <p className="text-muted-foreground">部门: {selectedUserDetail.department}</p>
                  <p className="text-muted-foreground">入职时间: {selectedUserDetail.joinDate}</p>
                </div>
                <div className="text-right">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="text-center">
                      <div className="text-2xl font-bold text-blue-600">{selectedUserDetail.totalHours}</div>
                      <div className="text-sm text-muted-foreground">总学习时长(小时)</div>
                    </div>
                    <div className="text-center">
                      <div className="text-2xl font-bold text-green-600">{selectedUserDetail.completedCourses}</div>
                      <div className="text-sm text-muted-foreground">完成课程</div>
                    </div>
                  </div>
                </div>
              </div>

              {/* 学习统计卡片 */}
              <div className="grid grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <BookOpen className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-2xl font-bold">{selectedUserDetail.inProgressCourses}</div>
                        <p className="text-sm text-muted-foreground">进行中课程</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Award className="h-5 w-5 text-yellow-500" />
                      <div>
                        <div className="text-2xl font-bold">{selectedUserDetail.certificates}</div>
                        <p className="text-sm text-muted-foreground">获得证书</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Clock className="h-5 w-5 text-green-500" />
                      <div>
                        <div className="text-2xl font-bold">{selectedUserDetail.averageScore}</div>
                        <p className="text-sm text-muted-foreground">平均分数</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center space-x-2">
                      <Calendar className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="text-2xl font-bold">45</div>
                        <p className="text-sm text-muted-foreground">本周学习(小时)</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* 课程学习详情 */}
              <Card>
                <CardHeader>
                  <CardTitle>课程学习进度</CardTitle>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>课程名称</TableHead>
                        <TableHead>进度</TableHead>
                        <TableHead>学习时长</TableHead>
                        <TableHead>成绩</TableHead>
                        <TableHead>状态</TableHead>
                        <TableHead>完成时间</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {selectedUserDetail.coursesDetail.map((course) => (
                        <TableRow key={course.id}>
                          <TableCell className="font-medium">{course.name}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <Progress value={course.progress} className="w-20" />
                              <span className="text-sm">{course.progress}%</span>
                            </div>
                          </TableCell>
                          <TableCell>{course.hours}h</TableCell>
                          <TableCell>
                            {course.score ? (
                              <Badge variant={course.score >= 90 ? "default" : course.score >= 80 ? "secondary" : "outline"}>
                                {course.score}分
                              </Badge>
                            ) : (
                              <span className="text-muted-foreground">-</span>
                            )}
                          </TableCell>
                          <TableCell>
                            <Badge variant={course.status === "completed" ? "default" : "secondary"}>
                              {course.status === "completed" ? "已完成" : "进行中"}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            {course.completedAt || <span className="text-muted-foreground">-</span>}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </CardContent>
              </Card>

              {/* 学习活动 */}
              <Card>
                <CardHeader>
                  <CardTitle>近期学习活动</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {selectedUserDetail.weeklyActivity.map((activity, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                        <span className="font-medium">{activity.week}</span>
                        <div className="flex items-center space-x-2">
                          <div className="w-32 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${(activity.hours / 20) * 100}%` }}
                            />
                          </div>
                          <span className="text-sm font-medium">{activity.hours}h</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default UserManagement;