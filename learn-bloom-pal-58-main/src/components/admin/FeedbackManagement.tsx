import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { 
  Star, 
  ThumbsUp, 
  ThumbsDown, 
  MessageSquare, 
  Search,
  Filter,
  Calendar,
  TrendingDown,
  AlertCircle,
  CheckCircle
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";

// Mock data for course feedback
const courseFeedback = [
  {
    id: '1',
    courseName: 'AI绘画基础',
    studentName: '张三',
    rating: 5,
    comment: '课程内容非常实用，老师讲解清晰，实践案例丰富。希望能增加更多高级技巧的内容。',
    date: '2024-01-15',
    department: '设计部',
    status: 'pending'
  },
  {
    id: '2',
    courseName: 'LLM应用开发',
    studentName: '李四',
    rating: 4,
    comment: '技术深度很好，但节奏稍快，建议增加更多练习时间。',
    date: '2024-01-14',
    department: '技术部',
    status: 'resolved'
  },
  {
    id: '3',
    courseName: '机器学习入门',
    studentName: '王五',
    rating: 3,
    comment: '内容偏理论，希望能有更多实战项目。',
    date: '2024-01-13',
    department: '产品部',
    status: 'pending'
  }
];

// Mock data for AI assistant feedback
const aiAssistantFeedback = [
  {
    id: '1',
    question: '如何优化模型的训练速度？',
    answer: '可以通过以下几种方式优化：1. 使用更高效的优化器...',
    feedback: 'negative',
    reason: '回答不够具体，缺少实际代码示例',
    studentName: '赵六',
    date: '2024-01-15',
    status: 'pending'
  },
  {
    id: '2',
    question: 'PyTorch和TensorFlow有什么区别？',
    answer: 'PyTorch和TensorFlow都是深度学习框架，主要区别在于...',
    feedback: 'negative',
    reason: '对比不够全面，建议增加使用场景说明',
    studentName: '孙七',
    date: '2024-01-14',
    status: 'resolved'
  },
  {
    id: '3',
    question: '什么是注意力机制？',
    answer: '注意力机制是深度学习中的重要概念...',
    feedback: 'positive',
    reason: '回答清晰易懂，例子恰当',
    studentName: '周八',
    date: '2024-01-13',
    status: 'resolved'
  }
];

const feedbackStats = {
  totalFeedback: 156,
  averageRating: 4.2,
  pendingReviews: 23,
  aiNegativeFeedback: 18,
  resolvedIssues: 89
};

export function FeedbackManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [activeTab, setActiveTab] = useState("course-feedback");

  const filteredCourseFeedback = courseFeedback.filter(feedback => {
    const matchesSearch = feedback.courseName.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || feedback.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const filteredAIFeedback = aiAssistantFeedback.filter(feedback => {
    const matchesSearch = feedback.question.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         feedback.studentName.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === "all" || feedback.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  const renderStars = (rating: number) => {
    return Array.from({ length: 5 }, (_, index) => (
      <Star
        key={index}
        className={`h-4 w-4 ${
          index < rating ? 'fill-yellow-400 text-yellow-400' : 'text-gray-300'
        }`}
      />
    ));
  };

  return (
    <div className="space-y-6">
      {/* Overview Stats */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总反馈数</CardTitle>
            <MessageSquare className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackStats.totalFeedback}</div>
            <p className="text-xs text-muted-foreground">本月新增 +32</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">平均评分</CardTitle>
            <Star className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackStats.averageRating}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">+0.2</span> 较上月
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">待处理</CardTitle>
            <AlertCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackStats.pendingReviews}</div>
            <p className="text-xs text-muted-foreground">需要及时处理</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">AI负面反馈</CardTitle>
            <TrendingDown className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackStats.aiNegativeFeedback}</div>
            <p className="text-xs text-muted-foreground">需优化AI模型</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">已解决</CardTitle>
            <CheckCircle className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{feedbackStats.resolvedIssues}</div>
            <p className="text-xs text-muted-foreground">
              <span className="text-green-600">57%</span> 解决率
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Search and Filter */}
      <div className="flex items-center gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
          <Input
            placeholder="搜索课程名称或学员姓名..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline">
              <Filter className="mr-2 h-4 w-4" />
              筛选状态
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent>
            <DropdownMenuItem onClick={() => setFilterStatus("all")}>
              全部
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("pending")}>
              待处理
            </DropdownMenuItem>
            <DropdownMenuItem onClick={() => setFilterStatus("resolved")}>
              已处理
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Feedback Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="course-feedback">课程反馈管理</TabsTrigger>
          <TabsTrigger value="ai-feedback">AI助教反馈</TabsTrigger>
        </TabsList>

        <TabsContent value="course-feedback" className="space-y-4">
          <div className="space-y-4">
            {filteredCourseFeedback.map((feedback) => (
              <Card key={feedback.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold text-lg">{feedback.courseName}</h4>
                        <Badge variant={feedback.status === 'pending' ? 'destructive' : 'default'}>
                          {feedback.status === 'pending' ? '待处理' : '已处理'}
                        </Badge>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{feedback.studentName}</span>
                        <span>{feedback.department}</span>
                        <span>{feedback.date}</span>
                      </div>
                    </div>
                    <div className="flex items-center gap-1">
                      {renderStars(feedback.rating)}
                      <span className="ml-2 font-medium">{feedback.rating}/5</span>
                    </div>
                  </div>
                  
                  <div className="bg-muted/50 p-4 rounded-lg mb-4">
                    <p className="text-sm">{feedback.comment}</p>
                  </div>
                  
                  <div className="flex justify-end gap-2">
                    <Button variant="outline" size="sm">
                      回复
                    </Button>
                    <Button size="sm">
                      标记为已处理
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        <TabsContent value="ai-feedback" className="space-y-4">
          <div className="space-y-4">
            {filteredAIFeedback.map((feedback) => (
              <Card key={feedback.id}>
                <CardContent className="p-6">
                  <div className="flex items-start justify-between mb-4">
                    <div className="space-y-2">
                      <div className="flex items-center gap-2">
                        <h4 className="font-semibold">AI助教问答反馈</h4>
                        <Badge variant={feedback.status === 'pending' ? 'destructive' : 'default'}>
                          {feedback.status === 'pending' ? '待处理' : '已处理'}
                        </Badge>
                        {feedback.feedback === 'negative' ? (
                          <ThumbsDown className="h-4 w-4 text-red-500" />
                        ) : (
                          <ThumbsUp className="h-4 w-4 text-green-500" />
                        )}
                      </div>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>{feedback.studentName}</span>
                        <span>{feedback.date}</span>
                      </div>
                    </div>
                  </div>
                  
                  <div className="space-y-3">
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">学员问题：</div>
                      <div className="bg-blue-50 dark:bg-blue-950 p-3 rounded-lg text-sm">
                        {feedback.question}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">AI回答：</div>
                      <div className="bg-muted/50 p-3 rounded-lg text-sm">
                        {feedback.answer}
                      </div>
                    </div>
                    
                    <div>
                      <div className="text-sm font-medium text-muted-foreground mb-1">反馈原因：</div>
                      <div className="bg-orange-50 dark:bg-orange-950 p-3 rounded-lg text-sm">
                        {feedback.reason}
                      </div>
                    </div>
                  </div>
                  
                  <div className="flex justify-end gap-2 mt-4">
                    <Button variant="outline" size="sm">
                      优化AI回答
                    </Button>
                    <Button size="sm">
                      标记为已处理
                    </Button>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}