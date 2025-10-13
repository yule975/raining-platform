import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { ApiService } from "@/lib/api";
import { Assignment, AssignmentSubmission } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  FileText,
  Upload,
  Download,
  Edit,
  Clock,
  BookOpen,
  CheckCircle,
  AlertCircle
} from "lucide-react";
import courseLLM from "@/assets/course-llm.jpg";
import courseAIArt from "@/assets/course-ai-art.jpg";

// 扩展Assignment类型以支持UI需要的额外字段
interface AssignmentWithSubmission extends Assignment {
  courseName: string;
  courseImage: string;
  submission?: AssignmentSubmission;
}

const MyLearning = () => {
  const { toast } = useToast();
  const { user, profile, loading: authLoading } = useAuth();
  const [assignments, setAssignments] = useState<AssignmentWithSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submissionText, setSubmissionText] = useState<{[key: string]: string}>({});
  const [uploadedFiles, setUploadedFiles] = useState<{[key: string]: File[]}>({});
  const [isSubmitting, setIsSubmitting] = useState<{[key: string]: boolean}>({});

  // 获取当前用户ID
  const currentStudentId = user?.id || profile?.id;

  // 🚀 加载真实作业数据
  useEffect(() => {
    const loadAssignments = async () => {
      // 确保用户已登录且有有效的用户ID
      if (!currentStudentId) {
        console.log('用户ID不存在，跳过加载作业');
        setIsLoading(false);
        return;
      }

      try {
        setIsLoading(true);
        setError(null);

        // 获取所有作业
        const allAssignments = await ApiService.getAssignments();
        
        // 获取所有课程
        const allCourses = await ApiService.getCourses();
        
        // 获取当前学生的提交记录
        const submissions = await ApiService.getStudentSubmissions(currentStudentId);
        
        // 创建课程映射
        const courseMap = new Map(allCourses.map(course => [course.id, course]));
        
        // 合并作业和提交数据
        const assignmentsWithSubmissions: AssignmentWithSubmission[] = allAssignments.map(assignment => {
          const course = courseMap.get(assignment.id.split('-')[0]) || allCourses[0]; // 简单的课程匹配逻辑
          const submission = submissions.find(sub => sub.assignment_id === assignment.id);

          return {
            ...assignment,
            courseName: course?.title || '未知课程',
            courseImage: course?.id === 'course-llm' ? courseLLM : courseAIArt,
            submission
          };
        });

        setAssignments(assignmentsWithSubmissions);
      } catch (error) {
        console.error('加载作业失败:', error);
        setError('加载作业失败，请稍后重试');
        toast({
          title: "加载失败",
          description: "无法加载作业列表，请检查网络连接",
          variant: "destructive",
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadAssignments();
  }, [currentStudentId, toast]);

  // 处理文件上传
  const handleFileUpload = (assignmentId: string, files: FileList | null) => {
    if (!files) return;
    
    const fileArray = Array.from(files);
    setUploadedFiles(prev => ({
      ...prev,
      [assignmentId]: fileArray
    }));
  };

  // 处理作业提交
  const handleSubmit = async (assignmentId: string) => {
    // 确保用户已登录
    if (!currentStudentId) {
      toast({
        title: "提交失败",
        description: "请先登录后再提交作业",
        variant: "destructive",
      });
      return;
    }

    try {
      setIsSubmitting(prev => ({ ...prev, [assignmentId]: true }));
      
      const content = submissionText[assignmentId] || '';
      const files = uploadedFiles[assignmentId] || [];
      
      if (!content.trim() && files.length === 0) {
        toast({
          title: "提交失败",
          description: "请输入文本内容或上传文件",
          variant: "destructive",
        });
        return;
      }

      // 创建提交数据
      const submissionData = {
        assignment_id: assignmentId,
        student_id: currentStudentId,
        content: content.trim(),
        files: files.map(file => ({
          name: file.name,
          size: file.size,
          type: file.type
        })),
        file_count: files.length,
        total_file_size: files.reduce((total, file) => total + file.size, 0),
        submitted_at: new Date().toISOString()
      };

      // 提交到后端
      await ApiService.createSubmission(submissionData);
      
      // 更新本地状态
      setAssignments(prev => prev.map(assignment => {
        if (assignment.id === assignmentId) {
          return {
            ...assignment,
            submission: submissionData
          };
        }
        return assignment;
      }));
      
      // 清空表单
      setSubmissionText(prev => ({ ...prev, [assignmentId]: '' }));
      setUploadedFiles(prev => ({ ...prev, [assignmentId]: [] }));
      
      toast({
        title: "提交成功",
        description: "作业已成功提交",
      });
    } catch (error) {
      console.error('提交作业失败:', error);
      toast({
        title: "提交失败",
        description: "提交作业时发生错误，请重试",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(prev => ({ ...prev, [assignmentId]: false }));
    }
  };

  // 处理更新提交
  const handleUpdateSubmission = (assignmentId: string) => {
    const assignment = assignments.find(a => a.id === assignmentId);
    if (assignment?.submission) {
      setSubmissionText(prev => ({
        ...prev,
        [assignmentId]: assignment.submission?.content || ''
      }));
    }
  };

  // 获取作业状态
  const getAssignmentStatus = (assignment: AssignmentWithSubmission) => {
    if (assignment.submission) {
      if (assignment.submission.score !== undefined) {
        return { status: 'graded', label: '已批改', color: 'bg-green-600' };
      }
      return { status: 'submitted', label: '已提交', color: 'bg-blue-600' };
    }
    
    const dueDate = new Date(assignment.due_date);
    const now = new Date();
    
    if (now > dueDate) {
      return { status: 'overdue', label: '已逾期', color: 'bg-red-600' };
    }
    
    return { status: 'pending', label: '待提交', color: 'bg-yellow-600' };
  };

  // 认证状态检查
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner className="w-8 h-8" />
        <span className="ml-2 text-muted-foreground">正在验证身份...</span>
      </div>
    );
  }

  // 未登录处理
  if (!user && !profile) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="w-12 h-12 text-yellow-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">请先登录</h3>
          <p className="text-muted-foreground mb-4">您需要登录后才能查看作业</p>
          <Button onClick={() => window.location.href = '/login'}>前往登录</Button>
        </div>
      </div>
    );
  }

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <LoadingSpinner className="w-8 h-8" />
        <span className="ml-2 text-muted-foreground">加载作业中...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] space-y-4">
        <AlertCircle className="w-12 h-12 text-red-500" />
        <div className="text-center">
          <h3 className="text-lg font-semibold text-foreground mb-2">加载失败</h3>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()}>重新加载</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">我的学习</h1>
        <p className="text-muted-foreground">查看和提交您的作业</p>
      </div>

      {assignments.length === 0 ? (
        <div className="text-center py-12">
          <BookOpen className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
          <h3 className="text-xl font-semibold text-foreground mb-2">暂无作业</h3>
          <p className="text-muted-foreground">目前没有分配给您的作业</p>
        </div>
      ) : (
        <div className="grid gap-6">
          {assignments.map((assignment) => {
            const status = getAssignmentStatus(assignment);
            const existingSubmission = assignment.submission?.assignment_id === assignment.id ? assignment.submission : null;
            
            return (
              <Card key={assignment.id} className="overflow-hidden">
                <CardHeader className="pb-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-4">
                      <img 
                        src={assignment.courseImage} 
                        alt={assignment.courseName}
                        className="w-16 h-16 rounded-lg object-cover"
                      />
                      <div className="flex-1">
                        <div className="flex items-center space-x-2 mb-2">
                          <Badge variant="outline" className="text-xs">
                            {assignment.courseName}
                          </Badge>
                          <Badge className={status.color}>
                            {status.label}
                          </Badge>
                        </div>
                        <CardTitle className="text-xl mb-2">{assignment.title}</CardTitle>
                        <div className="flex items-center text-sm text-muted-foreground space-x-4">
                          <span className="flex items-center">
                            <Clock className="w-4 h-4 mr-1" />
                            截止: {assignment.due_date}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                
                <CardContent className="space-y-6">
                  {/* 作业描述 */}
                  <div>
                    <h4 className="font-medium text-foreground mb-2">作业描述</h4>
                    <p className="text-muted-foreground text-sm leading-relaxed">
                      {assignment.description}
                    </p>
                  </div>

                  {/* 作业要求 */}
                  {assignment.requirements && assignment.requirements.length > 0 && (
                    <div>
                      <h4 className="font-medium text-foreground mb-2">作业要求</h4>
                      <ul className="list-disc list-inside space-y-1 text-sm text-muted-foreground">
                        {assignment.requirements.map((req, index) => (
                          <li key={index}>
                            <span>{req}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* 已提交状态显示 */}
                  {assignment.submission && (
                    <div className="bg-green-50 dark:bg-green-950/20 p-4 rounded-lg border border-green-200 dark:border-green-800">
                      <div className="flex items-center justify-between mb-3">
                        <h4 className="font-medium text-green-900 dark:text-green-100">已提交内容</h4>
                        <div className="flex items-center text-green-700 dark:text-green-300 text-sm">
                          <CheckCircle className="w-4 h-4 mr-1" />
                          提交时间: {assignment.submission.submitted_at ? new Date(assignment.submission.submitted_at).toLocaleString() : '未知'}
                        </div>
                      </div>
                      
                      {assignment.submission.content && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-1">提交内容:</p>
                          <p className="text-green-700 dark:text-green-300 text-sm bg-white dark:bg-green-950/30 p-2 rounded">
                            {assignment.submission.content}
                          </p>
                        </div>
                      )}
                      
                      {assignment.submission.files && assignment.submission.files.length > 0 && (
                        <div className="mb-3">
                          <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">
                            提交的文件 ({assignment.submission.file_count}):
                          </p>
                          <div className="flex flex-wrap gap-2">
                            {assignment.submission.files.map((file, index) => (
                              <Badge key={index} variant="outline" className="bg-green-100 dark:bg-green-900/30 border-green-300 dark:border-green-700">
                                <FileText className="w-3 h-3 mr-1" />
                                {file.name}
                              </Badge>
                            ))}
                          </div>
                          <p className="text-xs text-green-600 mt-1">
                            总大小: {(assignment.submission.total_file_size / 1024 / 1024).toFixed(2)} MB
                          </p>
                        </div>
                      )}

                      {assignment.submission.score !== undefined && (
                        <div className="mt-4 p-3 bg-green-100 dark:bg-green-900/30 border border-green-300 dark:border-green-700 rounded">
                          <div className="flex items-center justify-between mb-2">
                            <span className="font-medium text-green-800 dark:text-green-200">
                              已提交
                            </span>
                            <Badge className="bg-green-600">已批改</Badge>
                          </div>
                          {assignment.submission.feedback && (
                            <p className="text-sm text-green-700 dark:text-green-300">{assignment.submission.feedback}</p>
                          )}
                        </div>
                      )}
                    </div>
                  )}

                  {/* 作业提交区域 */}
                  {!assignment.submission && (
                    <div className="bg-gray-50 dark:bg-gray-900/50 p-6 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600">
                      <h4 className="font-medium text-foreground mb-4">作业提交</h4>
                      
                      <div className="space-y-4">
                        <div>
                          <label className="block text-sm font-medium text-foreground mb-2">
                            文本内容 (链接、回答等)
                          </label>
                          <Textarea
                            placeholder="请粘贴作业链接或输入简短回答..."
                            value={submissionText[assignment.id] || ""}
                            onChange={(e) => setSubmissionText(prev => ({
                              ...prev,
                              [assignment.id]: e.target.value
                            }))}
                            className="min-h-[100px]"
                          />
                        </div>

                        {assignment.allow_file_upload && (
                          <div>
                            <label className="block text-sm font-medium text-foreground mb-2">
                              文件上传
                            </label>
                            <div className="mb-2 text-xs text-muted-foreground">
                              <p>允许的文件类型: {assignment.allowed_file_types}</p>
                              <p>单个文件大小限制: {assignment.max_file_size_mb}MB</p>
                            </div>
                            <div className="flex items-center justify-center w-full">
                              <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                                <div className="flex flex-col items-center justify-center pt-5 pb-6">
                                  <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                                  <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                                    <span className="font-semibold">点击上传</span> 或拖拽文件到此处
                                  </p>
                                  <p className="text-xs text-gray-500 dark:text-gray-400">
                                    支持: {assignment.allowed_file_types?.replace(/,/g, ', ').toUpperCase() || ''}
                                  </p>
                                </div>
                                <input
                                  type="file"
                                  multiple
                                  accept={assignment.allowed_file_types?.split(',').map(type => `.${type.trim()}`).join(',') || ''}
                                  className="hidden"
                                  onChange={(e) => handleFileUpload(assignment.id, e.target.files)}
                                />
                              </label>
                            </div>
                          </div>
                        )}
                          
                        {uploadedFiles[assignment.id] && uploadedFiles[assignment.id].length > 0 && (
                          <div className="mt-2">
                            <p className="text-sm font-medium text-foreground mb-2">已选择的文件:</p>
                            <div className="flex flex-wrap gap-2">
                              {uploadedFiles[assignment.id].map((file, index) => (
                                <Badge key={index} variant="outline" className="flex items-center">
                                  <FileText className="w-3 h-3 mr-1" />
                                  {file.name}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>

                      <div className="flex justify-end space-x-2 pt-4">
                        <Button
                          onClick={() => handleSubmit(assignment.id)}
                          disabled={isSubmitting[assignment.id]}
                          className="bg-primary hover:bg-primary/90"
                        >
                          {isSubmitting[assignment.id] ? (
                            <>
                              <LoadingSpinner className="w-4 h-4 mr-2" />
                              提交中...
                            </>
                          ) : (
                            <>
                              <Upload className="w-4 h-4 mr-2" />
                              提交作业
                            </>
                          )}
                        </Button>
                      </div>
                    </div>
                  )}

                  {/* 操作按钮 */}
                  {assignment.submission && (
                    <div className="flex items-center justify-end space-x-2 pt-4 border-t">
                      <Button 
                        variant="outline"
                        onClick={() => handleUpdateSubmission(assignment.id)}
                      >
                        <Edit className="w-4 h-4 mr-2" />
                        修改提交
                      </Button>
                    </div>
                  )}
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyLearning;