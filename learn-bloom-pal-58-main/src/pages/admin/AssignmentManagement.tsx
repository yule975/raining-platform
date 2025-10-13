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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import {
  FileText,
  Plus,
  Search,
  Filter,
  Calendar,
  Users,
  Eye,
  Edit,
  Trash2,
  Clock,
  TrendingUp,
  Loader2,
  RefreshCw,
} from 'lucide-react';
import { AssignmentService } from '@/lib/supabaseService';
import { ApiService, TrainingSession } from '@/lib/api';
import { AssignmentDialog } from '@/components/AssignmentDialog';
import { toast } from 'sonner';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';

// 定义Assignment接口
interface Assignment {
  id: string;
  title: string;
  description: string;
  course_id: string;
  due_date: string;
  status: string;
  created_at: string;
  updated_at: string;
  course?: {
    title: string;
  };
  submissions_count?: number;
  coverage_count?: number;
}

export default function AssignmentManagement() {
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [assignmentStats, setAssignmentStats] = useState({
    totalAssignments: 0,
    totalSubmissions: 0,
    completedSubmissions: 0,
    completionRate: 0,
    pendingAudit: 0
  });
  const [statusFilter, setStatusFilter] = useState('all');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingAssignment, setEditingAssignment] = useState<Assignment | null>(null);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [deletingAssignment, setDeletingAssignment] = useState<Assignment | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [sessionId, setSessionId] = useState<string>('');
  // —— from-template dialog state ——
  const [publishOpen, setPublishOpen] = useState(false);
  const [templates, setTemplates] = useState<any[]>([]);
  const [templateId, setTemplateId] = useState<string>('');
  const [publishSessionIds, setPublishSessionIds] = useState<string[]>([]);
  const [publishDueDate, setPublishDueDate] = useState<string>('');
  const [publishUrl, setPublishUrl] = useState<string>('');
  const [perSessionUrls, setPerSessionUrls] = useState<Record<string, string>>({});
  const [coursesForPublish, setCoursesForPublish] = useState<any[]>([]);
  const [publishCourseId, setPublishCourseId] = useState<string>('');
  // quick template create
  const [tplTitle, setTplTitle] = useState('');
  const [tplDesc, setTplDesc] = useState('');
  const [tplUrl, setTplUrl] = useState('');
  const [tplDueDays, setTplDueDays] = useState<string>('');

  // —— view submissions dialog state ——
  const [viewOpen, setViewOpen] = useState(false);
  const [viewAssignment, setViewAssignment] = useState<Assignment | null>(null);
  const [viewLoading, setViewLoading] = useState(false);
  const [viewError, setViewError] = useState<string | null>(null);
  const [submissions, setSubmissions] = useState<any[]>([]);
  const [viewSearch, setViewSearch] = useState('');
  const [viewStatus, setViewStatus] = useState<'all' | 'submitted' | 'graded'>('all');

  // 加载数据
  useEffect(() => {
    const init = async () => {
      const list = await ApiService.getTrainingSessions();
      setSessions(list);
      const current = list.find(s => s.is_current && s.status === 'active');
      setSessionId(current?.id || '');
      await loadData(current?.id || undefined);
    };
    init();
  }, []);

  const loadData = async (retryCount = 0, sId?: string) => {
    try {
      setLoading(true);
      
      // 添加超时控制
      const timeout = new Promise((_, reject) => 
        setTimeout(() => reject(new Error('请求超时')), 10000)
      );
      
      const [assignmentsData, statsData] = await Promise.race([
        Promise.all([
          AssignmentService.getAssignments(sId || sessionId || undefined),
          AssignmentService.getAssignmentStats(sId || sessionId || undefined)
        ]),
        timeout
      ]);
      
      setAssignments(assignmentsData);
      setAssignmentStats(statsData);
      
      // 成功后显示提示
      if (retryCount > 0) {
        toast.success('数据加载成功');
      }
    } catch (err) {
      console.error('加载数据失败:', err);
      
      // 重试机制
      if (retryCount < 2) {
        toast.error(`加载失败，正在重试... (${retryCount + 1}/3)`);
        setTimeout(() => loadData(retryCount + 1), 1000);
        return;
      }
      
      // 最终失败处理
      const errorMessage = err instanceof Error ? err.message : '数据加载失败，请检查网络连接';
      toast.error(errorMessage);
      setError(errorMessage);
      setAssignments([]);
      setAssignmentStats({
        totalAssignments: 0,
        totalSubmissions: 0,
        completedSubmissions: 0,
        completionRate: 0,
        pendingReview: 0,
        averageScore: 0
      });
    } finally {
      setLoading(false);
    }
  };

  // 过滤作业
  const filteredAssignments = assignments.filter(assignment => {
    const matchesSearch = assignment.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         assignment.description.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || assignment.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  // CRUD 操作函数
  const handleCreateAssignment = () => {
    setEditingAssignment(null);
    setDialogOpen(true);
  };

  const handleEditAssignment = (assignment: Assignment) => {
    setEditingAssignment(assignment);
    setDialogOpen(true);
  };

  const handleDeleteAssignment = (assignment: Assignment) => {
    setDeletingAssignment(assignment);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteAssignment = async () => {
    if (!deletingAssignment) return;
    
    try {
      await AssignmentService.deleteAssignment(deletingAssignment.id);
      toast.success('作业删除成功');
      loadData(); // 重新加载数据
    } catch (error) {
      console.error('删除作业失败:', error);
      toast.error('删除作业失败');
    } finally {
      setDeleteDialogOpen(false);
      setDeletingAssignment(null);
    }
  };

  const handleDialogSuccess = () => {
    loadData(); // 重新加载数据
  };

  // 打开“查看提交明细”
  const openViewDialog = async (assignment: Assignment) => {
    try {
      setViewAssignment(assignment);
      setViewOpen(true);
      setViewLoading(true);
      setViewError(null);
      const list = await ApiService.getSubmissions(assignment.id);
      setSubmissions(list || []);
    } catch (e: any) {
      setViewError(e?.message || '加载提交数据失败');
      setSubmissions([]);
    } finally {
      setViewLoading(false);
    }
  };

  // 导出 CSV
  const exportCsv = () => {
    try {
      const header = ['id','student_id','student_name','student_email','submitted_at','content','file_url','status'];
      const rows = submissions
        .filter((s) => {
          const kw = viewSearch.trim().toLowerCase();
          const status = s.status || (s.score != null ? 'graded' : 'submitted');
          if (viewStatus !== 'all' && status !== viewStatus) return false;
          if (!kw) return true;
          return (
            String(s.student_id).toLowerCase().includes(kw) ||
            String(s.content || '').toLowerCase().includes(kw)
          );
        })
        .map((s) => [
          s.id,
          s.student_id,
          s.profiles?.full_name || '',
          s.profiles?.email || '',
          s.submitted_at || '',
          (s.content || '').replace(/\n/g,' ').replace(/,/g,'，'),
          s.file_url || '',
          s.status || (s.score != null ? 'graded' : 'submitted')
        ]);
      const csv = [header, ...rows].map(r => r.join(',')).join('\n');
      const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `submissions_${viewAssignment?.id || 'assignment'}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch {}
  };

  const handleRefresh = () => {
    setError(null);
    loadData(0, sessionId || undefined);
  };

  // 打开“从模板发布”
  const openPublishDialog = async () => {
    try {
      setPublishSessionIds(sessionId ? [sessionId] : []);
      const allCourses = await ApiService.getCourses();
      setCoursesForPublish(allCourses);
      const defaultCourseId = assignments[0]?.course_id || allCourses[0]?.id || '';
      setPublishCourseId(defaultCourseId);
      const list = defaultCourseId ? await ApiService.getAssignmentTemplates(defaultCourseId) : [];
      setTemplates(list);
      setTemplateId('');
      setPublishDueDate('');
      setPublishUrl('');
      setTplTitle('');
      setTplDesc('');
      setTplUrl('');
      setTplDueDays('');
      setPerSessionUrls({});
      setPublishOpen(true);
    } catch (e) {
      toast.error('加载模板失败');
    }
  };

  const toggleSessionForPublish = (id: string, checked: boolean) => {
    setPublishSessionIds(prev => checked ? Array.from(new Set([...prev, id])) : prev.filter(s => s !== id));
  };

  const confirmPublish = async () => {
    if (!templateId || publishSessionIds.length === 0) {
      toast.error('请选择模板和期次');
      return;
    }
    const sessionUrls = publishSessionIds
      .map(id => ({ id, url: perSessionUrls[id] }))
      .filter(x => x.url && x.url.trim() !== '');
    const ok = await ApiService.publishTemplate(templateId, {
      sessionIds: publishSessionIds,
      dueDate: publishDueDate || undefined,
      formUrl: publishUrl || undefined,
      sessionUrls: sessionUrls.length ? sessionUrls : undefined,
    });
    if (ok) {
      toast.success('已从模板发布作业');
      setPublishOpen(false);
      loadData(0, sessionId || undefined);
    } else {
      toast.error('发布失败');
    }
  };

  useEffect(() => {
    (async () => {
      if (!publishOpen) return;
      if (!publishCourseId) { setTemplates([]); return; }
      const list = await ApiService.getAssignmentTemplates(publishCourseId);
      setTemplates(list);
      setTemplateId('');
    })();
  }, [publishCourseId, publishOpen]);

  const createTemplateQuickly = async () => {
    try {
      if (!publishCourseId || !tplTitle.trim()) {
        toast.error('请填写模板标题并选择课程');
        return;
      }
      const created = await ApiService.createAssignmentTemplate(publishCourseId, {
        title: tplTitle.trim(),
        description: tplDesc,
        formUrl: tplUrl,
        dueDaysOffset: tplDueDays ? parseInt(tplDueDays) : undefined,
      });
      if (created) {
        toast.success('模板已创建');
        const list = await ApiService.getAssignmentTemplates(publishCourseId);
        setTemplates(list);
        setTemplateId(created.id);
        setTplTitle(''); setTplDesc(''); setTplUrl(''); setTplDueDays('');
      } else {
        toast.error('创建模板失败');
      }
    } catch (e) {
      toast.error('创建模板失败');
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-3xl font-bold text-foreground">作业管理</h1>
          <p className="text-muted-foreground mt-2">管理和监控学生作业提交情况</p>
          {error && (
            <div className="mt-2 p-2 bg-red-50 border border-red-200 rounded-md">
              <p className="text-sm text-red-600">{error}</p>
              <Button 
                variant="outline" 
                size="sm" 
                className="mt-1 text-red-600 border-red-200 hover:bg-red-50"
                onClick={handleRefresh}
              >
                <RefreshCw className="w-3 h-3 mr-1" />
                重试
              </Button>
            </div>
          )}
        </div>
        <div className="flex gap-2">
          <div className="min-w-[220px]">
            <Select value={sessionId} onValueChange={(v) => { setSessionId(v); loadData(0, v); }}>
              <SelectTrigger>
                <SelectValue placeholder="选择期次" />
              </SelectTrigger>
              <SelectContent>
                {sessions.map(s => (
                  <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <Button 
            variant="outline" 
            onClick={handleRefresh}
            disabled={loading}
          >
            <RefreshCw className={`mr-2 h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            刷新
          </Button>
          <Button className="btn-primary-gradient" onClick={handleCreateAssignment}>
            <Plus className="mr-2 h-4 w-4" />
            创建新作业
          </Button>
          <Button onClick={openPublishDialog}>从模板发布</Button>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card className="stat-card cursor-pointer group hover:scale-[1.02] transition-all duration-300">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">作业提交率</CardTitle>
            <div className="icon-enhanced group-hover:scale-110 transition-transform">
              {loading ? (
                <Loader2 className="h-5 w-5 text-primary animate-spin" />
              ) : (
                <FileText className="h-5 w-5 text-primary" />
              )}
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="stat-value">
              {loading ? '--' : `${assignmentStats.completionRate}%`}
            </div>
            <p className="stat-label">
              {loading ? '加载中...' : `${assignmentStats.completedSubmissions}/${assignmentStats.totalSubmissions} • 点击查看详情`}
            </p>
          </CardContent>
        </Card>

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">待审核作业（最新）</CardTitle>
            <div className="icon-enhanced">
              {loading ? (
                <Loader2 className="h-5 w-5 text-orange-500 animate-spin" />
              ) : (
                <Clock className="h-5 w-5 text-orange-500" />
              )}
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="stat-value text-orange-600">
              {loading ? '--' : assignmentStats.pendingAudit}
            </div>
            <p className="stat-label">
              {loading ? '加载中...' : '最新发布的作业中待审核提交'}
            </p>
          </CardContent>
        </Card>

        {/* 去掉平均分数卡片 */}

        <Card className="stat-card">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">总作业数</CardTitle>
            <div className="icon-enhanced">
              {loading ? (
                <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />
              ) : (
                <Users className="h-5 w-5 text-blue-500" />
              )}
            </div>
          </CardHeader>
          <CardContent className="pb-4">
            <div className="stat-value text-blue-600">
              {loading ? '--' : assignmentStats.totalAssignments}
            </div>
            <p className="stat-label">
              {loading ? '加载中...' : '个作业已发布'}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和筛选 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="relative flex-1 max-w-md">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="搜索作业标题或课程名称..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              筛选
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* 作业列表 */}
      <Card className="assignment-list-card">
        <CardHeader className="pb-4">
          <div className="flex items-center">
            <CardTitle className="text-xl font-semibold">作业列表</CardTitle>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              <span className="ml-2 text-muted-foreground">加载作业数据中...</span>
            </div>
          ) : filteredAssignments.length === 0 ? (
            <div className="text-center py-12">
              <FileText className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-lg font-medium text-muted-foreground mb-2">暂无作业</h3>
              <p className="text-sm text-muted-foreground mb-4">还没有创建任何作业，点击上方按钮开始创建第一个作业</p>
              <Button className="btn-primary" onClick={handleCreateAssignment}>
                 <Plus className="w-4 h-4 mr-2" />
                 创建第一个作业
               </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredAssignments.map((assignment) => (
                <div key={assignment.id} className="assignment-item">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-medium text-lg">{assignment.title}</h3>
                        <Badge 
                          variant={assignment.status === 'published' ? 'default' : 'secondary'}
                          className={assignment.status === 'published' ? 'badge-success' : 'badge-warning'}
                        >
                          {assignment.status === 'published' ? '已发布' : '草稿'}
                        </Badge>
                      </div>
                      <p className="text-muted-foreground mb-3">{assignment.description}</p>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground">
                        <span className="flex items-center gap-1">
                          <Clock className="w-4 h-4" />
                          截止时间: {new Date(assignment.due_date).toLocaleDateString('zh-CN')}
                        </span>
                        <span className="flex items-center gap-1">
                          <Users className="w-4 h-4" />
                          {assignment.submissions_count || 0} 人已提交
                        </span>
                        <span className="flex items-center gap-1">
                          <FileText className="w-4 h-4" />
                          {assignment.course?.title || '未知课程'}
                        </span>
                      </div>
                    </div>
                    <div className="flex items-center gap-2 ml-4">
                      <Button variant="outline" size="sm" onClick={() => openViewDialog(assignment)}>
                        <Eye className="w-4 h-4 mr-1" />
                        查看
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => handleEditAssignment(assignment)}
                      >
                        <Edit className="w-4 h-4 mr-1" />
                        编辑
                      </Button>
                      <Button 
                        variant="outline" 
                        size="sm" 
                        className="text-red-600 hover:text-red-700"
                        onClick={() => handleDeleteAssignment(assignment)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* 作业创建/编辑对话框 */}
      <AssignmentDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        assignment={editingAssignment}
        onSuccess={handleDialogSuccess}
      />

      {/* 删除确认对话框 */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>确认删除作业</AlertDialogTitle>
            <AlertDialogDescription>
              您确定要删除作业「{deletingAssignment?.title}」吗？此操作无法撤销，相关的提交记录也将被删除。
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>取消</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteAssignment}
              className="bg-red-600 hover:bg-red-700"
            >
              删除
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* 从模板发布对话框（带快速创建模板） */}
      <Dialog open={publishOpen} onOpenChange={setPublishOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>从模板发布作业</DialogTitle>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">选择课程</div>
                <Select value={publishCourseId} onValueChange={setPublishCourseId}>
                  <SelectTrigger>
                    <SelectValue placeholder="请选择课程" />
                  </SelectTrigger>
                  <SelectContent>
                    {coursesForPublish.map((c: any) => (
                      <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">选择模板</div>
                <Select value={templateId} onValueChange={setTemplateId}>
                  <SelectTrigger>
                    <SelectValue placeholder={templates.length ? '请选择模板' : '暂无模板'} />
                  </SelectTrigger>
                  <SelectContent>
                    {templates.map((t: any) => (
                      <SelectItem key={t.id} value={t.id}>{t.title}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">选择期次（可多选）</div>
                <div className="border rounded p-3 max-h-40 overflow-y-auto space-y-2">
                  {sessions.map(s => (
                    <label key={s.id} className="flex items-center space-x-2 text-sm">
                      <input type="checkbox" checked={publishSessionIds.includes(s.id)} onChange={(e) => toggleSessionForPublish(s.id, e.target.checked)} />
                      <span>{s.name}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">截止日期（可选）</div>
                  <Input type="date" value={publishDueDate} onChange={(e) => setPublishDueDate(e.target.value)} />
                </div>
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">覆盖飞书链接（可选）</div>
                  <Input placeholder="https://..." value={publishUrl} onChange={(e) => setPublishUrl(e.target.value)} />
                </div>
              </div>
              {/* 分期次自定义链接（可选） */}
              {publishSessionIds.length > 0 && (
                <div className="space-y-2">
                  <div className="text-sm text-muted-foreground">为所选期次分别设置飞书链接（可选，留空则使用上面的覆盖链接或模板默认链接）</div>
                  <div className="space-y-2 max-h-40 overflow-y-auto border rounded p-3">
                    {sessions.filter(s => publishSessionIds.includes(s.id)).map(s => (
                      <div key={s.id} className="grid grid-cols-4 gap-2 items-center">
                        <div className="col-span-1 text-sm truncate">{s.name}</div>
                        <div className="col-span-3">
                          <Input
                            placeholder="https://..."
                            value={perSessionUrls[s.id] || ''}
                            onChange={(e) => setPerSessionUrls(prev => ({ ...prev, [s.id]: e.target.value }))}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
            <div className="space-y-3">
              <div className="font-medium">快速创建模板</div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">模板标题</div>
                <Input placeholder="如：Unit 1 作业" value={tplTitle} onChange={(e) => setTplTitle(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">模板描述（可选）</div>
                <Textarea rows={3} placeholder="填写作业说明" value={tplDesc} onChange={(e) => setTplDesc(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">飞书表单链接（必填）</div>
                <Input placeholder="https://..." value={tplUrl} onChange={(e) => setTplUrl(e.target.value)} />
              </div>
              <div className="space-y-2">
                <div className="text-sm text-muted-foreground">截止偏移天数（可选）</div>
                <Input placeholder="如 7（发布后+7天）" value={tplDueDays} onChange={(e) => setTplDueDays(e.target.value)} />
              </div>
              <Button onClick={createTemplateQuickly}>创建模板</Button>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPublishOpen(false)}>取消</Button>
            <Button onClick={confirmPublish}>发布</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 查看提交明细对话框 */}
      <Dialog open={viewOpen} onOpenChange={setViewOpen}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>提交明细{viewAssignment ? ` · ${viewAssignment.title}` : ''}</DialogTitle>
          </DialogHeader>
          <div className="space-y-3">
            {viewError && (
              <div className="text-sm text-red-600">{viewError}</div>
            )}
            {viewLoading ? (
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Loader2 className="w-4 h-4 animate-spin" /> 加载中...
              </div>
            ) : submissions.length === 0 ? (
              <div className="text-sm text-muted-foreground">暂无提交</div>
            ) : (
              <>
                <div className="flex items-center gap-3">
                  <Input placeholder="搜索学员姓名/邮箱/ID/内容关键字" value={viewSearch} onChange={(e) => setViewSearch(e.target.value)} />
                  <Select value={viewStatus} onValueChange={(v) => setViewStatus(v as any)}>
                    <SelectTrigger className="w-[160px]"><SelectValue placeholder="状态筛选" /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部</SelectItem>
                      <SelectItem value="submitted">已提交</SelectItem>
                      <SelectItem value="graded">已批改</SelectItem>
                    </SelectContent>
                  </Select>
                  <Button variant="outline" onClick={() => exportCsv()}>导出 CSV</Button>
                </div>
                <div className="max-h-[420px] overflow-auto border rounded-md mt-3">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/50 text-muted-foreground">
                      <th className="text-left p-2">学员</th>
                      <th className="text-left p-2">提交时间</th>
                      <th className="text-left p-2">内容</th>
                      <th className="text-left p-2">附件</th>
                      <th className="text-left p-2">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {submissions
                      .filter((s) => {
                        const kw = viewSearch.trim().toLowerCase();
                        const status = s.status || (s.score != null ? 'graded' : 'submitted');
                        if (viewStatus !== 'all' && status !== viewStatus) return false;
                        if (!kw) return true;
                        return (
                          String(s.profiles?.full_name || '').toLowerCase().includes(kw) ||
                          String(s.profiles?.email || '').toLowerCase().includes(kw) ||
                          String(s.student_id).toLowerCase().includes(kw) ||
                          String(s.content || '').toLowerCase().includes(kw)
                        );
                      })
                      .map((s) => (
                      <tr key={s.id} className="border-t">
                        <td className="p-2">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">{s.profiles?.full_name || s.student_id}</span>
                            <span className="text-xs text-muted-foreground">{s.profiles?.email || '-'}</span>
                          </div>
                        </td>
                        <td className="p-2">{s.submitted_at ? new Date(s.submitted_at).toLocaleString() : '-'}</td>
                        <td className="p-2 break-words max-w-[320px]">{s.content || '-'}</td>
                        <td className="p-2">
                          {s.file_url ? (
                            <a href={s.file_url} target="_blank" rel="noreferrer" className="text-primary hover:underline">查看附件</a>
                          ) : (
                            '-'
                          )}
                        </td>
                        <td className="p-2">{s.status || (s.score != null ? 'graded' : 'submitted')}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              </>
            )}
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setViewOpen(false)}>关闭</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}