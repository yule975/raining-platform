import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Search, Filter, Users, Star, Clock, Play, BookOpen, Grid, List } from "lucide-react";
// Removed useAppStore import - migrated to Supabase
import { ApiService } from "@/lib/api";
import { LoadingSpinner, CardSkeleton } from "@/components/ui/loading-spinner";
// ErrorDisplay component removed - not exported from ErrorBoundary
import { Course, TrainingSession } from "@/lib/types";
import courseLLM from "@/assets/course-llm.jpg";
import courseAIArt from "@/assets/course-ai-art.jpg";

const Courses = () => {
  const navigate = useNavigate();
  // Migrated to Supabase - removed useAppStore dependency
  const [courses, setCourses] = useState<Course[]>([]);
  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
  const [isMember, setIsMember] = useState<boolean>(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [sortBy, setSortBy] = useState("latest");
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);

  // 数据加载和调试
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 先获取当前期次
        console.log('获取当前期次...');
        const session = await ApiService.getCurrentSession();
        setCurrentSession(session);
        
        if (session) {
          // 如果有当前期次，获取期次关联的课程
          console.log('获取期次关联的课程，期次ID:', session.id);
          // 校验用户是否属于该期次（若未登录，则视为非成员）
          let member = true;
          try {
            // 优先从user_profile获取（学员登录后设置的）
            let userId = null;
            const userProfile = localStorage.getItem('user_profile');
            if (userProfile) {
              const parsed = JSON.parse(userProfile);
              userId = parsed?.id;
            } else {
              // 兼容demo_user
              const demoUser = localStorage.getItem('demo_user');
              if (demoUser) {
                const parsed = JSON.parse(demoUser);
                userId = parsed?.id || parsed?.user?.id;
              }
            }
            
            if (userId) {
              member = await ApiService.isSessionMember(session.id, userId);
              console.log('期次成员检查:', { userId, sessionId: session.id, isMember: member });
            } else {
              console.warn('未找到用户ID，默认为期次成员');
            }
          } catch (err) {
            console.error('期次成员检查失败:', err);
          }
          setIsMember(member);
          if (member) {
            const courseData = await ApiService.getSessionCourses(session.id);
            setCourses(courseData || []);
            console.log('成功获取期次课程数据，课程数量:', courseData?.length || 0);
          } else {
            setCourses([]);
            console.warn('当前用户不属于该期次，禁止展示课程列表');
          }
        } else {
          // 如果没有当前期次，显示所有课程
          console.log('没有当前期次，获取所有课程...');
          const courseData = await ApiService.getCourses();
          setCourses(courseData || []);
          console.log('成功获取所有课程数据，课程数量:', courseData?.length || 0);
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('课程加载失败:', err);
        setError(err instanceof Error ? err : new Error('加载课程失败'));
        setIsLoading(false);
      }
    };

    loadCourses();
  }, []); // 移除courses依赖，避免无限循环

  const handleRetry = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      // 先获取当前期次
      console.log('重新获取当前期次...');
      const session = await ApiService.getCurrentSession();
      setCurrentSession(session);
      
      if (session) {
        // 如果有当前期次，获取期次关联的课程
        console.log('重新获取期次关联的课程，期次ID:', session.id);
        const courseData = await ApiService.getSessionCourses(session.id);
        setCourses(courseData || []);
        console.log('重试成功，获取期次课程数据，课程数量:', courseData?.length || 0);
      } else {
        // 如果没有当前期次，显示所有课程
        console.log('重新获取所有课程...');
        const courseData = await ApiService.getCourses();
        setCourses(courseData || []);
        console.log('重试成功，获取所有课程数据，课程数量:', courseData?.length || 0);
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('重试失败:', err);
      setCourses([]);
      setIsLoading(false);
    }
  };

  const categories = [
    { id: "all", name: "全部课程" },
    { id: "llm", name: "大语言模型" },
    { id: "ai-art", name: "AI绘画" },
    { id: "ml", name: "机器学习" },
    { id: "dev", name: "开发实战" },
    { id: "theory", name: "理论基础" }
  ];



  const filteredCourses = courses.filter(course => {
    const matchesSearch = course.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         course.description.toLowerCase().includes(searchQuery.toLowerCase());
    // 暂时忽略分类过滤，因为Course类型中没有category字段
    const matchesCategory = selectedCategory === "all";
    return matchesSearch && matchesCategory;
  });

  const sortedCourses = [...filteredCourses].sort((a, b) => {
    switch (sortBy) {
      case "rating":
        // 暂时按学生数量排序，因为Course类型中没有rating字段
        return (b.studentCount || 0) - (a.studentCount || 0);
      case "students":
        return (b.studentCount || 0) - (a.studentCount || 0);
      case "latest":
      default:
        return new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime();
    }
  });



  // 错误状态
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <Card className="max-w-md mx-auto">
          <CardHeader>
            <CardTitle className="text-red-600">加载失败</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground mb-4">{error.message}</p>
            <Button onClick={handleRetry} className="w-full">
              重试
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">课程中心</h1>
          <p className="text-muted-foreground">探索AI技术的无限可能，提升您的专业技能</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {Array.from({ length: 6 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-foreground mb-2">课程中心</h1>
        {currentSession ? (
          <p className="text-muted-foreground">当前期次：{currentSession.name}</p>
        ) : (
          <p className="text-muted-foreground">探索AI技术的无限可能，提升您的专业技能</p>
        )}
        {currentSession && !isMember && (
          <div className="mt-3 p-3 border border-yellow-200 bg-yellow-50 rounded text-sm text-yellow-700">
            您尚未被分配到当前期次，暂无法查看课程列表。请联系管理员分配期次，或稍后重试。
          </div>
        )}
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <div className="md:col-span-2">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
            <Input
              placeholder="搜索课程或讲师..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10"
            />
          </div>
        </div>
        
        <Select value={selectedCategory} onValueChange={setSelectedCategory}>
          <SelectTrigger>
            <SelectValue placeholder="选择分类" />
          </SelectTrigger>
          <SelectContent>
            {categories.map((category) => (
              <SelectItem key={category.id} value={category.id}>
                {category.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Select value={sortBy} onValueChange={setSortBy}>
          <SelectTrigger>
            <SelectValue placeholder="排序方式" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="latest">最新发布</SelectItem>
            <SelectItem value="rating">评分最高</SelectItem>
            <SelectItem value="students">最受欢迎</SelectItem>
          </SelectContent>
        </Select>
      </div>

      {/* Course Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {sortedCourses.map((course) => (
          <Card 
            key={course.id} 
            className="group cursor-pointer shadow-card hover:shadow-floating transition-all duration-300 hover:-translate-y-1"
            onClick={() => navigate(`/student/course/${course.id}`)}
          >
            <div className="relative overflow-hidden rounded-t-lg">
              <img 
                src={course.cover || courseLLM} 
                alt={course.title}
                className="w-full h-48 object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute bottom-2 right-2 bg-black/70 text-white px-2 py-1 rounded text-sm">
                {course.duration || '待定'}
              </div>
              <div className="absolute inset-0 bg-black/60 opacity-0 group-hover:opacity-100 transition-opacity duration-300 flex items-center justify-center">
                <Button className="bg-primary hover:bg-primary/90 text-primary-foreground">
                  <Play className="mr-2 w-4 h-4" />
                  开始学习
                </Button>
              </div>
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2 group-hover:text-primary transition-colors">
                {course.title}
              </h3>
              <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                {course.description}
              </p>
              <p className="text-sm text-muted-foreground mb-3">
                讲师：{course.instructor}
              </p>
              
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-3">
                <div className="flex items-center space-x-3">
                  <div className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {course.studentCount || 0}人学习
                  </div>
                  <div className="flex items-center">
                    <Clock className="w-4 h-4 mr-1" />
                    {course.duration || '待定'}
                  </div>
                </div>
                <div className="flex items-center">
                  完成率: {Math.round((course.completionRate || 0) * 100)}%
                </div>
              </div>
              
              <Button variant="outline" className="w-full group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                查看详情
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Empty State */}
      {sortedCourses.length === 0 && (
        <div className="text-center py-12">
          <Filter className="mx-auto h-12 w-12 text-muted-foreground mb-4" />
          <h3 className="text-lg font-medium text-foreground mb-2">没有找到相关课程</h3>
          <p className="text-muted-foreground">请尝试调整搜索条件或分类筛选</p>
        </div>
      )}
    </div>
  );
};

export default Courses;