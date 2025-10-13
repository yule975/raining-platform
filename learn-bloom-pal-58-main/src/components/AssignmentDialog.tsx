import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Calendar } from '@/components/ui/calendar';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import { CalendarIcon, Loader2 } from 'lucide-react';
import { format } from 'date-fns';
import { zhCN } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { AssignmentService } from '@/lib/supabaseService';
import { CourseService } from '@/services/CourseService';
import { ApiService, TrainingSession } from '@/lib/api';
import { toast } from 'sonner';

interface Assignment {
  id?: string;
  title: string;
  description: string;
  course_id: string;
  due_date: string;
  // 使用 instructions 字段保存“飞书表单链接”（避免改表）
  instructions: string; // feishu_form_url
  status: 'draft' | 'published';
}

interface Course {
  id: string;
  title: string;
}

interface AssignmentDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment?: Assignment;
  onSuccess: () => void;
}

export function AssignmentDialog({
  open,
  onOpenChange,
  assignment,
  onSuccess,
}: AssignmentDialogProps) {
  const [loading, setLoading] = useState(false);
  const [courses, setCourses] = useState<Course[]>([]);
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string>('');
  const [sessionCourses, setSessionCourses] = useState<string[]>([]);
  const [formData, setFormData] = useState<Assignment>({
    title: '',
    description: '',
    course_id: '',
    due_date: '',
    instructions: '', // feishu_form_url
    status: 'draft',
  });
  const [dueDate, setDueDate] = useState<Date>();

  const isEditing = !!assignment;

  useEffect(() => {
    if (open) {
      loadCourses();
      // 加载期次列表，并默认选中当前期次
      ApiService.getTrainingSessions()
        .then(list => {
          setSessions(list);
          const current = list.find(s => s.is_current && s.status === 'active');
          const defaultId = current?.id || '';
          setSelectedSessionId(prev => prev || defaultId);
          if (defaultId) {
            ApiService.getSessionCourses(defaultId).then(cs => setSessionCourses(cs.map(c => c.id)));
          }
        })
        .catch(() => {});
      if (assignment) {
        setFormData(assignment);
        setDueDate(new Date(assignment.due_date));
      } else {
        setFormData({
          title: '',
          description: '',
          course_id: '',
          due_date: '',
          instructions: '',
          status: 'draft',
        });
        setDueDate(undefined);
      }
    }
  }, [open, assignment]);

  // 切换期次时加载该期次解锁课程
  useEffect(() => {
    if (selectedSessionId) {
      ApiService.getSessionCourses(selectedSessionId).then(cs => setSessionCourses(cs.map(c => c.id))).catch(() => setSessionCourses([]));
    } else {
      setSessionCourses([]);
    }
  }, [selectedSessionId]);

  const loadCourses = async () => {
    try {
      const coursesData = await CourseService.getAllCourses();
      setCourses(coursesData);
    } catch (error) {
      console.error('加载课程失败:', error);
      toast.error('加载课程列表失败');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.title || !formData.course_id || !dueDate) {
      toast.error('请填写所有必填字段');
      return;
    }

    // 期次校验：若选择了期次，仅允许选择该期次已解锁的课程
    if (selectedSessionId && formData.course_id) {
      if (sessionCourses.length === 0 || !sessionCourses.includes(formData.course_id)) {
        toast.error('该课程尚未在所选期次解锁，请先在期次管理中解锁');
        return;
      }
    }

    setLoading(true);
    try {
      const assignmentData = {
        ...formData,
        due_date: dueDate.toISOString(),
      };

      if (isEditing) {
        await AssignmentService.updateAssignment(assignment.id!, assignmentData);
        toast.success('作业更新成功');
      } else {
        await AssignmentService.createAssignment(assignmentData);
        toast.success('作业创建成功');
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('保存作业失败:', error);
      toast.error(isEditing ? '更新作业失败' : '创建作业失败');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>
            {isEditing ? '编辑作业' : '创建新作业'}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>所属期次</Label>
              <Select value={selectedSessionId} onValueChange={(v) => setSelectedSessionId(v)}>
                <SelectTrigger>
                  <SelectValue placeholder="选择期次（可选，选后仅允许期次内已解锁课程）" />
                </SelectTrigger>
                <SelectContent>
                  {sessions.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="title">作业标题 *</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="请输入作业标题"
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="course">所属课程 *</Label>
              <Select
                value={formData.course_id}
                onValueChange={(value) => setFormData({ ...formData, course_id: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择课程" />
                </SelectTrigger>
                <SelectContent>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                      {selectedSessionId && sessionCourses.length > 0 && !sessionCourses.includes(course.id) ? '（未解锁）' : ''}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">作业描述</Label>
            <Textarea
              id="description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              placeholder="请输入作业描述"
              rows={3}
            />
          </div>

          <div className="space-y-2">
            <Label>截止日期 *</Label>
            <Popover>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    'w-full justify-start text-left font-normal',
                    !dueDate && 'text-muted-foreground'
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {dueDate ? (
                    format(dueDate, 'PPP', { locale: zhCN })
                  ) : (
                    <span>选择截止日期</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={dueDate}
                  onSelect={setDueDate}
                  disabled={(date) => date < new Date()}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>

          <div className="space-y-2">
            <Label htmlFor="instructions">飞书表单链接（用于收集作业）</Label>
            <Input
              id="instructions"
              value={formData.instructions}
              onChange={(e) => setFormData({ ...formData, instructions: e.target.value })}
              placeholder="https://xxx.feishu.cn/...（学员提交后视为已提交）"
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="status">发布状态</Label>
            <Select
              value={formData.status}
              onValueChange={(value: 'draft' | 'published') => setFormData({ ...formData, status: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="draft">草稿</SelectItem>
                <SelectItem value="published">已发布</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={loading}
            >
              取消
            </Button>
            <Button type="submit" disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {isEditing ? '更新作业' : '创建作业'}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}