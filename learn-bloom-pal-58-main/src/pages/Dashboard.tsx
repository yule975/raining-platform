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
  const { user, profile, loading: authLoading, session } = useAuth();
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
        console.log('Dashboard: 本地快速通道命中，获取真实课程数据');
        setError(null);
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
            // 不假装知道用户应该学什么特定课程
            // 目前没有学习记录，所以不推荐具体课程
            setLastCourseId(null);
            setLastCourseTitle('');
            
            // 设置真实的课程数据
            setUserCourseCompletions(
              courses.map((c: any) => ({
                course_id: c.id,
                title: c.title,
                description: c.description || '',
                completion_percentage: 0,
                status: 'available' // 可学习状态
              }))
            );

            // 计算真实的完成统计 - 基于可访问课程数量
            const totalCourses = courses.length;
            // 这里暂时设为0，因为没有具体的完成记录API
            // 后续可以通过用户学习记录API获取真实完成数据
            setCompletionStats({ 
              completedCourses: 0, 
              completionRate: 0 
            });
            console.log('Dashboard: 课程统计', { totalCourses, completedCourses: 0 });
          } else {
            // 没有课程时的状态
            setCompletionStats({ completedCourses: 0, completionRate: 0 });
          }
        } catch (e) {
          console.warn('Dashboard: 获取课程用于继续学习失败', e);
          setCompletionStats({ completedCourses: 0, completionRate: 0 });
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
        
        // 获取真实的课程数据和学习进度
        console.log('Dashboard: 获取真实课程数据');
        
        try {
          let courses = [] as any[];
          if (currentSession?.id) {
            courses = await ApiService.getSessionCourses(currentSession.id);
          }
          if (!courses || courses.length === 0) {
            courses = await ApiService.getCourses();
          }
          
          if (courses && courses.length > 0) {
            // 诚实处理：不假装知道用户应该学什么
            // 没有学习记录时，不推荐特定课程
            setLastCourseId(null);
            setLastCourseTitle('');
            
            // 设置真实的课程完成数据
            setUserCourseCompletions(
              courses.map((c: any) => ({
                course_id: c.id,
                title: c.title,
                description: c.description || '',
                completion_percentage: 0,
                status: 'available'
              }))
            );

            // 计算真实的完成统计
            const totalCourses = courses.length;
            // 目前设为0，因为暂未实现具体的课程完成追踪
            // 这里可以根据实际的学习记录API来计算真实完成数
            const completedCount = 0;
            const completionRate = totalCourses > 0 ? Math.round((completedCount / totalCourses) * 100) : 0;
            
            setCompletionStats({
              completedCourses: completedCount,
              completionRate: completionRate
            });
            
            console.log('Dashboard: 真实课程统计', { 
              totalCourses, 
              completedCourses: completedCount, 
              completionRate 
            });
          } else {
            // 没有课程时的状态
            setCompletionStats({ completedCourses: 0, completionRate: 0 });
          }
        } catch (e) {
          console.warn('Dashboard: 获取课程数据失败', e);
          setCompletionStats({ completedCourses: 0, completionRate: 0 });
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
    // 计算真实完成的课程数（这里基于completion_percentage或status）
    const completedCourses = userCourseCompletions.filter(course => 
      course.status === 'completed' || course.completion_percentage >= 100
    ).length;
    
    const overallProgress = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0;
    
    return {
      totalCourses,
      completedCourses,
      overallProgress
    };
  };
  
  const sessionProgress = calculateSessionProgress();

  const handleStartLearning = () => {
    // 直接跳转到课程列表，让用户自己选择
    navigate('/student/courses');
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

  // 获取用户显示名称
  const getUserDisplayName = () => {
    // 优先使用profile中的full_name
    if (profile?.full_name) {
      return profile.full_name;
    }
    // 其次使用user metadata中的full_name
    if (user?.user_metadata?.full_name) {
      return user.user_metadata.full_name;
    }
    // 最后使用email的用户名部分
    if (user?.email) {
      return user.email.split('@')[0];
    }
    // 兜底显示
    return '同学';
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
                  {getGreeting()}，{getUserDisplayName()}！
                </h1>
                <p className="text-muted-foreground text-lg">
                  今天也是充满能量的一天，继续加油吧！
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">当前期次：</p>
                <Link 
                  to="/student/courses"
                  className="inline-flex items-center text-primary hover:text-primary/80 font-medium"
                >
                  {currentSession ? `《${currentSession.name}》- 浏览可学课程` : '暂无当前期次'}
                </Link>
                <div className="flex items-center space-x-2 mt-3">
                  <GraduationCap className="h-5 w-5 text-primary" />
                  <span className="text-sm text-muted-foreground">
                    已完成课程：<span className="font-semibold text-foreground">{loading ? '...' : completionStats?.completedCourses || 0}</span> 门
                  </span>
                </div>
              </div>
              <div className="mt-4 flex flex-col sm:flex-row gap-2 max-w-md">
                <Button size="lg" className="sm:flex-1" onClick={handleStartLearning}>
                  浏览课程并开始学习
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