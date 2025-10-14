import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Search, Eye, CheckCircle, XCircle, Clock } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface StudentProgress {
  id: string;
  user_id: string;
  course_id: string;
  session_id: string;
  video_completed: boolean;
  assignments_completed: boolean;
  status: string;
  completion_percentage: number;
  completed_at: string | null;
  updated_at: string;
  courses?: {
    id: string;
    title: string;
    duration: string;
  };
  training_sessions?: {
    id: string;
    name: string;
  };
}

interface Student {
  id: number;
  name: string;
  email: string;
  profile_id?: string;
}

export default function StudentProgressManagement() {
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedStudent, setSelectedStudent] = useState<Student | null>(null);
  const [progressData, setProgressData] = useState<StudentProgress[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [showProgressDialog, setShowProgressDialog] = useState(false);

  // 加载学生列表
  useEffect(() => {
    loadStudents();
  }, []);

  const loadStudents = async () => {
    try {
      const { data, error } = await supabase
        .from('authorized_users')
        .select('id, name, email')
        .eq('role', 'student')
        .order('name');

      if (error) throw error;
      setStudents(data || []);
    } catch (error) {
      console.error('加载学生列表失败:', error);
      toast.error('加载学生列表失败');
    }
  };

  // 查看学生学习进度
  const viewStudentProgress = async (student: Student) => {
    setSelectedStudent(student);
    setIsLoading(true);
    setShowProgressDialog(true);

    try {
      // 首先获取学生的profile_id
      const { data: profiles } = await supabase
        .from('profiles')
        .select('id')
        .eq('email', student.email)
        .single();

      if (!profiles) {
        toast.error('该学生尚未登录过系统');
        setProgressData([]);
        setIsLoading(false);
        return;
      }

      // 使用profile_id获取学习进度
      const { data, error } = await supabase
        .from('user_course_completions')
        .select(`
          *,
          courses:course_id(id, title, duration),
          training_sessions:session_id(id, name)
        `)
        .eq('user_id', profiles.id)
        .order('updated_at', { ascending: false });

      if (error) throw error;
      setProgressData(data || []);
    } catch (error) {
      console.error('加载学习进度失败:', error);
      toast.error('加载学习进度失败');
      setProgressData([]);
    } finally {
      setIsLoading(false);
    }
  };

  // 过滤学生
  const filteredStudents = students.filter(
    s => s.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
         s.email.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // 计算进度统计
  const getProgressStats = (data: StudentProgress[]) => {
    const total = data.length;
    const completed = data.filter(p => p.status === 'completed').length;
    const videoCompleted = data.filter(p => p.video_completed).length;
    const assignmentsCompleted = data.filter(p => p.assignments_completed).length;

    return { total, completed, videoCompleted, assignmentsCompleted };
  };

  const stats = selectedStudent ? getProgressStats(progressData) : null;

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold">学员学习进度</h2>
      </div>

      {/* 搜索栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-2">
            <Search className="w-5 h-5 text-muted-foreground" />
            <Input
              placeholder="搜索学生姓名或邮箱..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="flex-1"
            />
          </div>
        </CardContent>
      </Card>

      {/* 学生列表 */}
      <Card>
        <CardHeader>
          <CardTitle>学生列表</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>姓名</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead className="text-right">操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredStudents.map((student) => (
                <TableRow key={student.id}>
                  <TableCell className="font-medium">{student.name}</TableCell>
                  <TableCell>{student.email}</TableCell>
                  <TableCell className="text-right">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => viewStudentProgress(student)}
                    >
                      <Eye className="w-4 h-4 mr-2" />
                      查看进度
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 学习进度详情对话框 */}
      <Dialog open={showProgressDialog} onOpenChange={setShowProgressDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              {selectedStudent?.name} 的学习进度
            </DialogTitle>
          </DialogHeader>

          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : (
            <div className="space-y-6">
              {/* 进度统计卡片 */}
              {stats && (
                <div className="grid grid-cols-4 gap-4">
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold">{stats.total}</div>
                        <div className="text-sm text-muted-foreground">总课程数</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-green-600">{stats.completed}</div>
                        <div className="text-sm text-muted-foreground">已完成</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-blue-600">{stats.videoCompleted}</div>
                        <div className="text-sm text-muted-foreground">视频已看</div>
                      </div>
                    </CardContent>
                  </Card>
                  <Card>
                    <CardContent className="pt-6">
                      <div className="text-center">
                        <div className="text-2xl font-bold text-purple-600">{stats.assignmentsCompleted}</div>
                        <div className="text-sm text-muted-foreground">作业已交</div>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              )}

              {/* 课程进度详情表格 */}
              <div>
                <h3 className="text-lg font-semibold mb-4">课程详情</h3>
                {progressData.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    该学生暂无学习记录
                  </div>
                ) : (
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>课程名称</TableHead>
                        <TableHead>所属期次</TableHead>
                        <TableHead>视频观看</TableHead>
                        <TableHead>作业提交</TableHead>
                        <TableHead>完成状态</TableHead>
                        <TableHead>完成进度</TableHead>
                        <TableHead>最后更新</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {progressData.map((progress) => (
                        <TableRow key={progress.id}>
                          <TableCell className="font-medium">
                            {progress.courses?.title || '未知课程'}
                          </TableCell>
                          <TableCell>
                            {progress.training_sessions?.name || '未知期次'}
                          </TableCell>
                          <TableCell>
                            {progress.video_completed ? (
                              <Badge className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                已完成
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="w-3 h-3 mr-1" />
                                未完成
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {progress.assignments_completed ? (
                              <Badge className="bg-green-500">
                                <CheckCircle className="w-3 h-3 mr-1" />
                                已提交
                              </Badge>
                            ) : (
                              <Badge variant="secondary">
                                <XCircle className="w-3 h-3 mr-1" />
                                未提交
                              </Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            {progress.status === 'completed' ? (
                              <Badge className="bg-green-500">已完成</Badge>
                            ) : progress.status === 'in_progress' ? (
                              <Badge className="bg-blue-500">进行中</Badge>
                            ) : (
                              <Badge variant="outline">未开始</Badge>
                            )}
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-2">
                              <div className="flex-1 bg-gray-200 rounded-full h-2">
                                <div
                                  className="bg-blue-600 h-2 rounded-full"
                                  style={{ width: `${progress.completion_percentage || 0}%` }}
                                />
                              </div>
                              <span className="text-sm">
                                {progress.completion_percentage || 0}%
                              </span>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">
                            {progress.updated_at
                              ? new Date(progress.updated_at).toLocaleDateString()
                              : '-'}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                )}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}

