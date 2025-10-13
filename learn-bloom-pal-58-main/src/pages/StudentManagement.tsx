import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription } from "@/components/ui/dialog";
import * as XLSX from 'xlsx';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ApiService } from "@/lib/api";
import { TrainingSession } from "@/lib/api";
import { Student } from "@/lib/types";
import { Plus, Upload, Download, Users, UserCheck, UserX, Search, FileText, Trash2, Edit, UserPlus, RefreshCw } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { LoadingSpinner, CardSkeleton, LoadingButton, TableSkeleton } from "@/components/ui/loading-spinner";
import { ErrorHandler, handleAsyncError } from "@/utils/errorHandler";
import { copyToClipboard } from "@/utils/userInvitation";
// ErrorDisplay component removed - not exported from ErrorBoundary

const StudentManagement = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const { toast } = useToast();
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false);
  const [isBatchImportOpen, setIsBatchImportOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [isLoading, setIsLoading] = useState(true);
  // 期次相关
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [sessionFilter, setSessionFilter] = useState<string>('all');
  const [studentSessionsMap, setStudentSessionsMap] = useState<Record<string, { id: string; name: string }[]>>({});
  const [error, setError] = useState<Error | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    status: "active" as "active" | "inactive"
  });
  const [batchData, setBatchData] = useState("");
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [importMode, setImportMode] = useState<'text' | 'file'>('file');
  const [isTestAccountDialogOpen, setIsTestAccountDialogOpen] = useState(false);
  const [isCreatingTestAccount, setIsCreatingTestAccount] = useState(false);
  // 编辑学员对话框
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [editSessions, setEditSessions] = useState<string[]>([]);
  const [editForm, setEditForm] = useState<{ name: string; email: string; status: 'active' | 'inactive' }>({
    name: '', email: '', status: 'active'
  });

  // 批量编辑
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [isBatchOpen, setIsBatchOpen] = useState(false);
  const [batchStatus, setBatchStatus] = useState<'nochange'|'active'|'inactive'>('nochange');
  const [batchSessions, setBatchSessions] = useState<string[]>([]);
  const [batchMode, setBatchMode] = useState<'replace'|'add'|'remove'>('replace');
  const [testAccounts, setTestAccounts] = useState<{
    student?: { email: string; password: string; name: string };
    admin?: { email: string; password: string; name: string };
  }>({});
  const [showPasswords, setShowPasswords] = useState(false);

  // 加载学生数据
  useEffect(() => {
    loadStudents();
    loadSessionsAndBuildTags();
  }, []);

  const loadStudents = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const data = await ApiService.getAuthorizedUsers();
      setStudents(data);
    } catch (err) {
      console.error('Failed to load students:', err);
      setError(err instanceof Error ? err : new Error('加载学生数据失败'));
      toast({
        title: "错误",
        description: "加载学生数据失败，请重试",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  // 加载期次并构建 学生->期次 标签
  const loadSessionsAndBuildTags = async () => {
    try {
      // 先拿到所有授权学员，用于建立 email -> authorized_user.id 的映射
      const authorized = await ApiService.getAuthorizedUsers();
      const emailToAuthId: Record<string, string> = {};
      (authorized || []).forEach((u: any) => {
        if (u?.email) emailToAuthId[String(u.email).toLowerCase()] = String(u.id);
      });

      const list = await ApiService.getTrainingSessions();
      setSessions(list || []);

      const maps: Record<string, { id: string; name: string }[]> = {};
      for (const s of list || []) {
        try {
          const rows = await ApiService.getSessionStudents(s.id);
          (rows || []).forEach((row: any) => {
            const uuid = row.user_id || row.profiles?.id || row.id;
            const email = row.profiles?.email ? String(row.profiles.email).toLowerCase() : undefined;
            // 关键：将UUID通过邮箱映射回 authorized_users 的数值ID，供表格用
            const authId = email ? emailToAuthId[email] : undefined;
            const key = authId ? String(authId) : (uuid ? String(uuid) : undefined);
            if (!key) return;
            if (!maps[key]) maps[key] = [];
            maps[key].push({ id: s.id, name: s.name });
          });
        } catch (e) {
          console.warn('获取期次学员失败', s.name, e);
        }
      }
      setStudentSessionsMap(maps);
    } catch (e) {
      console.warn('加载期次失败', e);
    }
  };

  const handleRetry = () => {
    setError(null);
    setIsLoading(true);
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      email: "",
      status: "active"
    });
  };

  const handleAddStudent = async () => {
    if (!formData.name || !formData.email) {
      toast({
        title: "错误",
        description: "请填写学生姓名和邮箱",
        variant: "destructive"
      });
      return;
    }

    // Check if email already exists
    const existingStudent = students.find(s => s.email === formData.email);
    if (existingStudent) {
      toast({
        title: "错误",
        description: "该邮箱已存在",
        variant: "destructive"
      });
      return;
    }

    try {
      setIsSubmitting(true);
      const newStudent = await ApiService.addAuthorizedUser({
        name: formData.name,
        email: formData.email
      });
      
      setStudents(prev => [newStudent, ...prev]);
      resetForm();
      setIsAddDialogOpen(false);
      toast({
        title: "成功",
        description: "学生添加成功"
      });
    } catch (err) {
      console.error('Failed to add student:', err);
      toast({
        title: "错误",
        description: "添加学生失败，请重试",
        variant: "destructive"
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const parseFileData = async (file: File): Promise<string[][]> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      
      reader.onload = (e) => {
        try {
          const data = e.target?.result;
          const fileName = file.name.toLowerCase();
          
          if (fileName.endsWith('.csv')) {
            // Parse CSV
            const text = data as string;
            const lines = text.split('\n').filter(line => line.trim());
            const rows = lines.map(line => {
              // Simple CSV parsing - handles basic cases
              return line.split(',').map(cell => cell.trim().replace(/^"|"$/g, ''));
            });
            resolve(rows);
          } else if (fileName.endsWith('.xlsx') || fileName.endsWith('.xls')) {
            // Parse Excel
            const workbook = XLSX.read(data, { type: 'array' });
            const sheetName = workbook.SheetNames[0];
            const worksheet = workbook.Sheets[sheetName];
            const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 }) as string[][];
            resolve(jsonData.filter(row => row.some(cell => cell && cell.toString().trim())));
          } else {
            reject(new Error('不支持的文件格式'));
          }
        } catch (error) {
          reject(error);
        }
      };
      
      reader.onerror = () => reject(new Error('文件读取失败'));
      
      if (file.name.toLowerCase().endsWith('.csv')) {
        reader.readAsText(file, 'UTF-8');
      } else {
        reader.readAsArrayBuffer(file);
      }
    });
  };

  const processStudentData = (rows: string[][]) => {
    const newStudents: Omit<Student, 'id'>[] = [];
    const errors: string[] = [];
    
    // Skip header row if it exists
    const dataRows = rows.length > 0 && 
      (rows[0][0]?.toLowerCase().includes('姓名') || 
       rows[0][0]?.toLowerCase().includes('name') ||
       rows[0][1]?.toLowerCase().includes('邮箱') ||
       rows[0][1]?.toLowerCase().includes('email')) 
      ? rows.slice(1) : rows;
    
    dataRows.forEach((row, index) => {
      const actualIndex = rows.length > dataRows.length ? index + 2 : index + 1;
      
      if (row.length < 2) {
        errors.push(`第${actualIndex}行：格式错误，需要至少包含姓名和邮箱`);
        return;
      }
      
      const [name, email, status = 'active'] = row.map(cell => cell?.toString().trim() || '');
      
      if (!name) {
        errors.push(`第${actualIndex}行：姓名不能为空`);
        return;
      }
      
      if (!email) {
        errors.push(`第${actualIndex}行：邮箱不能为空`);
        return;
      }
      
      // Validate email
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        errors.push(`第${actualIndex}行：邮箱格式错误`);
        return;
      }
      
      // Check if email already exists
      const existingStudent = students.find(s => s.email === email);
      if (existingStudent) {
        errors.push(`第${actualIndex}行：邮箱 ${email} 已存在`);
        return;
      }
      
      newStudents.push({
        name,
        email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${email}`,
        addedAt: new Date().toISOString(),
        status: (status === 'active' || status === 'inactive') ? status : 'active',
        enrolledCourses: []
      });
    });
    
    return { newStudents, errors };
  };

  const handleBatchImport = async () => {
    let studentData: { newStudents: Omit<Student, 'id'>[], errors: string[] };
    
    if (importMode === 'file') {
      if (!uploadedFile) {
        toast({
          title: "错误",
          description: "请选择要导入的文件",
          variant: "destructive"
        });
        return;
      }
      
      try {
        const rows = await parseFileData(uploadedFile);
        studentData = processStudentData(rows);
      } catch (error) {
        toast({
          title: "文件解析失败",
          description: error instanceof Error ? error.message : "文件格式不正确",
          variant: "destructive"
        });
        return;
      }
    } else {
      if (!batchData.trim()) {
        toast({
          title: "错误",
          description: "请输入学生数据",
          variant: "destructive"
        });
        return;
      }
      
      const lines = batchData.trim().split('\n');
      const rows = lines.map(line => line.split(',').map(part => part.trim()));
      studentData = processStudentData(rows);
    }
    
    const { newStudents, errors } = studentData;
    
    if (errors.length > 0) {
      toast({
        title: "导入错误",
        description: errors.join('\n'),
        variant: "destructive"
      });
      return;
    }
    
    if (newStudents.length === 0) {
      toast({
        title: "提示",
        description: "没有找到有效的学生数据",
        variant: "destructive"
      });
      return;
    }
    
    // Add all valid students
    try {
      setIsSubmitting(true);
      let successCount = 0;
      
      for (const studentData of newStudents) {
        try {
          const newStudent = await ApiService.addAuthorizedUser({
            name: studentData.name,
            email: studentData.email
          });
          setStudents(prev => [newStudent, ...prev]);
          successCount++;
        } catch (err) {
          console.error(`Failed to add student ${studentData.email}:`, err);
          // 继续处理其他学生
        }
      }
      
      toast({
        title: "导入完成",
        description: `成功导入 ${successCount} 名学生${successCount < newStudents.length ? `，${newStudents.length - successCount} 名学生导入失败` : ''}`
      });
    } finally {
      setIsSubmitting(false);
    }
    
    setBatchData("");
    setUploadedFile(null);
    setIsBatchImportOpen(false);
  };

  const handleFileUpload = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;
    
    // Validate file type
    const validExtensions = ['.xlsx', '.xls', '.csv'];
    const fileExtension = file.name.toLowerCase().substring(file.name.lastIndexOf('.'));
    
    if (!validExtensions.includes(fileExtension)) {
      toast({
        title: "文件格式错误",
        description: "请选择 Excel (.xlsx, .xls) 或 CSV (.csv) 格式的文件",
        variant: "destructive"
      });
      event.target.value = ''; // Reset file input
      return;
    }
    
    setUploadedFile(file);
  };

  const handleDeleteStudent = async (studentId: string, studentName: string) => {
    if (window.confirm(`确定要删除学生 "${studentName}" 吗？此操作不可撤销。`)) {
      try {
        const success = await ApiService.removeAuthorizedUser(studentId);
        if (success) {
          setStudents(prev => prev.filter(s => s.id !== studentId));
          toast({
            title: "成功",
            description: "学生删除成功"
          });
        } else {
          throw new Error('删除失败');
        }
      } catch (err) {
        console.error('Failed to delete student:', err);
        toast({
          title: "错误",
          description: "删除学生失败，请重试",
          variant: "destructive"
        });
      }
    }
  };

  const openEditDialog = (stu: Student) => {
    setEditingStudent(stu);
    setEditForm({ name: stu.name, email: stu.email, status: stu.status });
    setEditSessions(studentSessionsMap[stu.id]?.map(s => s.id) || []);
    setIsEditOpen(true);
  };

  const handleSaveEdit = async () => {
    if (!editingStudent) return;
    try {
      setIsSubmitting(true);
      console.log('开始保存学员编辑:', { studentId: editingStudent.id, editForm, editSessions });
      
      // 1) 更新基本信息
      console.log('更新学员基本信息...');
      const updated = await ApiService.updateAuthorizedUser(editingStudent.id, editForm);
      console.log('学员基本信息更新成功');
      
      // 2) 更新所属期次
      console.log('更新学员期次关系...', editSessions);
      await ApiService.setStudentSessions(editingStudent.id, editSessions);
      console.log('学员期次关系更新成功');
      
      // 本地状态更新
      setStudents(prev => prev.map(s => (s.id === updated.id ? { ...s, ...updated } : s)));
      
      // 3) 立即刷新"学生-期次"映射，确保列表实时反映
      console.log('刷新期次映射数据...');
      await loadSessionsAndBuildTags();
      console.log('期次映射数据刷新完成');
      
      setIsEditOpen(false);
      toast({ 
        title: '保存成功', 
        description: `已成功更新学员"${editingStudent.name}"的信息与所属期次` 
      });
    } catch (e: any) {
      console.error('保存学员编辑失败:', e);
      let errorMessage = '请稍后再试';
      
      // 根据错误类型提供更具体的错误信息
      if (e?.message) {
        if (e.message.includes('Failed to find user in authorized_users')) {
          errorMessage = '找不到该学员的授权记录，请联系管理员';
        } else if (e.message.includes('Failed to create auth user')) {
          errorMessage = '创建用户账户失败，请检查网络连接';
        } else if (e.message.includes('Failed to create profile')) {
          errorMessage = '创建用户档案失败，请重试';
        } else if (e.message.includes('Failed to set student sessions')) {
          errorMessage = '设置期次关系失败，可能是权限问题';
        } else if (e.message.includes('该邮箱已存在')) {
          errorMessage = '该邮箱已被其他学员使用';
        } else {
          errorMessage = e.message;
        }
      }
      
      toast({ 
        title: '保存失败', 
        description: errorMessage, 
        variant: 'destructive' 
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const exportStudents = () => {
    const csvContent = "姓名,邮箱,状态,添加时间\n" + 
      filteredStudents.map(student => 
        `${student.name},${student.email},${student.status},${new Date(student.addedAt).toLocaleDateString('zh-CN')}`
      ).join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `学生名单_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // 创建测试账号
  const handleCreateTestAccount = async (type: 'student' | 'admin') => {
    setIsCreatingTestAccount(true);
    
    const result = await handleAsyncError(
      async () => {
        const testAccounts = {
          student: {
            name: '测试学员',
            email: 'student@test.com',
            role: 'student'
          },
          admin: {
            name: '测试管理员',
            email: 'admin@test.com',
            role: 'admin'
          }
        };
        
        const accountData = testAccounts[type];
        
        // 检查账号是否已存在
        const existingUser = students.find(s => s.email === accountData.email);
        if (existingUser) {
          toast({
            title: "提示",
            description: `${accountData.name}已存在`,
            variant: "default"
          });
          return null;
        }
        
        // 创建测试账号
        const newUser = await ApiService.addAuthorizedUser({
          name: accountData.name,
          email: accountData.email
        });
        
        return { newUser, accountData };
      },
      '创建测试账号失败'
    );
    
    if (result && result.newUser) {
      setStudents(prev => [result.newUser, ...prev]);
      
      toast({
        title: "成功",
        description: `${result.accountData.name}创建成功\n邮箱: ${result.accountData.email}`
      });
    }
    
    setIsCreatingTestAccount(false);
  };
  
  // 批量创建所有测试账号
  const handleCreateAllTestAccounts = async () => {
    setIsCreatingTestAccount(true);
    
    const result = await handleAsyncError(
      async () => {
        const { student, admin } = await ApiService.createTestAccounts();
        return { student, admin };
      },
      '批量创建测试账号失败'
    );
    
    if (result) {
      // 保存测试账号信息
      setTestAccounts({
        student: {
          email: result.student.email,
          password: result.student.password,
          name: result.student.name
        },
        admin: {
          email: result.admin.email,
          password: result.admin.password,
          name: result.admin.name
        }
      });
      
      // 更新学生列表，避免重复
      setStudents(prev => {
        const filtered = prev.filter(s => !['student@test.com', 'admin@test.com'].includes(s.email));
        return [result.student, result.admin, ...filtered];
      });
      
      toast({
        title: "成功",
        description: "测试账号创建完成\n学员: student@test.com\n管理员: admin@test.com"
      });
    }
    
    setIsCreatingTestAccount(false);
  };

  // 复制密码到剪贴板
  const handleCopyPassword = async (password: string, accountType: string) => {
    const success = await copyToClipboard(password);
    if (success) {
      toast({
        title: "成功",
        description: `${accountType}密码已复制到剪贴板`
      });
    } else {
      toast({
        title: "失败",
        description: "复制失败，请手动复制密码",
        variant: "destructive"
      });
    }
  };

  // 重置测试账号密码
  const handleResetPassword = async (email: string, accountType: string) => {
    setIsCreatingTestAccount(true);
    
    const result = await handleAsyncError(
      async () => {
        // 重新创建测试账号以获取新密码
        const { student, admin } = await ApiService.createTestAccounts();
        return email === 'student@test.com' ? student : admin;
      },
      '重置密码失败'
    );
    
    if (result) {
      // 更新测试账号信息
      setTestAccounts(prev => ({
        ...prev,
        [email === 'student@test.com' ? 'student' : 'admin']: {
          email: result.email,
          password: result.password,
          name: result.name
        }
      }));
      
      toast({
        title: "成功",
        description: `${accountType}密码已重置`
      });
    }
    
    setIsCreatingTestAccount(false);
  };
  
  // 清理测试数据
  const handleClearTestData = async () => {
    setIsCreatingTestAccount(true);
    
    const result = await handleAsyncError(
      async () => {
        const deletedCount = await ApiService.clearTestData();
        return deletedCount;
      },
      '清理测试数据失败'
    );
    
    if (result !== null) {
      if (result === 0) {
        toast({
          title: "提示",
          description: "没有找到测试账号数据",
          variant: "default"
        });
      } else {
        // 从本地状态中移除测试账号
        const testEmails = ['student@test.com', 'admin@test.com'];
        setStudents(prev => prev.filter(s => !testEmails.includes(s.email)));
        
        toast({
          title: "成功",
          description: `已清理 ${result} 个测试账号`
        });
        
        setIsTestAccountDialogOpen(false);
      }
    }
    
    setIsCreatingTestAccount(false);
  };

  const filteredStudents = students.filter(student => {
    const matchesSearch = student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         student.email.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = statusFilter === "all" || student.status === statusFilter;
    const matchesSession = sessionFilter === 'all' || (studentSessionsMap[student.id]?.some(s => s.id === sessionFilter));
    return matchesSearch && matchesStatus && matchesSession;
  });

  const toggleSelectAll = (checked: boolean) => {
    if (checked) {
      setSelectedIds(new Set(filteredStudents.map(s => s.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectOne = (id: string, checked: boolean) => {
    setSelectedIds(prev => {
      const next = new Set(prev);
      if (checked) next.add(id); else next.delete(id);
      return next;
    });
  };

  const handleSaveBatch = async () => {
    try {
      const ids = Array.from(selectedIds);
      console.log('开始批量编辑:', { selectedCount: ids.length, batchStatus, batchSessions, batchMode });
      
      let successCount = 0;
      let errorCount = 0;
      const errors: string[] = [];
      
      for (const id of ids) {
        const origin = students.find(s => s.id === id);
        if (!origin) {
          errorCount++;
          errors.push(`学员ID ${id} 不存在`);
          continue;
        }
        
        try {
          console.log(`处理学员: ${origin.name} (${id})`);
          
          // 1) 状态
          if (batchStatus !== 'nochange') {
            console.log(`更新学员 ${origin.name} 状态: ${batchStatus}`);
            await ApiService.updateAuthorizedUser(id, { status: batchStatus as 'active'|'inactive' });
          }
          
          // 2) 所属期次
          if (batchSessions.length > 0 || batchMode === 'replace') {
            const owning = studentSessionsMap[id]?.map(s => s.id) || [];
            let next: string[] = owning;
            if (batchMode === 'replace') {
              next = batchSessions.slice();
            } else if (batchMode === 'add') {
              next = Array.from(new Set([...owning, ...batchSessions]));
            } else if (batchMode === 'remove') {
              next = owning.filter(sid => !batchSessions.includes(sid));
            }
            console.log(`更新学员 ${origin.name} 期次关系:`, { from: owning, to: next });
            await ApiService.setStudentSessions(id, next);
          }
          
          successCount++;
          console.log(`学员 ${origin.name} 处理成功`);
        } catch (err: any) {
          errorCount++;
          const errorMsg = `${origin.name}: ${err?.message || '处理失败'}`;
          errors.push(errorMsg);
          console.error(`学员 ${origin.name} 处理失败:`, err);
        }
      }
      
      // 刷新数据
      console.log('刷新学员数据和期次映射...');
      await loadStudents();
      await loadSessionsAndBuildTags();
      
      // 重置状态
      setIsBatchOpen(false);
      setSelectedIds(new Set());
      setBatchStatus('nochange');
      setBatchSessions([]);
      
      // 显示结果
      if (successCount > 0) {
        const successMsg = `成功处理 ${successCount} 个学员`;
        const errorMsg = errorCount > 0 ? `，${errorCount} 个失败` : '';
        toast({ 
          title: '批量编辑完成', 
          description: successMsg + errorMsg,
          variant: errorCount > 0 ? 'default' : 'default'
        });
        
        if (errorCount > 0 && errors.length > 0) {
          console.error('批量编辑错误详情:', errors);
          // 显示详细错误信息（限制显示前3个错误）
          const errorDetail = errors.slice(0, 3).join('；');
          setTimeout(() => {
            toast({ 
              title: '部分操作失败', 
              description: errorDetail + (errors.length > 3 ? '...' : ''),
              variant: 'destructive' 
            });
          }, 1000);
        }
      } else {
        toast({ 
          title: '批量编辑失败', 
          description: '没有学员被成功处理',
          variant: 'destructive' 
        });
      }
    } catch (e: any) {
      console.error('批量编辑整体失败:', e);
      toast({ 
        title: '批量保存失败', 
        description: e?.message || '请稍后重试', 
        variant: 'destructive' 
      });
    }
  };

  const activeStudents = students.filter(s => s.status === 'active').length;
  const inactiveStudents = students.filter(s => s.status === 'inactive').length;

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
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-3xl font-bold">学生管理</h1>
            <p className="text-muted-foreground mt-2">管理平台上的学生白名单</p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
          {Array.from({ length: 3 }).map((_, index) => (
            <CardSkeleton key={index} />
          ))}
        </div>
        <TableSkeleton />
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">学生管理</h1>
          <p className="text-muted-foreground mt-2">管理平台上的学生白名单</p>
        </div>
        <div className="flex space-x-2">
          <Button variant="outline" onClick={exportStudents}>
            <Download className="w-4 h-4 mr-2" />
            导出名单
          </Button>
          <Button
            variant="default"
            onClick={async () => {
              try {
                if (selectedIds.size === 0) {
                  toast({ title: '提示', description: '请先勾选要导出的学员', variant: 'default' });
                  return;
                }
                const sessionIds = sessionFilter !== 'all' ? [sessionFilter] : undefined;
                await ApiService.exportStudentCredentials({ userIds: Array.from(selectedIds) as any, sessionIds });
                toast({ title: '已导出', description: '初始密码CSV已下载，请妥善保管' });
              } catch (e: any) {
                toast({ title: '导出失败', description: e?.message || '请稍后重试', variant: 'destructive' });
              }
            }}
          >
            <Download className="w-4 h-4 mr-2" /> 导出登录凭据
          </Button>
          {/* 已移除创建测试账号功能 */}
          {false && (
          <Dialog open={isTestAccountDialogOpen} onOpenChange={setIsTestAccountDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" className="bg-blue-50 hover:bg-blue-100 text-blue-700 border-blue-200">
                <UserPlus className="w-4 h-4 mr-2" />
                创建测试账号
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>创建测试账号</DialogTitle>
                <DialogDescription>
                （已停用）
                </DialogDescription>
              </DialogHeader>
              
              <div className="space-y-4">
                {!testAccounts.student && !testAccounts.admin ? (
                  <div className="text-sm text-gray-600">
                    <p className="mb-2">将创建以下测试账号：</p>
                    <ul className="space-y-1">
                      <li>• 学员账号: student@test.com</li>
                      <li>• 管理员账号: admin@test.com</li>
                    </ul>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-lg font-medium">测试账号信息</h3>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setShowPasswords(!showPasswords)}
                      >
                        {showPasswords ? <EyeOff className="w-4 h-4 mr-2" /> : <Eye className="w-4 h-4 mr-2" />}
                        {showPasswords ? '隐藏密码' : '显示密码'}
                      </Button>
                    </div>
                    
                    {testAccounts.student && (
                      <div className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-blue-600">学员账号</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword('student@test.com', '学员')}
                            disabled={isCreatingTestAccount}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            重置密码
                          </Button>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">邮箱:</span> {testAccounts.student.email}</p>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">密码:</span>
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                              {showPasswords ? testAccounts.student.password : '••••••••••••'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyPassword(testAccounts.student.password, '学员')}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                    
                    {testAccounts.admin && (
                      <div className="border rounded-lg p-4 space-y-2">
                        <div className="flex items-center justify-between">
                          <h4 className="font-medium text-green-600">管理员账号</h4>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleResetPassword('admin@test.com', '管理员')}
                            disabled={isCreatingTestAccount}
                          >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            重置密码
                          </Button>
                        </div>
                        <div className="space-y-1 text-sm">
                          <p><span className="font-medium">邮箱:</span> {testAccounts.admin.email}</p>
                          <div className="flex items-center gap-2">
                            <span className="font-medium">密码:</span>
                            <span className="font-mono bg-gray-100 px-2 py-1 rounded">
                              {showPasswords ? testAccounts.admin.password : '••••••••••••'}
                            </span>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleCopyPassword(testAccounts.admin.password, '管理员')}
                            >
                              <Copy className="w-4 h-4" />
                            </Button>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                )}
                
                <div className="flex gap-2">
                  <LoadingButton
                    onClick={handleCreateAllTestAccounts}
                    loading={isCreatingTestAccount}
                    className="flex-1"
                  >
                    <UserPlus className="w-4 h-4 mr-2" />
                    {testAccounts.student || testAccounts.admin ? '重新创建' : '批量创建'}
                  </LoadingButton>
                  
                  <LoadingButton
                    onClick={handleClearTestData}
                    loading={isCreatingTestAccount}
                    variant="outline"
                    className="flex-1"
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    清理测试数据
                  </LoadingButton>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          )}
          <Dialog open={isBatchImportOpen} onOpenChange={setIsBatchImportOpen}>
            <DialogTrigger asChild>
              <Button variant="outline">
                <Upload className="w-4 h-4 mr-2" />
                批量导入
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>批量导入学生</DialogTitle>
                <DialogDescription>
                  支持 Excel (.xlsx, .xls) 和 CSV (.csv) 格式文件导入，或手动输入数据
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                {/* Import Mode Selection */}
                <div className="flex space-x-4">
                  <Button
                    variant={importMode === 'file' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImportMode('file')}
                  >
                    文件导入
                  </Button>
                  <Button
                    variant={importMode === 'text' ? 'default' : 'outline'}
                    size="sm"
                    onClick={() => setImportMode('text')}
                  >
                    手动输入
                  </Button>
                </div>

                {importMode === 'file' ? (
                  <div className="space-y-4">
                    <div>
                      <Label htmlFor="file-upload">选择文件</Label>
                      <Input
                        id="file-upload"
                        type="file"
                        accept=".xlsx,.xls,.csv"
                        onChange={handleFileUpload}
                        className="mt-2"
                      />
                      {uploadedFile && (
                        <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                          <p className="text-sm text-green-700">
                            已选择文件: {uploadedFile.name}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="text-sm text-gray-600 space-y-2">
                      <p><strong>文件格式要求：</strong></p>
                      <ul className="list-disc list-inside space-y-1">
                        <li>Excel文件：第一列为姓名，第二列为邮箱，第三列为状态（可选）</li>
                        <li>CSV文件：格式为 姓名,邮箱,状态（可选）</li>
                        <li>状态可以是 active 或 inactive，默认为 active</li>
                        <li>如果第一行是标题行（包含"姓名"、"name"、"邮箱"、"email"），将自动跳过</li>
                      </ul>
                    </div>
                  </div>
                ) : (
                  <div>
                    <Label htmlFor="batchData">学生数据</Label>
                    <p className="text-sm text-muted-foreground mb-2">
                      每行一个学生，格式：姓名,邮箱,状态(可选，默认为active)
                    </p>
                    <Textarea
                      id="batchData"
                      value={batchData}
                      onChange={(e) => setBatchData(e.target.value)}
                      placeholder={`张三,zhangsan@example.com,active\n李四,lisi@example.com,inactive\n王五,wangwu@example.com`}
                      rows={8}
                    />
                    <div className="bg-muted p-3 rounded-lg">
                      <h4 className="font-medium mb-2">导入说明：</h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• 每行一个学生，使用逗号分隔字段</li>
                        <li>• 必填字段：姓名、邮箱</li>
                        <li>• 可选字段：状态（active/inactive，默认为active）</li>
                        <li>• 邮箱不能重复</li>
                      </ul>
                    </div>
                  </div>
                )}
                
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => {
                    setBatchData("");
                    setUploadedFile(null);
                    setIsBatchImportOpen(false);
                  }}>
                    取消
                  </Button>
                  <Button 
                    onClick={handleBatchImport}
                    disabled={isSubmitting || (importMode === 'file' && !uploadedFile) || (importMode === 'text' && !batchData.trim())}
                  >
                    {isSubmitting ? "导入中..." : "导入"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="w-4 h-4 mr-2" />
                添加学生
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>添加新学生</DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <Label htmlFor="name">学生姓名 *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="请输入学生姓名"
                  />
                </div>
                <div>
                  <Label htmlFor="email">邮箱地址 *</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    placeholder="请输入邮箱地址"
                  />
                </div>
                <div>
                  <Label htmlFor="status">状态</Label>
                  <Select value={formData.status} onValueChange={(value: "active" | "inactive") => setFormData({ ...formData, status: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="active">激活</SelectItem>
                      <SelectItem value="inactive">未激活</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="flex justify-end space-x-2">
                  <Button variant="outline" onClick={() => { resetForm(); setIsAddDialogOpen(false); }}>
                    取消
                  </Button>
                  <Button onClick={handleAddStudent}>
                    添加
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>
      </div>

      {/* 统计卡片 */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">总学生数</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{students.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">激活学生</CardTitle>
            <UserCheck className="h-4 w-4 text-green-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{activeStudents}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">未激活学生</CardTitle>
            <UserX className="h-4 w-4 text-red-600" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-600">{inactiveStudents}</div>
          </CardContent>
        </Card>
      </div>

      {/* 搜索和过滤 */}
      <Card className="mb-6">
        <CardContent className="pt-6">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="搜索学生姓名或邮箱..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>
            <div className="w-full md:w-48">
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="筛选状态" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部状态</SelectItem>
                  <SelectItem value="active">激活</SelectItem>
                  <SelectItem value="inactive">未激活</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="w-full md:w-64">
              <Select value={sessionFilter} onValueChange={setSessionFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="按期次筛选" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">全部期次</SelectItem>
                  {(sessions || []).map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* 学生列表 */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle>学生列表 ({filteredStudents.length})</CardTitle>
            <div className="flex items-center gap-2">
              <div className="text-sm text-muted-foreground">已选 {selectedIds.size} 人</div>
              <Button variant="outline" size="sm" onClick={()=>setIsBatchOpen(true)} disabled={selectedIds.size===0}>
                批量编辑
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {filteredStudents.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">
                {students.length === 0 ? "暂无学生，点击上方按钮添加第一个学生" : "没有找到匹配的学生"}
              </p>
            </div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead className="w-10">
                    <input type="checkbox" onChange={(e)=>toggleSelectAll(e.target.checked)} checked={selectedIds.size>0 && selectedIds.size===filteredStudents.length} />
                  </TableHead>
                  <TableHead>学生信息</TableHead>
                  <TableHead>邮箱</TableHead>
                  <TableHead>状态</TableHead>
                  <TableHead>所属期次</TableHead>
                  <TableHead>添加时间</TableHead>
                  <TableHead className="text-right">操作</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredStudents.map((student) => (
                  <TableRow key={student.id}>
                    <TableCell>
                      <input type="checkbox" checked={selectedIds.has(student.id)} onChange={(e)=>toggleSelectOne(student.id, e.target.checked)} />
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-3">
                        <img
                          src={student.avatar}
                          alt={student.name}
                          className="w-10 h-10 rounded-full"
                        />
                        <div>
                          <div className="font-medium">{student.name}</div>
                          <div className="text-sm text-muted-foreground">ID: {student.id}</div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>{student.email}</TableCell>
                    <TableCell>
                      <Badge variant={student.status === 'active' ? 'default' : 'secondary'}>
                        {student.status === 'active' ? '激活' : '未激活'}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {studentSessionsMap[student.id] && studentSessionsMap[student.id].length > 0 ? (
                        <div className="flex flex-wrap gap-1 max-w-[360px]">
                          {studentSessionsMap[student.id].map(s => (
                            <Badge key={s.id} variant="secondary">{s.name}</Badge>
                          ))}
                        </div>
                      ) : (
                        <Badge variant="outline">未分配期次</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(student.addedAt).toLocaleDateString('zh-CN')}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="outline"
                        size="sm"
                      onClick={() => openEditDialog(student)}
                      className="mr-2"
                      >
                      <Edit className="w-4 h-4" />
                      </Button>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => handleDeleteStudent(student.id, student.name)}
                      className="text-red-600 hover:text-red-700"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      {/* 批量编辑对话框 */}
      <Dialog open={isBatchOpen} onOpenChange={setIsBatchOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>批量编辑 ({selectedIds.size} 人)</DialogTitle>
            <DialogDescription>批量调整学员状态与所属期次</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>状态</Label>
              <Select value={batchStatus} onValueChange={(v: any)=>setBatchStatus(v)}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="nochange">不变</SelectItem>
                  <SelectItem value="active">激活</SelectItem>
                  <SelectItem value="inactive">未激活</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>所属期次</Label>
              <div className="flex items-center gap-3 mb-2">
                <Label className="text-sm">模式</Label>
                <Select value={batchMode} onValueChange={(v: any)=>setBatchMode(v)}>
                  <SelectTrigger className="w-36"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="replace">覆盖</SelectItem>
                    <SelectItem value="add">添加</SelectItem>
                    <SelectItem value="remove">移除</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto">
                {(sessions||[]).map(s => (
                  <div key={s.id} className="flex items-center space-x-2">
                    <input type="checkbox" id={`bs-${s.id}`} checked={batchSessions.includes(s.id)}
                      onChange={(e)=>{
                        if (e.target.checked) setBatchSessions(prev=>[...prev, s.id])
                        else setBatchSessions(prev=>prev.filter(id=>id!==s.id))
                      }}
                      className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                    />
                    <Label htmlFor={`bs-${s.id}`} className="text-sm cursor-pointer">{s.name}</Label>
                  </div>
                ))}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setIsBatchOpen(false)}>取消</Button>
              <Button onClick={handleSaveBatch}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* 编辑学员对话框 */}
      <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>编辑学员</DialogTitle>
            <DialogDescription>修改学员基本信息与所属期次</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label htmlFor="edit-name">姓名</Label>
              <Input id="edit-name" value={editForm.name} onChange={(e)=>setEditForm({...editForm, name: e.target.value})} />
            </div>
            <div>
              <Label htmlFor="edit-email">邮箱</Label>
              <Input id="edit-email" type="email" value={editForm.email} onChange={(e)=>setEditForm({...editForm, email: e.target.value})} />
            </div>
            <div>
              <Label>状态</Label>
              <Select value={editForm.status} onValueChange={(v: 'active'|'inactive')=>setEditForm({...editForm, status: v})}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">激活</SelectItem>
                  <SelectItem value="inactive">未激活</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>所属期次</Label>
              <div className="border rounded-md p-3 max-h-48 overflow-y-auto mt-2">
                {(sessions||[]).length===0 ? (
                  <p className="text-sm text-muted-foreground">暂无期次</p>
                ) : (
                  <div className="space-y-2">
                    {sessions.map(s => (
                      <div key={s.id} className="flex items-center space-x-2">
                        <input
                          type="checkbox"
                          id={`s-${s.id}`}
                          checked={editSessions.includes(s.id)}
                          onChange={(e)=>{
                            if(e.target.checked){
                              setEditSessions(prev=>[...prev, s.id])
                            } else {
                              setEditSessions(prev=>prev.filter(id=>id!==s.id))
                            }
                          }}
                          className="rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                        />
                        <Label htmlFor={`s-${s.id}`} className="text-sm cursor-pointer">{s.name}</Label>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <Button variant="outline" onClick={()=>setIsEditOpen(false)}>取消</Button>
              <Button onClick={handleSaveEdit}>保存</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default StudentManagement;