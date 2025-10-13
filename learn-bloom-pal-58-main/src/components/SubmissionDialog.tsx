import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Upload, FileText, Clock, CheckCircle, AlertCircle } from 'lucide-react';
import { AssignmentService, StorageService } from '@/lib/supabaseService';
import { toast } from 'sonner';

interface Assignment {
  id: string;
  title: string;
  description: string;
  due_date: string;
  max_score?: number;
}

interface Submission {
  id: string;
  content: string;
  file_url?: string;
  status: string;
  submitted_at: string;
  score?: number;
  feedback?: string;
}

interface SubmissionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  assignment: Assignment | null;
  studentId: string;
  onSuccess?: () => void;
}

export function SubmissionDialog({
  open,
  onOpenChange,
  assignment,
  studentId,
  onSuccess
}: SubmissionDialogProps) {
  const [content, setContent] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingSubmission, setExistingSubmission] = useState<Submission | null>(null);
  const [loadingSubmission, setLoadingSubmission] = useState(false);

  // 加载现有提交
  useEffect(() => {
    if (open && assignment && studentId) {
      loadExistingSubmission();
    }
  }, [open, assignment, studentId]);

  const loadExistingSubmission = async () => {
    if (!assignment) return;
    
    try {
      setLoadingSubmission(true);
      const submission = await AssignmentService.getStudentSubmission(assignment.id, studentId);
      if (submission) {
        setExistingSubmission(submission);
        setContent(submission.content || '');
      } else {
        setExistingSubmission(null);
        setContent('');
      }
    } catch (error) {
      console.error('加载提交记录失败:', error);
    } finally {
      setLoadingSubmission(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = e.target.files?.[0];
    if (selectedFile) {
      // 检查文件大小 (10MB)
      if (selectedFile.size > 10 * 1024 * 1024) {
        toast.error('文件大小不能超过10MB');
        return;
      }
      setFile(selectedFile);
    }
  };

  const handleSubmit = async () => {
    if (!assignment || !content.trim()) {
      toast.error('请填写作业内容');
      return;
    }

    try {
      setLoading(true);
      let fileUrl = existingSubmission?.file_url;

      // 上传文件（如果有）
      if (file) {
        const fileName = `${studentId}/${assignment.id}/${Date.now()}_${file.name}`;
        const uploadedUrl = await StorageService.uploadFile('submissions', fileName, file);
        if (uploadedUrl) {
          fileUrl = uploadedUrl;
        }
      }

      // 创建或更新提交
      const result = await AssignmentService.createSubmission({
        assignment_id: assignment.id,
        student_id: studentId,
        content: content.trim(),
        file_url: fileUrl
      });

      if (result) {
        toast.success(existingSubmission ? '作业更新成功' : '作业提交成功');
        onSuccess?.();
        onOpenChange(false);
        // 重置表单
        setContent('');
        setFile(null);
      } else {
        toast.error('提交失败，请重试');
      }
    } catch (error) {
      console.error('提交作业失败:', error);
      toast.error('提交失败，请重试');
    } finally {
      setLoading(false);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Clock className="w-4 h-4 text-orange-500" />;
      case 'graded':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      default:
        return <AlertCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'submitted':
        return '已提交，待批改';
      case 'graded':
        return '已批改';
      default:
        return '未提交';
    }
  };

  const isOverdue = assignment && new Date() > new Date(assignment.due_date);
  const canSubmit = !isOverdue || existingSubmission;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="w-5 h-5" />
            {existingSubmission ? '编辑作业提交' : '提交作业'}
          </DialogTitle>
        </DialogHeader>

        {loadingSubmission ? (
          <div className="flex items-center justify-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
          </div>
        ) : (
          <div className="space-y-6">
            {/* 作业信息 */}
            {assignment && (
              <Card>
                <CardContent className="pt-6">
                  <div className="space-y-2">
                    <h3 className="font-semibold text-lg">{assignment.title}</h3>
                    <p className="text-muted-foreground">{assignment.description}</p>
                    <div className="flex items-center gap-4 text-sm text-muted-foreground">
                      <span>截止时间: {new Date(assignment.due_date).toLocaleString()}</span>
                      {isOverdue && (
                        <span className="text-red-500 font-medium">已逾期</span>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 现有提交状态 */}
            {existingSubmission && (
              <Card>
                <CardContent className="pt-6">
                  <div className="flex items-center gap-2 mb-3">
                    {getStatusIcon(existingSubmission.status)}
                    <span className="font-medium">{getStatusText(existingSubmission.status)}</span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>提交时间: {new Date(existingSubmission.submitted_at).toLocaleString()}</p>
                    {existingSubmission.score !== null && (
                      <p>得分: {existingSubmission.score}分</p>
                    )}
                    {existingSubmission.feedback && (
                      <div>
                        <p className="font-medium text-foreground mt-2">教师反馈:</p>
                        <p className="bg-muted p-2 rounded">{existingSubmission.feedback}</p>
                      </div>
                    )}
                  </div>
                </CardContent>
              </Card>
            )}

            {/* 提交表单 */}
            {canSubmit && (
              <div className="space-y-4">
                <div>
                  <Label htmlFor="content">作业内容 *</Label>
                  <Textarea
                    id="content"
                    placeholder="请输入您的作业内容..."
                    value={content}
                    onChange={(e) => setContent(e.target.value)}
                    rows={8}
                    className="mt-1"
                  />
                </div>

                <div>
                  <Label htmlFor="file">附件文件 (可选)</Label>
                  <div className="mt-1">
                    <Input
                      id="file"
                      type="file"
                      onChange={handleFileChange}
                      accept=".pdf,.doc,.docx,.txt,.jpg,.jpeg,.png,.zip,.rar"
                      className="cursor-pointer"
                    />
                    {file && (
                      <p className="text-sm text-muted-foreground mt-1">
                        已选择: {file.name} ({(file.size / 1024 / 1024).toFixed(2)}MB)
                      </p>
                    )}
                    {existingSubmission?.file_url && !file && (
                      <p className="text-sm text-muted-foreground mt-1">
                        当前附件: <a href={existingSubmission.file_url} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline">查看文件</a>
                      </p>
                    )}
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    支持格式: PDF, Word, 文本, 图片, 压缩包等，最大10MB
                  </p>
                </div>
              </div>
            )}

            {!canSubmit && (
              <Card>
                <CardContent className="pt-6">
                  <div className="text-center text-muted-foreground">
                    <AlertCircle className="w-12 h-12 mx-auto mb-2 text-red-500" />
                    <p className="font-medium">作业已逾期</p>
                    <p className="text-sm">截止时间已过，无法提交作业</p>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        )}

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            取消
          </Button>
          {canSubmit && (
            <Button onClick={handleSubmit} disabled={loading || !content.trim()}>
              {loading ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  {existingSubmission ? '更新中...' : '提交中...'}
                </>
              ) : (
                <>
                  <Upload className="w-4 h-4 mr-2" />
                  {existingSubmission ? '更新提交' : '提交作业'}
                </>
              )}
            </Button>
          )}
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}