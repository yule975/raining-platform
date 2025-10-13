import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import { Plus, Edit, Trash2, Users, Calendar, Settings, RefreshCw, Download, FileSpreadsheet } from 'lucide-react';
import { ApiService } from '@/lib/api';
import { ApiWithLoading } from '@/services/apiWithLoading';
import { SessionStatusService } from '@/services/sessionStatusService';
import { useLoading, useOperationLoading } from '../contexts/LoadingContext';
import { ErrorHandler } from '@/utils/errorHandler';
import { useToast } from '@/hooks/use-toast';
import { useErrorHandler } from '@/components/ErrorBoundary';
import { ExcelExporter } from '@/utils/excelExport';
import { Course } from '../lib/types';
import { TrainingSession } from '../lib/api';
import { PageLoadingIndicator, ButtonLoadingIndicator, TableSkeleton } from '../components/ui/GlobalLoadingIndicator';

const SessionManagement = () => {
  const [sessions, setSessions] = useState([]);
  const [courses, setCourses] = useState([]);
  const { isLoading } = useLoading();
  const fetchLoading = useOperationLoading('fetch-sessions');
  const createLoading = useOperationLoading('create-session');
  const updateLoading = useOperationLoading('update-session');
  const deleteLoading = useOperationLoading('delete-session');
  const refreshStatusLoading = useOperationLoading('refresh-status');
  const exportLoading = useOperationLoading('export-sessions');
  const [exportState, setExportState] = useState({ loading: false, message: '', progress: 0 });
  const handleError = useErrorHandler();
  const { toast: toastHook } = useToast();

  // 导出期次基本信息
  const handleExportSessions = async () => {
    try {
      setExportState({ loading: true, message: '正在导出期次数据...', progress: 0 });
      await ExcelExporter.exportSessions(sessions);
      toast.success('期次数据导出成功');
    } catch (error) {
      ErrorHandler.showError(error, toastHook);
    } finally {
      setExportState({ loading: false, message: '', progress: 0 });
    }
  };

  // 导出期次学员信息
  const handleExportSessionStudents = async (sessionId: string, sessionName: string) => {
    try {
      setExportState({ loading: true, message: `正在导出${sessionName}学员数据...`, progress: 0 });
      await ExcelExporter.exportSessionStudents(sessionId, sessionName);
      toast.success(`${sessionName}学员数据导出成功`);
    } catch (error) {
      ErrorHandler.showError(error, toastHook);
    } finally {
      setExportState({ loading: false, message: '', progress: 0 });
    }
  };

  // 导出完整报告
  const handleExportFullReport = async (sessionId: string) => {
    try {
      setExportState({ loading: true, message: '正在生成完整报告...', progress: 0 });
      await ExcelExporter.exportFullSessionReport(sessionId);
      toast.success('完整报告导出成功');
    } catch (error) {
      ErrorHandler.showError(error, toastHook);
    } finally {
      setExportState({ loading: false, message: '', progress: 0 });
    }
  };

  // 批量导出所有期次
  const handleExportAllSessions = async () => {
    try {
      setExportState({ loading: true, message: '正在批量导出所有期次数据...', progress: 0 });
      await ExcelExporter.exportAllSessions(sessions);
      toast.success('所有期次数据导出成功');
    } catch (error) {
      ErrorHandler.showError(error, toastHook);
    } finally {
      setExportState({ loading: false, message: '', progress: 0 });
    }
  };

  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingSession, setEditingSession] = useState(null);
  const [deletingSession, setDeletingSession] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    start_date: '',
    end_date: '',
    status: 'active' as 'active' | 'upcoming' | 'completed',
    is_current: false,
    selectedCourses: [] as string[]
  });
  const [formErrors, setFormErrors] = useState({
    name: '',
    start_date: '',
    end_date: ''
  });

  // 管理课程对话框
  const [manageCoursesOpen, setManageCoursesOpen] = useState(false);
  const [managingSession, setManagingSession] = useState<any>(null);
  const [managedSelected, setManagedSelected] = useState<string[]>([]);
  const [managedOriginal, setManagedOriginal] = useState<string[]>([]);
  // 编辑对话框中课程原始选择，用于保存差异
  const [editOriginalSelected, setEditOriginalSelected] = useState<string[]>([]);

  // 获取期次列表
  const fetchSessions = async () => {
    try {
      const data = await ApiWithLoading.getTrainingSessions(fetchLoading.withLoading)
      setSessions(data)
    } catch (error) {
      ErrorHandler.showError(error, toastHook);
    }
  };

  // 获取课程列表
  const fetchCourses = async () => {
    try {
      const data = await ApiService.getCourses();
      setCourses(data);
    } catch (error) {
      console.error('获取课程列表失败:', error);
    }
  };

  // 打开管理课程
  const openManageCourses = async (session: any) => {
    try {
      setManagingSession(session);
      // 当前期次已解锁课程
      const list = await ApiService.getSessionCourses(session.id);
      const ids = (list || []).map((c: any) => c.id);
      setManagedSelected(ids);
      setManagedOriginal(ids);
      setManageCoursesOpen(true);
    } catch (e) {
      toast.error('加载期次课程失败');
    }
  };

  // 切换选中课程
  const toggleManagedCourse = (courseId: string, checked: boolean) => {
    setManagedSelected(prev => checked ? Array.from(new Set([...prev, courseId])) : prev.filter(id => id !== courseId));
  };

  // 保存管理课程
  const saveManagedCourses = async () => {
    try {
      if (!managingSession) return;
      const toAdd = managedSelected.filter(id => !managedOriginal.includes(id));
      const toRemove = managedOriginal.filter(id => !managedSelected.includes(id));

      if (toAdd.length === 0 && toRemove.length === 0) {
        setManageCoursesOpen(false);
        return;
      }

      if (toAdd.length > 0) {
        await ApiService.addCoursesToSession(managingSession.id, toAdd);
      }
      if (toRemove.length > 0) {
        await ApiService.removeCoursesFromSession(managingSession.id, toRemove);
      }

      toast.success('期次课程已更新');
      setManageCoursesOpen(false);
      // 刷新期次列表（学员数/状态可能不变，但便于一致）
      fetchSessions();
    } catch (e) {
      console.error(e);
      toast.error('保存失败，请重试');
    }
  };

  useEffect(() => {
    fetchSessions();
    fetchCourses();
  }, []);

  // 重置表单
  const resetForm = () => {
    setFormData({
      name: '',
      description: '',
      start_date: '',
      end_date: '',
      status: 'active' as 'active' | 'upcoming' | 'completed',
      is_current: false,
      selectedCourses: []
    });
    setFormErrors({
      name: '',
      start_date: '',
      end_date: ''
    });
  };

  // 验证表单字段
  const validateField = (field: string, value: string) => {
    let error = '';
    
    switch (field) {
      case 'name':
        if (!value.trim()) {
          error = '期次名称不能为空';
        } else if (value.trim().length < 2) {
          error = '期次名称至少需要2个字符';
        } else if (value.trim().length > 50) {
          error = '期次名称不能超过50个字符';
        }
        break;
      case 'start_date':
        if (!value) {
          error = '开始日期不能为空';
        }
        break;
      case 'end_date':
        if (!value) {
          error = '结束日期不能为空';
        } else if (formData.start_date && new Date(value) <= new Date(formData.start_date)) {
          error = '结束日期必须晚于开始日期';
        }
        break;
    }
    
    setFormErrors(prev => ({ ...prev, [field]: error }));
    return error === '';
  };

  // 处理表单输入变化
  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // 实时验证
    setTimeout(() => validateField(field, value), 100);
  };

  // 处理课程选择变化
  const handleCourseSelection = (courseId: string, checked: boolean) => {
    setFormData(prev => ({
      ...prev,
      selectedCourses: checked 
        ? [...prev.selectedCourses, courseId]
        : prev.selectedCourses.filter(id => id !== courseId)
    }));
  };

  // 检查时间有效性（仅检查开始日期不晚于结束日期）
  const checkTimeConflict = (startDate: string, endDate: string, excludeId?: string) => {
    // 只检查开始日期是否晚于结束日期，允许期次之间时间重叠
    if (new Date(startDate) >= new Date(endDate)) {
      return '开始日期不能晚于或等于结束日期';
    }

    // 移除时间重叠检查，允许期次之间有时间重叠
    return null;
  };

  // 创建期次
  const handleCreateSession = async () => {
    await createLoading.withLoading(async () => {
      try {
        // 验证所有字段
        const nameValid = validateField('name', formData.name);
        const startDateValid = validateField('start_date', formData.start_date);
        const endDateValid = validateField('end_date', formData.end_date);
        
        if (!nameValid || !startDateValid || !endDateValid) {
          toast.error('请修正表单中的错误');
          return;
        }

        // 检查时间冲突
        const conflictError = checkTimeConflict(formData.start_date, formData.end_date);
        if (conflictError) {
          toast.error(conflictError);
          return;
        }

        try {
          // 准备期次数据，移除selectedCourses字段
          const { selectedCourses, ...sessionData } = formData;
          const result = await ApiWithLoading.createTrainingSession(sessionData, selectedCourses, createLoading.withLoading);
          toast.success(`期次创建成功${formData.selectedCourses.length > 0 ? `，已关联 ${formData.selectedCourses.length} 门课程` : ''}`);
          setIsCreateDialogOpen(false);
          resetForm();
          // 创建后立即更新状态
          if (result && result.id) {
            await SessionStatusService.updateSingleSessionStatus(result.id);
            await SessionStatusService.autoSetCurrentSession();
          }
          fetchSessions();
        } catch (error) {
          ErrorHandler.showError(error, toastHook);
        }
      } catch (error) {
        console.error('创建期次失败:', error);
        const errorMessage = error instanceof Error ? error.message : '创建期次失败';
        toast.error(errorMessage);
      }
    });
  };

  // 更新期次
  const handleUpdateSession = async () => {
    await updateLoading.withLoading(async () => {
      try {
        // 验证所有字段
        const nameValid = validateField('name', formData.name);
        const startDateValid = validateField('start_date', formData.start_date);
        const endDateValid = validateField('end_date', formData.end_date);
        
        if (!nameValid || !startDateValid || !endDateValid) {
          toast.error('请修正表单中的错误');
          return;
        }

        // 检查时间冲突（排除当前编辑的期次）
        const conflictError = checkTimeConflict(formData.start_date, formData.end_date, editingSession.id);
        if (conflictError) {
          toast.error(conflictError);
          return;
        }

        try {
          await ApiWithLoading.updateTrainingSession(editingSession.id, formData, updateLoading.withLoading);
          // 处理课程增删
          const toAdd = (formData.selectedCourses || []).filter(id => !editOriginalSelected.includes(id));
          const toRemove = (editOriginalSelected || []).filter(id => !(formData.selectedCourses || []).includes(id));
          if (toAdd.length > 0) {
            await ApiService.addCoursesToSession(editingSession.id, toAdd);
          }
          if (toRemove.length > 0) {
            await ApiService.removeCoursesFromSession(editingSession.id, toRemove);
          }
          toast.success('期次更新成功');
          setIsEditDialogOpen(false);
          setEditingSession(null);
          resetForm();
          // 更新后立即刷新状态
          await SessionStatusService.updateSingleSessionStatus(editingSession.id);
          await SessionStatusService.autoSetCurrentSession();
          fetchSessions();
        } catch (error) {
          ErrorHandler.showError(error, toastHook);
        }
      } catch (error) {
        console.error('更新期次失败:', error);
        const errorMessage = error instanceof Error ? error.message : '更新期次失败';
        toast.error(errorMessage);
      }
    });
  };

  // 打开编辑对话框
  const handleEditSession = async (session) => {
    setEditingSession(session);
    // 拉取当前期次课程，作为编辑初始选择
    try {
      const list = await ApiService.getSessionCourses(session.id);
      const ids = (list || []).map((c: any) => c.id);
      setEditOriginalSelected(ids);
      setFormData({
        name: session.name,
        description: session.description || '',
        start_date: session.start_date ? session.start_date.split('T')[0] : '',
        end_date: session.end_date ? session.end_date.split('T')[0] : '',
        status: (session.status || 'active') as 'active' | 'upcoming' | 'completed',
        is_current: session.is_current,
        selectedCourses: ids
      });
    } catch {
      // 回退到 session 上的字段
      setFormData({
        name: session.name,
        description: session.description || '',
        start_date: session.start_date ? session.start_date.split('T')[0] : '',
        end_date: session.end_date ? session.end_date.split('T')[0] : '',
        status: (session.status || 'active') as 'active' | 'upcoming' | 'completed',
        is_current: session.is_current,
        selectedCourses: Array.isArray(session.selectedCourses)
          ? session.selectedCourses
          : Array.isArray(session.selectedcourses)
            ? session.selectedcourses
            : Array.isArray(session.selected_courses)
              ? session.selected_courses
              : []
      });
      setEditOriginalSelected([]);
    }
    setIsEditDialogOpen(true);
  };

  // 删除期次
  const handleDeleteSession = async () => {
    if (!deletingSession) return;
    
    await deleteLoading.withLoading(async () => {
      try {
        try {
          const result = await ApiWithLoading.deleteTrainingSession(deletingSession.id, deleteLoading.withLoading);
          
          if (result.success) {
            toast.success(result.message);
            fetchSessions();
          } else {
            toast.error(result.message);
          }
        } catch (error) {
          ErrorHandler.showError(error, toastHook);
        }
      } catch (error) {
        console.error('删除期次失败:', error);
        toast.error('删除期次失败');
      } finally {
        setDeletingSession(null);
      }
    });
  };

  // 格式化日期显示
  const formatDate = (dateString) => {
    if (!dateString) return '-';
    return new Date(dateString).toLocaleDateString('zh-CN');
  };

  // 手动刷新期次状态
  const handleRefreshStatus = async () => {
    await refreshStatusLoading.withLoading(async () => {
      try {
        await SessionStatusService.updateAllSessionStatus();
        await SessionStatusService.autoSetCurrentSession();
        await fetchSessions();
        toast.success('期次状态已更新');
      } catch (error) {
        console.error('刷新状态失败:', error);
        toast.error('刷新状态失败');
      }
    });
  };

  // 获取期次状态显示信息
  const getSessionStatus = (session) => {
    return SessionStatusService.getStatusDisplay(session.status, session.is_current);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      {/* 页面标题和操作 */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-3xl font-bold">期次管理</h2>
          <p className="text-muted-foreground">管理培训期次的创建、编辑和设置</p>
        </div>
        <div className="flex items-center space-x-2">
          <Button 
            variant="outline" 
            onClick={handleRefreshStatus}
            disabled={refreshStatusLoading.loading}
          >
            <RefreshCw className={`w-4 h-4 mr-2 ${refreshStatusLoading.loading ? 'animate-spin' : ''}`} />
            刷新状态
          </Button>
          
          {/* 导出功能按钮组 */}
          <div className="flex items-center space-x-1">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportSessions}
              disabled={exportState.loading || sessions.length === 0}
            >
              <FileSpreadsheet className="w-4 h-4 mr-1" />
              导出期次
            </Button>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleExportAllSessions}
              disabled={exportState.loading || sessions.length === 0}
            >
              <Download className="w-4 h-4 mr-1" />
              批量导出
            </Button>
          </div>
          
          <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
            <DialogTrigger asChild>
              <Button onClick={resetForm} className="w-full sm:w-auto">
                <Plus className="w-4 h-4 mr-2" />
                创建期次
              </Button>
            </DialogTrigger>
            <DialogContent className="mx-4 max-w-[500px] max-h-[90vh] overflow-y-auto">
              <DialogHeader>
                <DialogTitle className="text-lg">创建新期次</DialogTitle>
                <DialogDescription className="text-sm">
                  创建一个新的培训期次，设置期次名称、时间范围等信息。
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label htmlFor="name" className="text-sm font-medium">期次名称 *</Label>
                  <div className="space-y-1">
                    <Input
                      id="name"
                      value={formData.name}
                      onChange={(e) => handleInputChange('name', e.target.value)}
                      placeholder="例如：AI基础培训第一期"
                      className={`text-sm ${formErrors.name ? 'border-red-500' : ''}`}
                    />
                    {formErrors.name && (
                      <p className="text-xs text-red-500">{formErrors.name}</p>
                    )}
                  </div>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="description" className="text-sm font-medium">期次描述</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="期次的详细描述..."
                    rows={3}
                    className="text-sm resize-none"
                  />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="start_date" className="text-sm font-medium">开始日期 *</Label>
                    <div className="space-y-1">
                      <Input
                        id="start_date"
                        type="date"
                        value={formData.start_date}
                        onChange={(e) => handleInputChange('start_date', e.target.value)}
                        className={`text-sm ${formErrors.start_date ? 'border-red-500' : ''}`}
                      />
                      {formErrors.start_date && (
                        <p className="text-xs text-red-500">{formErrors.start_date}</p>
                      )}
                    </div>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="end_date" className="text-sm font-medium">结束日期 *</Label>
                    <div className="space-y-1">
                      <Input
                        id="end_date"
                        type="date"
                        value={formData.end_date}
                        onChange={(e) => handleInputChange('end_date', e.target.value)}
                        className={`text-sm ${formErrors.end_date ? 'border-red-500' : ''}`}
                      />
                      {formErrors.end_date && (
                        <p className="text-xs text-red-500">{formErrors.end_date}</p>
                      )}
                    </div>
                  </div>
                </div>
                
                {/* 课程选择 */}
                <div className="grid gap-2">
                  <Label className="text-sm font-medium">选择课程</Label>
                  <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                    {courses.length === 0 ? (
                      <p className="text-sm text-muted-foreground">暂无可选课程</p>
                    ) : (
                      <div className="space-y-2">
                        {courses.map((course) => (
                          <div key={course.id} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`course-${course.id}`}
                              checked={formData.selectedCourses.includes(course.id)}
                              onChange={(e) => handleCourseSelection(course.id, e.target.checked)}
                              className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                            />
                            <Label 
                              htmlFor={`course-${course.id}`} 
                              className="text-sm cursor-pointer flex-1"
                            >
                              {course.title}
                            </Label>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    已选择 {formData.selectedCourses.length} 门课程
                  </p>
                </div>
                
                <div className="flex items-center space-x-2">
                  <Switch
                    id="is_current"
                    checked={formData.is_current}
                    onCheckedChange={(checked) => setFormData({ ...formData, is_current: checked })}
                  />
                  <Label htmlFor="is_current" className="text-sm">设为当前期次</Label>
                </div>
              </div>
              <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
                <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)} className="w-full sm:w-auto">
                  取消
                </Button>
                <Button onClick={handleCreateSession} disabled={createLoading.loading} className="w-full sm:w-auto">
                  {createLoading.loading ? <ButtonLoadingIndicator /> : null}
                  创建期次
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 期次列表 */}
      <Card>
        <CardHeader>
          <CardTitle>期次列表</CardTitle>
          <CardDescription>管理所有培训期次</CardDescription>
        </CardHeader>
        <CardContent>
          {fetchLoading.loading ? (
            <TableSkeleton />
          ) : sessions.length === 0 ? (
            <div className="text-center py-8">
              <p className="text-muted-foreground">暂无期次数据</p>
            </div>
          ) : (
            <>
              {/* 桌面端表格视图 */}
              <div className="hidden lg:block">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>期次名称</TableHead>
                      <TableHead>描述</TableHead>
                      <TableHead>开始日期</TableHead>
                      <TableHead>结束日期</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>学员数</TableHead>
                      <TableHead className="text-right">操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {sessions.map((session) => {
                      const status = getSessionStatus(session);
                      return (
                        <TableRow key={session.id}>
                          <TableCell className="font-medium">{session.name}</TableCell>
                          <TableCell className="max-w-xs truncate">
                            {session.description || '-'}
                          </TableCell>
                          <TableCell>{formatDate(session.start_date)}</TableCell>
                          <TableCell>{formatDate(session.end_date)}</TableCell>
                          <TableCell>
                            <Badge variant={status.variant}>{status.label}</Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              <Users className="w-4 h-4 text-muted-foreground" />
                              <span>{session.student_count || 0}</span>
                            </div>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end space-x-1">
                              {/* 导出按钮组 */}
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleExportSessionStudents(session.id, session.name)}
                                disabled={exportState.loading}
                                title="导出学员列表"
                              >
                                <Users className="w-4 h-4" />
                              </Button>
                              {/* 完整报告导出已移除 */}
                              
                              {/* 管理课程按钮 */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openManageCourses(session)}
                              >
                                管理课程
                              </Button>

                              {/* 编辑和删除按钮 */}
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleEditSession(session)}
                              >
                                <Edit className="w-4 h-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => setDeletingSession(session)}
                                  >
                                    <Trash2 className="w-4 h-4 text-red-500" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle>确认删除期次</AlertDialogTitle>
                                    <AlertDialogDescription>
                                      您确定要删除期次 "{session.name}" 吗？
                                      <br />
                                      <span className="text-red-600 font-medium">
                                        此操作不可撤销。如果期次已有学员或为当前期次，将无法删除。
                                      </span>
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel onClick={() => setDeletingSession(null)}>
                                      取消
                                    </AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={handleDeleteSession}
                                      className="bg-red-600 hover:bg-red-700"
                                    >
                                      删除
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>

              {/* 移动端卡片视图 */}
              <div className="lg:hidden space-y-4">
                {sessions.map((session) => {
                  const status = getSessionStatus(session);
                  return (
                    <Card key={session.id} className="p-4">
                      <div className="space-y-3">
                        {/* 期次标题和状态 */}
                        <div className="flex items-start justify-between">
                          <div className="flex-1 min-w-0">
                            <h3 className="font-medium text-sm truncate">{session.name}</h3>
                            {session.description && (
                              <p className="text-xs text-muted-foreground mt-1 line-clamp-2">
                                {session.description}
                              </p>
                            )}
                          </div>
                          <Badge variant={status.variant} className="ml-2 shrink-0">
                            {status.label}
                          </Badge>
                        </div>

                        {/* 期次信息 */}
                        <div className="grid grid-cols-2 gap-3 text-xs">
                          <div>
                            <span className="text-muted-foreground">开始日期</span>
                            <p className="font-medium">{formatDate(session.start_date)}</p>
                          </div>
                          <div>
                            <span className="text-muted-foreground">结束日期</span>
                            <p className="font-medium">{formatDate(session.end_date)}</p>
                          </div>
                        </div>

                        {/* 学员数 */}
                        <div className="flex items-center space-x-1 text-xs">
                          <Users className="w-3 h-3 text-muted-foreground" />
                          <span className="text-muted-foreground">学员数：</span>
                          <span className="font-medium">{session.student_count || 0}</span>
                        </div>

                        {/* 操作按钮 */}
                        <div className="flex flex-wrap gap-2 pt-2 border-t">
                          {/* 导出按钮 */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleExportSessionStudents(session.id, session.name)}
                            disabled={exportState.loading}
                            className="flex-1 min-w-0"
                          >
                            <Users className="w-3 h-3 mr-1" />
                            <span className="text-xs">导出学员</span>
                          </Button>
                          {/* 移除“完整报告”按钮以简化操作 */}
                          
                          {/* 编辑和删除按钮 */}
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditSession(session)}
                            className="px-3"
                          >
                            <Edit className="w-3 h-3" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDeletingSession(session)}
                                className="px-3"
                              >
                                <Trash2 className="w-3 h-3 text-red-500" />
                              </Button>
                            </AlertDialogTrigger>
                            <AlertDialogContent className="mx-4 max-w-sm">
                              <AlertDialogHeader>
                                <AlertDialogTitle className="text-base">确认删除期次</AlertDialogTitle>
                                <AlertDialogDescription className="text-sm">
                                  您确定要删除期次 "{session.name}" 吗？
                                  <br />
                                  <span className="text-red-600 font-medium">
                                    此操作不可撤销。如果期次已有学员或为当前期次，将无法删除。
                                  </span>
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
                                <AlertDialogCancel onClick={() => setDeletingSession(null)} className="w-full sm:w-auto">
                                  取消
                                </AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={handleDeleteSession}
                                  className="bg-red-600 hover:bg-red-700 w-full sm:w-auto"
                                >
                                  删除
                                </AlertDialogAction>
                              </AlertDialogFooter>
                            </AlertDialogContent>
                          </AlertDialog>
                        </div>
                      </div>
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </CardContent>
      </Card>

      {/* 编辑期次对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="mx-4 max-w-[500px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">编辑期次</DialogTitle>
            <DialogDescription className="text-sm">
              修改期次信息和设置。
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid gap-2">
              <Label htmlFor="edit_name" className="text-sm font-medium">期次名称 *</Label>
              <div className="space-y-1">
                <Input
                  id="edit_name"
                  value={formData.name}
                  onChange={(e) => handleInputChange('name', e.target.value)}
                  placeholder="例如：AI基础培训第一期"
                  className={`text-sm ${formErrors.name ? 'border-red-500' : ''}`}
                />
                {formErrors.name && (
                  <p className="text-xs text-red-500">{formErrors.name}</p>
                )}
              </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="edit_description" className="text-sm font-medium">期次描述</Label>
              <Textarea
                id="edit_description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="期次的详细描述..."
                rows={3}
                className="text-sm resize-none"
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="grid gap-2">
                <Label htmlFor="edit_start_date" className="text-sm font-medium">开始日期 *</Label>
                <div className="space-y-1">
                  <Input
                    id="edit_start_date"
                    type="date"
                    value={formData.start_date}
                    onChange={(e) => handleInputChange('start_date', e.target.value)}
                    className={`text-sm ${formErrors.start_date ? 'border-red-500' : ''}`}
                  />
                  {formErrors.start_date && (
                    <p className="text-xs text-red-500">{formErrors.start_date}</p>
                  )}
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="edit_end_date" className="text-sm font-medium">结束日期 *</Label>
                <div className="space-y-1">
                  <Input
                    id="edit_end_date"
                    type="date"
                    value={formData.end_date}
                    onChange={(e) => handleInputChange('end_date', e.target.value)}
                    className={`text-sm ${formErrors.end_date ? 'border-red-500' : ''}`}
                  />
                  {formErrors.end_date && (
                    <p className="text-xs text-red-500">{formErrors.end_date}</p>
                  )}
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-2">
              <Switch
                id="edit_is_current"
                checked={formData.is_current}
                onCheckedChange={(checked) => setFormData({ ...formData, is_current: checked })}
              />
              <Label htmlFor="edit_is_current" className="text-sm">设为当前期次</Label>
            </div>
          </div>
          <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)} className="w-full sm:w-auto">
              取消
            </Button>
            <Button onClick={handleUpdateSession} disabled={updateLoading.loading} className="w-full sm:w-auto">
              {updateLoading.loading ? <ButtonLoadingIndicator /> : null}
              保存更改
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* 管理课程对话框 */}
      <Dialog open={manageCoursesOpen} onOpenChange={setManageCoursesOpen}>
        <DialogContent className="mx-4 max-w-[520px] max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="text-lg">管理课程 - {managingSession?.name || ''}</DialogTitle>
            <DialogDescription className="text-sm">勾选表示在该期次中解锁/开放的课程</DialogDescription>
          </DialogHeader>
          <div className="border rounded-md p-3 max-h-[50vh] overflow-y-auto space-y-2">
            {courses.length === 0 ? (
              <p className="text-sm text-muted-foreground">暂无课程</p>
            ) : (
              courses.map((course: any) => (
                <div key={course.id} className="flex items-center space-x-2">
                  <input
                    type="checkbox"
                    id={`m-course-${course.id}`}
                    checked={managedSelected.includes(course.id)}
                    onChange={(e) => toggleManagedCourse(course.id, e.target.checked)}
                    className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                  />
                  <Label htmlFor={`m-course-${course.id}`} className="text-sm cursor-pointer flex-1">
                    {course.title}
                  </Label>
                </div>
              ))
            )}
          </div>
          <DialogFooter className="flex-col space-y-2 sm:flex-row sm:space-y-0">
            <Button variant="outline" onClick={() => setManageCoursesOpen(false)} className="w-full sm:w-auto">
              取消
            </Button>
            <Button onClick={saveManagedCourses} className="w-full sm:w-auto">
              保存
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
      
      {/* 导出进度提示 */}
      {exportState.loading && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-4 sm:p-6 max-w-sm w-full">
            <div className="flex items-center space-x-3 mb-4">
              <div className="animate-spin rounded-full h-5 w-5 sm:h-6 sm:w-6 border-b-2 border-blue-600"></div>
              <span className="text-base sm:text-lg font-medium">正在导出...</span>
            </div>
            <div className="space-y-2">
              <div className="text-xs sm:text-sm text-gray-600 break-words">{exportState.message}</div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${exportState.progress}%` }}
                ></div>
              </div>
              <div className="text-xs text-gray-500 text-right">{exportState.progress}%</div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SessionManagement;