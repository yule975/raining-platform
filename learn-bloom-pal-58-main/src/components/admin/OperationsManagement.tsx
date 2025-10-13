import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Plus, Edit, Trash2, Eye, Upload, ChevronUp, ChevronDown, Bell, Image, MessageSquare } from 'lucide-react';
import StudentManagement from './StudentManagement';
import AssignmentManagement from './AssignmentManagement';
import CourseManagement from './CourseManagement';

// Mock data
const mockAnnouncements = [
  {
    id: 1,
    title: "春节放假通知",
    content: "根据国家规定，春节假期安排如下...",
    status: "published",
    publishTime: "2024-01-25 09:00",
    views: 1200,
    priority: "high"
  },
  {
    id: 2,
    title: "新课程上线公告",
    content: "本月新增5门AI相关课程...",
    status: "scheduled",
    publishTime: "2024-01-26 10:00",
    views: 0,
    priority: "normal"
  }
];

const mockBanners = [
  {
    id: 1,
    title: "AI课程专区",
    image: "/api/placeholder/400/200",
    link: "/courses/ai",
    order: 1,
    status: "active"
  },
  {
    id: 2,
    title: "新年学习计划",
    image: "/api/placeholder/400/200", 
    link: "/learning-plan",
    order: 2,
    status: "active"
  }
];

const mockFeedbacks = [
  {
    id: 1,
    user: "张三",
    course: "AI基础入门",
    type: "课程反馈",
    content: "课程内容很好，但是视频有些卡顿...",
    status: "pending",
    createdAt: "2024-01-25 14:30",
    priority: "normal"
  },
  {
    id: 2,
    user: "李四",
    course: null,
    type: "平台建议",
    content: "希望能增加移动端APP...",
    status: "processing",
    createdAt: "2024-01-24 16:20",
    priority: "high"
  }
];

