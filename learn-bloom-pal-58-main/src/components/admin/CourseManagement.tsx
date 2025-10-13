import { useState, useRef, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { ApiService } from "@/lib/api";
import { ApiWithLoading } from "@/services/apiWithLoading";
import { useLoading, useOperationLoading } from "@/contexts/LoadingContext";
import { Course, Material, Assignment } from "@/lib/types";
import { 
  Plus,
  Edit,
  Trash2,
  BookOpen,
  Upload,
  Link,
  Calendar,
  Users,
  FileText,
  Eye,
  X
} from "lucide-react";

const CourseManagement = () => {
  const { toast } = useToast();
  const { withLoading } = useLoading();
  const fetchLoading = useOperationLoading('fetchCourses');
  const createLoading = useOperationLoading('createCourse');
  const updateLoading = useOperationLoading('updateCourse');
  const deleteLoading = useOperationLoading('deleteCourse');
  
  const [courses, setCourses] = useState<Course[]>([]);
  
  // 获取课程列表
  const fetchCourses = async () => {
    const data = await ApiWithLoading.getCourses(fetchLoading.withLoading);
    setCourses(data);
  };
  
  useEffect(() => {
    fetchCourses();
  }, []);
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const materialInputRef = useRef<HTMLInputElement>(null);
  
  // 表单状态
  const [formData, setFormData] = useState({
    title: "",
    description: "",
    cover: "",
    videoUrl: "",
    duration: "",
    materials: [] as Material[],
    assignment: {
      id: "",
      course_id: "",
      title: "",
      description: "",
      due_date: "",
      assignment_type: "general",
      max_score: 100,
      allow_file_upload: true,
      allowed_file_types: "pdf,jpg,png,zip",
      max_file_size_mb: 10,
      requirements: [] as string[],
      is_active: true,
      created_at: "",
      updated_at: ""
    } as Assignment
  });

  // 预览的封面文件
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [coverPreview, setCoverPreview] = useState<string>("");

  // 处理封面上传
  const handleCoverUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "文件过大",
          description: "封面图片不能超过5MB",
          variant: "destructive"
        });
        return;
      }
      
      setCoverFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCoverPreview(result);
        setFormData(prev => ({ ...prev, cover: result }));
      };
      reader.readAsDataURL(file);
    }
  };

  // 处理课程资料上传
  const handleMaterialUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length === 0) return;

    const newMaterials: Material[] = files.map(file => ({
      id: Date.now().toString() + Math.random(),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(1) + ' MB',
      type: file.name.endsWith('.pdf') ? 'pdf' : 
            file.name.endsWith('.zip') || file.name.endsWith('.rar') ? 'code' :
            file.name.endsWith('.mp4') || file.name.endsWith('.avi') ? 'video' : 'document',
      downloadUrl: '#', // In real app, upload to server and get URL
      uploadedAt: new Date().toISOString().split('T')[0]
    }));

    setFormData(prev => ({
      ...prev,
      materials: [...prev.materials, ...newMaterials]
    }));

    toast({
      title: "文件添加成功",
      description: `已添加 ${files.length} 个文件`
    });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.videoUrl) {
      toast({
        title: "提交失败",
        description: "请填写课程标题和视频链接",
        variant: "destructive"
      });
      return;
    }

    if (!formData.assignment.title) {
      toast({
        title: "提交失败",
        description: "请填写作业标题",
        variant: "destructive"
      });
      return;
    }

    const courseData = {
      title: formData.title,
      description: formData.description,
      cover: formData.cover || "/placeholder.svg",
      videoUrl: formData.videoUrl,
      duration: formData.duration,
      materials: formData.materials,
      assignment: {
        ...formData.assignment,
        id: formData.assignment.id || Date.now().toString()
      },
      createdAt: editingCourse ? editingCourse.createdAt : new Date().toISOString().split('T')[0],
      updatedAt: new Date().toISOString().split('T')[0],
      studentCount: editingCourse ? editingCourse.studentCount : 0,
      completionRate: editingCourse ? editingCourse.completionRate : 0
    };

    if (editingCourse) {
      const updatedCourse = updateCourse(courseData);
      console.log('课程更新成功:', updatedCourse);
      toast({
        title: "更新成功",
        description: "课程信息已更新"
      });
    } else {
      const newCourse = addCourse(courseData);
      console.log('新课程创建成功:', newCourse);
      toast({
        title: "创建成功",
        description: "新课程已创建"
      });
    }

    handleReset();
  };

  const handleReset = () => {
    setFormData({
      title: "",
      description: "",
      cover: "",
      videoUrl: "",
      duration: "",
      materials: [],
      assignment: {
          id: Date.now().toString(),
          course_id: "",
          title: "",
          description: "",
          due_date: "",
          assignment_type: "general",
          max_score: 100,
          allow_file_upload: true,
          allowed_file_types: "pdf,jpg,png,zip",
          max_file_size_mb: 10,
          requirements: [],
          is_active: true,
          created_at: "",
          updated_at: ""
        }
    });
    setCoverFile(null);
    setCoverPreview("");
    setEditingCourse(null);
    setIsDialogOpen(false);
  };

  const handleEdit = (course: Course) => {
    setEditingCourse(course);
    setFormData({
      title: course.title,
      description: course.description,
      cover: course.cover,
      videoUrl: course.videoUrl,
      duration: course.duration || "",
      materials: course.materials,
      assignment: course.assignments && course.assignments.length > 0 ? course.assignments[0] : {
         id: "",
         course_id: "",
         title: "",
         description: "",
         due_date: "",
         assignment_type: "general",
         max_score: 100,
         allow_file_upload: true,
         allowed_file_types: "pdf,jpg,png,zip",
         max_file_size_mb: 10,
         requirements: [],
         is_active: true,
         created_at: "",
         updated_at: ""
       }
    });
    setCoverPreview(course.cover);
    setIsDialogOpen(true);
  };

  const handleDelete = (courseId: string) => {
    deleteCourse(courseId);
    toast({
      title: "删除成功",
      description: "课程已删除"
    });
  };

  const handleCreateNew = () => {
    handleReset();
    setIsDialogOpen(true);
  };

  const removeMaterial = (materialId: string) => {
    setFormData(prev => ({
      ...prev,
      materials: prev.materials.filter(m => m.id !== materialId)
    }));
  };

  const addRequirement = () => {
    setFormData(prev => ({
      ...prev,
      assignment: {
        ...prev.assignment,
        requirements: [...prev.assignment.requirements, ""]
      }
    }));
  };

  const updateRequirement = (index: number, value: string) => {
    setFormData(prev => ({
      ...prev,
      assignment: {
        ...prev.assignment,
        requirements: prev.assignment.requirements.map((req, i) => i === index ? value : req)
      }
    }));
  };

  const removeRequirement = (index: number) => {
    setFormData(prev => ({
      ...prev,
      assignment: {
        ...prev.assignment,
        requirements: prev.assignment.requirements.filter((_, i) => i !== index)
      }
    }));
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-foreground">课程管理</h2>
          <p className="text-muted-foreground">创建和管理培训课程</p>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogTrigger asChild>
            <Button onClick={handleCreateNew}>
              <Plus className="w-4 h-4 mr-2" />
              创建课程
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {editingCourse ? "编辑课程" : "创建新课程"}
              </DialogTitle>
            </DialogHeader>
            
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium mb-2">课程标题 *</label>
                <Input
                  placeholder="请输入课程标题"
                  value={formData.title}
                  onChange={(e) => setFormData(prev => ({ ...prev, title: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">课程描述</label>
                <Textarea
                  placeholder="请输入课程描述"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  className="min-h-[80px]"
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">课程封面</label>
                <div className="space-y-3">
                  {coverPreview && (
                    <div className="relative">
                      <img 
                        src={coverPreview} 
                        alt="封面预览" 
                        className="w-full h-40 object-cover rounded-lg"
                      />
                      <Button
                        variant="destructive"
                        size="sm"
                        className="absolute top-2 right-2"
                        onClick={() => {
                          setCoverPreview("");
                          setCoverFile(null);
                          setFormData(prev => ({ ...prev, cover: "" }));
                        }}
                      >
                        <X className="w-4 h-4" />
                      </Button>
                    </div>
                  )}
                  <div className="flex items-center justify-center w-full">
                    <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                      <div className="flex flex-col items-center justify-center pt-5 pb-6">
                        <Upload className="w-8 h-8 mb-4 text-gray-500 dark:text-gray-400" />
                        <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                          <span className="font-semibold">点击上传封面</span> 或拖拽图片到此处
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          支持 PNG, JPG, JPEG 格式，最大 5MB
                        </p>
                      </div>
                      <input 
                        ref={fileInputRef}
                        type="file" 
                        className="hidden" 
                        accept="image/*"
                        onChange={handleCoverUpload}
                      />
                    </label>
                  </div>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">课程视频链接 *</label>
                <Input
                  placeholder="请粘贴飞书云文档/视频链接"
                  value={formData.videoUrl}
                  onChange={(e) => setFormData(prev => ({ ...prev, videoUrl: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">课程时长</label>
                <Input
                  placeholder="例如：2小时30分钟"
                  value={formData.duration}
                  onChange={(e) => setFormData(prev => ({ ...prev, duration: e.target.value }))}
                />
              </div>

              <div>
                <label className="block text-sm font-medium mb-2">课程资料</label>
                {formData.materials.length > 0 && (
                  <div className="space-y-2 mb-3">
                    {formData.materials.map((material) => (
                      <div key={material.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded border">
                        <div className="flex items-center space-x-2">
                          <FileText className="w-4 h-4 text-blue-500" />
                          <span className="text-sm">{material.name}</span>
                          <span className="text-xs text-gray-500">({material.size})</span>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeMaterial(material.id)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
                <div className="flex items-center justify-center w-full">
                  <label className="flex flex-col items-center justify-center w-full h-24 border-2 border-gray-300 border-dashed rounded-lg cursor-pointer bg-gray-50 dark:hover:bg-gray-800 dark:bg-gray-700 hover:bg-gray-100 dark:border-gray-600 dark:hover:border-gray-500">
                    <div className="flex flex-col items-center justify-center pt-5 pb-6">
                      <Upload className="w-6 h-6 mb-2 text-gray-500 dark:text-gray-400" />
                      <p className="text-xs text-gray-500 dark:text-gray-400">
                        <span className="font-semibold">上传资料文件</span>
                      </p>
                    </div>
                    <input 
                      ref={materialInputRef}
                      type="file" 
                      className="hidden" 
                      multiple 
                      accept=".pdf,.doc,.docx,.md,.zip,.rar"
                      onChange={handleMaterialUpload}
                    />
                  </label>
                </div>
              </div>

              {/* 作业设置 */}
              <div className="space-y-4 p-4 border rounded-lg">
                <h4 className="font-medium">课后作业设置</h4>
                
                <div>
                  <label className="block text-sm font-medium mb-2">作业标题 *</label>
                  <Input
                    placeholder="请输入作业标题"
                    value={formData.assignment.title}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      assignment: { ...prev.assignment, title: e.target.value }
                    }))}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">作业描述 *</label>
                  <Textarea
                    placeholder="请详细描述作业要求"
                    value={formData.assignment.description}
                    onChange={(e) => setFormData(prev => ({
                      ...prev,
                      assignment: { ...prev.assignment, description: e.target.value }
                    }))}
                    className="min-h-[100px]"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-2">截止日期</label>
                    <Input
                      type="date"
                      value={formData.assignment.due_date}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        assignment: { ...prev.assignment, due_date: e.target.value }
                      }))}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">文件大小限制</label>
                    <Input
                      placeholder="例如：10MB"
                      value={formData.assignment.max_file_size_mb.toString()}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        assignment: { ...prev.assignment, max_file_size_mb: parseInt(e.target.value) || 10 }
                      }))}
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-2">作业要求</label>
                  <div className="space-y-2">
                    {formData.assignment.requirements.map((req, index) => (
                      <div key={index} className="flex items-center space-x-2">
                        <Input
                          placeholder={`要求 ${index + 1}`}
                          value={req}
                          onChange={(e) => updateRequirement(index, e.target.value)}
                        />
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => removeRequirement(index)}
                        >
                          <X className="w-4 h-4" />
                        </Button>
                      </div>
                    ))}
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addRequirement}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      添加要求
                    </Button>
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={handleReset}>
                  取消
                </Button>
                <Button onClick={handleSubmit}>
                  {editingCourse ? "更新课程" : "创建课程"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      {/* 课程列表 */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {courses.map((course) => (
          <Card key={course.id} className="overflow-hidden">
            <div className="aspect-video relative">
              <img 
                src={course.cover} 
                alt={course.title}
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2 flex space-x-1">
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => handleEdit(course)}
                >
                  <Edit className="w-3 h-3" />
                </Button>
                <Button
                  size="sm"
                  variant="destructive"
                  onClick={() => handleDelete(course.id)}
                >
                  <Trash2 className="w-3 h-3" />
                </Button>
              </div>
            </div>
            
            <CardContent className="p-4">
              <h3 className="font-semibold text-lg mb-2">{course.title}</h3>
              
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Users className="w-4 h-4 mr-1" />
                    {course.studentCount} 名学员
                  </span>
                  <span className="flex items-center">
                    <Eye className="w-4 h-4 mr-1" />
                    {course.completionRate}% 完成率
                  </span>
                </div>
                
                <div className="flex items-center">
                  <Link className="w-4 h-4 mr-1" />
                  <span className="truncate">视频链接已配置</span>
                </div>
                
                <div className="flex items-center">
                  <FileText className="w-4 h-4 mr-1" />
                  <span>{course.materials.length} 个资料文件</span>
                </div>
                
                <div className="flex items-center justify-between">
                  <span className="flex items-center">
                    <Calendar className="w-4 h-4 mr-1" />
                    创建: {course.createdAt}
                  </span>
                </div>
                
                {course.updatedAt !== course.createdAt && (
                  <div className="text-xs">
                    更新: {course.updatedAt}
                  </div>
                )}
              </div>

              {course.assignments && course.assignments.length > 0 && (
                <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-950/20 rounded border border-blue-200 dark:border-blue-800">
                  <p className="text-xs font-medium text-blue-900 dark:text-blue-100 mb-1">课后作业:</p>
                  <p className="text-xs text-blue-800 dark:text-blue-200 line-clamp-2">
                    {course.assignments[0].title}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-center mt-4">
                <Badge variant="outline" className="text-xs">
                  <BookOpen className="w-3 h-3 mr-1" />
                  课程
                </Badge>
                <div className="flex space-x-2">
                  <Button size="sm" variant="outline">
                    查看详情
                  </Button>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
};

export default CourseManagement;