import { useState, useEffect, useCallback, memo, useRef } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
// 已迁移到Supabase，不再需要本地存储
// import { useAppStore } from "@/hooks/useAppStore";
import { Course, Assignment } from "@/lib/types";
import { ApiService } from "@/lib/api";
import { Plus, Edit, Trash2, Users, Clock, BookOpen, FileText, Download, X, TrendingUp, Upload } from "lucide-react";
import { LoadingSpinner, CardSkeleton, LoadingButton } from "@/components/ui/loading-spinner";
import { useToast } from "@/hooks/use-toast";
// ErrorDisplay component removed - not exported from ErrorBoundary

// Simple ErrorDisplay component for local use
const ErrorDisplay = ({ error, onRetry }: { error: Error; onRetry: () => void }) => (
  <div className="text-center py-8">
    <div className="text-red-600 mb-4">
      <p className="text-lg font-semibold">加载失败</p>
      <p className="text-sm">{error.message}</p>
    </div>
    <Button onClick={onRetry} variant="outline">
      重试
    </Button>
  </div>
);

// 🚀 将CourseForm移到组件外部，避免重新创建导致的性能问题
interface CourseFormProps {
  formData: {
    title: string;
    description: string;
    cover: string;
    videoUrl: string;
    duration: string;
    instructor: string;
    // 🔄 改为多作业支持
    assignments: Assignment[];
    // 资料字段
    materials: Array<{
      id?: string;
      name: string;
      type: string;
      size: string;
      downloadUrl: string;
    }>;
  };
  updateFormField: (field: string, value: string) => void;
  resetForm: () => void;
  isEdit?: boolean;
  onSubmit: () => void;
  onCancel: () => void;
  isSubmitting: boolean;
  // 资料管理
  onAddMaterial: () => void;
  onRemoveMaterial: (index: number) => void;
  onUpdateMaterial: (index: number, partial: { name?: string; size?: string; downloadUrl?: string; type?: string; }) => void;
  // 🚀 新增：作业管理
  onAddAssignment: () => void;
  onRemoveAssignment: (index: number) => void;
  onUpdateAssignment: (index: number, assignment: Partial<Assignment>) => void;
  // 🖼️ 封面上传相关
  coverPreview: string;
  isDragOver: boolean;
  coverInputRef: React.RefObject<HTMLInputElement>;
  onDragOver: (e: React.DragEvent) => void;
  onDragLeave: (e: React.DragEvent) => void;
  onDrop: (e: React.DragEvent) => void;
  onCoverClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onRemoveCover: () => void;
}

