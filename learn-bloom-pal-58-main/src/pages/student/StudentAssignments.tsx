import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  FileText,
  Calendar,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Filter,
  Upload,
  Eye
} from 'lucide-react';
import { ApiService } from '@/lib/api';
import { SubmissionDialog } from '@/components/SubmissionDialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { AssignmentService } from '@/lib/supabaseService';
import { useAuth } from '@/contexts/AuthContext';
import { toast } from 'sonner';

interface Assignment {
  id: string;
  title: string;
  description: string;
  course_id: string;
  due_date: string;
  status: string;
  max_score?: number;
  created_at: string;
  courses?: {
    title: string;
  };
  submissions_count?: number;
  instructions?: string;
}

interface Submission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string;
  file_url?: string;
  status: string;
  submitted_at: string;
  score?: number;
  feedback?: string;
}

export default function StudentAssignments() {
  const { user } = useAuth();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [submissions, setSubmissions] = useState<Record<string, Submission>>({});
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [submissionDialogOpen, setSubmissionDialogOpen] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const [confirmOpen, setConfirmOpen] = useState(false);
  
  // 当前学生ID（来自认证）
  const currentStudentId = user?.id || '';

  useEffect(() => {
    loadAssignments();
    // 回跳自动打点：?submitted=1&aid={assignmentId}
    const params = new URLSearchParams(window.location.search);
    const submitted = params.get('submitted');
    const aid = params.get('aid') || params.get('assignmentId');
    if (submitted === '1' && aid && currentStudentId) {
      ApiService.markAssignmentSubmitted(aid, currentStudentId, { content: 'feishu_form_submitted' })
        .then((ok) => {
          if (!ok) throw new Error('submit failed');
          toast.success('已记录提交');
          loadAssignments();
        })
        .catch(() => {
          toast.error('记录提交失败');
        })
        .finally(() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('submitted');
          url.searchParams.delete('aid');
          url.searchParams.delete('assignmentId');
          window.history.replaceState({}, '', url.toString());
        });
    }
  }, [currentStudentId]);

  const loadAssignments = async () => {
    try {
      console.log('StudentAssignments: 开始加载作业数据...');
      setLoading(true);
      const current = await ApiService.getCurrentSession();
      const allowedCourses = current ? (await ApiService.getSessionCourses(current.id)).map(c => c.id) : [];
      const data = await ApiService.getStudentAssignments();
      console.log('StudentAssignments: 获取到作业数据', data?.length || 0, '个作业');
      // 规范化 instructions（支持 JSON: { url, sessions } 或 直接字符串）并按期次与解锁课程过滤
      const normalized = (data || []).map((a: any) => {
        let url: string | undefined = undefined;
        let sessions: string[] | undefined = undefined;
        let sessionUrls: Array<{id: string; url: string}> | undefined = undefined;
        if (a.instructions) {
          try {
            const parsed = JSON.parse(a.instructions);
            if (parsed && typeof parsed === 'object') {
              if (typeof parsed.url === 'string') url = parsed.url;
              if (Array.isArray(parsed.sessions)) sessions = parsed.sessions as string[];
              if (Array.isArray(parsed.sessionUrls)) sessionUrls = parsed.sessionUrls as any;
            }
          } catch {
            // 非JSON，当作直链
            if (typeof a.instructions === 'string') url = a.instructions as string;
          }
        }
        return { ...a, instructions: url, __sessions: sessions, __sessionUrls: sessionUrls };
      });
      const filtered = normalized
        .filter((a: any) => !current || allowedCourses.includes(a.course_id))
        .filter((a: any) => {
          if (!current) return true;
          const s: string[] | undefined = a.__sessions;
          // 未指定 sessions 视为对所有期次可见；指定则需包含当前期次
          return !s || s.length === 0 || s.includes(current.id);
        });
      // 优先使用为当前期次配置的独立URL
      const finalList = filtered.map((a: any) => {
        if (!current) return a;
        const arr = a.__sessionUrls as Array<{id: string; url: string}> | undefined;
        const found = arr?.find(x => x.id === current.id && x.url);
        return found ? { ...a, instructions: found.url } : a;
      });
      setAssignments(finalList);
      
      // 加载学生的提交记录
      if (filtered && filtered.length > 0 && currentStudentId) {
        console.log('StudentAssignments: 开始加载提交记录...');
        const submissionPromises = filtered.map((assignment: any) => ApiService.getStudentSubmission(assignment.id, currentStudentId));
        const submissionResults = await Promise.all(submissionPromises);
        
        const submissionsMap: Record<string, Submission> = {};
        submissionResults.forEach((submission, index) => {
          if (submission) {
            submissionsMap[filtered[index].id] = submission;
          }
        });
        console.log('StudentAssignments: 获取到提交记录', Object.keys(submissionsMap).length, '个');
        setSubmissions(submissionsMap);
      }
    } catch (error) {
      console.error('StudentAssignments: 加载作业失败:', error);
      toast.error('加载作业失败');
    } finally {
      console.log('StudentAssignments: 作业数据加载完成');
      setLoading(false);
    }
  };

  const handleSubmitAssignment = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setSubmissionDialogOpen(true);
  };

  // 学员点击“我已提交”二次确认并打点
  const handleMarkSubmitted = (assignment: Assignment) => {
    setSelectedAssignment(assignment);
    setConfirmOpen(true);
  };

  const confirmMarkSubmitted = async () => {
    if (!selectedAssignment) return;
    try {
      // 仅记录一条提交（无附件），content 标记为 feishu 提交
      const ok = await ApiService.markAssignmentSubmitted(selectedAssignment.id, currentStudentId, { content: 'feishu_form_submitted' });
      if (ok) {
        toast.success('已记录提交');
        await loadAssignments();
      } else {
        toast.error('记录提交失败');
      }
    } catch (e) {
      console.error(e);
      toast.error('记录提交失败');
    } finally {
      setConfirmOpen(false);
      setSelectedAssignment(null);
    }
  };

  const handleSubmissionSuccess = () => {
    loadAssignments(); // 重新加载数据
  };

  const getAssignmentStatus = (assignment: Assignment) => {
    const submission = submissions[assignment.id];
    const isOverdue = new Date() > new Date(assignment.due_date);
    
    if (submission) {
      if (submission.status === 'graded') {
        return { status: 'graded', label: '已批改', color: 'bg-green-100 text-green-800' };
      }
      return { status: 'submitted', label: '已提交', color: 'bg-blue-100 text-blue-800' };
    }
    
    if (isOverdue) {
      return { status: 'overdue', label: '已逾期', color: 'bg-red-100 text-red-800' };
    }
    
    return { status: 'pending', label: '待提交', color: 'bg-yellow-100 text-yellow-800' };
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'graded':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'submitted':
        return <Clock className="w-4 h-4 text-blue-500" />;
      case 'overdue':
        return <AlertCircle className="w-4 h-4 text-red-500" />;
      default:
        return <FileText className="w-4 h-4 text-yellow-500" />;
    }
  };

  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.courses?.title.toLowerCase().includes(searchTerm.toLowerCase());
    
    if (statusFilter === 'all') return matchesSearch;
    
    const assignmentStatus = getAssignmentStatus(assignment);
    return matchesSearch && assignmentStatus.status === statusFilter;
  });

  const getTimeRemaining = (dueDate: string) => {
    const now = new Date();
    const due = new Date(dueDate);
    const diff = due.getTime() - now.getTime();
    
    if (diff < 0) return '已逾期';
    
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    const hours = Math.floor((diff % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60));
    
    if (days > 0) return `${days}天${hours}小时`;
    if (hours > 0) return `${hours}小时`;
    
    const minutes = Math.floor((diff % (1000 * 60 * 60)) / (1000 * 60));
    return `${minutes}分钟`;
  };

  if (loading) {
    return (
      <div className="container mx-auto p-6">
        <div className="flex items-center justify-center min-h-[360px]">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="space-y-6">
        {/* 页面标题 */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">我的作业</h1>
            <p className="text-muted-foreground mt-2">查看和提交课程作业</p>
          </div>
        </div>

        {/* 搜索和筛选 */}
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="搜索作业标题、描述或课程..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={statusFilter} onValueChange={setStatusFilter}>
            <SelectTrigger className="w-full sm:w-[180px]">
              <Filter className="w-4 h-4 mr-2" />
              <SelectValue placeholder="筛选状态" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">全部状态</SelectItem>
              <SelectItem value="pending">待提交</SelectItem>
              <SelectItem value="submitted">已提交</SelectItem>
              <SelectItem value="graded">已批改</SelectItem>
              <SelectItem value="overdue">已逾期</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {/* 作业列表 */}
        {filteredAssignments.length === 0 ? (
          <Card className="border-dashed">
            <CardContent className="flex flex-col items-center justify-center py-16">
              <FileText className="w-12 h-12 text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">暂无作业</h3>
              <p className="text-muted-foreground text-center">
                {searchTerm || statusFilter !== 'all' ? '没有找到符合条件的作业' : '还没有发布任何作业'}
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {filteredAssignments.map((assignment) => {
            const assignmentStatus = getAssignmentStatus(assignment);
            const submission = submissions[assignment.id];
            const timeRemaining = getTimeRemaining(assignment.due_date);
            const isOverdue = new Date() > new Date(assignment.due_date);

            return (
              <Card key={assignment.id} className="hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="space-y-2 flex-1">
                      <div className="flex items-center gap-2">
                        <CardTitle className="text-xl">{assignment.title}</CardTitle>
                        <Badge className={assignmentStatus.color}>
                          {assignmentStatus.label}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground">{assignment.description}</p>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-4 h-4" />
                          截止: {new Date(assignment.due_date).toLocaleString()}
                        </span>
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          {timeRemaining}
                        </span>
                        {assignment.courses && (
                          <span>课程: {assignment.courses.title}</span>
                        )}
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      {getStatusIcon(assignmentStatus.status)}
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent>
                  {/* 提交信息 */}
                  {submission && (
                    <div className="bg-muted/50 rounded-lg p-4 mb-4">
                      <div className="flex items-center justify-between mb-2">
                        <span className="font-medium">提交信息</span>
                        <span className="text-sm text-muted-foreground">
                          {new Date(submission.submitted_at).toLocaleString()}
                        </span>
                      </div>
                      {submission.score !== null && (
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-sm">得分:</span>
                          <Badge variant="outline">
                            已提交
                          </Badge>
                        </div>
                      )}
                      {submission.feedback && (
                        <div className="mt-2">
                          <span className="text-sm font-medium">教师反馈:</span>
                          <p className="text-sm text-muted-foreground mt-1 bg-background p-2 rounded">
                            {submission.feedback}
                          </p>
                        </div>
                      )}
                      {submission.file_url && (
                        <div className="mt-2">
                          <a 
                            href={submission.file_url} 
                            target="_blank" 
                            rel="noopener noreferrer"
                            className="text-sm text-primary hover:underline flex items-center gap-1"
                          >
                            <Eye className="w-3 h-3" />
                            查看附件
                          </a>
                        </div>
                      )}
                    </div>
                  )}
                  
                  {/* 操作按钮 */}
                  <div className="flex gap-2">
                    <Button
                      onClick={() => window.open(assignment.instructions || '#', '_blank')}
                      className="flex items-center gap-2"
                      disabled={!assignment.instructions}
                    >
                      <Upload className="w-4 h-4" />
                      完成作业
                    </Button>
                    {!submission && (
                      <Button
                        variant="outline"
                        onClick={() => handleMarkSubmitted(assignment)}
                        disabled={isOverdue}
                      >
                        我已提交
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            );
            })}
          </div>
        )}

        {/* 提交对话框 */}
        <SubmissionDialog
          open={submissionDialogOpen}
          onOpenChange={setSubmissionDialogOpen}
          assignment={selectedAssignment}
          studentId={currentStudentId}
          onSuccess={handleSubmissionSuccess}
        />

        {/* 我已提交二次确认 */}
        <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>确认已提交？</AlertDialogTitle>
              <AlertDialogDescription>
                请确保已在新窗口完成并提交飞书表单。确认后系统会记录一次提交。
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>再看看</AlertDialogCancel>
              <AlertDialogAction onClick={confirmMarkSubmitted}>确认提交</AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </div>
  );
}