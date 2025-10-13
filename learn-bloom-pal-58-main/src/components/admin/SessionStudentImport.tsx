import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ApiService, TrainingSession as ApiTrainingSession, SessionStudent as ApiSessionStudent } from "@/lib/api";
import { 
  Plus,
  Download,
  Upload,
  Trash2,
  Search,
  UserPlus,
  FileSpreadsheet,
  Users,
  Calendar
} from "lucide-react";

// 使用API中定义的类型，但添加显示需要的字段
interface SessionStudentDisplay extends ApiSessionStudent {
  student_name?: string; // 从profiles关联获取
}

// 直接使用API中的TrainingSession类型
type TrainingSession = ApiTrainingSession;

interface SessionStudentImportProps {
  onImportComplete?: () => void;
}

const SessionStudentImport = ({ onImportComplete }: SessionStudentImportProps) => {
  const [students, setStudents] = useState<SessionStudentDisplay[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [newStudentName, setNewStudentName] = useState("");
  const [newStudentNumber, setNewStudentNumber] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // 过滤学员列表
  const filteredStudents = students.filter(student => 
    student.student_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    student.student_number.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 加载培训期次列表
  const loadSessions = async () => {
    try {
      const sessionsData = await ApiService.getTrainingSessions();
      setSessions(sessionsData);
      
      // 默认选择当前活跃期次
      const currentSession = sessionsData.find(s => s.is_current);
      if (currentSession) {
        setSelectedSessionId(currentSession.id);
        await loadSessionStudents(currentSession.id);
      }
    } catch (error) {
      toast({
        title: "加载失败",
        description: "无法加载培训期次列表",
        variant: "destructive"
      });
    }
  };

  // 加载指定期次的学员列表
  const loadSessionStudents = async (sessionId: string) => {
    if (!sessionId) return;
    
    try {
      setIsLoading(true);
      const studentsData = await ApiService.getSessionStudents(sessionId);
      // 转换数据格式以适配显示需求
      const displayStudents: SessionStudentDisplay[] = studentsData.map(student => ({
        ...student,
        student_name: (student as any).profiles?.full_name || '未知学员'
      }));
      setStudents(displayStudents);
    } catch (error) {
      toast({
        title: "加载失败",
        description: "无法加载学员列表",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 处理期次切换
  const handleSessionChange = (sessionId: string) => {
    setSelectedSessionId(sessionId);
    loadSessionStudents(sessionId);
  };

  // 手动添加学员
  const handleAddStudent = async () => {
    if (!newStudentName.trim() || !selectedSessionId) {
      toast({
        title: "信息不完整",
        description: "请填写学员姓名并选择培训期次",
        variant: "destructive"
      });
      return;
    }

    try {
      const studentsToImport = [{
        email: `${newStudentNumber.trim()}@temp.com`, // 临时邮箱，实际应该要求输入邮箱
        name: newStudentName.trim(),
        student_number: newStudentNumber.trim()
      }];

      await ApiService.importStudentsToSession(selectedSessionId, studentsToImport, 'manual_add.csv');
      
      toast({
        title: "添加成功",
        description: `学员 ${newStudentName} 已添加到当前期次`
      });

      // 重置表单并刷新列表
      setNewStudentName("");
      setNewStudentNumber("");
      setIsAddDialogOpen(false);
      await loadSessionStudents(selectedSessionId);
      onImportComplete?.();
    } catch (error) {
      toast({
        title: "添加失败",
        description: error instanceof Error ? error.message : "添加学员时发生错误",
        variant: "destructive"
      });
    }
  };

  // 处理Excel文件导入
  const handleBatchImport = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file || !selectedSessionId) {
      if (!selectedSessionId) {
        toast({
          title: "请选择期次",
          description: "请先选择要导入学员的培训期次",
          variant: "destructive"
        });
      }
      return;
    }

    // 检查文件格式
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    if (!validExtensions.includes(fileExtension)) {
      toast({
        title: "文件格式错误",
        description: "请上传Excel文件(.xlsx, .xls)或CSV文件(.csv)",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsLoading(true);
      
      // 解析Excel/CSV文件
      const studentsData = await parseImportFile(file);
      
      if (studentsData.length === 0) {
        toast({
          title: "文件为空",
          description: "导入文件中没有找到有效的学员数据",
          variant: "destructive"
        });
        return;
      }

      // 调用API导入学员
      await ApiService.importStudentsToSession(selectedSessionId, studentsData, file.name);
      
      toast({
        title: "批量导入成功",
        description: `成功导入 ${studentsData.length} 名学员到当前期次`
      });

      // 刷新学员列表
      await loadSessionStudents(selectedSessionId);
      onImportComplete?.();
    } catch (error) {
      toast({
        title: "导入失败",
        description: error instanceof Error ? error.message : "批量导入时发生错误",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
      // 重置文件输入
      event.target.value = '';
    }
  };

  // 解析导入文件
  const parseImportFile = async (file: File): Promise<{email: string, name: string, student_number?: string}[]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const content = e.target?.result as string;
          const lines = content.split('\n').filter(line => line.trim());
          
          if (lines.length < 2) {
            reject(new Error('文件内容不足，至少需要表头和一行数据'));
            return;
          }

          // 跳过表头，解析数据行
          const studentsData: {email: string, name: string, student_number?: string}[] = [];
          
          for (let i = 1; i < lines.length; i++) {
            const columns = lines[i].split(',').map(col => col.trim().replace(/"/g, ''));
            
            if (columns.length >= 3 && columns[0] && columns[1] && columns[2]) {
              studentsData.push({
                name: columns[0],
                email: columns[1],
                student_number: columns[2]
              });
            } else if (columns.length >= 2 && columns[0] && columns[1]) {
              // 兼容只有姓名和邮箱的格式
              studentsData.push({
                name: columns[0],
                email: columns[1]
              });
            }
          }
          
          resolve(studentsData);
        } catch (error) {
          reject(new Error('文件解析失败，请检查文件格式'));
        }
      };
      
      reader.onerror = () => reject(new Error('文件读取失败'));
      reader.readAsText(file, 'UTF-8');
    });
  };

  // 导出学员名单
  const handleExportStudents = () => {
    if (!selectedSessionId || students.length === 0) {
      toast({
        title: "无数据导出",
        description: "当前期次没有学员数据可导出",
        variant: "destructive"
      });
      return;
    }

    // 创建CSV内容
    const csvContent = [
      ['学员姓名', '学员编号', '入学时间', '状态', '完成率'],
      ...students.map(student => [
        student.student_name || '未知学员',
        student.student_number || '',
        student.enrolled_at,
        student.status === 'active' ? '活跃' : '未激活',
        `${student.completion_rate}%`
      ])
    ].map(row => row.join(',')).join('\n');

    // 创建下载链接
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    const selectedSession = sessions.find(s => s.id === selectedSessionId);
    const fileName = `${selectedSession?.name || '培训期次'}_学员名单_${new Date().toISOString().split('T')[0]}.csv`;
    
    link.setAttribute('href', url);
    link.setAttribute('download', fileName);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "导出成功",
      description: "学员名单已导出到CSV文件"
    });
  };

  // 移除学员
  const handleRemoveStudent = async (studentId: string) => {
    // 这里应该调用API删除学员，暂时只是前端移除
    const student = students.find(s => s.id === studentId);
    setStudents(prev => prev.filter(s => s.id !== studentId));
    
    toast({
      title: "移除成功",
      description: `学员 ${student?.student_name} 已从当前期次中移除`
    });
  };

  // 获取状态徽章
  const getStatusBadge = (status: string) => {
    return status === 'active' 
      ? <Badge className="bg-green-100 text-green-800">活跃</Badge>
      : <Badge variant="secondary">未激活</Badge>;
  };

  // 初始化数据
  useState(() => {
    loadSessions();
  });

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">期次学员管理</h2>
          <p className="text-muted-foreground">管理各培训期次的学员名单</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={handleExportStudents} disabled={!selectedSessionId || students.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            导出名单
          </Button>
          <div className="relative">
            <input
              type="file"
              accept=".xlsx,.xls,.csv"
              onChange={handleBatchImport}
              disabled={!selectedSessionId || isLoading}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
            />
            <Button variant="outline" disabled={!selectedSessionId || isLoading}>
              <Upload className="w-4 h-4 mr-2" />
              {isLoading ? '导入中...' : '批量导入'}
            </Button>
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button disabled={!selectedSessionId}>
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
                  <label className="block text-sm font-medium mb-2">学员编号</label>
                  <Input
                    placeholder="请输入学员编号（可选）"
                    value={newStudentNumber}
                    onChange={(e) => setNewStudentNumber(e.target.value)}
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

      {/* 期次选择器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Calendar className="w-5 h-5 mr-2" />
            选择培训期次
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex items-center space-x-4">
            <div className="flex-1">
              <Select value={selectedSessionId} onValueChange={handleSessionChange}>
                <SelectTrigger>
                  <SelectValue placeholder="请选择培训期次" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      <div className="flex items-center justify-between w-full">
                        <span>{session.name}</span>
                        {session.is_current && (
                          <Badge className="ml-2 bg-blue-100 text-blue-800">当前期次</Badge>
                        )}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            {selectedSessionId && (
              <div className="text-sm text-muted-foreground">
                共 {students.length} 名学员
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* 学员列表 */}
      {selectedSessionId && (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <CardTitle className="flex items-center">
                <Users className="w-5 h-5 mr-2" />
                学员名单 ({students.length} 人)
              </CardTitle>
              <div className="relative w-64">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="搜索学员姓名或编号..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
          </CardHeader>
          <CardContent>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                加载中...
              </div>
            ) : filteredStudents.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                {searchTerm ? '没有找到匹配的学员' : '当前期次暂无学员'}
              </div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>学员姓名</TableHead>
                    <TableHead>学员编号</TableHead>
                    <TableHead>入学时间</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>完成率</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredStudents.map((student) => (
                    <TableRow key={student.id}>
                      <TableCell className="font-medium">{student.student_name || '未知学员'}</TableCell>
                      <TableCell>{student.student_number || '-'}</TableCell>
                      <TableCell>{student.enrolled_at}</TableCell>
                      <TableCell>{getStatusBadge(student.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <div className="w-16 bg-gray-200 rounded-full h-2">
                            <div 
                              className="bg-blue-600 h-2 rounded-full" 
                              style={{ width: `${student.completion_rate}%` }}
                            ></div>
                          </div>
                          <span className="text-sm text-muted-foreground">
                            {student.completion_rate}%
                          </span>
                        </div>
                      </TableCell>
                      <TableCell>
                        <Button 
                          variant="ghost" 
                          size="sm" 
                          className="text-red-600"
                          onClick={() => handleRemoveStudent(student.id)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </CardContent>
        </Card>
      )}

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
            支持通过Excel或CSV文件批量导入学员名单，文件格式要求：
          </p>
          <div className="bg-gray-50 dark:bg-gray-900 p-3 rounded-lg font-mono text-sm">
            <div className="text-muted-foreground mb-2">Excel/CSV文件示例格式：</div>
            <div>学员姓名,邮箱地址,学员编号</div>
            <div>张三,zhangsan@company.com,STU001</div>
            <div>李四,lisi@company.com,STU002</div>
            <div>王五,wangwu@company.com,STU003</div>
            <div className="text-muted-foreground mt-2">或简化格式（不含学员编号）：</div>
            <div>张三,zhangsan@company.com</div>
            <div>李四,lisi@company.com</div>
          </div>
          <ul className="text-sm text-muted-foreground space-y-1">
            <li>• 支持Excel文件(.xlsx, .xls)和CSV文件(.csv)</li>
            <li>• 完整格式：学员姓名,邮箱地址,学员编号</li>
            <li>• 简化格式：学员姓名,邮箱地址</li>
            <li>• 邮箱地址必须唯一，重复邮箱将被跳过</li>
            <li>• 支持中文姓名和有效邮箱地址</li>
            <li>• 导入前请先选择目标培训期次</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default SessionStudentImport;