const CourseForm = memo(({ 
  formData, 
  updateFormField, 
  resetForm, 
  isEdit = false, 
  onSubmit, 
  onCancel, 
  isSubmitting,
  onAddMaterial,
  onRemoveMaterial,
  onUpdateMaterial,
  onAddAssignment,
  onRemoveAssignment,
  onUpdateAssignment,
  // 🖼️ 封面上传相关
  coverPreview,
  isDragOver,
  coverInputRef,
  onDragOver,
  onDragLeave,
  onDrop,
  onCoverClick,
  onFileChange,
  onRemoveCover
}: CourseFormProps) => (
  <div className="space-y-4">
    <div>
      <Label htmlFor="title">课程标题 *</Label>
      <Input
        id="title"
        value={formData.title}
        onChange={(e) => updateFormField('title', e.target.value)}
        placeholder="请输入课程标题"
      />
    </div>
    <div>
      <Label htmlFor="description">课程描述</Label>
      <Textarea
        id="description"
        value={formData.description}
        onChange={(e) => updateFormField('description', e.target.value)}
        placeholder="可选，支持为空"
        rows={3}
      />
    </div>
    <div>
      <Label htmlFor="instructor">讲师</Label>
      <Input
        id="instructor"
        value={formData.instructor}
        onChange={(e) => updateFormField('instructor', e.target.value)}
        placeholder="请输入讲师姓名"
      />
    </div>
    <div>
      <Label htmlFor="cover">课程封面</Label>
      <div className="space-y-3">
        {/* 封面预览 */}
        {coverPreview && (
          <div className="relative inline-block">
            <img
              src={coverPreview}
              alt="课程封面预览"
              className="w-32 h-20 object-cover rounded-lg border"
            />
            <Button
              type="button"
              variant="destructive"
              size="sm"
              onClick={onRemoveCover}
              className="absolute -top-2 -right-2 w-6 h-6 rounded-full p-0"
            >
              <X className="w-3 h-3" />
            </Button>
          </div>
        )}
        
        {/* 文件上传区域 */}
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center cursor-pointer transition-colors ${
            isDragOver
              ? 'border-blue-400 bg-blue-50'
              : 'border-gray-300 hover:border-gray-400'
          }`}
          onDragOver={onDragOver}
          onDragLeave={onDragLeave}
          onDrop={onDrop}
          onClick={onCoverClick}
        >
          <Upload className="w-8 h-8 mx-auto mb-2 text-gray-400" />
          <p className="text-sm text-gray-600 mb-1">
            {isDragOver ? '松开鼠标上传文件' : '点击选择或拖拽图片到此处'}
          </p>
          <p className="text-xs text-gray-500">
            支持 PNG、JPG、JPEG 格式，最大 5MB
          </p>
        </div>
        
        {/* 隐藏的文件输入框 */}
        <input
          ref={coverInputRef}
          type="file"
          accept="image/png,image/jpeg,image/jpg"
          onChange={onFileChange}
          className="hidden"
        />
      </div>
      <p className="text-xs text-muted-foreground mt-1">
        学员将看到此封面图片，建议尺寸：800×450
      </p>
    </div>
    <div>
      <Label htmlFor="videoUrl">视频链接</Label>
      <Input
        id="videoUrl"
        value={formData.videoUrl}
        onChange={(e) => updateFormField('videoUrl', e.target.value)}
        placeholder="https://your-company.feishu.cn/docx/文档ID"
      />
    </div>

    {/* 🚀 新的多作业管理部分 */}
    <div className="border rounded-lg p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold flex items-center space-x-2">
          <FileText className="w-5 h-5" />
          <span>课程作业管理</span>
        </h3>
        <Button 
          type="button" 
          variant="outline" 
          size="sm"
          onClick={onAddAssignment}
          className="flex items-center space-x-2"
        >
          <Plus className="w-4 h-4" />
          <span>添加作业</span>
        </Button>
      </div>
      
      {formData.assignments.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
          <p>暂无作业，点击"添加作业"创建第一个作业</p>
        </div>
      ) : (
        <div className="space-y-4">
          {formData.assignments.map((assignment, index) => (
            <div key={assignment.id} className="p-4 bg-gray-50 border border-gray-200 rounded-lg space-y-3">
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-semibold text-gray-700">作业 #{index + 1}</h4>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => onRemoveAssignment(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  <X className="w-4 h-4" />
                </Button>
              </div>
              
              <div>
                <Label>作业标题</Label>
                <Input
                  value={assignment.title}
                  onChange={(e) => onUpdateAssignment(index, { title: e.target.value })}
                  placeholder="请输入作业标题"
                />
              </div>
              
              <div>
                <Label>作业描述</Label>
                <Textarea
                  value={assignment.description}
                  onChange={(e) => onUpdateAssignment(index, { description: e.target.value })}
                  placeholder="请输入作业要求和描述"
                  rows={2}
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label>截止日期</Label>
                  <Input
                    type="date"
                    value={assignment.due_date || ''}
                    onChange={(e) => onUpdateAssignment(index, { due_date: e.target.value })}
                  />
                </div>
                {/* 移除：文件大小/允许类型/允许上传 设置 */}
              </div>
              
              {/* 原先的文件类型与大小、允许上传选项已删，以飞书表单为准 */}
              

            </div>
          ))}
        </div>
      )}
    </div>

    {/* 🔗 课程资料链接管理 */}
    <div className="border rounded-lg p-4 space-y-4">
      <h3 className="text-lg font-semibold flex items-center space-x-2">
        <Download className="w-5 h-5" />
        <span>课程资料链接</span>
      </h3>
      
      <div className="space-y-3">
        <div className="p-2 bg-blue-50 rounded border border-blue-200">
          <p className="text-sm text-blue-800">📋 支持：Gamma课件、飞书文档</p>
        </div>
        
        {formData.materials.map((material, index) => (
          <div key={material.id} className="p-4 bg-white border border-gray-200 rounded-lg space-y-3 shadow-sm">
            <div className="flex items-center justify-between">
              <h4 className="text-sm font-medium text-gray-700">资料 #{index + 1}</h4>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => onRemoveMaterial(index)}
                className="text-red-600 hover:text-red-700"
              >
                <X className="w-4 h-4" />
              </Button>
            </div>
            
            <div className="space-y-3">
              {/* 🔗 课件链接 - 主要字段 */}
              <div>
                <Label className="text-sm font-medium">课件链接 *</Label>
                <Input
                  placeholder="粘贴Gamma课件链接或其他文档链接"
                  value={material.downloadUrl}
                  onChange={(e) => {
                    const url = e.target.value;
                    const partial: any = { downloadUrl: url };
                    if (url.includes('gamma.app')) {
                      partial.type = 'gamma';
                      if (!material.name) partial.name = `Gamma课件 ${index + 1}`;
                    } else if (url.includes('feishu.cn')) {
                      partial.type = 'feishu';
                      if (!material.name) partial.name = `飞书文档 ${index + 1}`;
                    } else {
                      partial.type = 'other';
                    }
                    onUpdateMaterial(index, partial);
                  }}
                  className="font-mono text-sm"
                />
                {material.downloadUrl && (
                  <p className="text-xs text-gray-500 mt-1">
                    🔗 类型: {
                      material.downloadUrl.includes('gamma.app') ? '🎨 Gamma课件' :
                      material.downloadUrl.includes('feishu.cn') ? '📋 飞书文档' :
                      '🔗 其他链接'
                    }
                  </p>
                )}
              </div>
              
              {/* 📝 资料名称 */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <Label className="text-sm">资料名称</Label>
                  <Input
                    placeholder="例如：第一章课件"
                    value={material.name}
                    onChange={(e) => onUpdateMaterial(index, { name: e.target.value })}
                  />
                </div>
                <div>
                  <Label className="text-sm">描述信息</Label>
                  <Input
                    placeholder="例如：课程介绍、实战案例"
                    value={material.size}
                    onChange={(e) => onUpdateMaterial(index, { size: e.target.value })}
                  />
                </div>
              </div>
            </div>
          </div>
        ))}
        
        <Button
          type="button"
          variant="outline"
          onClick={onAddMaterial}
          className="w-full border-dashed border-2 py-3 text-gray-600 hover:text-gray-800 hover:border-gray-400"
        >
          <Plus className="w-5 h-5 mr-2" />
          添加课件链接
        </Button>

      </div>
    </div>

    <div className="flex justify-end space-x-2">
      <Button variant="outline" onClick={onCancel}>
        取消
      </Button>
      <LoadingButton onClick={onSubmit} isLoading={isSubmitting}>
        {isEdit ? "更新" : "创建"}
      </LoadingButton>
    </div>
  </div>
));

CourseForm.displayName = 'CourseForm';

const CourseManagement = () => {
  // 已迁移到Supabase，不再使用本地存储
  // const { courses: localCourses, addCourse, updateCourse, deleteCourse } = useAppStore();
  const [courses, setCourses] = useState<Course[]>([]);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // 🎯 生成唯一ID的辅助函数
  const generateId = useCallback(() => {
    return crypto?.randomUUID?.() || `id-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }, []);
  
  // 🚀 表单数据状态
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cover: "",
    videoUrl: "",
    duration: "",
    instructor: "",
    // 🔄 改为多作业支持
    assignments: [] as Assignment[],
    // 资料字段
    materials: [] as Array<{
      name: string;
      type: string;
      size: string;
      downloadUrl: string;
    }>
  });

  // 🖼️ 封面上传相关状态
  const [coverPreview, setCoverPreview] = useState<string>("");
  const [isDragOver, setIsDragOver] = useState(false);
  const coverInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();

  // 🚀 真正从数据库加载课程数据
  useEffect(() => {
    const loadCourses = async () => {
      try {
        setIsLoading(true);
        setError(null);
        
        console.log('管理员界面：正在从数据库加载课程...');
        console.log('当前localStorage user_role:', localStorage.getItem('user_role'));
        console.log('当前路径:', window.location.pathname);
        
        // 优先从API获取真实数据
        const coursesData = await ApiService.getCourses();
        
        // 🚀 修复：始终使用数据库数据，即使为空也不回退到本地数据
        setCourses(coursesData || []);
        console.log('管理员界面：成功加载', (coursesData || []).length, '个课程');
        
        if (!coursesData || coursesData.length === 0) {
          console.log('📝 数据库中暂无课程，可以通过"创建课程"按钮添加新课程');
        }
        
        setIsLoading(false);
      } catch (err) {
        console.error('管理员界面：加载课程失败:', err);
        // 🚀 修复：发生错误时显示空列表，不使用本地模拟数据
        setCourses([]);
        setError(err instanceof Error ? err : new Error('加载数据失败'));
        setIsLoading(false);
      }
    };

    loadCourses();
  }, []); // 🚀 修复：移除对localCourses的依赖

  const handleRetry = async () => {
    try {
      setError(null);
      setIsLoading(true);
      
      console.log('重试：正在从数据库加载课程...');
      // 重新调用API获取数据
      const coursesData = await ApiService.getCourses();
      
      setCourses(coursesData || []);
      console.log('重试成功：加载了', (coursesData || []).length, '个课程');
      
      if (!coursesData || coursesData.length === 0) {
        console.log('📝 数据库中暂无课程，可以通过"创建课程"按钮添加新课程');
      }
      
      setIsLoading(false);
    } catch (err) {
      console.error('重试失败:', err);
      setCourses([]);
      setError(err instanceof Error ? err : new Error('重试加载数据失败'));
      setIsLoading(false);
    }
  };

  // 🚀 优化表单处理函数
  const resetForm = useCallback(() => {
    setFormData({
      title: "",
      description: "",
      cover: "",
      videoUrl: "",
      duration: "",
      instructor: "",
      // 🔄 改为多作业支持
      assignments: [],
      // 资料字段
      materials: []
    });
    setCoverPreview("");
  }, []);

  // 🖼️ 封面上传处理函数
  const handleCoverUpload = useCallback((file: File) => {
    // 文件类型验证
    const allowedTypes = ['image/png', 'image/jpeg', 'image/jpg'];
    if (!allowedTypes.includes(file.type)) {
      toast({
        title: "文件格式不支持",
        description: "请选择 PNG、JPG 或 JPEG 格式的图片",
        variant: "destructive"
      });
      return;
    }

    // 文件大小验证 (5MB)
    const maxSize = 5 * 1024 * 1024;
    if (file.size > maxSize) {
      toast({
        title: "文件过大",
        description: "图片大小不能超过 5MB",
        variant: "destructive"
      });
      return;
    }

    // 创建预览
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setCoverPreview(result);
      setFormData(prev => ({ ...prev, cover: result }));
    };
    reader.readAsDataURL(file);
  }, [toast]);

  // 🖼️ 删除封面
  const handleRemoveCover = useCallback(() => {
    setCoverPreview("");
    setFormData(prev => ({ ...prev, cover: "" }));
    if (coverInputRef.current) {
      coverInputRef.current.value = "";
    }
  }, []);

  // 🖼️ 拖拽处理
  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      handleCoverUpload(files[0]);
    }
  }, [handleCoverUpload]);

  // 🖼️ 点击选择文件
  const handleCoverClick = useCallback(() => {
    coverInputRef.current?.click();
  }, []);

  const handleFileChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      handleCoverUpload(files[0]);
    }
  }, [handleCoverUpload]);

  // 🚀 优化输入处理函数，避免重新创建对象
  const updateFormField = useCallback((field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  }, []);

  // 🚀 作业管理函数
  const addAssignment = useCallback(() => {
    const newAssignment: Assignment = {
      id: generateId(),
      course_id: '', // 将在课程创建时设置
      title: `U${(formData.assignments?.length || 0) + 1}`,
      description: '',
      assignment_type: 'general',
      due_date: '',
      max_score: 100,
      allow_file_upload: false,
      allowed_file_types: '',
      max_file_size_mb: 0,
      instructions: '',
      requirements: [],
      is_active: true,
      created_at: '',
      updated_at: ''
    };
    setFormData(prev => ({
      ...prev,
      assignments: [...prev.assignments, newAssignment]
    }));
  }, [generateId]);

  const removeAssignment = useCallback((index: number) => {
    setFormData(prev => ({
      ...prev,
      assignments: prev.assignments.filter((_, i) => i !== index)
    }));
  }, []);

  const updateAssignment = useCallback((index: number, updates: Partial<Assignment>) => {
    setFormData(prev => ({
      ...prev,
      assignments: prev.assignments.map((assignment, i) => 
        i === index ? { ...assignment, ...updates } : assignment
      )
    }));
  }, []);

  const handleCreate = async () => {
    if (!formData.title) {
      alert("请填写课程标题");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 准备课程数据
      const newCourseData = {
        title: formData.title,
        description: formData.description,
        cover: formData.cover || "https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&auto=format&fit=crop&w=2340&q=80",
        videoUrl: formData.videoUrl || "",
        duration: formData.duration || "",
        materials: formData.materials.map(material => ({
          id: generateId(),
          name: material.name,
          size: material.size,
          type: material.type as 'pdf' | 'document' | 'code' | 'video' | 'other',
          downloadUrl: material.downloadUrl,
          uploadedAt: new Date().toISOString()
        })),
        // 🔄 改为多作业支持
        assignments: formData.assignments,
        studentCount: 0,
        completionRate: 0,
        instructor: formData.instructor || "管理员",
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      // 🚀 真正调用Supabase API创建课程
      console.log('正在创建课程到数据库:', newCourseData.title);
      const createdCourse = await ApiService.createCourse(newCourseData);
      console.log('课程创建成功:', createdCourse);

      // 同步写入资料到数据库
      if (createdCourse?.id) {
        await ApiService.setCourseMaterials(createdCourse.id, formData.materials as any);
        
        // 🚀 新增：创建所有作业到数据库
        // 将课程中填的作业，自动生成“模板”（status=template）
        for (const assignment of formData.assignments) {
          const title = (assignment.title || '').trim();
          if (!title) continue;
          console.log('正在为课程自动创建作业模板:', title);
          await ApiService.createAssignmentTemplate(createdCourse.id, {
            title,
            description: assignment.description || '',
            formUrl: assignment.instructions || '',
            dueDaysOffset: undefined
          });
        }
      }
      
      // 更新管理员界面状态
      setCourses(prev => [...prev, createdCourse]);
      
      resetForm();
      setIsCreateDialogOpen(false);
      
      // 显示成功提示
      alert(`课程《${createdCourse.title}》创建成功！已创建 ${formData.assignments.length} 个作业。`);
      
    } catch (err) {
      console.error('创建课程失败:', err);
      alert(`创建课程失败: ${err.message || '未知错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleEdit = async (course: Course) => {
    setEditingCourse(course);
    try {
      // 关键修复：在打开编辑弹窗前，拉取该课程的完整详情（含资料）
      const fullCourse = await ApiService.getCourse(course.id);
      
      // 🎯 新增：同时获取该课程的作业数据
      const assignments = await ApiService.getAssignments(course.id);
      const existingAssignment = assignments.length > 0 ? assignments[0] : null;

      const source = fullCourse || course;
      setFormData({
        title: source.title,
        description: source.description,
        cover: source.cover,
        videoUrl: source.videoUrl || "",
        duration: source.duration || "",
        instructor: source.instructor || "",
        // 🎯 修改：使用数据库中的真实作业数据
        assignments: assignments || [],
        // 资料：从后端拉到的真实数据
        materials: (source.materials || []).map((m) => ({
          name: m.name,
          type: m.type,
          size: m.size,
          downloadUrl: m.downloadUrl
        }))
      });
    } catch (e) {
      console.warn('加载课程详情失败，使用列表数据回退');
      setFormData({
        title: course.title,
        description: course.description,
        cover: course.cover,
        videoUrl: course.videoUrl || "",
        duration: course.duration || "",
        instructor: course.instructor || "",
        assignments: [],
        materials: []
      });
    }
    setIsEditDialogOpen(true);
  };

  // 统一管理 materials 的增删改，避免在子组件内直接 setFormData 造成作用域问题
  const handleAddMaterial = useCallback(() => {
    const newMaterial = {
      id: generateId(),
      name: "",
      type: "other",
      size: "",
      downloadUrl: ""
    };
    setFormData(prev => ({ ...prev, materials: [...prev.materials, newMaterial] }));
  }, [generateId]);

  const handleRemoveMaterial = useCallback((index: number) => {
    setFormData(prev => ({ ...prev, materials: prev.materials.filter((_, i) => i !== index) }));
  }, []);

  const handleUpdateMaterial = useCallback((index: number, partial: { name?: string; size?: string; downloadUrl?: string; type?: string; }) => {
    setFormData(prev => {
      const next = [...prev.materials];
      next[index] = { ...next[index], ...partial } as any;
      return { ...prev, materials: next };
    });
  }, []);

  const handleUpdate = async () => {
    if (!editingCourse || !formData.title) {
      alert("请填写课程标题");
      return;
    }

    try {
      setIsSubmitting(true);
      
      // 准备更新数据
      const updatedCourseData = {
        title: formData.title,
        description: formData.description,
        cover: formData.cover || editingCourse.cover,
        videoUrl: formData.videoUrl || "",
        duration: formData.duration || "",
        instructor: formData.instructor || editingCourse.instructor,
        materials: formData.materials.map(material => ({
          id: generateId(),
          name: material.name,
          size: material.size,
          type: material.type as 'pdf' | 'document' | 'code' | 'video' | 'other',
          downloadUrl: material.downloadUrl,
          uploadedAt: new Date().toISOString()
        })),
        updatedAt: new Date().toISOString()
      };

      // 🚀 真正调用Supabase API更新课程
      console.log('正在更新课程到数据库:', editingCourse.id, updatedCourseData.title);
      const updatedCourse = await ApiService.updateCourse(editingCourse.id, updatedCourseData);
      console.log('课程更新成功:', updatedCourse);

      // 覆盖写入最新资料
      await ApiService.setCourseMaterials(editingCourse.id, formData.materials as any);
      
      // 🎯 处理作业更新
      const existingAssignments = await ApiService.getAssignments(editingCourse.id);
      
      // 处理表单中的作业数据
      for (let i = 0; i < formData.assignments.length; i++) {
        const assignment = formData.assignments[i];
        if (assignment.title.trim()) {
          if (existingAssignments[i]) {
            // 更新现有作业
            console.log('正在更新作业:', assignment.title);
            const payload = {
              title: assignment.title,
              description: assignment.description,
              requirements: [],
              due_date: assignment.due_date,
              max_score: assignment.max_score || 100,
              // 统一走外部表单，不携带文件上传控制
              instructions: assignment.instructions || ''
            } as any;
            await ApiService.updateAssignment(existingAssignments[i].id, payload);
          } else {
            // 创建新作业
            console.log('正在创建新作业:', assignment.title);
            const payload = {
              course_id: editingCourse.id,
              title: assignment.title,
              description: assignment.description,
              assignment_type: assignment.assignment_type || 'general',
              due_date: assignment.due_date,
              max_score: assignment.max_score || 100,
              // 统一走外部表单，不携带文件上传控制
              instructions: assignment.instructions || '',
              requirements: assignment.requirements || []
            } as any;
            await ApiService.createAssignment(payload);
          }
        }
      }
      
      // 删除多余的作业
      for (let i = formData.assignments.length; i < existingAssignments.length; i++) {
        console.log('正在删除多余作业');
        await ApiService.deleteAssignment(existingAssignments[i].id);
      }
      
      // 更新管理员界面状态
      setCourses(prev => prev.map(course => 
        course.id === editingCourse.id ? updatedCourse : course
      ));
      
      resetForm();
      setEditingCourse(null);
      setIsEditDialogOpen(false);
      
      // 显示成功提示
      alert(`课程《${updatedCourse.title}》更新成功！`);
      
    } catch (err) {
      console.error('更新课程失败:', err);
      alert(`更新课程失败: ${err.message || '未知错误'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleDelete = async (courseId: string) => {
    if (window.confirm("确定要删除这门课程吗？此操作不可撤销。")) {
      try {
        // 🚀 真正调用Supabase API删除课程
        console.log('正在从数据库删除课程:', courseId);
        await ApiService.deleteCourse(courseId);
        console.log('课程删除成功:', courseId);
        
        // 更新管理员界面状态
        setCourses(prev => prev.filter(course => course.id !== courseId));
        
        alert('课程删除成功！');
      } catch (err) {
        console.error('删除课程失败:', err);
        alert(`删除课程失败: ${err.message || '未知错误'}`);
      }
    }
  };

  // 🚀 创建取消和提交回调函数
  const handleCreateCancel = useCallback(() => {
    resetForm();
    setIsCreateDialogOpen(false);
  }, [resetForm]);

  const handleEditCancel = useCallback(() => {
    resetForm();
    setIsEditDialogOpen(false);
    setEditingCourse(null);
  }, [resetForm]);

  // 错误状态
  if (error) {
    return (
      <div className="container mx-auto p-6">
        <ErrorDisplay error={error} onRetry={handleRetry} />
      </div>
    );
  }

  // 加载状态
  if (isLoading) {
    return (
      <div className="container mx-auto p-6">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-foreground mb-2">课程管理</h1>
          <p className="text-muted-foreground">管理和维护平台上的所有课程</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {Array.from({ length: 4 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
        <div className="space-y-4">
           {Array.from({ length: 3 }).map((_, index) => (
             <div key={index} className="h-20">
               <CardSkeleton />
             </div>
           ))}
         </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">课程管理</h1>
          <p className="text-muted-foreground mt-2">管理平台上的所有课程</p>
        </div>
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="w-4 h-4 mr-2" />
              创建课程
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
            <DialogHeader>
              <DialogTitle>创建新课程</DialogTitle>
            </DialogHeader>
            <div className="flex-1 overflow-y-auto pr-2">
              <CourseForm 
                formData={formData}
                updateFormField={updateFormField}
                resetForm={resetForm}
                isEdit={false}
                onSubmit={handleCreate}
                onCancel={handleCreateCancel}
                isSubmitting={isSubmitting}
                onAddMaterial={handleAddMaterial}
                onRemoveMaterial={handleRemoveMaterial}
                onUpdateMaterial={handleUpdateMaterial}
                onAddAssignment={addAssignment}
                onRemoveAssignment={removeAssignment}
                onUpdateAssignment={updateAssignment}
                // 🖼️ 封面上传相关
                coverPreview={coverPreview}
                isDragOver={isDragOver}
                coverInputRef={coverInputRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onCoverClick={handleCoverClick}
                onFileChange={handleFileChange}
                onRemoveCover={handleRemoveCover}
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总课程数</CardTitle>
            <BookOpen className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{courses.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">草稿课程</CardTitle>
            <FileText className="h-4 w-4 text-yellow-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">
              {courses.filter(course => course.status === 'draft').length}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* 课程列表 */}
      <Card>
        <CardHeader>
          <CardTitle>课程列表</CardTitle>
        </CardHeader>
        <CardContent>
          {courses.length === 0 ? (
            <div className="text-center py-8">
              <BookOpen className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">暂无课程，点击上方按钮创建第一门课程</p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>课程信息</TableHead>
                  <TableHead>讲师</TableHead>
                  {/* 隐藏学生数与完成率列以简化列表 */}
                  {/* <TableHead>学生数</TableHead>
                  <TableHead>完成率</TableHead> */}
                  <TableHead>创建时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {courses.map((course) => (
                  <TableRow key={course.id}>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img
                          src={course.cover}
                          alt={course.title}
                          className="w-12 h-12 rounded object-cover"
                          loading="lazy"
                          onLoad={(e) => {
                            (e.target as HTMLImageElement).style.opacity = '1';
                          }}
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = "/placeholder-course.jpg";
                          }}
                          style={{ opacity: 0, transition: 'opacity 0.3s ease-in-out' }}
                        />
                        <div>
                          <div className="font-medium">{course.title}</div>
                          <div className="text-sm text-muted-foreground">
                            {course.description.length > 50
                              ? `${course.description.substring(0, 50)}...`
                              : course.description}
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{course.instructor}</TableCell>
                    {/* 移除学生数与完成率单元格 */}
                    {/*
                    <TableCell>
                      <Badge variant="secondary">{course.studentCount || 0}</Badge>
                    </TableCell>
                    <TableCell>
                      <Badge variant="outline">
                        {Math.round((course.completionRate || 0) * 100)}%
                      </Badge>
                    </TableCell>
                    */}
                    <TableCell>
                      {new Date(course.createdAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end space-x-2">
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleEdit(course)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        <Button
                          variant="outline"
                          size="sm"
                          onClick={() => handleDelete(course.id)}
                          className="text-red-600 hover:text-red-700"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>

      {/* 编辑对话框 */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
          <DialogHeader>
            <DialogTitle>编辑课程</DialogTitle>
          </DialogHeader>
          <div className="flex-1 overflow-y-auto pr-2">
            <CourseForm 
              formData={formData}
              updateFormField={updateFormField}
              resetForm={resetForm}
              isEdit={true}
              onSubmit={handleUpdate}
              onCancel={handleEditCancel}
              isSubmitting={isSubmitting}
              onAddMaterial={handleAddMaterial}
              onRemoveMaterial={handleRemoveMaterial}
              onUpdateMaterial={handleUpdateMaterial}
              onAddAssignment={addAssignment}
              onRemoveAssignment={removeAssignment}
              onUpdateAssignment={updateAssignment}
              // 🖼️ 封面上传相关
              coverPreview={coverPreview}
              isDragOver={isDragOver}
              coverInputRef={coverInputRef}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              onCoverClick={handleCoverClick}
              onFileChange={handleFileChange}
              onRemoveCover={handleRemoveCover}
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default CourseManagement;