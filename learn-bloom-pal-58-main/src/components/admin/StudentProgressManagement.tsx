import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
import { Search, Eye, CheckCircle, XCircle, Users, Video, FileCheck, Award } from 'lucide-react';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface Course {
  id: string;
  title: string;
  duration: string;
}

interface TrainingSession {
  id: string;
  name: string;
  is_current: boolean;
}

interface StudentProgress {
  user_id: string;
  video_completed: boolean;
  assignments_completed: boolean;
  status: string;
  student_name?: string;
  student_email?: string;
}

interface CourseProgressSummary {
  course: Course;
  totalStudents: number;
  videoWatchedCount: number;
  videoNotWatchedCount: number;
  assignmentSubmittedCount: number;
  assignmentNotSubmittedCount: number;
  completedCount: number;
  videoWatchedStudents: { name: string; email: string }[];
  videoNotWatchedStudents: { name: string; email: string }[];
  assignmentSubmittedStudents: { name: string; email: string }[];
  assignmentNotSubmittedStudents: { name: string; email: string }[];
  completedStudents: { name: string; email: string }[];
}

export default function StudentProgressManagement() {
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [courseProgressList, setCourseProgressList] = useState<CourseProgressSummary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [selectedCourseProgress, setSelectedCourseProgress] = useState<CourseProgressSummary | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [detailType, setDetailType] = useState<'video_watched' | 'video_not_watched' | 'assignment_submitted' | 'assignment_not_submitted' | 'completed'>('video_watched');

  // 加载期次列表
  useEffect(() => {
    loadSessions();
  }, []);

  // 当选择期次时加载课程进度
  useEffect(() => {
    if (selectedSessionId) {
      loadCourseProgress();
    }
  }, [selectedSessionId]);

  const loadSessions = async () => {
    try {
      const { data, error } = await supabase
        .from('training_sessions')
        .select('id, name, is_current')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSessions(data || []);
      
      // 默认选择当前期次
      const currentSession = data?.find(s => s.is_current);
      if (currentSession) {
        setSelectedSessionId(currentSession.id);
      } else if (data && data.length > 0) {
        setSelectedSessionId(data[0].id);
      }
    } catch (error) {
      console.error('加载期次列表失败:', error);
      toast.error('加载期次列表失败');
    }
  };

  const loadCourseProgress = async () => {
    if (!selectedSessionId) return;
    
    setIsLoading(true);
    try {
      console.log('开始加载课程进度，期次ID:', selectedSessionId);
      
      // 1. 获取该期次的所有课程
      const { data: sessionCourses, error: coursesError } = await supabase
        .from('session_courses')
        .select('course_id, courses:course_id(id, title, duration)')
        .eq('session_id', selectedSessionId)
        .eq('is_active', true);

      console.log('课程查询结果:', { sessionCourses, coursesError });
      if (coursesError) throw coursesError;

      // 2. 获取该期次的所有学生
      const { data: sessionStudents, error: studentsError } = await supabase
        .from('session_students')
        .select(`
          user_id,
          profiles:user_id(id, email, full_name)
        `)
        .eq('session_id', selectedSessionId);

      console.log('学生查询结果:', { sessionStudents, studentsError });
      if (studentsError) throw studentsError;

      // 3. 获取所有学生的授权信息（从authorized_users表）
      const studentEmails = (sessionStudents || [])
        .map(s => s.profiles?.email)
        .filter(Boolean);

      console.log('学生邮箱列表:', studentEmails);

      const { data: authorizedUsers, error: authError } = await supabase
        .from('authorized_users')
        .select('email, name')
        .in('email', studentEmails);

      console.log('授权用户查询结果:', { authorizedUsers, authError });

      // 创建email到name的映射
      const emailToNameMap = new Map(
        (authorizedUsers || []).map(u => [u.email, u.name])
      );

      // 4. 获取所有学习进度记录
      const { data: progressRecords, error: progressError } = await supabase
        .from('user_course_completions')
        .select('*')
        .eq('session_id', selectedSessionId);

      if (progressError) throw progressError;

      // 5. 处理数据，按课程汇总
      const summaries: CourseProgressSummary[] = (sessionCourses || []).map((sc: any) => {
        const course = sc.courses;
        const totalStudents = sessionStudents?.length || 0;
        
        // 为每个课程找出学习进度
        const courseProgress = (progressRecords || []).filter(p => p.course_id === course.id);
        
        // 统计各项数据
        const videoWatched: { name: string; email: string }[] = [];
        const videoNotWatched: { name: string; email: string }[] = [];
        const assignmentSubmitted: { name: string; email: string }[] = [];
        const assignmentNotSubmitted: { name: string; email: string }[] = [];
        const completed: { name: string; email: string }[] = [];

        (sessionStudents || []).forEach((student: any) => {
          const progress = courseProgress.find(p => p.user_id === student.user_id);
          const email = student.profiles?.email || '';
          const studentInfo = {
            name: emailToNameMap.get(email) || student.profiles?.full_name || email.split('@')[0] || '未知',
            email: email
          };

          if (progress?.video_completed) {
            videoWatched.push(studentInfo);
          } else {
            videoNotWatched.push(studentInfo);
          }

          if (progress?.assignments_completed) {
            assignmentSubmitted.push(studentInfo);
          } else {
            assignmentNotSubmitted.push(studentInfo);
          }

          if (progress?.status === 'completed') {
            completed.push(studentInfo);
          }
        });

        return {
          course,
          totalStudents,
          videoWatchedCount: videoWatched.length,
          videoNotWatchedCount: videoNotWatched.length,
          assignmentSubmittedCount: assignmentSubmitted.length,
          assignmentNotSubmittedCount: assignmentNotSubmitted.length,
          completedCount: completed.length,
          videoWatchedStudents: videoWatched,
          videoNotWatchedStudents: videoNotWatched,
          assignmentSubmittedStudents: assignmentSubmitted,
          assignmentNotSubmittedStudents: assignmentNotSubmitted,
          completedStudents: completed
        };
      });

      setCourseProgressList(summaries);
    } catch (error) {
      console.error('加载课程进度失败:', error);
      toast.error('加载课程进度失败');
    } finally {
      setIsLoading(false);
    }
  };

  // 显示详情对话框
  const showDetail = (courseProgress: CourseProgressSummary, type: typeof detailType) => {
    setSelectedCourseProgress(courseProgress);
    setDetailType(type);
    setShowDetailDialog(true);
  };

  // 获取当前要显示的学生列表
  const getDetailStudents = () => {
    if (!selectedCourseProgress) return [];
    
    switch (detailType) {
      case 'video_watched':
        return selectedCourseProgress.videoWatchedStudents;
      case 'video_not_watched':
        return selectedCourseProgress.videoNotWatchedStudents;
      case 'assignment_submitted':
        return selectedCourseProgress.assignmentSubmittedStudents;
      case 'assignment_not_submitted':
        return selectedCourseProgress.assignmentNotSubmittedStudents;
      case 'completed':
        return selectedCourseProgress.completedStudents;
      default:
        return [];
    }
  };

  const getDetailTitle = () => {
    const typeLabels = {
      video_watched: '已看视频',
      video_not_watched: '未看视频',
      assignment_submitted: '已交作业',
      assignment_not_submitted: '未交作业',
      completed: '已完成学习'
    };
    return `${selectedCourseProgress?.course.title} - ${typeLabels[detailType]}`;
  };

  // 过滤课程
  const filteredCourses = courseProgressList.filter(
    cp => cp.course.title.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6">
      {/* 标题 */}
      <div className="flex justify-between items-center">
        <h2 className="text-3xl font-bold">学习进度</h2>
      </div>

      {/* 筛选栏 */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center space-x-4">
            <div className="flex-1 flex items-center space-x-2">
              <Search className="w-5 h-5 text-muted-foreground" />
              <Input
                placeholder="搜索课程名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="flex-1"
              />
            </div>
            <div className="w-64">
              <Select value={selectedSessionId} onValueChange={setSelectedSessionId}>
                <SelectTrigger>
                  <SelectValue placeholder="选择期次" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name} {session.is_current ? '(当前)' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 课程进度列表 */}
      <Card>
        <CardHeader>
          <CardTitle>课程学习进度统计</CardTitle>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="text-center py-8">加载中...</div>
          ) : filteredCourses.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              {searchTerm ? '没有找到匹配的课程' : '该期次暂无课程'}
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>课程名称</TableHead>
                  <TableHead className="text-center">总学员数</TableHead>
                  <TableHead className="text-center">已看视频</TableHead>
                  <TableHead className="text-center">未看视频</TableHead>
                  <TableHead className="text-center">已交作业</TableHead>
                  <TableHead className="text-center">未交作业</TableHead>
                  <TableHead className="text-center">已完成学习</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredCourses.map((courseProgress) => (
                  <TableRow key={courseProgress.course.id}>
                    <TableCell className="font-medium">
                      {courseProgress.course.title}
                    </TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">
                        <Users className="w-3 h-3 mr-1" />
                        {courseProgress.totalStudents}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showDetail(courseProgress, 'video_watched')}
                        className="text-green-600 hover:text-green-700"
                      >
                        <Video className="w-4 h-4 mr-1" />
                        {courseProgress.videoWatchedCount}
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showDetail(courseProgress, 'video_not_watched')}
                        className="text-orange-600 hover:text-orange-700"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        {courseProgress.videoNotWatchedCount}
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showDetail(courseProgress, 'assignment_submitted')}
                        className="text-blue-600 hover:text-blue-700"
                      >
                        <FileCheck className="w-4 h-4 mr-1" />
                        {courseProgress.assignmentSubmittedCount}
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showDetail(courseProgress, 'assignment_not_submitted')}
                        className="text-red-600 hover:text-red-700"
                      >
                        <XCircle className="w-4 h-4 mr-1" />
                        {courseProgress.assignmentNotSubmittedCount}
                      </Button>
                    </TableCell>
                    <TableCell className="text-center">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => showDetail(courseProgress, 'completed')}
                        className="text-purple-600 hover:text-purple-700"
                      >
                        <Award className="w-4 h-4 mr-1" />
                        {courseProgress.completedCount}
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 详情对话框 */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{getDetailTitle()}</DialogTitle>
          </DialogHeader>
          <div className="mt-4">
            {getDetailStudents().length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">暂无学员</div>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>姓名</TableHead>
                    <TableHead>邮箱</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {getDetailStudents().map((student, index) => (
                    <TableRow key={index}>
                      <TableCell className="font-medium">{student.name}</TableCell>
                      <TableCell>{student.email}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

