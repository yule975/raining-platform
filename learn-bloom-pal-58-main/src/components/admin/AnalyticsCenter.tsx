import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, BarChart, Bar, FunnelChart, Funnel, Cell } from 'recharts';
import { TrendingUp, Users, BookOpen, Clock, Target, Award } from 'lucide-react';
import { ApiService } from '@/lib/api';

// Mock data
const platformTrendData = [
  { date: '2024-01-01', users: 120, learning: 850, completion: 45 },
  { date: '2024-01-02', users: 135, learning: 920, completion: 48 },
  { date: '2024-01-03', users: 145, learning: 980, completion: 52 },
  { date: '2024-01-04', users: 128, learning: 890, completion: 47 },
  { date: '2024-01-05', users: 160, learning: 1100, completion: 55 },
  { date: '2024-01-06', users: 142, learning: 980, completion: 50 },
  { date: '2024-01-07', users: 155, learning: 1050, completion: 53 },
];

const learningFunnelData = [
  { name: '浏览课程', value: 1000, fill: '#8884d8' },
  { name: '报名课程', value: 750, fill: '#83a6ed' },
  { name: '开始学习', value: 600, fill: '#8dd1e1' },
  { name: '完成50%', value: 400, fill: '#82ca9d' },
  { name: '完成100%', value: 250, fill: '#a4de6c' },
  { name: '提交作业', value: 180, fill: '#ffc658' },
];

const chapterCompletionData = [
  { chapter: '第1章：AI概述', completion: 85, difficulty: 'easy' },
  { chapter: '第2章：机器学习基础', completion: 72, difficulty: 'medium' },
  { chapter: '第3章：深度学习', completion: 58, difficulty: 'hard' },
  { chapter: '第4章：实战项目', completion: 45, difficulty: 'hard' },
  { chapter: '第5章：模型部署', completion: 38, difficulty: 'hard' },
];

const topPerformers = [
  { rank: 1, name: '张三', department: '技术部', hours: 120, courses: 8, score: 95 },
  { rank: 2, name: '李四', department: '产品部', hours: 110, courses: 7, score: 92 },
  { rank: 3, name: '王五', department: '运营部', hours: 105, courses: 6, score: 90 },
  { rank: 4, name: '赵六', department: '技术部', hours: 98, courses: 6, score: 88 },
  { rank: 5, name: '陈七', department: '市场部', hours: 95, courses: 5, score: 85 },
];

const userSegmentData = [
  { segment: '高价值用户', count: 150, description: '学习时间>50h，完成率>80%' },
  { segment: '潜力用户', count: 380, description: '学习时间20-50h，完成率50-80%' },
  { segment: '普通用户', count: 920, description: '学习时间5-20h，完成率30-50%' },
  { segment: '流失风险', count: 245, description: '学习时间<5h，完成率<30%' },
];

