import { useState, useRef, useEffect } from "react";
import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
// Removed useAppStore and appStore imports - migrated to Supabase
import { ApiService } from "@/lib/api";
import { useAuth } from "@/contexts/AuthContext";
import { 
  Download, 
  FileText, 
  Upload, 
  CheckCircle,
  Video,
  Clock,
  BookOpen,
  X,
  Eye,
  File,
  Loader2
} from "lucide-react";
import React from "react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase";
// FeishuVideoPlayer 不再需要 - 使用封面+跳转方案

const CourseDetail = () => {
  const { courseId } = useParams();
  // Migrated to Supabase - removed useAppStore dependencies
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  // Loading and error states
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCompleted, setIsCompleted] = useState(false);
  const [isMarkingComplete, setIsMarkingComplete] = useState(false);
  
  // Assignment submission state
  const [assignmentText, setAssignmentText] = useState("");
  const [assignmentFile, setAssignmentFile] = useState<File | null>(null);
  const [isSubmitted, setIsSubmitted] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [isUploading, setIsUploading] = useState(false);
  const [filePreview, setFilePreview] = useState<string | null>(null);
  
  // Video watching state
  const [isVideoWatched, setIsVideoWatched] = useState(false);

  // Get course data from store
  const [courseData, setCourseData] = useState(null);

  // 作业与提交（经由后端代理，支持模板instructions JSON）
  const [assignmentLoading, setAssignmentLoading] = useState(true);
  const [assignmentError, setAssignmentError] = useState<string | null>(null);
  const [assignmentInfo, setAssignmentInfo] = useState<{
    id: string;
    title: string;
    description: string;
    due_date: string;
    url?: string;
  } | null>(null);

  // 🎯 标记课程完成 - 基于视频观看和作业完成的双重标准
  const handleMarkComplete = async () => {
    if (!courseId) return;
    
    // 检查完成条件
    if (!isVideoWatched) {
      toast.error('请先观看完课程视频', {
        description: '需要完成视频观看才能标记课程完成'
      });
      return;
    }
    
    if (!isSubmitted) {
      toast.error('请先提交课程作业', {
        description: '需要提交作业才能标记课程完成'
      });
      return;
    }
    
    setIsMarkingComplete(true);
    try {
      // 获取当前用户ID - 在实际应用中应该从认证状态获取
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        toast.error('请先登录');
        return;
      }
      
      // 先标记视频完成
      await ApiService.markVideoCompleted(courseId, user.id);
      
      // 再标记作业完成
      await ApiService.markAssignmentsCompleted(courseId, user.id);
      
      // 最后标记课程完成
      await ApiService.markCourseComplete(courseId, user.id);
      
      setIsCompleted(true);
      toast.success('🎉 恭喜完成课程！', {
        description: '您已成功完成视频观看和作业提交，课程学习完成！'
      });
    } catch (error) {
      console.error('标记课程完成失败:', error);
      toast.error('标记完成失败', {
        description: '请稍后重试或联系管理员'
      });
    } finally {
      setIsMarkingComplete(false);
    }
  };

  // 🎯 资料访问处理函数（支持链接查看和文件下载）
  const handleMaterialAccess = (material: any) => {
    try {
      if (material.downloadUrl && !material.downloadUrl.startsWith('#demo-file') && material.downloadUrl !== '#') {
        // 🎯 智能处理不同类型的资料链接
        if (isOnlineMaterial(material.downloadUrl)) {
          // 在线课件：新窗口打开
          window.open(material.downloadUrl, '_blank');
          toast('🎨 正在打开课件', { 
            description: `正在新窗口中打开 ${material.name}` 
          });
        } else {
          // 文件下载：直接下载
          const link = document.createElement('a');
          link.href = material.downloadUrl;
          link.download = material.name;
          link.target = '_blank';
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);
          toast('📁 下载已开始', { description: `正在下载 ${material.name}` });
        }
      } else {
        // 演示模式：生成一个真实的可下载文件
        const fileContent = generateDemoFileContent(material, courseData);
        const blob = new Blob([fileContent], { 
          type: getFileType(material.name)
        });
        
        const url = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = url;
        link.download = getDownloadFileName(material);
        link.style.display = 'none';
        
        document.body.appendChild(link);
        
        // 确保下载开始
        setTimeout(() => {
          link.click();
          
          toast('📁 文件下载成功', { 
            description: `${getDownloadFileName(material)} 已下载到您的下载文件夹`,
            duration: 3000
          });
          
          // 清理
          setTimeout(() => {
            document.body.removeChild(link);
            URL.revokeObjectURL(url);
          }, 100);
        }, 100);
      }
    } catch (error) {
      console.error('Access error:', error);
      toast.error('访问失败', { 
        description: '请检查链接是否有效或稍后重试'
      });
    }
  };

  // 🎯 判断是否为在线课件（只支持Gamma和飞书）
  const isOnlineMaterial = (url: string) => {
    return url.includes('gamma.app') || 
           url.includes('feishu.cn');
  };

  // 🎯 获取资料类型图标和标签（只支持Gamma和飞书）
  const getMaterialInfo = (material: any) => {
    const url = material.downloadUrl || '';
    
    if (url.includes('gamma.app')) {
      return { icon: '🎨', label: 'Gamma课件', action: '查看' };
    } else if (url.includes('feishu.cn')) {
      return { icon: '📋', label: '飞书文档', action: '查看' };
    } else if (url.includes('.pdf')) {
      return { icon: '📄', label: 'PDF文档', action: '下载' };
    } else if (url.includes('.zip') || url.includes('.rar')) {
      return { icon: '📦', label: '压缩文件', action: '下载' };
    } else {
      return { icon: '📁', label: '资料文件', action: '访问' };
    }
  };

  // 生成演示文件内容
  const generateDemoFileContent = (material: any, course: any) => {
    const fileName = material.name;
    const courseTitle = course?.title || '未知课程';
    const timestamp = new Date().toLocaleString('zh-CN');
    
    if (fileName.includes('手册') || fileName.includes('指南')) {
      return `# ${fileName}

## 课程：${courseTitle}

### 📚 学习目标
- 掌握核心概念和原理
- 理解实际应用场景
- 完成实践练习

### 📖 内容大纲
1. 基础概念介绍
2. 核心技术原理
3. 实际案例分析
4. 实践练习指导

### 💡 重点提示
- 建议结合视频学习
- 完成课后作业
- 参与讨论交流

### 📝 学习笔记
（请在此处记录您的学习心得）

---
📅 生成时间：${timestamp}
🎯 这是AI训练营学习平台生成的演示文档
💻 实际使用中将提供真实的课程资料文件`;
    }
    
    if (fileName.includes('代码') || fileName.includes('练习')) {
      return `# ${fileName}

## 项目说明
课程：${courseTitle}
文件类型：代码练习包

## 📁 文件结构
/src
  ├── main.py          # 主程序入口
  ├── utils.py         # 工具函数
  ├── config.py        # 配置文件
  └── tests/           # 测试文件

## 🚀 快速开始
1. 解压文件到本地目录
2. 安装依赖：pip install -r requirements.txt
3. 运行程序：python main.py

## 📝 练习要求
1. 完成基础功能实现
2. 添加错误处理
3. 编写单元测试
4. 提交作业到平台

## 💡 提示
- 遇到问题可以查看课程视频
- 参考官方文档
- 与同学交流讨论

---
📅 生成时间：${timestamp}
🎯 这是AI训练营学习平台生成的演示代码包
💻 实际使用中将提供完整的项目代码文件`;
    }
    
    return `${fileName}

课程：${courseTitle}

这是${courseTitle}的学习资料文件。

📚 内容概述：
本资料包含课程的核心学习内容，包括理论知识、实践指导和练习材料。

🎯 学习建议：
1. 先观看课程视频
2. 阅读理论资料
3. 完成实践练习
4. 提交课程作业

📝 注意事项：
- 请按照课程进度学习
- 如有疑问及时提问
- 积极参与讨论互动

---
📅 生成时间：${timestamp}
🏫 AI训练营学习平台
💻 实际使用中将提供真实的课程文件内容`;
  };

  // 获取文件类型
  const getFileType = (fileName: string) => {
    if (fileName.includes('pdf')) return 'application/pdf';
    if (fileName.includes('doc')) return 'application/msword';
    if (fileName.includes('zip')) return 'application/zip';
    if (fileName.includes('code') || fileName.includes('代码')) return 'text/plain';
    return 'text/plain;charset=utf-8';
  };

  // 获取下载文件名
  const getDownloadFileName = (material: any) => {
    const baseName = material.name;
    const timestamp = new Date().toISOString().slice(0, 10);
    
    if (baseName.includes('pdf')) return `${baseName}`;
    if (baseName.includes('doc')) return `${baseName}`;
    if (baseName.includes('zip')) return `${baseName}`;
    if (baseName.includes('代码') || baseName.includes('练习')) {
      return `${baseName.replace(/\.(txt|doc|pdf)$/i, '')}_${timestamp}.txt`;
    }
    
    return `${baseName.replace(/\.(txt|doc|pdf)$/i, '')}_${timestamp}.txt`;
  };

  // 飞书视频播放处理函数
  const handleVideoPlay = () => {
    if (!courseData.videoUrl) {
      toast.error('视频链接未配置', { 
        description: '请联系管理员添加课程视频链接'
      });
      return;
    }

    // 验证飞书链接格式
    const feishuPatterns = [
      /^https:\/\/[\w-]+\.feishu\.cn\/docx?\//,
      /^https:\/\/[\w-]+\.feishu\.cn\/file\//,
      /^https:\/\/[\w-]+\.feishu\.cn\/minutes\//,
      /^https:\/\/[\w-]+\.feishu\.cn\/drive\//,
      /^https:\/\/[\w-]+\.feishu\.cn\/vc\//,
      /^https:\/\/[\w-]+\.feishu\.cn\/wiki\//,  // 支持飞书知识库
    ];

    const isFeishuLink = feishuPatterns.some(pattern => pattern.test(courseData.videoUrl));
    
    if (isFeishuLink) {
      // 飞书链接
      toast('正在打开飞书视频', { 
        description: '视频将在新窗口中打开，请确保您已登录企业飞书账号' 
      });
      try {
        window.open(courseData.videoUrl, '_blank', 'noopener,noreferrer');
        // 不再使用3秒自动完成逻辑，由用户点击“我已看完视频”写库
      } catch (error) {
        toast.error('无法打开视频', { 
          description: '请检查浏览器弹窗设置或手动复制链接'
        });
      }
    } else {
      // 检测其他视频平台
      let platformName = '视频';
      if (courseData.videoUrl.includes('youtube.com') || courseData.videoUrl.includes('youtu.be')) {
        platformName = 'YouTube视频';
      } else if (courseData.videoUrl.includes('drive.google.com')) {
        platformName = 'Google Drive视频';
      } else if (courseData.videoUrl.includes('bilibili.com')) {
        platformName = 'B站视频';
      } else if (courseData.videoUrl.includes('vimeo.com')) {
        platformName = 'Vimeo视频';
      }
      
      toast(`正在打开${platformName}`, { 
        description: '视频将在新窗口中打开' 
      });
      try {
        window.open(courseData.videoUrl, '_blank', 'noopener,noreferrer');
        // 不再使用3秒自动完成逻辑，由用户点击“我已看完视频”写库
      } catch (error) {
        toast.error('无法打开视频', { 
          description: '请检查网络连接或链接是否有效'
        });
      }
    }
  };

  // 手动确认"我已看完视频"
  const handleMarkVideoWatched = async () => {
    console.log('🎬 点击"我已看完视频"按钮', { courseId: courseData?.id, userId });
    
    if (!courseData?.id || !userId) {
      console.error('❌ 缺少必要参数', { courseId: courseData?.id, userId });
      toast.error('请先登录');
      return;
    }
    
    try {
      console.log('📤 发送请求标记视频完成...', { courseId: courseData.id, userId });
      const ok = await ApiService.markVideoCompleted(courseData.id, userId);
      console.log('📥 收到响应', { ok });
      
      if (ok) {
        setIsVideoWatched(true);
        toast.success('已记录视频观看');
        console.log('✅ 视频观看记录成功');
      } else {
        toast.error('记录失败，请稍后重试');
        console.error('❌ 记录失败：API返回false');
      }
    } catch (error) {
      console.error('❌ 记录失败：异常', error);
      toast.error('记录失败，请稍后重试');
    }
  };
  
  // Get authenticated user ID
  const { user } = useAuth();
  const userId = user?.id || "";
  const [existingSubmissions, setExistingSubmissions] = useState([]);
  const [currentSubmission, setCurrentSubmission] = useState<any>(null);

  // 解析 instructions，兼容字符串或 JSON { url, sessions }
  const parseInstructions = (raw: any): { url?: string; sessions?: string[]; sessionUrls?: Array<{id: string; url: string}> } => {
    if (!raw) return {};
    if (typeof raw === 'string') {
      try {
        const parsed = JSON.parse(raw);
        if (parsed && typeof parsed === 'object') {
          return { url: typeof parsed.url === 'string' ? parsed.url : undefined, sessions: Array.isArray(parsed.sessions) ? parsed.sessions : undefined, sessionUrls: Array.isArray(parsed.sessionUrls) ? parsed.sessionUrls : undefined };
        }
        return { url: raw };
      } catch {
        return { url: raw };
      }
    }
    try {
      const parsed = JSON.parse(String(raw));
      if (parsed && typeof parsed === 'object') {
        return { url: typeof parsed.url === 'string' ? parsed.url : undefined, sessions: Array.isArray(parsed.sessions) ? parsed.sessions : undefined, sessionUrls: Array.isArray(parsed.sessionUrls) ? parsed.sessionUrls : undefined };
      }
    } catch {}
    return {};
  };

  // 后台加载：根据课程与当前期次，选择该课程的作业（按sessions过滤）并获取提交
  const loadAssignmentAndSubmission = async (courseIdValue: string) => {
    try {
      setAssignmentLoading(true);
      setAssignmentError(null);

      const currentSession = await ApiService.getCurrentSession();
      const sessionId = currentSession?.id;

      const list = await ApiService.getStudentAssignments();
      const forCourse = (list || []).filter((a: any) => a.course_id === courseIdValue);
      // 解析 instructions 并按期次过滤
      const normalized = forCourse.map((a: any) => {
        const { url, sessions, sessionUrls } = parseInstructions(a.instructions);
        return { ...a, __url: url, __sessions: sessions, __sessionUrls: sessionUrls };
      }).filter((a: any) => {
        if (!sessionId) return true;
        const s: string[] | undefined = a.__sessions;
        return !s || s.length === 0 || s.includes(sessionId);
      });

      // 选最新一条
      const pickedRaw = normalized[0];
      const picked = (() => {
        if (!pickedRaw) return null as any;
        if (!sessionId) return pickedRaw;
        const arr = pickedRaw.__sessionUrls as Array<{id: string; url: string}> | undefined;
        const found = arr?.find(x => x.id === sessionId && x.url);
        return found ? { ...pickedRaw, __url: found.url } : pickedRaw;
      })();
      if (picked) {
        setAssignmentInfo({
          id: picked.id,
          title: picked.title,
          description: picked.description || '',
          due_date: picked.due_date || '',
          url: picked.__url,
        });

        // 获取当前学员提交（后端代理）
        if (userId) {
          const submission = await ApiService.getStudentSubmission(picked.id, userId);
          setCurrentSubmission(submission);
          setIsSubmitted(!!submission);
        } else {
          setCurrentSubmission(null);
          setIsSubmitted(false);
        }
      } else {
        setAssignmentInfo(null);
        setCurrentSubmission(null);
        setIsSubmitted(false);
      }
    } catch (e: any) {
      console.error('加载作业失败:', e);
      setAssignmentError(e?.message || '加载作业失败');
      setAssignmentInfo(null);
      setCurrentSubmission(null);
      setIsSubmitted(false);
    } finally {
      setAssignmentLoading(false);
    }
  };

  // Load course data and submissions（分步：课程先呈现，作业后台加载）
  useEffect(() => {
    const loadCourseData = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        // 🚀 从Supabase API获取课程数据
        let course;
        try {
          console.log('正在从API获取课程详情:', courseId);
          course = await ApiService.getCourse(courseId || "");
          console.log('API获取课程成功:', course ? course.title : 'null');
        } catch (apiError) {
          console.error('API获取课程失败:', apiError);
          throw new Error('课程不存在或已被删除');
        }
        
        if (!course) {
          throw new Error("课程不存在");
        }
        
        setCourseData(course);
        // 课程首屏先呈现；作业与提交后台加载
        loadAssignmentAndSubmission(course.id);
      } catch (err) {
        setError(err.message || "加载课程数据失败");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadCourseData();
    // 回跳自动打点：?submitted=1&aid={assignmentId}
    try {
      const params = new URLSearchParams(window.location.search);
      const submitted = params.get('submitted');
      const aid = params.get('aid') || params.get('assignmentId');
      if (submitted === '1' && aid && userId) {
        ApiService.getStudentSubmission(aid, userId).then((s) => {
          if (!s) {
            // 若后端无记录，则创建一条最简提交记录（走旧接口以兼容）
            // 这里保持轻量，不阻塞页面
          }
        }).finally(() => {
          const url = new URL(window.location.href);
          url.searchParams.delete('submitted');
          url.searchParams.delete('aid');
          url.searchParams.delete('assignmentId');
          window.history.replaceState({}, '', url.toString());
        });
      }
    } catch {}
  }, [courseId, userId]);

  // Loading state
  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">加载中...</h2>
          <p className="text-muted-foreground">正在获取课程信息</p>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <div className="w-16 h-16 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <X className="w-8 h-8 text-red-500" />
          </div>
          <h1 className="text-2xl font-bold mb-2 text-red-600">加载失败</h1>
          <p className="text-muted-foreground mb-4">{error}</p>
          <Button onClick={() => window.location.reload()} variant="outline">
            重新加载
          </Button>
        </div>
      </div>
    );
  }

  if (!courseData) {
    return (
      <div className="min-h-screen bg-background p-6 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-2">课程不存在</h1>
          <p className="text-muted-foreground">请检查课程ID是否正确</p>
        </div>
      </div>
    );
  }

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 10 * 1024 * 1024) { // 10MB limit
        toast.error("文件大小不能超过10MB");
        return;
      }
      
      setAssignmentFile(file);
      
      // Generate file preview for images
      if (file.type.startsWith('image/')) {
        const reader = new FileReader();
        reader.onload = (e) => {
          setFilePreview(e.target?.result as string);
        };
        reader.readAsDataURL(file);
      } else {
        setFilePreview(null);
      }
      
      // Simulate upload progress
      setIsUploading(true);
      setUploadProgress(0);
      
      const interval = setInterval(() => {
        setUploadProgress(prev => {
          if (prev >= 100) {
            clearInterval(interval);
            setIsUploading(false);
            toast.success("文件上传成功");
            return 100;
          }
          return prev + 10;
        });
      }, 200);
    }
  };

  const handleRemoveFile = () => {
    setAssignmentFile(null);
    setFilePreview(null);
    setUploadProgress(0);
    setIsUploading(false);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getFileIcon = (fileName: string) => {
    const extension = fileName.split('.').pop()?.toLowerCase();
    switch (extension) {
      case 'pdf':
        return <FileText className="w-8 h-8 text-red-500" />;
      case 'doc':
      case 'docx':
        return <FileText className="w-8 h-8 text-blue-500" />;
      case 'txt':
        return <FileText className="w-8 h-8 text-gray-500" />;
      case 'zip':
      case 'rar':
        return <File className="w-8 h-8 text-yellow-500" />;
      default:
        return <File className="w-8 h-8 text-gray-500" />;
    }
  };

  const handleSubmitAssignment = async () => {
    if (!assignmentText.trim() && !assignmentFile) {
      toast.error("请至少填写文本内容或上传文件");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1500));

      // Create submission data
      const submissionData = {
        studentId: userId,
        studentName: "当前用户", // In real app, get from auth context
        studentEmail: "user@company.com", // In real app, get from auth context
        courseId: courseData.id,
        courseName: courseData.title,
        assignmentId: courseData.assignment?.id || '',
        assignmentTitle: courseData.assignment?.title || '',
        status: 'submitted' as const,
        submittedAt: new Date().toISOString(),
        submittedText: assignmentText,
        submittedFiles: assignmentFile ? [assignmentFile.name] : undefined
      };

      await ApiService.submitAssignment(
        courseData.assignment?.id || '',
        userId,
        { content: assignmentText, fileUrl: assignmentFile?.name }
      );
      setIsSubmitted(true);
      toast.success("作业提交成功！");
    } catch (error) {
      toast.error("提交失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  // —— 模板/飞书表单 ——
  const handleOpenForm = () => {
    if (!assignmentInfo?.url) return;
    window.open(assignmentInfo.url, '_blank', 'noopener,noreferrer');
  };

  const handleMarkFormSubmitted = async () => {
    if (!assignmentInfo?.id || !userId) { toast.error('请先登录或稍后重试'); return; }
    try {
      setIsSubmitting(true);
      // 通过后端代理创建/更新提交
      const ok = await ApiService.markAssignmentSubmitted(assignmentInfo.id, userId, { content: 'feishu_form_submitted' });
      if (ok) {
        setIsSubmitted(true);
        toast.success('已记录提交');
      } else {
        toast.error('记录提交失败');
      }
    } catch (e) {
      toast.error('记录提交失败');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleUpdateSubmission = async () => {
    if (!currentSubmission) return;
    
    try {
      setIsSubmitting(true);
      
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // 重新提交作业（Supabase中没有直接的更新方法）
        await ApiService.submitAssignment(
          currentSubmission.assignment_id,
          userId,
          { content: assignmentText, fileUrl: assignmentFile?.name }
        );
      
      toast.success("作业更新成功！");
    } catch (error) {
      toast.error("更新失败，请重试");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-background p-6">
      <div className="max-w-7xl mx-auto">
        {/* Course Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-2">{courseData.title}</h1>
          <p className="text-muted-foreground mb-4">{courseData.description}</p>
          <div className="flex items-center space-x-4 text-sm text-muted-foreground">
            <div className="flex items-center space-x-1">
              <Clock className="w-4 h-4" />
              <span>{courseData.duration}</span>
            </div>
            <div className="flex items-center space-x-1">
              <BookOpen className="w-4 h-4" />
              <span>课程ID: {courseData.id}</span>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Video Player */}
          <div className="lg:col-span-2 space-y-6">
            {/* Video Section */}
            <Card>
              <CardContent className="p-0">
                <div className="aspect-video bg-black rounded-lg overflow-hidden relative group cursor-pointer">
                  {courseData.cover ? (
                    <>
                      {/* 课程封面 */}
                      <img 
                        src={courseData.cover} 
                        alt={courseData.title}
                        className="w-full h-full object-cover"
                      />
                      
                      {/* 播放按钮覆盖层 */}
                      <div className="absolute inset-0 bg-black/30 flex items-center justify-center group-hover:bg-black/50 transition-all duration-300">
                        <div 
                          className="bg-primary hover:bg-primary/90 rounded-full p-6 shadow-2xl transform group-hover:scale-110 transition-all duration-300"
                          onClick={() => handleVideoPlay()}
                        >
                          <Video className="w-12 h-12 text-primary-foreground" />
                        </div>
                      </div>
                      
                      {/* 视频信息标签 */}
                      <div className="absolute top-4 left-4">
                        <Badge className="bg-black/60 text-white border-none">
                          <Clock className="w-3 h-3 mr-1" />
                          {courseData.duration || '时长未知'}
                        </Badge>
                      </div>
                      
                      {/* 播放提示 */}
                      <div className="absolute bottom-4 left-4 right-4">
                        <div className="bg-black/60 backdrop-blur-sm rounded-lg p-3 text-white">
                          <p className="text-sm font-medium">{courseData.title}</p>
                          <p className="text-xs opacity-80 mt-1">
                            {courseData.videoUrl?.includes('feishu.cn') 
                              ? '🚀 点击播放飞书企业视频' 
                              : '▶️ 点击播放视频内容'
                            }
                          </p>
                        </div>
                      </div>
                    </>
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-white">
                      <div className="text-center">
                        <Video className="w-16 h-16 mx-auto mb-4 opacity-80" />
                        <p className="text-lg mb-2">暂无视频内容</p>
                        <p className="text-sm opacity-60">请联系管理员添加课程封面和视频链接</p>
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Assignment Submission */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <FileText className="w-5 h-5" />
                  <span>课后作业</span>
                  {isSubmitted && <CheckCircle className="w-5 h-5 text-green-500" />}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                {/* 后端加载的作业信息 */}
                {assignmentLoading ? (
                  <div className="text-sm text-muted-foreground">正在加载作业...</div>
                ) : assignmentError ? (
                  <div className="text-sm text-red-600">
                    {assignmentError}
                    <Button variant="outline" size="sm" className="ml-2" onClick={() => loadAssignmentAndSubmission(courseData.id)}>重试</Button>
                  </div>
                ) : assignmentInfo ? (
                  <div>
                    <h4 className="font-semibold text-lg mb-2">{assignmentInfo.title}</h4>
                    <p className="text-muted-foreground mb-4">{assignmentInfo.description || '暂无作业描述'}</p>
                    <div className="flex items-center space-x-4 text-sm text-muted-foreground mb-4">
                      <span>截止时间: {assignmentInfo.due_date ? new Date(assignmentInfo.due_date).toLocaleString() : '未设置'}</span>
                    </div>
                    {assignmentInfo.url && (
                      <div className="flex gap-2 mb-2">
                        <Button onClick={handleOpenForm} className="flex items-center gap-2">
                          <Upload className="w-4 h-4" />
                          完成作业
                        </Button>
                        {!isSubmitted && (
                          <Button variant="outline" onClick={handleMarkFormSubmitted} disabled={isSubmitting}>
                            我已提交
                          </Button>
                        )}
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="text-sm text-muted-foreground">暂无作业</div>
                )}

                {/* 新逻辑：仅支持“飞书表单 + 我已提交”模式。若当前课程暂无发布的作业，则展示提示，不再显示文本/附件上传表单。 */}
                {!assignmentInfo?.url && (
                  <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
                    暂无发布的作业，请等待老师在「作业管理」中发布本课程的作业。
                  </div>
                )}

                {/* Submit Button */}
                <div className="flex justify-end"></div>
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Course Materials */}
          <div className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <Download className="w-5 h-5" />
                  <span>课程资料</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {(courseData.materials || []).map((material) => {
                    const materialInfo = getMaterialInfo(material);
                    return (
                      <div
                        key={material.id}
                        className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/50 transition-colors"
                      >
                        <div className="flex items-center space-x-3">
                          <div className="text-2xl">{materialInfo.icon}</div>
                          <div className="flex-1">
                            <h5 className="font-medium text-sm flex items-center space-x-2">
                              <span>{material.name}</span>
                              <Badge variant="secondary" className="text-xs">
                                {materialInfo.label}
                              </Badge>
                            </h5>
                            <p className="text-xs text-muted-foreground mt-1">
                              {material.size || '点击访问课件内容'}
                            </p>
                            {material.downloadUrl && isOnlineMaterial(material.downloadUrl) && (
                              <p className="text-xs text-blue-600 mt-1">
                                🔗 在线查看 · 新窗口打开
                              </p>
                            )}
                          </div>
                        </div>
                        <Button 
                          size="sm" 
                          variant={isOnlineMaterial(material.downloadUrl) ? "default" : "outline"}
                          onClick={() => handleMaterialAccess(material)}
                          className={isOnlineMaterial(material.downloadUrl) ? "bg-blue-600 hover:bg-blue-700" : ""}
                        >
                          {materialInfo.action === '查看' ? (
                            <>
                              <Eye className="w-4 h-4 mr-1" />
                              查看
                            </>
                          ) : (
                            <>
                              <Download className="w-4 h-4 mr-1" />
                              {materialInfo.action}
                            </>
                          )}
                        </Button>
                      </div>
                    );
                  })}
                </div>
              </CardContent>
            </Card>

            {/* Course Progress */}
            <Card>
              <CardHeader>
                <CardTitle>学习进度</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {/* 阶段按钮 - 更简洁的二步确认 */}
                  <div className="grid gap-3">
                    <Button
                      size="lg"
                      className="w-full"
                      variant={isVideoWatched ? 'default' : 'outline'}
                      onClick={handleMarkVideoWatched}
                      disabled={isVideoWatched}
                    >
                      {isVideoWatched ? '已记录：我已看完视频' : '我已看完视频'}
                    </Button>
                    <Button
                      size="lg"
                      className="w-full"
                      onClick={handleMarkFormSubmitted}
                      disabled={!assignmentInfo?.id || isSubmitted}
                      variant={isSubmitted ? 'default' : 'outline'}
                    >
                      {isSubmitted ? '已记录：我已完成作业' : '我已完成作业'}
                    </Button>
                  </div>

                  {/* 完成学习按钮 - 条件达成自动高亮 */}
                  <div className="pt-3 border-t">
                    <Button
                      onClick={handleMarkComplete}
                      disabled={!(isVideoWatched && isSubmitted) || isMarkingComplete}
                      className={`w-full ${isVideoWatched && isSubmitted ? '' : 'opacity-60 cursor-not-allowed'}`}
                      size="lg"
                    >
                      {isMarkingComplete ? (
                        <>
                          <Loader2 className="w-4 h-4 mr-2 animate-spin" /> 标记中...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="w-4 h-4 mr-2" /> 完成学习
                        </>
                      )}
                    </Button>
                    {!(isVideoWatched && isSubmitted) && (
                      <p className="text-xs text-muted-foreground mt-2 text-center">
                        请先点击上方“我已看完视频”和“我已完成作业”进行记录
                      </p>
                    )}
                    {isCompleted && (
                      <div className="flex items-center justify-center text-green-600 text-sm mt-2">
                        <CheckCircle className="w-4 h-4 mr-2" /> 恭喜您完成了本课程！
                      </div>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDetail;