import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Button } from "@/components/ui/button";
import { 
  Users, 
  BookOpen, 
  Clock, 
  TrendingUp, 
  TrendingDown,
  Activity, 
  Star,
  AlertTriangle,
  CheckCircle,
  BarChart3,
  Filter,
  Calendar,
  Award,
  Target
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  Area,
  AreaChart
} from "recharts";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

// Enhanced platform statistics
const platformStats = {
  totalUsers: 2847,
  dailyActiveUsers: 456,
  weeklyActiveUsers: 1234,
  totalCourses: 24,
  totalLearningHours: 15680,
  avgCompletionRate: 78.5
};

// 30-day user activity data
const userActivityTrend = [
  { date: "1月1日", dau: 320, wau: 1100 },
  { date: "1月2日", dau: 412, wau: 1150 },
  { date: "1月3日", dau: 508, wau: 1200 },
  { date: "1月4日", dau: 456, wau: 1234 },
  { date: "1月5日", dau: 398, wau: 1189 },
  { date: "1月6日", dau: 234, wau: 1098 },
  { date: "1月7日", dau: 189, wau: 1045 },
  { date: "1月8日", dau: 445, wau: 1156 },
  { date: "1月9日", dau: 523, wau: 1278 },
  { date: "1月10日", dau: 467, wau: 1298 },
];

// Top courses by different metrics
const topCoursesByEnrollment = [
  { name: "机器学习入门", value: 567, satisfaction: 4.3 },
  { name: "AI绘画基础", value: 458, satisfaction: 4.6 },
  { name: "LLM应用开发", value: 321, satisfaction: 4.4 },
  { name: "深度学习实战", value: 234, satisfaction: 4.8 },
  { name: "计算机视觉", value: 189, satisfaction: 4.2 }
];

const topCoursesByTime = [
  { name: "深度学习实战", value: 2340, satisfaction: 4.8 },
  { name: "机器学习入门", value: 1890, satisfaction: 4.3 },
  { name: "LLM应用开发", value: 1567, satisfaction: 4.4 },
  { name: "AI绘画基础", value: 1234, satisfaction: 4.6 },
  { name: "自然语言处理", value: 987, satisfaction: 4.1 }
];

const topCoursesByCompletion = [
  { name: "深度学习实战", value: 91, satisfaction: 4.8 },
  { name: "AI绘画基础", value: 85, satisfaction: 4.6 },
  { name: "自然语言处理", value: 83, satisfaction: 4.1 },
  { name: "LLM应用开发", value: 72, satisfaction: 4.4 },
  { name: "机器学习入门", value: 68, satisfaction: 4.3 }
];

// Department learning distribution
const departmentLearning = [
  { name: "技术部", value: 35, hours: 5600, color: "#3B82F6" },
  { name: "产品部", value: 28, hours: 4200, color: "#10B981" },
  { name: "运营部", value: 20, hours: 3100, color: "#F59E0B" },
  { name: "市场部", value: 17, hours: 2780, color: "#EF4444" }
];

// Learning funnel data for selected course
const learningFunnelData = [
  { stage: "浏览课程详情页", users: 1000, percentage: 100 },
  { stage: "报名课程", users: 800, percentage: 80 },
  { stage: "开始学习第一节", users: 750, percentage: 75 },
  { stage: "完成50%的课时", users: 400, percentage: 40 },
  { stage: "提交作业", users: 300, percentage: 30 },
  { stage: "完成所有课程", users: 280, percentage: 28 }
];

// Chapter completion details
const chapterDetails = [
  { chapter: "第1章：AI绘画概述", learners: 458, completed: 445, rate: 97 },
  { chapter: "第2章：基础工具使用", learners: 445, completed: 398, rate: 89 },
  { chapter: "第3章：风格迁移技术", learners: 398, completed: 287, rate: 72 },
  { chapter: "第4章：高级创作技巧", learners: 287, completed: 156, rate: 54 },
  { chapter: "第5章：作品集制作", learners: 156, completed: 134, rate: 86 },
  { chapter: "第6章：商业应用案例", learners: 134, completed: 128, rate: 96 }
];