const AnalyticsCenter = () => {
  const [selectedCourse, setSelectedCourse] = useState("ai-basic");
  const [timeRange, setTimeRange] = useState("30d");
  const [courseCompletionStats, setCourseCompletionStats] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // 期次制培训相关状态
  const [trainingSessions, setTrainingSessions] = useState([]);
  const [selectedSession, setSelectedSession] = useState("");
  const [sessionStats, setSessionStats] = useState(null);
  const [sessionLoading, setSessionLoading] = useState(true);

  useEffect(() => {
    const fetchCompletionStats = async () => {
      try {
        setLoading(true);
        const stats = await ApiService.getCourseCompletionStats();
        setCourseCompletionStats(stats);
      } catch (error) {
        console.error('获取课程完成统计失败:', error);
      } finally {
        setLoading(false);
      }
    };

    const fetchTrainingSessions = async () => {
      try {
        const sessions = await ApiService.getTrainingSessions();
        setTrainingSessions(sessions);
        
        // 默认选择当前期次
        const currentSession = sessions.find(s => s.is_current);
        if (currentSession) {
          setSelectedSession(currentSession.id);
        } else if (sessions.length > 0) {
          setSelectedSession(sessions[0].id);
        }
      } catch (error) {
        console.error('获取培训期次失败:', error);
      }
    };

    fetchCompletionStats();
    fetchTrainingSessions();
  }, []);
  
  // 获取期次统计数据
  useEffect(() => {
    const fetchSessionStats = async () => {
      if (!selectedSession) return;
      
      try {
        setSessionLoading(true);
        const stats = await ApiService.getSessionCompletionStats(selectedSession);
        setSessionStats(stats);
      } catch (error) {
        console.error('获取期次统计失败:', error);
      } finally {
        setSessionLoading(false);
      }
    };

    fetchSessionStats();
  }, [selectedSession]);

  const getDifficultyBadge = (difficulty: string) => {
    switch (difficulty) {
      case 'easy':
        return <Badge className="bg-green-100 text-green-800">简单</Badge>;
      case 'medium':
        return <Badge className="bg-yellow-100 text-yellow-800">中等</Badge>;
      case 'hard':
        return <Badge className="bg-red-100 text-red-800">困难</Badge>;
      default:
        return <Badge variant="secondary">{difficulty}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">数据分析中心</h2>

      <Tabs defaultValue="platform" className="space-y-4">
        <TabsList>
          <TabsTrigger value="platform">平台概览</TabsTrigger>
          <TabsTrigger value="course">课程分析</TabsTrigger>
          <TabsTrigger value="user">用户行为</TabsTrigger>
        </TabsList>

        <TabsContent value="platform" className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-lg font-semibold">平台整体分析</h3>
            <div className="flex items-center space-x-4">
              <Select value={selectedSession} onValueChange={setSelectedSession}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="选择培训期次" />
                </SelectTrigger>
                <SelectContent>
                  {trainingSessions.map((session) => (
                    <SelectItem key={session.id} value={session.id}>
                      {session.name} {session.is_current && '(当前期次)'}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={timeRange} onValueChange={setTimeRange}>
                <SelectTrigger className="w-[150px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="7d">最近7天</SelectItem>
                  <SelectItem value="30d">最近30天</SelectItem>
                  <SelectItem value="90d">最近90天</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
          
          {/* 期次统计卡片 */}
          {selectedSession && (
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">期次学员数</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sessionLoading ? '...' : sessionStats?.totalStudents || 0}</div>
                  <p className="text-xs text-muted-foreground">当前期次注册学员</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">期次课程数</CardTitle>
                  <BookOpen className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sessionLoading ? '...' : sessionStats?.totalCourses || 0}</div>
                  <p className="text-xs text-muted-foreground">期次内课程总数</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">期次完成数</CardTitle>
                  <Award className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sessionLoading ? '...' : sessionStats?.totalCompletions || 0}</div>
                  <p className="text-xs text-muted-foreground">期次课程完成总数</p>
                </CardContent>
              </Card>
              
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">期次完成率</CardTitle>
                  <Target className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{sessionLoading ? '...' : `${sessionStats?.overallCompletionRate || 0}%`}</div>
                  <p className="text-xs text-muted-foreground">期次整体完课率</p>
                </CardContent>
              </Card>
            </div>
           )}
           
           {/* 期次课程完成详情 */}
           {selectedSession && sessionStats && (
             <Card>
               <CardHeader>
                 <CardTitle>期次课程完成详情</CardTitle>
                 <CardDescription>各课程在当前期次的完成情况统计</CardDescription>
               </CardHeader>
               <CardContent>
                 <div className="overflow-x-auto">
                   <table className="w-full">
                     <thead>
                       <tr className="border-b">
                         <th className="text-left p-2">课程名称</th>
                         <th className="text-center p-2">视频完成</th>
                         <th className="text-center p-2">作业完成</th>
                         <th className="text-center p-2">课程完成</th>
                         <th className="text-center p-2">完成率</th>
                       </tr>
                     </thead>
                     <tbody>
                       {sessionStats.courseStats.map((course) => (
                         <tr key={course.courseId} className="border-b hover:bg-gray-50">
                           <td className="p-2 font-medium">{course.courseTitle}</td>
                           <td className="text-center p-2">
                             <span className="text-sm">
                               {course.videoCompletions}/{sessionStats.totalStudents}
                             </span>
                             <div className="text-xs text-gray-500">
                               ({course.videoCompletionRate}%)
                             </div>
                           </td>
                           <td className="text-center p-2">
                             <span className="text-sm">
                               {course.assignmentCompletions}/{sessionStats.totalStudents}
                             </span>
                             <div className="text-xs text-gray-500">
                               ({course.assignmentCompletionRate}%)
                             </div>
                           </td>
                           <td className="text-center p-2">
                             <span className="text-sm">
                               {course.courseCompletions}/{sessionStats.totalStudents}
                             </span>
                             <div className="text-xs text-gray-500">
                               ({course.courseCompletionRate}%)
                             </div>
                           </td>
                           <td className="text-center p-2">
                             <div className="flex items-center justify-center">
                               <div className="w-16 bg-gray-200 rounded-full h-2 mr-2">
                                 <div 
                                   className="bg-blue-600 h-2 rounded-full" 
                                   style={{ width: `${course.courseCompletionRate}%` }}
                                 ></div>
                               </div>
                               <span className="text-sm font-medium">{course.courseCompletionRate}%</span>
                             </div>
                           </td>
                         </tr>
                       ))}
                     </tbody>
                   </table>
                 </div>
               </CardContent>
             </Card>
           )}
 
           {/* 核心指标卡片 */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总用户数</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : courseCompletionStats?.totalUsers || 0}</div>
                <p className="text-xs text-muted-foreground">平台注册用户</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总课程数</CardTitle>
                <BookOpen className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : courseCompletionStats?.totalCourses || 0}</div>
                <p className="text-xs text-muted-foreground">平台课程总数</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">总完成数</CardTitle>
                <Award className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : courseCompletionStats?.totalCompletions || 0}</div>
                <p className="text-xs text-muted-foreground">课程完成总数</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">平均完成率</CardTitle>
                <Target className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{loading ? '...' : `${courseCompletionStats?.averageCompletionRate || 0}%`}</div>
                <p className="text-xs text-muted-foreground">整体完课率</p>
              </CardContent>
            </Card>
          </div>

          {/* 课程完成率统计表 */}
          <Card>
            <CardHeader>
              <CardTitle>课程完成率详情</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <div className="text-center py-8">加载中...</div>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>课程名称</TableHead>
                      <TableHead>报名人数</TableHead>
                      <TableHead>完成人数</TableHead>
                      <TableHead>完成率</TableHead>
                      <TableHead>状态</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {courseCompletionStats?.courseDetails?.map((course, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{course.title}</TableCell>
                        <TableCell>{course.enrollments}</TableCell>
                        <TableCell>{course.completions}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <span>{course.completionRate}%</span>
                            <div className="w-16 h-2 bg-gray-200 rounded-full">
                              <div 
                                className="h-2 bg-blue-500 rounded-full" 
                                style={{ width: `${course.completionRate}%` }}
                              />
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge 
                            variant={course.completionRate >= 70 ? "default" : course.completionRate >= 40 ? "secondary" : "destructive"}
                          >
                            {course.completionRate >= 70 ? "优秀" : course.completionRate >= 40 ? "良好" : "待改进"}
                          </Badge>
                        </TableCell>
                      </TableRow>
                    )) || (
                      <TableRow>
                        <TableCell colSpan={5} className="text-center text-muted-foreground">
                          暂无数据
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>

          {/* 趋势图表 */}
          <Card>
            <CardHeader>
              <CardTitle>平台趋势分析</CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <AreaChart data={platformTrendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Area type="monotone" dataKey="users" stackId="1" stroke="#8884d8" fill="#8884d8" />
                  <Area type="monotone" dataKey="learning" stackId="2" stroke="#82ca9d" fill="#82ca9d" />
                </AreaChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="course" className="space-y-4">
          <div className="flex items-center space-x-4">
            <h3 className="text-lg font-semibold">课程深度分析</h3>
            <Select value={selectedCourse} onValueChange={setSelectedCourse}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ai-basic">AI基础入门</SelectItem>
                <SelectItem value="python">Python编程</SelectItem>
                <SelectItem value="data-analysis">数据分析</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* 课程核心指标 */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">340</div>
                <p className="text-sm text-muted-foreground">报名人数</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">65%</div>
                <p className="text-sm text-muted-foreground">完课率</p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-2xl font-bold">4.6</div>
                <p className="text-sm text-muted-foreground">满意度评分</p>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 学习漏斗图 */}
            <Card>
              <CardHeader>
                <CardTitle>学习转化漏斗</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <BarChart data={learningFunnelData} layout="horizontal">
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" />
                    <YAxis dataKey="name" type="category" width={80} />
                    <Tooltip />
                    <Bar dataKey="value" fill="#8884d8" />
                  </BarChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 章节完成率 */}
            <Card>
              <CardHeader>
                <CardTitle>章节完成率分析</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>章节</TableHead>
                      <TableHead>完成率</TableHead>
                      <TableHead>难度</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {chapterCompletionData.map((chapter, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{chapter.chapter}</TableCell>
                        <TableCell>
                          <div className="flex items-center space-x-2">
                            <div className="w-16 bg-gray-200 rounded-full h-2">
                              <div 
                                className="bg-blue-600 h-2 rounded-full" 
                                style={{ width: `${chapter.completion}%` }}
                              />
                            </div>
                            <span className="text-sm">{chapter.completion}%</span>
                          </div>
                        </TableCell>
                        <TableCell>{getDifficultyBadge(chapter.difficulty)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="user" className="space-y-4">
          <h3 className="text-lg font-semibold">用户行为分析</h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* 用户分层 */}
            <Card>
              <CardHeader>
                <CardTitle>用户分层模型</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {userSegmentData.map((segment, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div>
                        <p className="font-medium">{segment.segment}</p>
                        <p className="text-sm text-muted-foreground">{segment.description}</p>
                      </div>
                      <Badge variant="outline">{segment.count}</Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* 学霸排行榜 */}
            <Card>
              <CardHeader>
                <CardTitle>学霸排行榜</CardTitle>
              </CardHeader>
              <CardContent>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>排名</TableHead>
                      <TableHead>姓名</TableHead>
                      <TableHead>部门</TableHead>
                      <TableHead>学习时长</TableHead>
                      <TableHead>完成课程</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {topPerformers.map((performer) => (
                      <TableRow key={performer.rank}>
                        <TableCell>
                          <Badge variant={performer.rank <= 3 ? "default" : "secondary"}>
                            #{performer.rank}
                          </Badge>
                        </TableCell>
                        <TableCell className="font-medium">{performer.name}</TableCell>
                        <TableCell>{performer.department}</TableCell>
                        <TableCell>{performer.hours}h</TableCell>
                        <TableCell>{performer.courses}门</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default AnalyticsCenter;