const OperationsManagement = () => {
  const [isAnnouncementDialogOpen, setIsAnnouncementDialogOpen] = useState(false);
  const [isBannerDialogOpen, setIsBannerDialogOpen] = useState(false);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'published':
        return <Badge className="bg-green-100 text-green-800">已发布</Badge>;
      case 'scheduled':
        return <Badge className="bg-blue-100 text-blue-800">定时发布</Badge>;
      case 'draft':
        return <Badge variant="secondary">草稿</Badge>;
      case 'active':
        return <Badge className="bg-green-100 text-green-800">启用</Badge>;
      case 'inactive':
        return <Badge variant="secondary">禁用</Badge>;
      case 'pending':
        return <Badge className="bg-orange-100 text-orange-800">待处理</Badge>;
      case 'processing':
        return <Badge className="bg-blue-100 text-blue-800">处理中</Badge>;
      case 'resolved':
        return <Badge className="bg-green-100 text-green-800">已解决</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getPriorityBadge = (priority: string) => {
    switch (priority) {
      case 'high':
        return <Badge variant="destructive">高优先级</Badge>;
      case 'normal':
        return <Badge variant="outline">普通</Badge>;
      case 'low':
        return <Badge variant="secondary">低优先级</Badge>;
      default:
        return <Badge variant="outline">{priority}</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">运营管理</h2>

      <Tabs defaultValue="courses" className="space-y-4">
        <TabsList>
          <TabsTrigger value="courses">课程管理</TabsTrigger>
          <TabsTrigger value="announcements">公告管理</TabsTrigger>
          <TabsTrigger value="banners">Banner管理</TabsTrigger>
          <TabsTrigger value="feedback">反馈中心</TabsTrigger>
          <TabsTrigger value="students">学员管理</TabsTrigger>
          <TabsTrigger value="assignments">作业管理</TabsTrigger>
        </TabsList>

        <TabsContent value="courses" className="space-y-4">
          <CourseManagement />
        </TabsContent>

        <TabsContent value="announcements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>公告管理</CardTitle>
                <Dialog open={isAnnouncementDialogOpen} onOpenChange={setIsAnnouncementDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      发布公告
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>发布新公告</DialogTitle>
                      <DialogDescription>
                        创建和发布平台公告，可选择立即发布或定时发布。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">公告标题</label>
                        <Input placeholder="输入公告标题" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">公告内容</label>
                        <Textarea 
                          placeholder="输入公告内容..."
                          className="min-h-[120px]"
                        />
                      </div>
                      <div className="grid grid-cols-2 gap-4">
                        <div className="space-y-2">
                          <label className="text-sm font-medium">优先级</label>
                          <Select>
                            <SelectTrigger>
                              <SelectValue placeholder="选择优先级" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="high">高优先级</SelectItem>
                              <SelectItem value="normal">普通</SelectItem>
                              <SelectItem value="low">低优先级</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                        <div className="space-y-2">
                          <label className="text-sm font-medium">发布时间</label>
                          <Input type="datetime-local" />
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="immediate" />
                        <label htmlFor="immediate" className="text-sm">立即发布</label>
                      </div>
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={() => setIsAnnouncementDialogOpen(false)}>
                          取消
                        </Button>
                        <Button onClick={() => setIsAnnouncementDialogOpen(false)}>
                          发布公告
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>标题</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>优先级</TableHead>
                    <TableHead>发布时间</TableHead>
                    <TableHead>浏览量</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockAnnouncements.map((announcement) => (
                    <TableRow key={announcement.id}>
                      <TableCell className="font-medium">{announcement.title}</TableCell>
                      <TableCell>{getStatusBadge(announcement.status)}</TableCell>
                      <TableCell>{getPriorityBadge(announcement.priority)}</TableCell>
                      <TableCell>{announcement.publishTime}</TableCell>
                      <TableCell>{announcement.views}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="banners" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle>Banner管理</CardTitle>
                <Dialog open={isBannerDialogOpen} onOpenChange={setIsBannerDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>
                      <Plus className="mr-2 h-4 w-4" />
                      添加Banner
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="max-w-2xl">
                    <DialogHeader>
                      <DialogTitle>添加Banner</DialogTitle>
                      <DialogDescription>
                        上传Banner图片并配置显示信息。
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4 py-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium">Banner标题</label>
                        <Input placeholder="输入Banner标题" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">上传图片</label>
                        <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
                          <Upload className="mx-auto h-12 w-12 text-gray-400" />
                          <p className="mt-2 text-sm text-gray-600">点击或拖拽上传图片</p>
                          <p className="text-xs text-gray-500">建议尺寸: 1200x400px</p>
                        </div>
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium">链接地址</label>
                        <Input placeholder="输入跳转链接 (可选)" />
                      </div>
                      <div className="flex items-center space-x-2">
                        <Switch id="bannerActive" />
                        <label htmlFor="bannerActive" className="text-sm">启用Banner</label>
                      </div>
                      <div className="flex justify-end space-x-2 pt-4">
                        <Button variant="outline" onClick={() => setIsBannerDialogOpen(false)}>
                          取消
                        </Button>
                        <Button onClick={() => setIsBannerDialogOpen(false)}>
                          添加Banner
                        </Button>
                      </div>
                    </div>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>预览</TableHead>
                    <TableHead>标题</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>排序</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockBanners.map((banner) => (
                    <TableRow key={banner.id}>
                      <TableCell>
                        <img 
                          src={banner.image} 
                          alt={banner.title}
                          className="w-20 h-12 object-cover rounded"
                        />
                      </TableCell>
                      <TableCell className="font-medium">{banner.title}</TableCell>
                      <TableCell>{getStatusBadge(banner.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-1">
                          <Button variant="ghost" size="sm">
                            <ChevronUp className="h-4 w-4" />
                          </Button>
                          <span className="text-sm">{banner.order}</span>
                          <Button variant="ghost" size="sm">
                            <ChevronDown className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" className="text-red-600">
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="feedback" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>反馈中心</CardTitle>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>用户</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>课程</TableHead>
                    <TableHead>内容</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>优先级</TableHead>
                    <TableHead>时间</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {mockFeedbacks.map((feedback) => (
                    <TableRow key={feedback.id}>
                      <TableCell className="font-medium">{feedback.user}</TableCell>
                      <TableCell>{feedback.type}</TableCell>
                      <TableCell>{feedback.course || '-'}</TableCell>
                      <TableCell className="max-w-xs truncate">{feedback.content}</TableCell>
                      <TableCell>{getStatusBadge(feedback.status)}</TableCell>
                      <TableCell>{getPriorityBadge(feedback.priority)}</TableCell>
                      <TableCell>{feedback.createdAt}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">
                            <MessageSquare className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm">
                            <Edit className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="students" className="space-y-4">
          <StudentManagement />
        </TabsContent>

        <TabsContent value="assignments" className="space-y-4">
          <AssignmentManagement />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default OperationsManagement;