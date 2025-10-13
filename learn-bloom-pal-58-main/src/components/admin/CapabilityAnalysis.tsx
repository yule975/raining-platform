import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { 
  Brain, 
  TrendingUp, 
  Users, 
  Award,
  Target,
  BookOpen
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
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  ScatterChart,
  Scatter,
  Cell
} from "recharts";

// Mock data for organizational capability analysis
const skillDistribution = [
  {
    skill: "机器学习基础",
    beginner: 45,
    intermediate: 35,
    advanced: 20,
    total: 234
  },
  {
    skill: "深度学习",
    beginner: 52,
    intermediate: 28,
    advanced: 20,
    total: 189
  },
  {
    skill: "自然语言处理",
    beginner: 60,
    intermediate: 25,
    advanced: 15,
    total: 156
  },
  {
    skill: "计算机视觉",
    beginner: 48,
    intermediate: 32,
    advanced: 20,
    total: 203
  },
  {
    skill: "AI绘画",
    beginner: 38,
    intermediate: 42,
    advanced: 20,
    total: 312
  },
  {
    skill: "LLM应用开发",
    beginner: 55,
    intermediate: 30,
    advanced: 15,
    total: 278
  }
];

const departmentCapability = [
  {
    department: "产品部",
    aiBasics: 85,
    mlPractice: 70,
    dataAnalysis: 90,
    aiApplication: 80,
    ethicsCompliance: 75
  },
  {
    department: "技术部",
    aiBasics: 92,
    mlPractice: 88,
    dataAnalysis: 85,
    aiApplication: 95,
    ethicsCompliance: 70
  },
  {
    department: "运营部",
    aiBasics: 75,
    mlPractice: 60,
    dataAnalysis: 85,
    aiApplication: 78,
    ethicsCompliance: 88
  },
  {
    department: "市场部",
    aiBasics: 70,
    mlPractice: 55,
    dataAnalysis: 80,
    aiApplication: 75,
    ethicsCompliance: 82
  }
];

const learningProgress = [
  { name: "新手", value: 48, color: "#EF4444" },
  { name: "进阶", value: 32, color: "#F59E0B" },
  { name: "高级", value: 20, color: "#10B981" }
];

const skillGapAnalysis = [
  {
    skill: "AI伦理与合规",
    currentLevel: 65,
    targetLevel: 85,
    gap: 20,
    priority: "高"
  },
  {
    skill: "模型部署与运维", 
    currentLevel: 55,
    targetLevel: 80,
    gap: 25,
    priority: "高"
  },
  {
    skill: "数据隐私保护",
    currentLevel: 70,
    targetLevel: 90,
    gap: 20,
    priority: "中"
  },
  {
    skill: "AI产品设计",
    currentLevel: 75,
    targetLevel: 85,
    gap: 10,
    priority: "中"
  }
];

const topPerformers = [
  { name: "张伟", department: "技术部", score: 95, courses: 8 },
  { name: "李娜", department: "产品部", score: 92, courses: 6 },
  { name: "王强", department: "技术部", score: 89, courses: 7 },
  { name: "刘芳", department: "运营部", score: 87, courses: 5 },
  { name: "陈明", department: "市场部", score: 85, courses: 4 }
];

export function CapabilityAnalysis() {
  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总体能力指数</CardTitle>
            <Brain className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">78.5</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+5.2</span> 较上季度
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">高级技能人才</CardTitle>
            <Award className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">187</div>
            <p className="text-xs text-muted-foreground">
              占总员工 <span className="text-blue-600">20%</span>
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">技能覆盖度</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">85%</div>
            <p className="text-xs text-muted-foreground">
              6个核心技能领域
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">学习活跃度</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">92%</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+8%</span> 较上月
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Department Capability Radar */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>各部门AI能力画像</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <RadarChart data={[
                { skill: 'AI基础', 产品部: departmentCapability[0].aiBasics, 技术部: departmentCapability[1].aiBasics, 运营部: departmentCapability[2].aiBasics, 市场部: departmentCapability[3].aiBasics },
                { skill: '机器学习实践', 产品部: departmentCapability[0].mlPractice, 技术部: departmentCapability[1].mlPractice, 运营部: departmentCapability[2].mlPractice, 市场部: departmentCapability[3].mlPractice },
                { skill: '数据分析', 产品部: departmentCapability[0].dataAnalysis, 技术部: departmentCapability[1].dataAnalysis, 运营部: departmentCapability[2].dataAnalysis, 市场部: departmentCapability[3].dataAnalysis },
                { skill: 'AI应用', 产品部: departmentCapability[0].aiApplication, 技术部: departmentCapability[1].aiApplication, 运营部: departmentCapability[2].aiApplication, 市场部: departmentCapability[3].aiApplication },
                { skill: '伦理合规', 产品部: departmentCapability[0].ethicsCompliance, 技术部: departmentCapability[1].ethicsCompliance, 运营部: departmentCapability[2].ethicsCompliance, 市场部: departmentCapability[3].ethicsCompliance }
              ]} cx="50%" cy="50%" outerRadius="80%">
                <PolarGrid />
                <PolarAngleAxis 
                  dataKey="skill"
                  tick={{ fontSize: 12 }}
                />
                <PolarRadiusAxis 
                  angle={90}
                  domain={[0, 100]}
                  tick={{ fontSize: 10 }}
                />
                <Radar
                  name="产品部"
                  dataKey="产品部"
                  stroke="#3B82F6"
                  fill="#3B82F6"
                  fillOpacity={0.1}
                />
                <Radar
                  name="技术部"
                  dataKey="技术部"
                  stroke="#10B981"
                  fill="#10B981"
                  fillOpacity={0.1}
                />
                <Radar
                  name="运营部"
                  dataKey="运营部"
                  stroke="#F59E0B"
                  fill="#F59E0B"
                  fillOpacity={0.1}
                />
                <Radar
                  name="市场部"
                  dataKey="市场部"
                  stroke="#EF4444"
                  fill="#EF4444"
                  fillOpacity={0.1}
                />
                <Tooltip />
                <Legend />
              </RadarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Skill Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>技能水平分布</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={skillDistribution} layout="horizontal">
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="skill" type="category" width={100} />
                <Tooltip />
                <Legend />
                <Bar dataKey="beginner" stackId="a" name="初级" fill="#EF4444" />
                <Bar dataKey="intermediate" stackId="a" name="中级" fill="#F59E0B" />
                <Bar dataKey="advanced" stackId="a" name="高级" fill="#10B981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Skill Gap Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>技能缺口分析</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {skillGapAnalysis.map((item) => (
              <div key={item.skill} className="border rounded-lg p-4">
                <div className="flex items-center justify-between mb-3">
                  <h4 className="font-semibold">{item.skill}</h4>
                  <Badge variant={item.priority === "高" ? "destructive" : "secondary"}>
                    {item.priority}优先级
                  </Badge>
                </div>
                
                <div className="grid grid-cols-3 gap-4 mb-3">
                  <div className="text-center">
                    <div className="text-2xl font-bold text-muted-foreground">{item.currentLevel}%</div>
                    <div className="text-xs text-muted-foreground">当前水平</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-primary">{item.targetLevel}%</div>
                    <div className="text-xs text-muted-foreground">目标水平</div>
                  </div>
                  <div className="text-center">
                    <div className="text-2xl font-bold text-destructive">{item.gap}%</div>
                    <div className="text-xs text-muted-foreground">能力缺口</div>
                  </div>
                </div>
                
                <Progress value={item.currentLevel} className="h-3" />
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Top Performers */}
      <Card>
        <CardHeader>
          <CardTitle>高潜力学员识别</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {topPerformers.map((performer, index) => (
              <div key={performer.name} className="flex items-center justify-between p-3 border rounded-lg">
                <div className="flex items-center gap-3">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-primary-foreground text-sm font-bold">
                    {index + 1}
                  </div>
                  <div>
                    <div className="font-semibold">{performer.name}</div>
                    <div className="text-sm text-muted-foreground">{performer.department}</div>
                  </div>
                </div>
                
                <div className="flex items-center gap-4">
                  <div className="text-right">
                    <div className="font-semibold">{performer.score}分</div>
                    <div className="text-xs text-muted-foreground">{performer.courses}门课程</div>
                  </div>
                  <Badge variant="outline">
                    <Award className="h-3 w-3 mr-1" />
                    优秀学员
                  </Badge>
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Detailed Skill Matrix */}
      <Card>
        <CardHeader>
          <CardTitle>组织技能矩阵</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left p-2">技能领域</th>
                  <th className="text-center p-2">学习人数</th>
                  <th className="text-center p-2">初级</th>
                  <th className="text-center p-2">中级</th>
                  <th className="text-center p-2">高级</th>
                  <th className="text-center p-2">覆盖率</th>
                </tr>
              </thead>
              <tbody>
                {skillDistribution.map((skill) => (
                  <tr key={skill.skill} className="border-b">
                    <td className="p-2 font-medium">{skill.skill}</td>
                    <td className="text-center p-2">{skill.total}</td>
                    <td className="text-center p-2">{skill.beginner}%</td>
                    <td className="text-center p-2">{skill.intermediate}%</td>
                    <td className="text-center p-2">{skill.advanced}%</td>
                    <td className="text-center p-2">
                      <Badge variant={skill.total > 200 ? "default" : "secondary"}>
                        {Math.round((skill.total / 500) * 100)}%
                      </Badge>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}