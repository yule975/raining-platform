import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ApiService } from "@/lib/api";
import { AssignmentSubmission, Assignment, Course } from "@/lib/types";
import { LoadingSpinner } from "@/components/ui/loading-spinner";
import { 
  BookOpen,
  Eye,
  CheckCircle,
  Clock,
  FileText,
  Download,
  Users,
  Filter,
  AlertCircle,
  RefreshCw
} from "lucide-react";

const AssignmentManagement = () => {
  const { toast } = useToast();
  
  // 🚀 真实数据状态
  const [courses, setCourses] = useState<Course[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [allSubmissions, setAllSubmissions] = useState<AssignmentSubmission[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // 筛选状态
  const [selectedCourse, setSelectedCourse] = useState<string>("all");
  const [selectedAssignment, setSelectedAssignment] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selectedSubmission, setSelectedSubmission] = useState<AssignmentSubmission | null>(null);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);

  // 🚀 加载真实数据
  useEffect(() => {
    const loadData = async () => {
      try {
        setIsLoading(true);
        setError(null);

        console.log('正在加载管理员作业数据...');
        
        // 并行加载课程、作业和提交数据，添加超时控制
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('请求超时')), 15000); // 15秒超时
        });

        const results = await Promise.allSettled([
          Promise.race([ApiService.getCourses(), timeoutPromise]),
          Promise.race([ApiService.getAssignments(), timeoutPromise]),
          Promise.race([ApiService.getSubmissions(), timeoutPromise])
        ]);

        // 处理课程数据
        if (results[0].status === 'fulfilled') {
          setCourses(results[0].value);
        } else {
          console.error('加载课程失败:', results[0].reason);
          setCourses([]); // 设置为空数组作为降级方案
        }

        // 处理作业数据
        if (results[1].status === 'fulfilled') {
          setAssignments(results[1].value);
        } else {
          console.error('加载作业失败:', results[1].reason);
          setAssignments([]); // 设置为空数组作为降级方案
        }

        // 处理提交数据
        if (results[2].status === 'fulfilled') {
          setAllSubmissions(results[2].value);
        } else {
          console.error('加载提交数据失败:', results[2].reason);
          setAllSubmissions([]); // 设置为空数组作为降级方案
        }

        // 检查是否有任何请求失败
        const failedRequests = results.filter(result => result.status === 'rejected');
        if (failedRequests.length > 0) {
          const errorMessages = failedRequests.map((result, index) => {
            const apiNames = ['课程', '作业', '提交数据'];
            return `${apiNames[results.indexOf(result)]}: ${result.reason?.message || '未知错误'}`;
          });
          
          setError(`部分数据加载失败: ${errorMessages.join(', ')}`);
          toast({
            title: "部分数据加载失败",
            description: `${errorMessages.join(', ')}。已显示可用数据。`,
            variant: "destructive"
          });
        } else {
          console.log('数据加载完成:', {
            courses: results[0].status === 'fulfilled' ? results[0].value.length : 0,
            assignments: results[1].status === 'fulfilled' ? results[1].value.length : 0,
            submissions: results[2].status === 'fulfilled' ? results[2].value.length : 0
          });
        }

      } catch (err) {
        console.error('加载数据失败:', err);
        setError(err instanceof Error ? err.message : '加载失败');
        toast({
          title: "加载失败",
          description: "无法加载作业数据，请重试",
          variant: "destructive"
        });
      } finally {
        setIsLoading(false);
      }
    };

    loadData();
  }, [toast]);

  // 手动刷新数据
  const handleRefresh = () => {
    window.location.reload(); // 简单的刷新方式
  };

  // 根据选择的课程和作业筛选提交数据
  const getFilteredSubmissions = () => {
    let filtered = allSubmissions;

    if (selectedCourse && selectedCourse !== "all") {
      filtered = filtered.filter(s => s.courseId === selectedCourse);
    }

    if (selectedAssignment && selectedAssignment !== "all") {
      filtered = filtered.filter(s => s.assignmentId === selectedAssignment);
    }

    if (filterStatus !== "all") {
      filtered = filtered.filter(s => s.status === filterStatus);
    }

    return filtered;
  };

  // 获取当前课程的作业列表
  const getAssignmentsForCourse = () => {
    if (selectedCourse === "all") return assignments;
    return assignments.filter(assignment => {
      // 通过课程ID匹配作业
      // 这里需要确保作业数据包含course_id字段
      return assignment.id.includes(selectedCourse) || 
             assignments.some(a => a.id === assignment.id);
    });
  };

  const filteredSubmissions = getFilteredSubmissions();

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'submitted':
        return <Badge className="bg-blue-100 text-blue-800">已提交</Badge>;
      case 'graded':
        return <Badge className="bg-green-100 text-green-800">已批改</Badge>;
      case 'not_submitted':
        return <Badge variant="outline" className="text-gray-600">未提交</Badge>;
      default:
        return <Badge variant="outline" className="text-gray-600">未知</Badge>;
    }
  };

  const handleViewSubmission = (submission: AssignmentSubmission) => {
    setSelectedSubmission(submission);
    setIsDetailDialogOpen(true);
  };

  const getSubmissionStats = () => {
    const total = filteredSubmissions.length;
    const submitted = filteredSubmissions.filter(s => s.status === 'submitted').length;
    const graded = filteredSubmissions.filter(s => s.status === 'graded').length;
    const notSubmitted = filteredSubmissions.filter(s => s.status === 'not_submitted').length;
    const submissionRate = total > 0 ? Math.round(((submitted + graded) / total) * 100) : 0;

    return { total, submitted, graded, notSubmitted, submissionRate };
  };

  const stats = getSubmissionStats();

  // 加载状态
  if (isLoading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">学员作业管理</h2>
            <p className="text-muted-foreground">跟踪和查看学员的作业提交情况</p>
          </div>
        </div>
        <div className="flex items-center justify-center py-12">
          <LoadingSpinner />
          <span className="ml-2 text-muted-foreground">正在加载作业数据...</span>
        </div>
      </div>
    );
  }

  // 错误状态
  if (error) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-foreground">学员作业管理</h2>
            <p className="text-muted-foreground">跟踪和查看学员的作业提交情况</p>
          </div>
        </div>
        <div className="flex flex-col items-center justify-center py-12 space-y-4">
          <AlertCircle className="w-12 h-12 text-red-500" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground mb-2">加载失败</h3>
            <p className="text-muted-foreground mb-4">{error}</p>
            <Button onClick={handleRefresh}>
              <RefreshCw className="w-4 h-4 mr-2" />
              重新加载
            </Button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">学员作业管理</h2>
          <p className="text-muted-foreground">跟踪和查看学员的作业提交情况</p>
          {allSubmissions.length > 0 && (
            <p className="text-sm text-muted-foreground mt-1">
              共 {allSubmissions.length} 条提交记录，{assignments.length} 个作业
            </p>
          )}
        </div>
        <Button variant="outline" onClick={handleRefresh}>
          <RefreshCw className="w-4 h-4 mr-2" />
          刷新数据
        </Button>
      </div>

      {/* 筛选器 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center">
            <Filter className="w-5 h-5 mr-2" />
            筛选条件
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2">选择课程</label>
              <Select 
                value={selectedCourse} 
                onValueChange={(value) => {
                  setSelectedCourse(value);
                  setSelectedAssignment("all"); // 重置作业选择
                }}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择课程" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部课程</SelectItem>
                  {courses.map((course) => (
                    <SelectItem key={course.id} value={course.id}>
                      {course.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">选择作业</label>
              <Select 
                value={selectedAssignment} 
                onValueChange={setSelectedAssignment}
                disabled={!selectedCourse || selectedCourse === "all"}
              >
                <SelectTrigger>
                  <SelectValue placeholder="选择作业" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部作业</SelectItem>
                  {getAssignmentsForCourse().map((assignment) => (
                    <SelectItem key={assignment.id} value={assignment.id}>
                      {assignment.title}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div>
              <label className="block text-sm font-medium mb-2">提交状态</label>
              <Select value={filterStatus} onValueChange={setFilterStatus}>
                <SelectTrigger>
                  <SelectValue placeholder="选择状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="submitted">已提交</SelectItem>
                  <SelectItem value="graded">已批改</SelectItem>
                  <SelectItem value="not_submitted">未提交</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 统计信息 */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold">{stats.total}</div>
            <p className="text-sm text-muted-foreground">总提交数</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-blue-600">{stats.submitted}</div>
            <p className="text-sm text-muted-foreground">已提交</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-green-600">{stats.graded}</div>
            <p className="text-sm text-muted-foreground">已批改</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-orange-600">{stats.notSubmitted}</div>
            <p className="text-sm text-muted-foreground">未提交</p>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="text-2xl font-bold text-purple-600">{stats.submissionRate}%</div>
            <p className="text-sm text-muted-foreground">提交率</p>
          </CardContent>
        </Card>
      </div>

      {/* 学员列表 */}
      <Card>
        <CardHeader>
          <CardTitle>学员提交情况</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>学员姓名</TableHead>
                <TableHead>邮箱</TableHead>
                <TableHead>课程</TableHead>
                <TableHead>作业</TableHead>
                <TableHead>状态</TableHead>
                <TableHead>提交时间</TableHead>
                <TableHead>操作</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredSubmissions.map((submission) => (
                <TableRow key={submission.id}>
                  <TableCell className="font-medium">{submission.studentName}</TableCell>
                  <TableCell>{submission.studentEmail}</TableCell>
                  <TableCell>{submission.courseName}</TableCell>
                  <TableCell className="max-w-xs truncate">{submission.assignmentTitle}</TableCell>
                  <TableCell>{getStatusBadge(submission.status)}</TableCell>
                  <TableCell>{submission.submittedAt || '-'}</TableCell>
                  <TableCell>
                    {submission.status === 'submitted' ? (
                      <Button 
                        variant="ghost" 
                        size="sm"
                        onClick={() => handleViewSubmission(submission)}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                </TableRow>
              ))}
              {filteredSubmissions.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="text-center text-muted-foreground py-8">
                    暂无数据
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* 作业详情对话框 */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>作业提交详情</DialogTitle>
          </DialogHeader>
          
          {selectedSubmission && (
            <div className="space-y-6">
              {/* 基本信息 */}
              <div className="grid grid-cols-2 gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div>
                  <h4 className="font-medium text-foreground mb-2">学员信息</h4>
                  <p className="text-sm"><strong>姓名：</strong>{selectedSubmission.studentName}</p>
                  <p className="text-sm"><strong>邮箱：</strong>{selectedSubmission.studentEmail}</p>
                  <p className="text-sm"><strong>提交时间：</strong>{selectedSubmission.submittedAt}</p>
                </div>
                <div>
                  <h4 className="font-medium text-foreground mb-2">作业信息</h4>
                  <p className="text-sm"><strong>课程：</strong>{selectedSubmission.courseName}</p>
                  <p className="text-sm"><strong>作业：</strong>{selectedSubmission.assignmentTitle}</p>
                  <p className="text-sm flex items-center">
                    <strong>状态：</strong>
                    <span className="ml-2">{getStatusBadge(selectedSubmission.status)}</span>
                  </p>
                </div>
              </div>

              {/* 提交内容 */}
              <div>
                <h4 className="font-medium text-foreground mb-3">提交内容</h4>
                <div className="p-4 bg-white dark:bg-gray-950 border rounded-lg">
                  <pre className="whitespace-pre-wrap text-sm font-sans">
                    {selectedSubmission.submittedText || "无文本内容"}
                  </pre>
                </div>
              </div>

              {/* 提交文件 */}
              {selectedSubmission.submittedFiles && selectedSubmission.submittedFiles.length > 0 && (
                <div>
                  <h4 className="font-medium text-foreground mb-3">提交文件</h4>
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                    {selectedSubmission.submittedFiles.map((file, index) => (
                      <div key={index} className="flex items-center p-2 bg-gray-50 dark:bg-gray-900 rounded border">
                        <FileText className="w-4 h-4 mr-2 text-blue-500" />
                        <span className="text-sm truncate">{file}</span>
                        <Button variant="ghost" size="sm" className="ml-auto">
                          <Download className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* 评分和反馈 */}
              {selectedSubmission.score !== undefined && (
                <div className="p-4 bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-800 rounded-lg">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-medium text-green-900 dark:text-green-100">评分结果</h4>
                    <div className="flex items-center">
                      <CheckCircle className="w-4 h-4 mr-1 text-green-600" />
                      <span className="font-bold text-green-700 dark:text-green-300">
                        {selectedSubmission.score}/100
                      </span>
                    </div>
                  </div>
                  {selectedSubmission.feedback && (
                    <div>
                      <p className="text-sm font-medium text-green-800 dark:text-green-200 mb-2">教师反馈：</p>
                      <p className="text-sm text-green-700 dark:text-green-300">
                        {selectedSubmission.feedback}
                      </p>
                    </div>
                  )}
                </div>
              )}

              <div className="flex justify-end">
                <Button variant="outline" onClick={() => setIsDetailDialogOpen(false)}>
                  关闭
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssignmentManagement;