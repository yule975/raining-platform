import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Link, useNavigate } from "react-router-dom";
import { Clock, Users, TrendingUp, BookOpen, Play, Star, GraduationCap, PlayCircle, CheckCircle, Lock, Award, Trophy, AlertCircle } from "lucide-react";
import heroBanner from "@/assets/hero-banner.jpg";
import courseLLM from "@/assets/course-llm.jpg";
import courseAIArt from "@/assets/course-ai-art.jpg";
import FloatingAIAssistant from "@/components/FloatingAIAssistant";
import { ApiService } from "@/lib/api";
import { useState, useEffect } from "react";
import { useAuth } from "@/contexts/AuthContext";
import { useSession } from "@/contexts/SessionContext";
import { toast } from "sonner";

const Dashboard = () => {
  const { user, loading: authLoading, session } = useAuth();
  const { currentSession, loading: sessionLoading } = useSession();
  const navigate = useNavigate();
  const [completionStats, setCompletionStats] = useState({
    completedCourses: 0,
    completionRate: 0
  });
  const [userCourseCompletions, setUserCourseCompletions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [lastCourseId, setLastCourseId] = useState<string | null>(null);
  const [lastCourseTitle, setLastCourseTitle] = useState<string>("");

  useEffect(() => {
    const fetchDashboardData = async () => {
      console.log('Dashboard: 开始获取数据...', {
        authLoading,
        sessionLoading,
        hasUser: !!user,
        hasSession: !!session,
        hasCurrentSession: !!currentSession
      });

      // 本地就绪快速通道：如果本地已存在认证与期次信息，直接渲染，避免因上游loading阻塞
      const authToken = localStorage.getItem('auth_token');
      const userRole = localStorage.getItem('user_role');
      const selectedSessionId = localStorage.getItem('selectedSessionId');
      if (authToken && userRole === 'student' && selectedSessionId) {
        console.log('Dashboard: 本地快速通道命中，直接使用模拟数据渲染');
        setError(null);
        setCompletionStats({ completedCourses: 2, completionRate: 40 });
        try {
          // 优先取期次课程，其次取所有课程
          let courses = [] as any[];
          try {
            const sessionCourses = await ApiService.getSessionCourses(selectedSessionId);
            courses = sessionCourses;
          } catch (e) {
            console.warn('Dashboard: 获取期次课程失败，改为获取全部课程');
          }
          if (!courses || courses.length === 0) {
            courses = await ApiService.getCourses();
          }
          if (courses && courses.length > 0) {
            setLastCourseId(courses[0].id);
            setLastCourseTitle(courses[0].title || '继续学习');
            // 用课程列表填充一个简单的展示数组
            setUserCourseCompletions(
              courses.slice(0, 2).map((c: any) => ({
                course_id: c.id,
                title: c.title,
                description: c.description || '',
                completion_percentage: 0,
                status: 'in_progress'
              }))
            );
          }
        } catch (e) {
          console.warn('Dashboard: 获取课程用于继续学习失败', e);
        }
        setLoading(false);
        return;
      }
      
      // 如果认证或期次还在加载中，等待
      if (authLoading || sessionLoading) {
        console.log('Dashboard: 等待认证或期次加载...');
        return;
      }
      
      // 如果没有用户或会话，显示错误
      if (!user || !session) {
        console.log('Dashboard: 缺少用户或会话');
        setError('请先登录后再访问Dashboard');
        setLoading(false);
        return;
      }

      // 如果没有选择期次，跳转到期次选择页面
      if (!currentSession) {
        console.log('Dashboard: 没有当前期次');
        setError('请先选择培训期次');
        setLoading(false);
        return;
      }

      try {
        console.log('Dashboard: 开始获取用户数据...');
        setError(null);
        
        // 临时使用模拟数据，避免API调用问题
        console.log('Dashboard: 使用模拟数据');
        setCompletionStats({
          completedCourses: 2,
          completionRate: 40
        });
        
        // 设置模拟的课程数据
        try {
          let courses = [] as any[];
          if (currentSession?.id) {
            courses = await ApiService.getSessionCourses(currentSession.id);
          }
          if (!courses || courses.length === 0) {
            courses = await ApiService.getCourses();
          }
          if (courses && courses.length > 0) {
            setLastCourseId(courses[0].id);
            setLastCourseTitle(courses[0].title || '继续学习');
            setUserCourseCompletions(
              courses.slice(0, 2).map((c: any) => ({
                course_id: c.id,
                title: c.title,
                description: c.description || '',
                completion_percentage: 0,
                status: 'in_progress'
              }))
            );
          }
        } catch (e) {
          console.warn('Dashboard: 获取课程用于继续学习失败', e);
        }
        
        console.log('Dashboard: 数据设置完成');
      } catch (error) {
        console.error('获取Dashboard数据失败:', error);
        setError('获取数据失败，请刷新页面重试');
        toast.error('获取Dashboard数据失败');
      } finally {
        console.log('Dashboard: 设置loading为false');
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [user, session, authLoading, currentSession, sessionLoading]);
  // 计算当前期次的学习进度
  const calculateSessionProgress = () => {
    if (!currentSession || !userCourseCompletions.length) {
      return {
        totalCourses: 0,
        completedCourses: 0,
        overallProgress: 0
      };
    }
    
    const totalCourses = userCourseCompletions.length;
    const completedCourses = userCourseCompletions.length; // 这里显示的是用户有权限访问的课程数
    const overallProgress = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
    
    return {
      totalCourses,
      completedCourses,
      overallProgress
    };
  };
  
  const sessionProgress = calculateSessionProgress();

  const handleContinue = () => {
    if (lastCourseId) {
      navigate(`/student/course/${lastCourseId}`);
    } else {
      toast.error('未找到可学习的课程');
    }
  };

  // Current Lesson Progress
  const currentLesson = {
    moduleNumber: "1",
    title: lastCourseTitle || "暂无课程",
    module: lastCourseTitle || "暂无课程",
    watchTime: "0:00",
    totalTime: "--:--",
    progress: 0
  };

  // Learning Path Progress
  const learningPath = [
    {
      module: "模块1: AI基础概念",
      status: "completed",
      lessons: 4,
      completedLessons: 4
    },
    {
      module: "模块2: 机器学习入门",
      status: "completed", 
      lessons: 6,
      completedLessons: 6
    },
    {
      module: "模块3: 大语言模型基础",
      status: "current",
      lessons: 5,
      completedLessons: 2
    },
    {
      module: "模块4: 模型微调技术",
      status: "locked",
      lessons: 5,
      completedLessons: 0
    }
  ];

  // Upcoming Training Series
  const upcomingTrainingSeries = [
    {
      id: 2,
      title: "AI绘画专项培训 · 第二期",
      status: "即将开班",
      startDate: "2024年3月15日",
      duration: "6周",
      totalHours: 24,
      enrollmentStatus: "可报名"
    },
    {
      id: 3,
      title: "AI数字人专项 · 第一期",
      status: "报名中",
      startDate: "2024年4月1日", 
      duration: "8周",
      totalHours: 32,
      enrollmentStatus: "限额招生"
    }
  ];


  // 获取当前时间问候语
  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "上午好";
    if (hour < 18) return "下午好";
    return "晚上好";
  };

  // 如果认证或期次还在加载中，显示加载状态
  if (authLoading || sessionLoading || loading) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // 如果有错误，显示错误状态
  if (error) {
    return (
      <div className="container mx-auto p-6 flex items-center justify-center min-h-[400px]">
        <Card className="w-full max-w-md">
          <CardContent className="pt-6">
            <div className="text-center space-y-4">
              <AlertCircle className="h-12 w-12 text-destructive mx-auto" />
              <div>
                <h3 className="text-lg font-semibold">访问受限</h3>
                <p className="text-muted-foreground mt-2">{error}</p>
              </div>
              <div className="space-y-2">
                <Link to="/login">
                  <Button className="w-full">前往登录</Button>
                </Link>
                <Button 
                  variant="outline" 
                  className="w-full"
                  onClick={() => window.location.reload()}
                >
                  刷新页面
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 space-y-8">
      {/* My Learning Snapshot */}
      <section className="relative overflow-hidden rounded-xl border">
        {/* Background Hero Image */}
        <div 
          className="absolute inset-0 bg-cover bg-center opacity-20"
          style={{ backgroundImage: `url(${heroBanner})` }}
        />
        <div className="absolute inset-0 bg-gradient-to-r from-background/80 to-muted/60" />
        
        <div className="relative z-10 p-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 items-center">
            {/* Left Side: Personalized Greeting */}
            <div className="space-y-4">
              <div>
                <h1 className="text-3xl font-bold text-foreground mb-2">
                  {getGreeting()}，张同学！
                </h1>
                <p className="text-muted-foreground text-lg">
                  今天也是充满能量的一天，继续加油吧！
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">上次学习到：</p>
                <Link 
                  to={lastCourseId ? `/student/course/${lastCourseId}` : '/student/courses'}
                  className="inline-flex items-center text-primary hover:text-primary/80 font-medium"
                >
                  {currentSession ? `《${currentSession.name}》- 当前期次学习` : '暂无当前期次'}
                </Link>
                <div className="flex items-center space-x-2 mt-3">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    已完成课程：<span className="font-semibold text-foreground">{loading ? '...' : completionStats?.completedCourses || 0}</span> 门
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-2 max-w-md">
                <Button size="lg" className="sm:flex-1" onClick={handleContinue} disabled={!lastCourseId}>
                  {lastCourseTitle ? `继续：${lastCourseTitle}` : '继续上次学习'}
                </Button>
                <Link to="/student/courses" className="sm:flex-1">
                  <Button size="lg" variant="outline" className="w-full">查看全部课程</Button>
                </Link>
              </div>
              {/* 精简：在问候卡片内展示期次进度 */}
              <div className="mt-4 max-w-xl">
                <div className="flex items-center justify-between text-sm text-muted-foreground mb-1">
                  <span>课程进度（{currentSession ? currentSession.name : '暂无期次'}）</span>
                  <span>{sessionProgress.completedCourses}/{sessionProgress.totalCourses} 课程可学</span>
                </div>
                <Progress value={sessionProgress.overallProgress} className="h-2" />
              </div>
              {/* 已按要求精简：移除公告/作业芯片与课程列表，仅保留进度与按钮 */}
            </div>
            

          </div>
        </div>
      </section>

      {/* 已精简：移除下方重复卡片，主CTA与进度已并入上方问候区 */}
    </div>
  );
};

export default Dashboard;