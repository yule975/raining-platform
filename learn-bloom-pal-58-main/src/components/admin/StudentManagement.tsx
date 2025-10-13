import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { useToast } from "@/hooks/use-toast";
import { UserService } from "@/lib/supabaseService";
import { 
  Plus,
  Download,
  Upload,
  Trash2,
  Search,
  UserPlus,
  FileSpreadsheet,
  CheckCircle,
  XCircle,
  Clock,
  User
} from "lucide-react";

interface UserWithStatus {
  id: number;
  name: string;
  email: string;
  added_at: string;
  status: 'active' | 'inactive';
  hasAccount: boolean;
  lastSignIn: string | null;
  isActive: boolean;
  userId: string | null;
  emailConfirmed: boolean;
}

const StudentManagement = () => {
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [newStudentEmail, setNewStudentEmail] = useState("");
  const [newStudentName, setNewStudentName] = useState("");
  const [loading, setLoading] = useState(true);
  const [users, setUsers] = useState<UserWithStatus[]>([]);

  // 获取用户列表和状态信息
  const fetchUsers = async () => {
    try {
      setLoading(true);
      const usersWithStatus = await UserService.getUsersWithLoginStatus();
      setUsers(usersWithStatus);
    } catch (error) {
      console.error('获取用户列表失败:', error);
      toast({
        title: "获取用户列表失败",
        description: "请稍后重试",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const filteredUsers = users.filter(user => 
    user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    user.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleAddStudent = async () => {
    if (!newStudentEmail || !newStudentName) {
      toast({
        title: "添加失败",
        description: "请填写完整的学员信息",
        variant: "destructive"
      });
      return;
    }

    // 检查邮箱是否已存在
    if (users.some(user => user.email === newStudentEmail)) {
      toast({
        title: "添加失败", 
        description: "该邮箱已存在",
        variant: "destructive"
      });
      return;
    }

    try {
      const success = await UserService.addAuthorizedUser(newStudentEmail, newStudentName);
      
      if (success) {
        // 重新获取用户列表
        await fetchUsers();
        
        setNewStudentEmail("");
        setNewStudentName("");
        setIsAddDialogOpen(false);
        
        toast({
          title: "添加成功",
          description: `学员 ${newStudentName} 已添加到白名单`
        });
      } else {
        toast({
          title: "添加失败",
          description: "添加用户时发生错误，请稍后重试",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('添加用户失败:', error);
      toast({
        title: "添加失败",
        description: "添加用户时发生错误，请稍后重试",
        variant: "destructive"
      });
    }
  };

  const handleRemoveStudent = async (userId: number) => {
    const user = users.find(u => u.id === userId);
    
    try {
      const success = await UserService.removeAuthorizedUser(userId);
      
      if (success) {
        // 重新获取用户列表
        await fetchUsers();
        
        toast({
          title: "移除成功",
          description: `学员 ${user?.name} 已从白名单中移除`
        });
      } else {
        toast({
          title: "移除失败",
          description: "移除用户时发生错误，请稍后重试",
          variant: "destructive"
        });
      }
    } catch (error) {
      console.error('移除用户失败:', error);
      toast({
        title: "移除失败",
        description: "移除用户时发生错误，请稍后重试",
        variant: "destructive"
      });
    }
  };

  // 批量导入功能已移至专门的批量导入对话框中

  const handleExportStudents = () => {
    // 创建CSV内容
    const csvContent = [
      ['姓名', '邮箱', '添加时间', '状态', '已注册', '最后登录', '邮箱验证'],
      ...users.map(user => [
        user.name,
        user.email, 
        user.added_at,
        user.status === 'active' ? '活跃' : '未激活',
        user.hasAccount ? '是' : '否',
        user.lastSignIn ? new Date(user.lastSignIn).toLocaleString('zh-CN') : '从未登录',
        user.emailConfirmed ? '已验证' : '未验证'
      ])
    ].map(row => row.join(',')).join('\n');

    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `学员名单_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "导出成功",
      description: "学员名单已导出到CSV文件"
    });
  };

  const getStatusBadge = (user: UserWithStatus) => {
    if (!user.hasAccount) {
      return <Badge variant="outline" className="text-gray-600">未注册</Badge>;
    }
    
    if (user.status === 'inactive') {
      return <Badge variant="secondary">已禁用</Badge>;
    }
    
    if (!user.emailConfirmed) {
      return <Badge variant="outline" className="text-yellow-600">待验证</Badge>;
    }
    
    return <Badge className="bg-green-100 text-green-800">正常</Badge>;
  };

  const getAccountStatusIcon = (user: UserWithStatus) => {
    if (!user.hasAccount) {
      return <XCircle className="h-4 w-4 text-gray-400" />;
    }
    
    if (!user.emailConfirmed) {
      return <Clock className="h-4 w-4 text-yellow-500" />;
    }
    
    return <CheckCircle className="h-4 w-4 text-green-500" />;
  };

  const formatLastSignIn = (lastSignIn: string | null) => {
    if (!lastSignIn) return '从未登录';
    
    const date = new Date(lastSignIn);
    const now = new Date();
    const diffInHours = Math.floor((now.getTime() - date.getTime()) / (1000 * 60 * 60));
    
    if (diffInHours < 24) {
      return `${diffInHours}小时前`;
    } else if (diffInHours < 24 * 7) {
      return `${Math.floor(diffInHours / 24)}天前`;
    } else {
      return date.toLocaleDateString('zh-CN');
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">学员名单管理</h2>
          <p className="text-muted-foreground">管理有权访问平台的学员白名单</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportStudents}>
            <Download className="w-4 h-4 mr-2" />
            导出名单
          </Button>
          <Button variant="outline" onClick={() => {/* TODO: 实现批量导入对话框 */}}>
            <Upload className="w-4 h-4 mr-2" />
            批量导入
          </Button>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <UserPlus className="w-4 h-4 mr-2" />
                添加学员
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加新学员</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-2">学员姓名 *</label>
                  <Input
                    placeholder="请输入学员姓名"
                    value={newStudentName}
                    onChange={(e) => setNewStudentName(e.target.value)}
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">邮箱地址 *</label>
                  <Input
                    type="email"
                    placeholder="请输入学员邮箱"
                    value={newStudentEmail}
                    onChange={(e) => setNewStudentEmail(e.target.value)}
                  />
                </div>
                <div className="flex justify-end space-x-2 pt-4">
                  <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                    取消
                  </Button>
                  <Button onClick={handleAddStudent}>
                    添加学员
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>学员白名单 ({users.length} 人)</CardTitle>
            <div className="relative w-64">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
              <Input
                placeholder="搜索学员姓名或邮箱..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>邮箱地址</TableHead>
                <TableHead>添加时间</TableHead>
                <TableHead>账号状态</TableHead>
                <TableHead>最后登录</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8">
                    <div className="flex items-center justify-center space-x-2">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      <span>加载中...</span>
                    </div>
                  </TableCell>
                </TableRow>
              ) : filteredUsers.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-muted-foreground">
                    {searchTerm ? '未找到匹配的用户' : '暂无用户数据'}
                  </TableCell>
                </TableRow>
              ) : (
                filteredUsers.map((user) => (
                  <TableRow key={user.id}>
                    <TableCell className="font-medium">{user.name}</TableCell>
                    <TableCell>{user.email}</TableCell>
                    <TableCell>{new Date(user.added_at).toLocaleDateString('zh-CN')}</TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getAccountStatusIcon(user)}
                        <span className="text-sm">
                          {user.hasAccount ? (user.emailConfirmed ? '已验证' : '待验证') : '未注册'}
                        </span>
                      </div>
                    </TableCell>
                    <TableCell className="text-sm text-muted-foreground">
                      {formatLastSignIn(user.lastSignIn)}
                    </TableCell>
                    <TableCell>{getStatusBadge(user)}</TableCell>
                    <TableCell>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="text-red-600"
                        onClick={() => handleRemoveStudent(user.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 批量导入说明 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <FileSpreadsheet className="w-5 h-5 mr-2" />
            批量导入说明
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <p className="text-sm text-muted-foreground">
            支持通过CSV文件批量导入学员名单，CSV文件格式要求：
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg font-mono text-sm">
            <div className="text-muted-foreground mb-2">CSV文件示例格式：</div>
            <div>姓名,邮箱</div>
            <div>张三,zhangsan@company.com</div>
            <div>李四,lisi@company.com</div>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 文件必须是CSV格式（.csv后缀）</li>
            <li>• 第一行为表头：姓名,邮箱</li>
            <li>• 邮箱地址必须唯一，重复邮箱将被跳过</li>
            <li>• 支持中文姓名和邮箱地址</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default StudentManagement;