import { useState } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { 
  Play, 
  Pause, 
  SkipBack, 
  SkipForward, 
  Volume2, 
  Settings, 
  Download,
  FileText,
  Code,
  Database,
  BookOpen,
  CheckCircle,
  Clock,
  Lock
} from "lucide-react";

const CourseLearning = () => {
  const { courseId } = useParams();
  const [isPlaying, setIsPlaying] = useState(false);
  const [currentSpeed, setCurrentSpeed] = useState(1.0);

  // Mock course data
  const courseData = {
    title: "AI训战基础营学习",
    currentLesson: "Unit 2 结构化提示词",
    progress: 64,
    totalDuration: "28:45",
    currentTime: "18:30"
  };

  const courseSyllabus = [
    {
      module: "模块1: AI基础概念",
      status: "completed",
      lessons: [
        { id: "1.1", title: "人工智能概述", duration: "15:30", completed: true },
        { id: "1.2", title: "机器学习基础", duration: "20:15", completed: true },
        { id: "1.3", title: "深度学习入门", duration: "18:45", completed: true },
      ]
    },
    {
      module: "模块2: 机器学习算法",
      status: "completed", 
      lessons: [
        { id: "2.1", title: "监督学习算法", duration: "22:10", completed: true },
        { id: "2.2", title: "无监督学习", duration: "19:35", completed: true },
        { id: "2.3", title: "强化学习基础", duration: "25:20", completed: true },
      ]
    },
    {
      module: "模块3: 大语言模型基础",
      status: "current",
      lessons: [
        { id: "3.1", title: "自然语言处理概述", duration: "16:40", completed: true },
        { id: "2", title: "Unit 2 结构化提示词", duration: "28:45", completed: false, current: true },
        { id: "3.3", title: "BERT模型原理", duration: "24:15", completed: false },
        { id: "3.4", title: "GPT系列模型", duration: "32:10", completed: false },
      ]
    },
    {
      module: "模块4: 模型微调技术",
      status: "locked",
      lessons: [
        { id: "4.1", title: "微调基础理论", duration: "20:30", completed: false },
        { id: "4.2", title: "LoRA技术详解", duration: "26:15", completed: false },
        { id: "4.3", title: "实战项目演练", duration: "45:20", completed: false },
      ]
    }
  ];

  const learningMaterials = [
    { type: "ppt", name: "Transformer架构讲义.pptx", size: "15.2 MB", icon: FileText },
    { type: "pdf", name: "注意力机制论文.pdf", size: "3.8 MB", icon: FileText },
    { type: "code", name: "transformer_implementation.py", size: "12.5 KB", icon: Code },
    { type: "dataset", name: "训练数据集.zip", size: "245.7 MB", icon: Database },
  ];

  return (
    <div className="min-h-screen bg-background">
      <div className="flex">
        {/* Left Sidebar - Course Outline */}
        <div className="w-80 bg-card border-r border-border overflow-y-auto">
          <div className="p-4 border-b border-border">
            <h2 className="font-bold text-lg mb-2">{courseData.title}</h2>
            <div className="space-y-2">
              <div className="flex justify-between text-sm text-muted-foreground">
                <span>整体进度</span>
                <span>7/12 课时完成</span>
              </div>
              <Progress value={58} className="h-2" />
            </div>
          </div>

          <div className="p-4">
            {courseSyllabus.map((module, moduleIndex) => (
              <div key={moduleIndex} className="mb-6">
                <div className="flex items-center space-x-2 mb-3">
                  {module.status === "completed" && (
                    <CheckCircle className="w-5 h-5 text-green-500" />
                  )}
                  {module.status === "current" && (
                    <Clock className="w-5 h-5 text-primary" />
                  )}
                  {module.status === "locked" && (
                    <Lock className="w-5 h-5 text-gray-400" />
                  )}
                  <h3 className={`font-semibold ${module.status === "locked" ? "text-gray-400" : ""}`}>
                    {module.module}
                  </h3>
                </div>

                <div className="space-y-2 ml-7">
                  {module.lessons.map((lesson) => (
                    <div
                      key={lesson.id}
                      className={`flex items-center justify-between p-2 rounded-lg cursor-pointer transition-colors ${
                        lesson.current 
                          ? "bg-primary/10 border border-primary/20" 
                          : lesson.completed 
                            ? "hover:bg-muted/50" 
                            : module.status === "locked"
                              ? "opacity-50 cursor-not-allowed"
                              : "hover:bg-muted/50"
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <div className="flex items-center space-x-2">
                          {lesson.completed && (
                            <CheckCircle className="w-4 h-4 text-green-500" />
                          )}
                          {lesson.current && (
                            <div className="w-4 h-4 bg-primary rounded-full flex items-center justify-center">
                              <div className="w-2 h-2 bg-primary-foreground rounded-full"></div>
                            </div>
                          )}
                          {!lesson.completed && !lesson.current && module.status !== "locked" && (
                            <div className="w-4 h-4 border-2 border-muted-foreground rounded-full"></div>
                          )}
                          {module.status === "locked" && (
                            <Lock className="w-4 h-4 text-gray-400" />
                          )}
                        </div>
                        <div>
                          <p className={`text-sm font-medium ${lesson.current ? "text-primary" : ""}`}>
                            {lesson.title}
                          </p>
                          <p className="text-xs text-muted-foreground">{lesson.duration}</p>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content Area */}
        <div className="flex-1 flex flex-col">
          {/* Video Player Section */}
          <div className="bg-black">
            <div className="aspect-video bg-gray-900 flex items-center justify-center relative">
              <div className="text-white text-center">
                <Play className="w-16 h-16 mx-auto mb-4 opacity-80" />
                <p className="text-lg">视频播放器区域</p>
                <p className="text-sm opacity-60">支持断点续播、倍速播放、字幕等功能</p>
              </div>
              
              {/* Video Controls */}
              <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-4">
                <div className="flex items-center space-x-4">
                  <Button 
                    size="icon" 
                    variant="ghost" 
                    className="text-white hover:bg-white/20"
                    onClick={() => setIsPlaying(!isPlaying)}
                  >
                    {isPlaying ? <Pause className="w-5 h-5" /> : <Play className="w-5 h-5" />}
                  </Button>
                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                    <SkipBack className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                    <SkipForward className="w-5 h-5" />
                  </Button>
                  
                  <div className="flex-1 flex items-center space-x-2">
                    <span className="text-white text-sm">{courseData.currentTime}</span>
                    <div className="flex-1 bg-white/20 rounded-full h-1">
                      <div 
                        className="bg-primary h-1 rounded-full" 
                        style={{ width: `${courseData.progress}%` }}
                      ></div>
                    </div>
                    <span className="text-white text-sm">{courseData.totalDuration}</span>
                  </div>
                  
                  <select 
                    value={currentSpeed}
                    onChange={(e) => setCurrentSpeed(parseFloat(e.target.value))}
                    className="bg-black/50 text-white border border-white/20 rounded px-2 py-1 text-sm"
                  >
                    <option value={0.5}>0.5x</option>
                    <option value={0.75}>0.75x</option>
                    <option value={1.0}>1.0x</option>
                    <option value={1.25}>1.25x</option>
                    <option value={1.5}>1.5x</option>
                    <option value={2.0}>2.0x</option>
                  </select>
                  
                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                    <Volume2 className="w-5 h-5" />
                  </Button>
                  <Button size="icon" variant="ghost" className="text-white hover:bg-white/20">
                    <Settings className="w-5 h-5" />
                  </Button>
                </div>
              </div>
            </div>
          </div>

          {/* Course Content Tabs */}
          <div className="flex-1 p-6">
            <div className="mb-4">
              <h1 className="text-2xl font-bold mb-2">{courseData.currentLesson}</h1>
              <div className="flex items-center space-x-4 text-sm text-muted-foreground">
                <span>Unit 2 结构化提示词</span>
                <Separator orientation="vertical" className="h-4" />
                <span>时长: {courseData.totalDuration}</span>
              </div>
            </div>

            <Tabs defaultValue="overview" className="w-full">
              <TabsList className="grid w-full grid-cols-4">
                <TabsTrigger value="overview">课程简介</TabsTrigger>
                <TabsTrigger value="materials">学习资料</TabsTrigger>
                <TabsTrigger value="notes">学习笔记</TabsTrigger>
                <TabsTrigger value="discussion">问答讨论</TabsTrigger>
              </TabsList>

              <TabsContent value="overview" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">本节课内容概述</h3>
                    <div className="prose max-w-none">
                      <p className="text-muted-foreground mb-4">
                        本节课将深入讲解Transformer架构的核心原理，包括自注意力机制、多头注意力、位置编码等关键技术。
                        通过理论讲解和代码实践，帮助学员全面理解这一革命性的神经网络架构。
                      </p>
                      
                      <h4 className="font-semibold mb-2">学习目标</h4>
                      <ul className="list-disc list-inside space-y-1 text-muted-foreground mb-4">
                        <li>理解Transformer架构的整体设计思路</li>
                        <li>掌握自注意力机制的计算原理</li>
                        <li>学会多头注意力的实现方法</li>
                        <li>了解位置编码的作用和实现</li>
                      </ul>

                      <h4 className="font-semibold mb-2">前置知识</h4>
                      <div className="flex flex-wrap gap-2">
                        <Badge variant="secondary">神经网络基础</Badge>
                        <Badge variant="secondary">深度学习概念</Badge>
                        <Badge variant="secondary">Python编程</Badge>
                        <Badge variant="secondary">PyTorch框架</Badge>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="materials" className="space-y-4">
                {/* Chapter-specific materials */}
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">当前章节资料</h3>
                    <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg mb-4">
                      <h4 className="font-semibold text-primary mb-2">第3.2节：Transformer架构详解</h4>
                      <p className="text-sm text-muted-foreground mb-3">针对当前学习章节的专项资料</p>
                      <div className="grid gap-3">
                        <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <FileText className="w-6 h-6 text-primary" />
                            <div>
                              <h5 className="font-medium">3.2-Transformer架构PPT.pptx</h5>
                              <p className="text-sm text-muted-foreground">本章节专用讲义 · 8.5 MB</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            下载
                          </Button>
                        </div>
                        <div className="flex items-center justify-between p-3 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <Code className="w-6 h-6 text-primary" />
                            <div>
                              <h5 className="font-medium">3.2-transformer_demo.py</h5>
                              <p className="text-sm text-muted-foreground">本章节示例代码 · 15.2 KB</p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            下载
                          </Button>
                        </div>
                      </div>
                    </div>
                    
                    <h3 className="font-semibold text-lg mb-4">全套配套资料</h3>
                    <div className="grid gap-4">
                      {learningMaterials.map((material, index) => (
                        <div key={index} className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors">
                          <div className="flex items-center space-x-3">
                            <material.icon className="w-8 h-8 text-primary" />
                            <div>
                              <h4 className="font-medium">{material.name}</h4>
                              <p className="text-sm text-muted-foreground">
                                {material.type === "ppt" && "课程讲义"}
                                {material.type === "pdf" && "参考文档"}
                                {material.type === "code" && "示例代码"}
                                {material.type === "dataset" && "实践数据"}
                                {" · " + material.size}
                              </p>
                            </div>
                          </div>
                          <Button size="sm" variant="outline">
                            <Download className="w-4 h-4 mr-2" />
                            下载
                          </Button>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="notes" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">学习笔记</h3>
                    <div className="min-h-64 border border-border rounded-lg p-4 bg-muted/20">
                      <p className="text-muted-foreground">在这里记录您的学习笔记...</p>
                    </div>
                    <div className="flex justify-end mt-4">
                      <Button>保存笔记</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>

              <TabsContent value="discussion" className="space-y-4">
                <Card>
                  <CardContent className="p-6">
                    <h3 className="font-semibold text-lg mb-4">问答讨论</h3>
                    <div className="space-y-4">
                      <div className="p-4 border border-border rounded-lg">
                        <div className="flex items-start space-x-3">
                          <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center">
                            <span className="text-primary-foreground text-sm font-bold">张</span>
                          </div>
                          <div className="flex-1">
                            <div className="flex items-center space-x-2 mb-2">
                              <span className="font-medium">张同学</span>
                              <span className="text-xs text-muted-foreground">2小时前</span>
                            </div>
                            <p className="text-sm">请问多头注意力中的"头"具体是什么概念？为什么要使用多个头？</p>
                          </div>
                        </div>
                      </div>
                    </div>
                    <div className="mt-4">
                      <Button>提出问题</Button>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            </Tabs>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseLearning;