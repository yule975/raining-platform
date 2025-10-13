import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Textarea } from "@/components/ui/textarea";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings, Upload, Key, Bell, Shield, Search, Users, Mail, Plus, Trash2 } from 'lucide-react';
import InvitationEmailTemplate from './InvitationEmailTemplate';
import { emailService } from '@/lib/emailService';

// Mock data for email whitelist
const mockWhitelist = [
  {
    id: 1,
    email: "zhang.san@company.com",
    addedBy: "管理员A",
    addedAt: "2024-01-20 10:30:00",
    status: "active",
    inviteSent: true,
    lastInvite: "2024-01-20 10:35:00"
  },
  {
    id: 2,
    email: "li.si@company.com",
    addedBy: "管理员B",
    addedAt: "2024-01-21 14:20:00",
    status: "pending",
    inviteSent: false,
    lastInvite: null
  },
  {
    id: 3,
    email: "wang.wu@company.com",
    addedBy: "管理员A",
    addedAt: "2024-01-22 09:15:00",
    status: "registered",
    inviteSent: true,
    lastInvite: "2024-01-22 09:20:00"
  }
];

// Mock data for operation logs
const mockOperationLogs = [
  {
    id: 1,
    user: "管理员A",
    action: "创建课程",
    target: "AI基础入门",
    timestamp: "2024-01-25 14:30:00",
    ip: "192.168.1.100",
    status: "success"
  },
  {
    id: 2,
    user: "管理员B",
    action: "删除用户",
    target: "用户ID: 1234",
    timestamp: "2024-01-25 13:15:00",
    ip: "192.168.1.101",
    status: "success"
  },
  {
    id: 3,
    user: "管理员A",
    action: "修改权限",
    target: "角色：课程管理员",
    timestamp: "2024-01-25 12:45:00",
    ip: "192.168.1.100",
    status: "success"
  },
  {
    id: 4,
    user: "管理员C",
    action: "批量导入用户",
    target: "500个用户",
    timestamp: "2024-01-25 11:20:00",
    ip: "192.168.1.102",
    status: "failed"
  }
];

const notificationTemplates = [
  {
    id: 1,
    name: "欢迎信",
    type: "邮件",
    trigger: "用户注册",
    status: "active"
  },
  {
    id: 2,
    name: "课程完成祝贺",
    type: "飞书消息",
    trigger: "完成课程",
    status: "active"
  },
  {
    id: 3,
    name: "作业提醒",
    type: "邮件",
    trigger: "作业截止前3天",
    status: "inactive"
  }
];

const SystemSettings = () => {
  const [searchTerm, setSearchTerm] = useState("");
  const [filterUser, setFilterUser] = useState("all");
  const [filterAction, setFilterAction] = useState("all");
  
  // Whitelist management states
  const [newEmail, setNewEmail] = useState("");
  const [whitelistSearch, setWhitelistSearch] = useState("");
  const [isAddingEmail, setIsAddingEmail] = useState(false);
  const [showEmailTemplate, setShowEmailTemplate] = useState(false);
  const [currentInvite, setCurrentInvite] = useState<{email: string, url: string} | null>(null);

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'success':
        return <Badge className="bg-green-100 text-green-800">成功</Badge>;
      case 'failed':
        return <Badge variant="destructive">失败</Badge>;
      case 'active':
        return <Badge className="bg-blue-100 text-blue-800">待邀请</Badge>;
      case 'pending':
        return <Badge className="bg-yellow-100 text-yellow-800">邀请中</Badge>;
      case 'registered':
        return <Badge className="bg-green-100 text-green-800">已注册</Badge>;
      case 'inactive':
        return <Badge variant="secondary">禁用</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  // Whitelist management functions
  const handleAddEmail = () => {
    if (!newEmail.trim()) return;
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(newEmail)) {
      alert('请输入有效的邮箱地址');
      return;
    }
    
    setIsAddingEmail(true);
    // Simulate API call
    setTimeout(() => {
      console.log('添加邮箱到白名单:', newEmail);
      setNewEmail('');
      setIsAddingEmail(false);
      alert('邮箱已添加到白名单');
    }, 1000);
  };

  const handleRemoveEmail = (emailId: number, email: string) => {
    if (confirm(`确定要从白名单中移除 ${email} 吗？`)) {
      console.log('从白名单移除邮箱:', emailId);
      alert('邮箱已从白名单移除');
    }
  };

  const handleSendInvite = async (emailId: number, email: string) => {
    try {
      // Generate invitation token (in real implementation, this would be done by backend)
      const inviteToken = btoa(`${email}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`);
      const inviteUrl = `${window.location.origin}/invitation?token=${inviteToken}&email=${encodeURIComponent(email)}`;
      
      // Show email template modal first
      setCurrentInvite({ email, url: inviteUrl });
      setShowEmailTemplate(true);
      
      console.log('生成邀请链接:', inviteUrl);
      
      // Actually send the email
      console.log('正在发送邀请邮件到:', email);
      const result = await emailService.sendInvitationEmail(email, inviteUrl);
      
      if (result.success) {
        console.log('邮件发送成功:', result.messageId);
        alert(`邀请邮件已成功发送到 ${email}`);
        
        // Update the whitelist item status (in real app, this would update the database)
        // For now, just log it
        console.log(`更新邮箱 ${email} 的邀请状态为已发送`);
      } else {
        console.error('邮件发送失败:', result.error);
        alert(`邮件发送失败: ${result.error}`);
      }
    } catch (error) {
      console.error('发送邀请邮件时出错:', error);
      alert('发送邀请邮件时出错，请稍后重试');
    }
  };

  const filteredWhitelist = mockWhitelist.filter(item => 
    item.email.toLowerCase().includes(whitelistSearch.toLowerCase()) ||
    item.addedBy.toLowerCase().includes(whitelistSearch.toLowerCase())
  );

  const filteredLogs = mockOperationLogs.filter(log => {
    const matchesSearch = log.action.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         log.target.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesUser = filterUser === "all" || log.user === filterUser;
    const matchesAction = filterAction === "all" || log.action.includes(filterAction);
    
    return matchesSearch && matchesUser && matchesAction;
  });

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold">系统设置</h2>

      <Tabs defaultValue="basic" className="space-y-4">
        <TabsList>
          <TabsTrigger value="basic">基础设置</TabsTrigger>
          <TabsTrigger value="whitelist">邮箱白名单</TabsTrigger>
          <TabsTrigger value="api">接口配置</TabsTrigger>
          <TabsTrigger value="notifications">通知模板</TabsTrigger>
          <TabsTrigger value="logs">操作日志</TabsTrigger>
        </TabsList>

        <TabsContent value="basic" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Settings className="h-5 w-5" />
                <span>基础设置</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">平台名称</label>
                    <Input defaultValue="训战营学习平台" />
                  </div>
                  
                  <div className="space-y-2">
                    <label className="text-sm font-medium">平台Logo</label>
                    <div className="flex items-center space-x-4">
                      <div className="w-16 h-16 bg-gray-100 rounded-lg flex items-center justify-center">
                        <Upload className="h-6 w-6 text-gray-400" />
                      </div>
                      <Button variant="outline">上传Logo</Button>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">版权信息</label>
                    <Input defaultValue="© 2024 训战营学习平台. All rights reserved." />
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">系统维护模式</label>
                    <div className="flex items-center space-x-2">
                      <Switch id="maintenance" />
                      <label htmlFor="maintenance" className="text-sm">启用维护模式</label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">用户注册</label>
                    <div className="flex items-center space-x-2">
                      <Switch id="registration" defaultChecked />
                      <label htmlFor="registration" className="text-sm">允许用户注册</label>
                    </div>
                  </div>

                  <div className="space-y-2">
                    <label className="text-sm font-medium">邮件验证</label>
                    <div className="flex items-center space-x-2">
                      <Switch id="email-verify" defaultChecked />
                      <label htmlFor="email-verify" className="text-sm">启用邮件验证</label>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <Button>保存设置</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="whitelist" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Users className="h-5 w-5" />
                  <span>邮箱白名单管理</span>
                </CardTitle>
                <div className="flex items-center space-x-2">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="搜索邮箱或添加人..."
                      value={whitelistSearch}
                      onChange={(e) => setWhitelistSearch(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Add new email form */}
              <div className="flex items-center space-x-2 p-4 bg-gray-50 rounded-lg">
                <Mail className="h-5 w-5 text-gray-500" />
                <Input
                  placeholder="输入邮箱地址添加到白名单"
                  value={newEmail}
                  onChange={(e) => setNewEmail(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && handleAddEmail()}
                  className="flex-1"
                />
                <Button 
                  onClick={handleAddEmail}
                  disabled={isAddingEmail || !newEmail.trim()}
                  className="flex items-center space-x-1"
                >
                  <Plus className="h-4 w-4" />
                  <span>{isAddingEmail ? '添加中...' : '添加'}</span>
                </Button>
              </div>

              {/* Whitelist table */}
              <div className="border rounded-lg">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>邮箱地址</TableHead>
                      <TableHead>添加人</TableHead>
                      <TableHead>添加时间</TableHead>
                      <TableHead>状态</TableHead>
                      <TableHead>邀请状态</TableHead>
                      <TableHead>最后邀请时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredWhitelist.length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={7} className="text-center py-8 text-gray-500">
                          {whitelistSearch ? '未找到匹配的邮箱' : '暂无白名单邮箱'}
                        </TableCell>
                      </TableRow>
                    ) : (
                      filteredWhitelist.map((item) => (
                        <TableRow key={item.id}>
                          <TableCell className="font-medium">{item.email}</TableCell>
                          <TableCell>{item.addedBy}</TableCell>
                          <TableCell>{item.addedAt}</TableCell>
                          <TableCell>{getStatusBadge(item.status)}</TableCell>
                          <TableCell>
                            {item.inviteSent ? (
                              <Badge className="bg-green-100 text-green-800">已发送</Badge>
                            ) : (
                              <Badge variant="secondary">未发送</Badge>
                            )}
                          </TableCell>
                          <TableCell>{item.lastInvite || '-'}</TableCell>
                          <TableCell>
                            <div className="flex items-center space-x-1">
                              {item.status !== 'registered' && (
                                <Button 
                                  variant="ghost" 
                                  size="sm"
                                  onClick={() => handleSendInvite(item.id, item.email)}
                                  className="text-blue-600 hover:text-blue-800"
                                >
                                  <Mail className="h-4 w-4" />
                                </Button>
                              )}
                              <Button 
                                variant="ghost" 
                                size="sm"
                                onClick={() => handleRemoveEmail(item.id, item.email)}
                                className="text-red-600 hover:text-red-800"
                              >
                                <Trash2 className="h-4 w-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>

              {/* Statistics */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mt-6">
                <div className="bg-blue-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-blue-600">{mockWhitelist.length}</div>
                  <div className="text-sm text-blue-600">总邮箱数</div>
                </div>
                <div className="bg-yellow-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-yellow-600">
                    {mockWhitelist.filter(item => item.status === 'pending').length}
                  </div>
                  <div className="text-sm text-yellow-600">邀请中</div>
                </div>
                <div className="bg-green-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-green-600">
                    {mockWhitelist.filter(item => item.status === 'registered').length}
                  </div>
                  <div className="text-sm text-green-600">已注册</div>
                </div>
                <div className="bg-gray-50 p-4 rounded-lg">
                  <div className="text-2xl font-bold text-gray-600">
                    {mockWhitelist.filter(item => item.status === 'active').length}
                  </div>
                  <div className="text-sm text-gray-600">待邀请</div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="api" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Key className="h-5 w-5" />
                <span>接口配置</span>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* SSO配置 */}
                <div className="space-y-4">
                  <h4 className="font-medium">飞书SSO配置</h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">App ID</label>
                    <Input placeholder="输入飞书App ID" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">App Secret</label>
                    <Input type="password" placeholder="输入飞书App Secret" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">回调地址</label>
                    <Input defaultValue="https://platform.company.com/auth/callback" />
                  </div>
                </div>

                {/* 视频配置 */}
                <div className="space-y-4">
                  <h4 className="font-medium">视频点播配置</h4>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Access Key</label>
                    <Input placeholder="输入视频服务Access Key" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Secret Key</label>
                    <Input type="password" placeholder="输入视频服务Secret Key" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">存储桶名称</label>
                    <Input placeholder="输入存储桶名称" />
                  </div>
                </div>
              </div>

              {/* 对象存储配置 */}
              <div className="space-y-4">
                <h4 className="font-medium">对象存储配置</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Access Key ID</label>
                    <Input placeholder="输入Access Key ID" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Secret Access Key</label>
                    <Input type="password" placeholder="输入Secret Access Key" />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Endpoint</label>
                    <Input placeholder="输入服务端点" />
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2">
                <Button variant="outline">测试连接</Button>
                <Button>保存配置</Button>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="notifications" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Bell className="h-5 w-5" />
                  <span>通知模板管理</span>
                </CardTitle>
                <Button>添加模板</Button>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>模板名称</TableHead>
                    <TableHead>类型</TableHead>
                    <TableHead>触发条件</TableHead>
                    <TableHead>状态</TableHead>
                    <TableHead>操作</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {notificationTemplates.map((template) => (
                    <TableRow key={template.id}>
                      <TableCell className="font-medium">{template.name}</TableCell>
                      <TableCell>{template.type}</TableCell>
                      <TableCell>{template.trigger}</TableCell>
                      <TableCell>{getStatusBadge(template.status)}</TableCell>
                      <TableCell>
                        <div className="flex items-center space-x-2">
                          <Button variant="ghost" size="sm">编辑</Button>
                          <Button variant="ghost" size="sm">预览</Button>
                          <Button variant="ghost" size="sm" className="text-red-600">删除</Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="logs" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center space-x-2">
                  <Shield className="h-5 w-5" />
                  <span>操作日志 (安全审计)</span>
                </CardTitle>
                <div className="flex items-center space-x-4">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                    <Input
                      placeholder="搜索操作或目标..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-10 w-64"
                    />
                  </div>
                  <Select value={filterUser} onValueChange={setFilterUser}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="操作人筛选" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部用户</SelectItem>
                      <SelectItem value="管理员A">管理员A</SelectItem>
                      <SelectItem value="管理员B">管理员B</SelectItem>
                      <SelectItem value="管理员C">管理员C</SelectItem>
                    </SelectContent>
                  </Select>
                  <Select value={filterAction} onValueChange={setFilterAction}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="操作类型" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">全部操作</SelectItem>
                      <SelectItem value="创建">创建</SelectItem>
                      <SelectItem value="删除">删除</SelectItem>
                      <SelectItem value="修改">修改</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>操作人</TableHead>
                    <TableHead>操作类型</TableHead>
                    <TableHead>操作目标</TableHead>
                    <TableHead>操作时间</TableHead>
                    <TableHead>IP地址</TableHead>
                    <TableHead>状态</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="font-medium">{log.user}</TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.target}</TableCell>
                      <TableCell>{log.timestamp}</TableCell>
                      <TableCell>{log.ip}</TableCell>
                      <TableCell>{getStatusBadge(log.status)}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      
      {/* Email Template Modal */}
      {showEmailTemplate && currentInvite && (
        <InvitationEmailTemplate
          email={currentInvite.email}
          inviteUrl={currentInvite.url}
          onClose={() => {
            setShowEmailTemplate(false);
            setCurrentInvite(null);
          }}
        />
      )}
    </div>
  );
};

export default SystemSettings;