// Platform announcements
const platformAnnouncements = [
  { title: "新增《GPT-4应用实战》课程", date: "2024-01-15", type: "新课程" },
  { title: "平台维护通知：1月20日02:00-04:00", date: "2024-01-14", type: "系统公告" },
  { title: "《AI绘画基础》课程内容更新", date: "2024-01-13", type: "课程更新" },
  { title: "春节期间客服服务时间调整", date: "2024-01-12", type: "服务公告" }
];

export function DataDashboard() {
  const [selectedCourse, setSelectedCourse] = useState("AI绘画基础");
  const [rankingMetric, setRankingMetric] = useState("enrollments");
  const [activeTab, setActiveTab] = useState("overview");

  const getCurrentRankingData = () => {
    switch (rankingMetric) {
      case "enrollments": return topCoursesByEnrollment;
      case "time": return topCoursesByTime;
      case "completion": return topCoursesByCompletion;
      default: return topCoursesByEnrollment;
    }
  };

  const getRankingLabel = () => {
    switch (rankingMetric) {
      case "enrollments": return "报名人数";
      case "time": return "学习时长(小时)";
      case "completion": return "完课率(%)";
      default: return "报名人数";
    }
  };

  return (
    <div className="space-y-8">
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="overview">平台概览</TabsTrigger>
          <TabsTrigger value="course-analysis">课程分析</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-8">
          {/* 核心KPI卡片 - 最醒目的位置 */}
          <div className="space-y-4">
            <h2 className="text-2xl font-bold text-foreground">核心KPI指标</h2>
            <div className="grid grid-cols-2 lg:grid-cols-6 gap-6">
              <Card className="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950 dark:to-blue-900 border-blue-200 dark:border-blue-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-blue-700 dark:text-blue-300">总用户数</CardTitle>
                  <Users className="h-5 w-5 text-blue-600 dark:text-blue-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-blue-900 dark:text-blue-100">
                    {platformStats.totalUsers.toLocaleString()}
                  </div>
                  <div className="flex items-center text-xs text-blue-600 dark:text-blue-400 mt-2">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>+23 ⬆️ 本周</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-950 dark:to-green-900 border-green-200 dark:border-green-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-green-700 dark:text-green-300">日活用户(DAU)</CardTitle>
                  <Activity className="h-5 w-5 text-green-600 dark:text-green-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-green-900 dark:text-green-100">
                    {platformStats.dailyActiveUsers}
                  </div>
                  <div className="flex items-center text-xs text-green-600 dark:text-green-400 mt-2">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>+8.2% 较昨日</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950 dark:to-purple-900 border-purple-200 dark:border-purple-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-purple-700 dark:text-purple-300">周活用户(WAU)</CardTitle>
                  <Calendar className="h-5 w-5 text-purple-600 dark:text-purple-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-purple-900 dark:text-purple-100">
                    {platformStats.weeklyActiveUsers.toLocaleString()}
                  </div>
                  <div className="flex items-center text-xs text-purple-600 dark:text-purple-400 mt-2">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>+15.3% 较上周</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-950 dark:to-orange-900 border-orange-200 dark:border-orange-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-orange-700 dark:text-orange-300">总课程数</CardTitle>
                  <BookOpen className="h-5 w-5 text-orange-600 dark:text-orange-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-orange-900 dark:text-orange-100">
                    {platformStats.totalCourses}
                  </div>
                  <div className="flex items-center text-xs text-orange-600 dark:text-orange-400 mt-2">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>+2 本月新增</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950 dark:to-amber-900 border-amber-200 dark:border-amber-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-amber-700 dark:text-amber-300">总学习时长</CardTitle>
                  <Clock className="h-5 w-5 text-amber-600 dark:text-amber-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-amber-900 dark:text-amber-100">
                    {(platformStats.totalLearningHours / 1000).toFixed(1)}K
                  </div>
                  <div className="text-xs text-amber-600 dark:text-amber-400 mt-1">小时</div>
                  <div className="flex items-center text-xs text-amber-600 dark:text-amber-400 mt-1">
                    <TrendingUp className="h-3 w-3 mr-1" />
                    <span>+12.5% 本月</span>
                  </div>
                </CardContent>
              </Card>

              <Card className="bg-gradient-to-br from-emerald-50 to-emerald-100 dark:from-emerald-950 dark:to-emerald-900 border-emerald-200 dark:border-emerald-800">
                <CardHeader className="pb-3">
                  <CardTitle className="text-sm font-medium text-emerald-700 dark:text-emerald-300">平均完课率</CardTitle>
                  <Target className="h-5 w-5 text-emerald-600 dark:text-emerald-400" />
                </CardHeader>
                <CardContent>
                  <div className="text-3xl font-bold text-emerald-900 dark:text-emerald-100">
                    {platformStats.avgCompletionRate}%
                  </div>
                  <div className="flex items-center text-xs text-red-600 dark:text-red-400 mt-2">
                    <TrendingDown className="h-3 w-3 mr-1 rotate-180" />
                    <span>-2.1% 较上月</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          </div>

          {/* 核心趋势图表 */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* 用户活跃度趋势图 */}
            <Card className="lg:col-span-2">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <BarChart3 className="h-5 w-5" />
                  用户活跃度趋势 (最近10天)
                </CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <AreaChart data={userActivityTrend}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis />
                    <Tooltip />
                    <Legend />
                    <Area 
                      type="monotone" 
                      dataKey="dau" 
                      stackId="1"
                      stroke="#3B82F6" 
                      fill="#3B82F6"
                      fillOpacity={0.6}
                      name="日活跃用户(DAU)"
                    />
                    <Area 
                      type="monotone" 
                      dataKey="wau" 
                      stackId="2"
                      stroke="#10B981" 
                      fill="#10B981"
                      fillOpacity={0.3}
                      name="周活跃用户(WAU)"
                    />
                  </AreaChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* 部门学习投入度概览 */}
            <Card>
              <CardHeader>
                <CardTitle>部门学习投入度</CardTitle>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={departmentLearning}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, value }) => `${name}: ${value}%`}
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {departmentLearning.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                      ))}
                    </Pie>
                    <Tooltip formatter={(value, name) => [`${value}%`, name]} />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* 热门课程排行榜 */}
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>热门课程排行榜 (Top 5)</CardTitle>
                <Select value={rankingMetric} onValueChange={setRankingMetric}>
                  <SelectTrigger className="w-40">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="enrollments">按报名人数</SelectItem>
                    <SelectItem value="time">按学习时长</SelectItem>
                    <SelectItem value="completion">按完课率</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={getCurrentRankingData()} layout="horizontal">
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis type="number" />
                  <YAxis dataKey="name" type="category" width={120} />
                  <Tooltip 
                    formatter={(value, name, props) => [
                      value, 
                      getRankingLabel(),
                      `满意度: ${props.payload.satisfaction}/5`
                    ]} 
                  />
                  <Bar 
                    dataKey="value" 
                    fill="#3B82F6"
                    radius={[0, 4, 4, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* 平台公告/最新动态 */}
          <Card>
            <CardHeader>
              <CardTitle>平台最新动态</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {platformAnnouncements.map((announcement, index) => (
                  <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center gap-3">
                      <Badge variant="outline">{announcement.type}</Badge>
                      <span className="font-medium">{announcement.title}</span>
                    </div>
                    <span className="text-sm text-muted-foreground">{announcement.date}</span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="course-analysis" className="space-y-6">
          {/* 课程筛选器 */}
          <Card>
            <CardHeader>
              <CardTitle>课程分析筛选</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex gap-4">
                <Select value={selectedCourse} onValueChange={setSelectedCourse}>
                  <SelectTrigger className="w-60">
                    <SelectValue placeholder="选择要分析的课程" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="AI绘画基础">AI绘画基础</SelectItem>
                    <SelectItem value="LLM应用开发">LLM应用开发</SelectItem>
                    <SelectItem value="机器学习入门">机器学习入门</SelectItem>
                    <SelectItem value="深度学习实战">深度学习实战</SelectItem>
                  </SelectContent>
                </Select>
                <Button variant="outline">
                  <Filter className="h-4 w-4 mr-2" />
                  应用筛选
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* 单个课程健康度仪表盘 */}
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">报名人数</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">458</div>
                <p className="text-xs text-muted-foreground">+12 本周</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">学习人次</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">1,247</div>
                <p className="text-xs text-muted-foreground">总访问</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">完课率</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">85%</div>
                <p className="text-xs text-green-600">优秀水平</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">平均学习时长</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">4.2h</div>
                <p className="text-xs text-muted-foreground">每人</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">作业平均分</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">87.5</div>
                <p className="text-xs text-muted-foreground">满分100</p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-sm">满意度评分</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="text-2xl font-bold">4.6</div>
                  <Star className="h-4 w-4 fill-yellow-400 text-yellow-400" />
                </div>
                <p className="text-xs text-muted-foreground">共158个评价</p>
              </CardContent>
            </Card>
          </div>

          {/* 学员学习漏斗 */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <AlertTriangle className="h-5 w-5 text-orange-500" />
                学员学习漏斗分析 - {selectedCourse}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                {learningFunnelData.map((item, index) => {
                  const isDropoffPoint = item.percentage < learningFunnelData[index - 1]?.percentage * 0.7;
                  return (
                    <div key={item.stage} className="relative">
                      <div className={`flex items-center justify-between p-4 border rounded-lg ${
                        isDropoffPoint ? 'bg-red-50 dark:bg-red-950 border-red-200 dark:border-red-800' : 'bg-muted/30'
                      }`}>
                        <div className="flex items-center gap-3">
                          <div className={`flex items-center justify-center w-8 h-8 rounded-full text-sm font-bold ${
                            isDropoffPoint ? 'bg-red-500 text-white' : 'bg-primary text-primary-foreground'
                          }`}>
                            {index + 1}
                          </div>
                          <span className="font-medium">{item.stage}</span>
                          {isDropoffPoint && (
                            <Badge variant="destructive" className="text-xs">
                              重大流失节点
                            </Badge>
                          )}
                        </div>
                        
                        <div className="flex items-center gap-4">
                          <div className="text-right">
                            <div className="font-semibold">{item.users}人</div>
                            <div className="text-sm text-muted-foreground">{item.percentage}%</div>
                          </div>
                          <div className="w-32">
                            <Progress value={item.percentage} className="h-2" />
                          </div>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>

          {/* 章节完课率详情 */}
          <Card>
            <CardHeader>
              <CardTitle>章节完课率详情 - {selectedCourse}</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left p-3">章节名称</th>
                      <th className="text-center p-3">学习人数</th>
                      <th className="text-center p-3">完成人数</th>
                      <th className="text-center p-3">完成率</th>
                      <th className="text-center p-3">状态</th>
                    </tr>
                  </thead>
                  <tbody>
                    {chapterDetails
                      .sort((a, b) => a.rate - b.rate)
                      .map((chapter, index) => (
                        <tr key={chapter.chapter} className="border-b hover:bg-muted/50">
                          <td className="p-3 font-medium">{chapter.chapter}</td>
                          <td className="text-center p-3">{chapter.learners}</td>
                          <td className="text-center p-3">{chapter.completed}</td>
                          <td className="text-center p-3">
                            <div className="flex items-center justify-center gap-2">
                              <span className={`font-semibold ${
                                chapter.rate < 60 ? 'text-red-600' : 
                                chapter.rate < 80 ? 'text-orange-600' : 'text-green-600'
                              }`}>
                                {chapter.rate}%
                              </span>
                              <div className="w-16">
                                <Progress value={chapter.rate} className="h-1" />
                              </div>
                            </div>
                          </td>
                          <td className="text-center p-3">
                            {chapter.rate < 60 ? (
                              <Badge variant="destructive">需要优化</Badge>
                            ) : chapter.rate < 80 ? (
                              <Badge variant="secondary">待提升</Badge>
                            ) : (
                              <Badge variant="default">表现良好</Badge>
                            )}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}