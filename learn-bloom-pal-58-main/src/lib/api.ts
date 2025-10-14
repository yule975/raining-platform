import { supabase } from './supabase'
import { createClient } from '@supabase/supabase-js'
import { getApiBaseUrl, getFullApiUrl, isDevelopment } from './config'

// 管理员专用客户端（使用服务密钥，绕过RLS）
const adminSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY!
)
import { Course, Student, AssignmentSubmission, Material, Assignment, UploadedFile } from './types'
import { generateTemporaryPassword } from '../utils/userInvitation'

// 期次制培训相关类型定义
export interface TrainingSession {
  id: string;
  name: string;
  description?: string;
  start_date: string;
  end_date?: string;
  status: 'upcoming' | 'active' | 'completed';
  is_current: boolean;
  selectedCourses?: string[]; // 创建期次时选中的课程ID列表
  created_at: string;
  updated_at: string;
}

export interface SessionStudent {
  id: string;
  session_id: string;
  user_id: string;
  student_number?: string;
  enrolled_at: string;
  status: 'active' | 'completed' | 'dropped';
  completion_rate: number;
  completed_at?: string;
}

export interface CourseCompletion {
  id: string;
  session_id: string;
  user_id: string;
  course_id: string;
  video_completed: boolean;
  video_completed_at?: string;
  assignments_completed: boolean;
  assignments_completed_at?: string;
  course_completed: boolean;
  course_completed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface StudentImport {
  id: string;
  session_id: string;
  imported_by?: string;
  file_name: string;
  total_count: number;
  success_count: number;
  error_count: number;
  error_details?: any;
  imported_at: string;
}

export class ApiService {
  // 🚀 文件上传相关 API
  static async uploadFile(file: File, studentId: string, assignmentId: string): Promise<UploadedFile | null> {
    try {
      const fileExt = file.name.split('.').pop()
      const fileName = `${studentId}/${assignmentId}/${Date.now()}.${fileExt}`
      
      console.log('🔄 上传文件:', fileName, file.size, 'bytes')
      
      const { data, error } = await supabase.storage
        .from('assignments')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        })
      
      if (error) {
        console.error('上传失败:', error)
        throw error
      }
      
      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from('assignments')
        .getPublicUrl(fileName)
      
      return {
        id: crypto.randomUUID(),
        name: file.name,
        size: file.size,
        type: file.type,
        url: publicUrl,
        path: fileName
      }
    } catch (error) {
      console.error('Error uploading file:', error)
      return null
    }
  }
  
  static async deleteFile(filePath: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from('assignments')
        .remove([filePath])
      
      if (error) {
        console.error('删除文件失败:', error)
        return false
      }
      
      return true
    } catch (error) {
      console.error('Error deleting file:', error)
      return false
    }
  }
  // 课程相关 API
  static async getCourses(): Promise<Course[]> {
    try {
      // 检查是否在管理员路径下
      const isAdminPath = window.location.pathname.includes('/admin');
      
      // 检查用户角色
      let role = localStorage.getItem('user_role');
      if (!role) {
        const demoUser = localStorage.getItem('demo_user');
        if (demoUser) {
          const parsedDemoUser = JSON.parse(demoUser);
          role = parsedDemoUser.role;
        }
      }
      
      // 在管理员路径下，强制使用后端代理，不管角色是什么
      if (isAdminPath) {
        console.log('ApiService.getCourses: 管理员路径 - 强制使用后端代理', { role, isAdminPath });
        try {
          const res = await fetch(getFullApiUrl('/api/courses'));
          if (!res.ok) {
            throw new Error(`Backend API error: ${res.status} ${res.statusText}`);
          }
          const data = await res.json();
          console.log('ApiService.getCourses: 后端API返回课程数据', data.length, '门课程');
          return data.map((course: any) => ({
            id: course.id,
            title: course.title,
            description: course.description || '',
            cover: course.cover_url || '',
            videoUrl: course.video_url || '',
            duration: course.duration || '',
            materials: [],
            assignments: [],
            createdAt: course.created_at,
            updatedAt: course.updated_at,
            studentCount: 0,
            completionRate: 0,
            instructor: course.instructor || ''
          }));
        } catch (fetchError) {
          console.error('ApiService.getCourses: 后端API调用失败', fetchError);
          throw new Error(`无法连接到后端服务器: ${fetchError.message}`);
        }
      }
      
      // 非管理员路径或者角色为admin时，也使用后端代理
      if (role === 'admin') {
        console.log('ApiService.getCourses: 管理员角色 - 使用后端代理', { role, isAdminPath });
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/api/courses`);
        if (!res.ok) throw new Error(`Backend proxy error: ${res.status}`);
        const data = await res.json();
        return data.map((course: any) => ({
          id: course.id,
          title: course.title,
          description: course.description || '',
          cover: course.cover_url || '',
          videoUrl: course.video_url || '',
          duration: course.duration || '',
          materials: [],
          assignments: [],
          createdAt: course.created_at,
          updatedAt: course.updated_at,
          studentCount: 0,
          completionRate: 0,
          instructor: course.instructor || ''
        }));
      }
      
      // 对于学员用户，也使用后端代理，避免RLS权限问题
      console.log('ApiService.getCourses: 学员用户 - 使用后端代理', { role });
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/courses`);
      if (!res.ok) throw new Error(`Backend proxy error: ${res.status}`);
      const data = await res.json();
      console.log('ApiService.getCourses: 后端API返回课程数据', data?.length || 0, '门课程');
      return data.map((course: any) => ({
        id: course.id,
        title: course.title,
        description: course.description || '',
        cover: course.cover_url || '',
        videoUrl: course.video_url || '',
        duration: course.duration || '',
        materials: [],
        assignments: [],
        createdAt: course.created_at,
        updatedAt: course.updated_at,
        studentCount: 0,
        completionRate: 0,
        instructor: course.instructor || ''
      }))
    } catch (error) {
      console.error('Error fetching courses:', error)
      throw error
    }
  }

  // 兼容旧代码：有的地方调用 getAllCourses，这里做一个别名方法
  static async getAllCourses(): Promise<Course[]> {
    try {
      console.log('ApiService.getAllCourses: 兼容调用，转到 getCourses');
      return await this.getCourses();
    } catch (e) {
      console.error('Error getAllCourses:', e);
      throw e;
    }
  }

  // ========== 期次制培训相关 API ==========
  static async getCurrentSession(): Promise<TrainingSession | null> {
    try {
      // 统一使用后端代理获取当前期次，避免RLS权限问题
      console.log('ApiService.getCurrentSession: 使用后端代理获取当前期次');
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/training-sessions/current`);
      
      if (!res.ok) {
        if (res.status === 404) {
          console.log('ApiService.getCurrentSession: 未找到当前期次');
          return null;
        }
        throw new Error(`Backend proxy error: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('ApiService.getCurrentSession: 获取到当前期次', data?.name || 'null');
      return data;
    } catch (error) {
      console.error('Error fetching current session:', error);
      return null;
    }
  }

  static async getTrainingSessions(): Promise<TrainingSession[]> {
    try {
      // 检查用户角色，优先从localStorage获取，然后从demo_user获取
      let role = localStorage.getItem('user_role');
      // 学员端兜底：如果没有或被误判为admin，但存在force_student_role，则强制视为student
      if (localStorage.getItem('force_student_role') === 'true') {
        role = 'student';
      }
      if (!role) {
        const demoUser = localStorage.getItem('demo_user');
        if (demoUser) {
          const parsedDemoUser = JSON.parse(demoUser);
          role = parsedDemoUser.role;
        }
      }
      
      // 检查是否在管理员路径下，如果是则强制使用后端代理
      const isAdminPath = window.location.pathname.includes('/admin');
      
      // 统一使用后端代理获取期次数据，避免RLS权限问题
      console.log('ApiService.getTrainingSessions: 使用后端代理获取期次数据', { role, isAdminPath });
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/training-sessions`);
      if (!res.ok) throw new Error(`Backend proxy error: ${res.status}`);
      const data = await res.json();
      console.log('ApiService.getTrainingSessions: 获取到期次数据', data?.length || 0, '条');
      return data || [];
    } catch (error) {
      console.error('Error fetching training sessions:', error);
      throw error;
    }
  }

  // 期次成员校验
  static async isSessionMember(sessionId: string, userId: string): Promise<boolean> {
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/sessions/${sessionId}/members/${userId}/exists`);
      if (!res.ok) return false;
      const data = await res.json();
      return !!data?.isMember;
    } catch (e) {
      console.error('ApiService.isSessionMember error:', e);
      return false;
    }
  }

  

  static async getCourse(id: string): Promise<Course | null> {
    try {
      // 优先使用后端代理（避免RLS及网络超时），再回退到直连
      try {
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/api/courses`);
        if (res.ok) {
          const list = await res.json();
          const course = (list || []).find((c: any) => c.id === id);
          if (course) {
            return {
              id: course.id,
              title: course.title,
              description: course.description || '',
              cover: course.cover_url || '',
              videoUrl: course.video_url || '',
              duration: course.duration || '',
              materials: [], // 学员端先不查materials，避免RLS导致阻塞
              assignments: [],
              createdAt: course.created_at,
              updatedAt: course.updated_at,
              studentCount: 0,
              completionRate: 0,
              instructor: course.instructor || ''
            }
          }
        }
      } catch (e) {
        console.warn('getCourse: 后端代理失败，回退直连', e);
      }

      // 回退直连 Supabase（管理员或本地调试）
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single()

      if (error) {
        throw error
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        cover: data.cover_url || '',
        videoUrl: data.video_url || '',
        duration: data.duration || '',
        materials: await ApiService.getCourseMaterials(data.id),
        assignments: await ApiService.getCourseAssignments(data.id),
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        studentCount: 0,
        completionRate: 0,
        instructor: data.instructor || ''
      }
    } catch (error) {
      console.error('Error fetching course:', error)
      return null
    }
  }

  // 获取课程资料
  static async getCourseMaterials(courseId: string): Promise<Material[]> {
    try {
      const { data, error } = await supabase
        .from('course_materials')
        .select('*')
        .eq('course_id', courseId)

      if (error) {
        console.error('Error fetching course materials:', error)
        return []
      }

      // 辅助函数：根据MIME类型确定文件类型
      const getFileType = (mimeType: string): 'pdf' | 'document' | 'code' | 'video' | 'other' => {
        if (mimeType.includes('pdf')) return 'pdf';
        if (mimeType.includes('document') || mimeType.includes('word')) return 'document';
        if (mimeType.includes('zip') || mimeType.includes('code')) return 'code';
        if (mimeType.includes('video')) return 'video';
        return 'other';
      };

      return data.map((material: any) => ({
        id: material.id,
        name: material.file_name,
        size: material.file_size,
        type: getFileType(material.file_type),
        downloadUrl: material.file_url, // 映射 file_url 到 downloadUrl
        uploadedAt: material.uploaded_at || material.created_at
      }))
    } catch (error) {
      console.error('Error fetching course materials:', error)
      return []
    }
  }

  // 覆盖写入：将某课程的资料链接替换为给定列表
  static async setCourseMaterials(courseId: string, materials: Material[]): Promise<boolean> {
    try {
      // 先删除旧的
      const { error: delError } = await supabase
        .from('course_materials')
        .delete()
        .eq('course_id', courseId)

      if (delError) {
        console.error('Error deleting old materials:', delError)
        throw delError
      }

      if (!materials || materials.length === 0) {
        return true
      }

      // 批量插入新的
      const rows = materials.map((m) => ({
        course_id: courseId,
        file_name: m.name || '',
        file_type: m.type || 'other',
        file_size: m.size || '',
        file_url: m.downloadUrl || ''
      }))

      const { error: insError } = await supabase
        .from('course_materials')
        .insert(rows)

      if (insError) {
        console.error('Error inserting materials:', insError)
        throw insError
      }

      return true
    } catch (error) {
      console.error('Error setCourseMaterials:', error)
      return false
    }
  }

  static async createCourse(course: Omit<Course, 'id' | 'createdAt' | 'updatedAt'>): Promise<Course> {
    try {
      console.log('API: 使用管理员权限创建课程', course.title);
      const now = new Date().toISOString();
      const { data, error } = await adminSupabase
        .from('courses')
        .insert({
          title: course.title,
          description: course.description,
          cover_url: course.cover,
          video_url: course.videoUrl,
          duration: course.duration,
          instructor: course.instructor,
          created_at: now,
          updated_at: now
        })
        .select()
        .single()

      if (error) {
        console.error('API: 创建课程失败', error);
        throw error
      }
      console.log('API: 课程创建成功', data.id);

      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        cover: data.cover_url || '',
        videoUrl: data.video_url || '',
        duration: data.duration || '',
        materials: [],
        assignments: [], // 🔄 改为数组
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        studentCount: 0,
        completionRate: 0,
        instructor: data.instructor || ''
      }
    } catch (error) {
      console.error('Error creating course:', error)
      throw error
    }
  }

  static async updateCourse(id: string, updates: Partial<Course>): Promise<Course | null> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .update({
          title: updates.title,
          description: updates.description,
          cover_url: updates.cover,
          video_url: updates.videoUrl,
          duration: updates.duration,
          instructor: updates.instructor,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        cover: data.cover_url || '',
        videoUrl: data.video_url || '',
        duration: data.duration || '',
        materials: [],
        assignments: [], // 🔄 改为数组
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        studentCount: 0,
        completionRate: 0,
        instructor: data.instructor || ''
      }
    } catch (error) {
      console.error('Error updating course:', error)
      return null
    }
  }

  static async deleteCourse(id: string): Promise<boolean> {
    try {
      console.log('API: 使用管理员权限删除课程及其关联数据', id);
      
      // 使用管理员客户端进行删除操作，绕过RLS限制
      
      // 1. 先删除关联的作业
      console.log('API: 删除关联作业...');
      const { error: assignmentError } = await adminSupabase
        .from('assignments')
        .delete()
        .eq('course_id', id);
      
      if (assignmentError) {
        console.error('API: 删除关联作业失败', assignmentError);
        throw new Error(`删除作业失败: ${assignmentError.message}`);
      }
      console.log('API: 关联作业删除成功');

      // 2. 删除关联的课程材料（如果有）
      console.log('API: 删除课程材料...');
      const { error: materialError } = await adminSupabase
        .from('course_materials')
        .delete()
        .eq('course_id', id);
      
      if (materialError && materialError.code !== 'PGRST116') {
        console.error('API: 删除课程材料失败', materialError);
        throw new Error(`删除课程材料失败: ${materialError.message}`);
      }
      console.log('API: 课程材料删除成功');

      // 3. 最后删除课程本身
      console.log('API: 删除课程...');
      const { error: courseError } = await adminSupabase
        .from('courses')
        .delete()
        .eq('id', id);

      if (courseError) {
        console.error('API: 删除课程失败', courseError);
        throw new Error(`删除课程失败: ${courseError.message}`);
      }

      console.log('API: 课程及其关联数据删除成功');
      return true;
    } catch (error) {
      console.error('API: deleteCourse异常:', error);
      throw error;
    }
  }

  // 学生管理相关 API
  static async getAuthorizedUsers(): Promise<Student[]> {
    try {
      const { data, error } = await supabase
        .from('authorized_users')
        .select('*')
        .eq('role', 'student')
        .order('added_at', { ascending: false })

      if (error) {
        throw error
      }

      return data.map(user => ({
        id: user.id.toString(),
        name: user.name || '',
        email: user.email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${user.email}`,
        addedAt: user.added_at,
        status: user.status as 'active' | 'inactive',
        enrolledCourses: [] // TODO: 从关联表获取
      }))
    } catch (error) {
      console.error('Error fetching authorized users:', error)
      throw error
    }
  }

  static async addAuthorizedUser(user: { name: string; email: string }): Promise<Student> {
    try {
      const { data, error } = await supabase
        .from('authorized_users')
        .insert({
          name: user.name,
          email: user.email,
          status: 'active'
        })
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        id: data.id.toString(),
        name: data.name || '',
        email: data.email,
        avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
        addedAt: data.added_at,
        status: data.status as 'active' | 'inactive',
        enrolledCourses: []
      }
    } catch (error) {
      console.error('Error adding authorized user:', error)
      throw error
    }
  }

  static async removeAuthorizedUser(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('authorized_users')
        .delete()
        .eq('id', parseInt(id))

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Error removing authorized user:', error)
      return false
    }
  }

  // 更新授权用户（姓名/邮箱/状态）
  static async updateAuthorizedUser(
    id: string,
    updates: { name?: string; email?: string; status?: 'active' | 'inactive' }
  ): Promise<Student> {
    const base = getApiBaseUrl()
    const res = await fetch(`${base}/api/authorized-users/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(updates)
    })

    if (res.status === 409) {
      throw new Error('该邮箱已存在')
    }
    if (!res.ok) {
      throw new Error('更新失败')
    }
    const data = await res.json()
    return {
      id: data.id.toString(),
      name: data.name || '',
      email: data.email,
      avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
      addedAt: data.added_at,
      status: data.status as 'active' | 'inactive',
      enrolledCourses: []
    }
  }

  // 设置学员所属期次（覆盖式）
  static async setStudentSessions(userId: string, sessionIds: string[]): Promise<boolean> {
    const base = getApiBaseUrl()
    console.log('🔧 [前端] setStudentSessions 调用:', { userId, sessionIds, apiUrl: `${base}/api/students/${userId}/sessions` })
    
    const res = await fetch(`${base}/api/students/${userId}/sessions`, {
      method: 'PUT',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionIds })
    })
    
    console.log('🔧 [前端] setStudentSessions 响应状态:', res.status, res.statusText)
    
    if (!res.ok) {
      const errorText = await res.text()
      console.error('🔧 [前端] setStudentSessions 错误响应:', errorText)
      throw new Error(`设置所属期次失败: ${res.status} ${res.statusText} - ${errorText}`)
    }
    
    const result = await res.json()
    console.log('🔧 [前端] setStudentSessions 成功响应:', result)
    return true
  }

  static async exportStudentCredentials(params: { userIds: string[]; sessionIds?: string[] }) {
    const base = getApiBaseUrl()
    const res = await fetch(`${base}/api/students/export-credentials`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(params)
    })
    if (!res.ok) throw new Error('导出失败')
    const blob = await res.blob()
    const url = window.URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = 'credentials.csv'
    document.body.appendChild(a)
    a.click()
    a.remove()
    window.URL.revokeObjectURL(url)
  }

  // 批量创建测试账号
  static async createTestAccounts(): Promise<{ student: Student & { password: string }; admin: Student & { password: string } }> {
    try {
      const testAccounts = [
        {
          name: '测试学员',
          email: 'student@test.com',
          role: 'student',
          status: 'active'
        },
        {
          name: '测试管理员', 
          email: 'admin@test.com',
          role: 'admin',
          status: 'active'
        }
      ];

      const results = [];
      
      for (const account of testAccounts) {
        // 生成临时密码
        const password = generateTemporaryPassword(12);
        
        // 检查账号是否已存在
        const { data: existing } = await supabase
          .from('authorized_users')
          .select('id')
          .eq('email', account.email)
          .single();
          
        if (existing) {
          // 如果已存在，获取现有账号信息
          const { data: existingUser } = await supabase
            .from('authorized_users')
            .select('*')
            .eq('email', account.email)
            .single();
            
          // 更新Supabase Auth中的密码
          try {
            const { error: authError } = await supabase.auth.admin.updateUserById(
              existingUser.auth_user_id || '',
              { password }
            );
            if (authError) {
              console.warn('更新Auth密码失败:', authError);
            }
          } catch (authError) {
            console.warn('Auth操作失败:', authError);
          }
            
          results.push({
            id: existingUser.id.toString(),
            name: existingUser.name || '',
            email: existingUser.email,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${existingUser.email}`,
            addedAt: existingUser.added_at,
            status: existingUser.status as 'active' | 'inactive',
            enrolledCourses: [],
            password
          });
        } else {
          // 在Supabase Auth中创建用户
          let authUserId = null;
          try {
            const { data: authData, error: authError } = await supabase.auth.admin.createUser({
              email: account.email,
              password,
              email_confirm: true,
              user_metadata: {
                name: account.name,
                role: account.role
              }
            });
            
            if (authError) {
              console.warn('创建Auth用户失败:', authError);
            } else {
              authUserId = authData.user?.id;
            }
          } catch (authError) {
            console.warn('Auth操作失败:', authError);
          }
          
          // 创建新账号
          const { data, error } = await supabase
            .from('authorized_users')
            .insert({
              name: account.name,
              email: account.email,
              role: account.role,
              status: account.status,
              auth_user_id: authUserId
            })
            .select()
            .single();
            
          if (error) {
            throw error;
          }
          
          results.push({
            id: data.id.toString(),
            name: data.name || '',
            email: data.email,
            avatar: `https://api.dicebear.com/7.x/avataaars/svg?seed=${data.email}`,
            addedAt: data.added_at,
            status: data.status as 'active' | 'inactive',
            enrolledCourses: [],
            password
          });
        }
      }
      
      return {
        student: results[0],
        admin: results[1]
      };
    } catch (error) {
      console.error('Error creating test accounts:', error);
      throw error;
    }
  }

  // 清理测试数据
  static async clearTestData(): Promise<number> {
    try {
      const testEmails = ['student@test.com', 'admin@test.com'];
      
      // 获取测试账号
      const { data: testUsers, error: fetchError } = await supabase
        .from('authorized_users')
        .select('id')
        .in('email', testEmails);
        
      if (fetchError) {
        throw fetchError;
      }
      
      if (!testUsers || testUsers.length === 0) {
        return 0;
      }
      
      // 删除测试账号
      const { error: deleteError } = await supabase
        .from('authorized_users')
        .delete()
        .in('email', testEmails);
        
      if (deleteError) {
        throw deleteError;
      }
      
      return testUsers.length;
    } catch (error) {
      console.error('Error clearing test data:', error);
      throw error;
    }
  }



  // 🚀 新的作业管理 API
  static async getCourseAssignments(courseId: string): Promise<Assignment[]> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('course_id', courseId)
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data.map(assignment => ({
        id: assignment.id,
        course_id: assignment.course_id,
        title: assignment.title,
        description: assignment.description || '',
        assignment_type: 'general',
        due_date: assignment.due_date,
        max_score: 100,
        allow_file_upload: true,
        allowed_file_types: 'pdf,jpg,png,zip',
        max_file_size_mb: parseInt(assignment.max_file_size?.replace('MB', '') || '10'),
        instructions: assignment.description || '',
        requirements: assignment.requirements || [],
        is_active: true,
        created_at: assignment.created_at,
        updated_at: assignment.created_at
      }))
    } catch (error) {
      console.error('Error fetching course assignments:', error)
      return []
    }
  }

  static async getAssignments(courseId?: string): Promise<Assignment[]> {
    try {
      console.log('API: 使用管理员权限获取作业列表', courseId ? `课程ID: ${courseId}` : '所有课程');
      
      let query = adminSupabase
        .from('assignments')
        .select('*')
        .order('created_at', { ascending: false })

      if (courseId) {
        query = query.eq('course_id', courseId)
      }

      const { data, error } = await query

      if (error) {
        console.error('API: 获取作业列表失败', error);
        throw new Error(`获取作业失败: ${error.message}`)
      }

      if (!data) {
        console.log('API: 没有找到作业数据');
        return []
      }

      console.log('API: 成功获取作业列表', data.length, '个作业');
      return data.map(assignment => ({
        id: assignment.id,
        course_id: assignment.course_id,
        title: assignment.title,
        description: assignment.description || '',
        assignment_type: assignment.assignment_type || 'general',
        due_date: assignment.due_date,
        max_score: assignment.max_score || 100,
        allow_file_upload: assignment.allow_file_upload ?? true,
        allowed_file_types: assignment.allowed_file_types || 'pdf,jpg,png,zip',
        max_file_size_mb: assignment.max_file_size_mb || 10,
        instructions: assignment.instructions || '',
        requirements: assignment.requirements || [],
        is_active: assignment.is_active ?? true,
        created_at: assignment.created_at,
        updated_at: assignment.updated_at || assignment.created_at
      }))
    } catch (error) {
      console.error('API: getAssignments异常:', error)
      throw error
    }
  }

  static async getAssignment(assignmentId: string): Promise<Assignment | null> {
    try {
      const { data, error } = await supabase
        .from('assignments')
        .select('*')
        .eq('id', assignmentId)
        .single()

      if (error) {
        throw error
      }

      if (!data) {
        return null
      }

      return {
        id: data.id,
        course_id: data.course_id,
        title: data.title,
        description: data.description || '',
        assignment_type: 'general',
        due_date: data.due_date,
        max_score: 100,
        allow_file_upload: true,
        allowed_file_types: 'pdf,jpg,png,zip',
        max_file_size_mb: parseInt(data.max_file_size?.replace('MB', '') || '10'),
        instructions: data.description || '',
        requirements: data.requirements || [],
        is_active: true,
        created_at: data.created_at,
        updated_at: data.created_at
      }
    } catch (error) {
      console.error('Error fetching assignment:', error)
      return null
    }
  }

  static async createAssignment(assignmentData: Omit<Assignment, 'id' | 'created_at' | 'updated_at'>): Promise<Assignment> {
    try {
      console.log('API: 使用管理员权限创建作业', assignmentData.title);
      const now = new Date().toISOString()
      const { data, error } = await adminSupabase
        .from('assignments')
        .insert({
          course_id: assignmentData.course_id,
          title: assignmentData.title,
          description: assignmentData.description,
          assignment_type: assignmentData.assignment_type || 'general',
          due_date: assignmentData.due_date,
          max_score: assignmentData.max_score || 100,
          allow_file_upload: assignmentData.allow_file_upload || true,
          allowed_file_types: assignmentData.allowed_file_types || 'pdf,jpg,png,zip',
          max_file_size_mb: assignmentData.max_file_size_mb || 10,
          instructions: assignmentData.instructions || '',
          requirements: assignmentData.requirements || [],
          is_active: assignmentData.is_active !== false,
          created_at: now,
          updated_at: now
        })
        .select()
        .single()

      if (error) {
        console.error('API: 创建作业失败', error);
        throw error
      }
      console.log('API: 作业创建成功', data.id);

      return {
        id: data.id,
        course_id: data.course_id,
        title: data.title,
        description: data.description || '',
        assignment_type: data.assignment_type || 'general',
        due_date: data.due_date,
        max_score: data.max_score || 100,
        allow_file_upload: data.allow_file_upload || true,
        allowed_file_types: data.allowed_file_types || 'pdf,jpg,png,zip',
        max_file_size_mb: data.max_file_size_mb || 10,
        instructions: data.instructions || '',
        requirements: data.requirements || [],
        is_active: data.is_active || true,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    } catch (error) {
      console.error('Error creating assignment:', error)
      throw error
    }
  }

  static async updateAssignment(assignmentId: string, updates: Partial<Assignment>): Promise<Assignment | null> {
    try {
      const now = new Date().toISOString()
      const updateData: any = { updated_at: now }
      
      // 只更新提供的字段
      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.assignment_type !== undefined) updateData.assignment_type = updates.assignment_type
      if (updates.due_date !== undefined) updateData.due_date = updates.due_date
      if (updates.max_score !== undefined) updateData.max_score = updates.max_score
      if (updates.allow_file_upload !== undefined) updateData.allow_file_upload = updates.allow_file_upload
      if (updates.allowed_file_types !== undefined) updateData.allowed_file_types = updates.allowed_file_types
      if (updates.max_file_size_mb !== undefined) updateData.max_file_size_mb = updates.max_file_size_mb
      if (updates.instructions !== undefined) updateData.instructions = updates.instructions
      if (updates.requirements !== undefined) updateData.requirements = updates.requirements
      if (updates.is_active !== undefined) updateData.is_active = updates.is_active

      const { data, error } = await supabase
        .from('assignments')
        .update(updateData)
        .eq('id', assignmentId)
        .select()
        .single()

      if (error) {
        throw error
      }

      return {
        id: data.id,
        course_id: data.course_id,
        title: data.title,
        description: data.description || '',
        assignment_type: data.assignment_type || 'general',
        due_date: data.due_date,
        max_score: data.max_score || 100,
        allow_file_upload: data.allow_file_upload || true,
        allowed_file_types: data.allowed_file_types || 'pdf,jpg,png,zip',
        max_file_size_mb: data.max_file_size_mb || 10,
        instructions: data.instructions || '',
        requirements: data.requirements || [],
        is_active: data.is_active || true,
        created_at: data.created_at,
        updated_at: data.updated_at
      }
    } catch (error) {
      console.error('Error updating assignment:', error)
      return null
    }
  }

  static async deleteAssignment(assignmentId: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('assignments')
        .delete()
        .eq('id', assignmentId)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Error deleting assignment:', error)
      return false
    }
  }

  // 🎯 作业提交 API
  static async submitAssignment(
    assignmentId: string, 
    studentId: string, 
    submission: { content: string; fileUrl?: string }
  ): Promise<AssignmentSubmission> {
    try {
      // 先检查是否已有提交记录
      const { data: existing } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .single()

      if (existing) {
        // 更新现有提交
        const { data, error } = await supabase
          .from('submissions')
          .update({
            content: submission.content,
            file_url: submission.fileUrl,
            submitted_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select(`
            *,
            assignments:assignment_id (title, course_id)
          `)
          .single()

        if (error) throw error

        return this.mapSubmissionData(data)
      } else {
        // 创建新提交
        const { data, error } = await supabase
          .from('submissions')
          .insert({
            assignment_id: assignmentId,
            student_id: studentId,
            content: submission.content,
            file_url: submission.fileUrl,
            submitted_at: new Date().toISOString()
          })
          .select(`
            *,
            assignments:assignment_id (title, course_id)
          `)
          .single()

        if (error) throw error

        return this.mapSubmissionData(data)
      }
    } catch (error) {
      console.error('Error submitting assignment:', error)
      throw error
    }
  }

  static async getSubmissions(assignmentId?: string, courseId?: string): Promise<AssignmentSubmission[]> {
    try {
      console.log('API: 获取提交数据', { assignmentId, courseId });
      
      if (!assignmentId) {
        // 如果没有assignmentId，暂时返回空数组
        // 未来可以添加获取所有提交的API
        console.log('API: 没有指定assignmentId，返回空数组');
        return []
      }

      // 通过后端API获取作业提交明细
      const response = await fetch(getFullApiUrl(`/api/assignments/${assignmentId}/submissions`))
      
      if (!response.ok) {
        throw new Error(`获取提交数据失败: ${response.status} ${response.statusText}`)
      }

      const data = await response.json()

      if (!data) {
        console.log('API: 没有找到提交数据');
        return []
      }

      console.log('API: 成功获取提交数据', data.length, '个提交');
      return data.map((submission: any) => ({
        ...this.mapSubmissionData(submission),
        student: submission.student ? {
          id: submission.student.id,
          name: submission.student.name || 'Unknown Student',
          email: submission.student.email || ''
        } : {
          id: submission.student_id,
          name: submission.student_name || 'Unknown Student',
          email: submission.student_email || ''
        }
      }))
    } catch (error) {
      console.error('API: getSubmissions异常:', error)
      throw error
    }
  }

  static async getStudentSubmissions(studentId: string): Promise<AssignmentSubmission[]> {
    try {
      // 使用后端代理获取学生提交记录
      const base = getApiBaseUrl()
      const res = await fetch(`${base}/api/students/${studentId}/submissions`)
      
      if (!res.ok) {
        throw new Error(`Failed to fetch student submissions: ${res.status}`)
      }
      
      const data = await res.json()
      return (data || []).map((submission: any) => this.mapSubmissionData(submission))
    } catch (error) {
      console.error('Error fetching student submissions:', error)
      throw error
    }
  }

  static async getSubmission(assignmentId: string, studentId: string): Promise<AssignmentSubmission | null> {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          assignments:assignment_id (title, course_id)
        `)
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .single()

      if (error) {
        if (error.code === 'PGRST116') {
          // 没有找到提交记录
          return null
        }
        throw error
      }

      return this.mapSubmissionData(data)
    } catch (error) {
      console.error('Error fetching submission:', error)
      return null
    }
  }

  // 🎯 辅助方法：转换提交数据格式
  private static mapSubmissionData(data: any): AssignmentSubmission {
    return {
      id: data.id,
      assignment_id: data.assignment_id,
      student_id: data.student_id,
      content: data.content || '',
      files: data.files || [],
      file_count: data.file_count || 0,
      total_file_size: data.total_file_size || 0,
      score: data.score,
      feedback: data.feedback,
      status: data.graded_at ? 'graded' : (data.submitted_at ? 'submitted' : 'draft'),
      submitted_at: data.submitted_at,
      graded_at: data.graded_at,
      graded_by: data.graded_by,
      created_at: data.created_at,
      updated_at: data.updated_at,
      // 关联数据（处理简化数据结构）
      student: data.profiles ? {
        id: data.student_id,
        name: data.profiles.full_name || 'Unknown Student',
        email: data.profiles.email || ''
      } : undefined,
      assignment: data.assignments ? {
        id: data.assignments.id,
        course_id: data.assignments.course_id,
        title: data.assignments.title,
        description: '',
        assignment_type: data.assignments.assignment_type || 'general',
        due_date: data.assignments.due_date,
        max_score: data.assignments.max_score || 100,
        allow_file_upload: data.assignments.allow_file_upload || true,
        allowed_file_types: data.assignments.allowed_file_types || 'pdf,jpg,png,zip',
        max_file_size_mb: data.assignments.max_file_size_mb || 10,
        instructions: '',
        requirements: [],
        is_active: true,
        created_at: '',
        updated_at: ''
      } : {
        id: data.assignment_id,
        course_id: '',
        title: 'Unknown Assignment',
        description: '',
        assignment_type: 'general',
        due_date: '',
        max_score: 100,
        allow_file_upload: true,
        allowed_file_types: 'pdf,jpg,png,zip',
        max_file_size_mb: 10,
        instructions: '',
        requirements: [],
        is_active: true,
        created_at: '',
        updated_at: ''
      }
    }
  }

  // 🚀 新的提交API，支持文件上传
  static async submitAssignmentWithFiles(
    assignmentId: string, 
    studentId: string, 
    submissionData: { 
      content: string; 
      files?: UploadedFile[] 
    }
  ): Promise<AssignmentSubmission> {
    try {
      const now = new Date().toISOString()
      
      // 先检查是否已有提交记录
      const { data: existing } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .single()

      const submissionPayload = {
        content: submissionData.content,
        files: submissionData.files || [],
        file_count: submissionData.files?.length || 0,
        total_file_size: submissionData.files?.reduce((sum, f) => sum + f.size, 0) || 0,
        status: 'submitted',
        submitted_at: now,
        updated_at: now
      }

      if (existing) {
        // 更新现有提交
        const { data, error } = await supabase
          .from('submissions')
          .update(submissionPayload)
          .eq('id', existing.id)
          .select('*')
          .single()

        if (error) {
          throw error
        }

        return this.mapNewSubmissionData(data)
      } else {
        // 创建新的提交
        const { data, error } = await supabase
          .from('submissions')
          .insert({
            assignment_id: assignmentId,
            student_id: studentId,
            created_at: now,
            ...submissionPayload
          })
          .select('*')
          .single()

        if (error) {
          throw error
        }

        return this.mapNewSubmissionData(data)
      }
    } catch (error) {
      console.error('Error submitting assignment:', error)
      throw error
    }
  }

  // 新的数据映射方法
  private static mapNewSubmissionData(data: any): AssignmentSubmission {
    return {
      id: data.id,
      assignment_id: data.assignment_id,
      student_id: data.student_id,
      content: data.content || '',
      files: data.files || [],
      file_count: data.file_count || 0,
      total_file_size: data.total_file_size || 0,
      score: data.score,
      feedback: data.feedback,
      status: data.status || 'draft',
      submitted_at: data.submitted_at,
      graded_at: data.graded_at,
      graded_by: data.graded_by,
      created_at: data.created_at,
      updated_at: data.updated_at,
      assignment: data.assignments ? {
        id: data.assignments.id,
        course_id: data.assignments.course_id,
        title: data.assignments.title,
        description: '',
        assignment_type: data.assignments.assignment_type || 'general',
        due_date: data.assignments.due_date,
        max_score: data.assignments.max_score || 100,
        allow_file_upload: data.assignments.allow_file_upload || true,
        allowed_file_types: data.assignments.allowed_file_types || 'pdf,jpg,png,zip',
        max_file_size_mb: data.assignments.max_file_size_mb || 10,
        instructions: '',
        requirements: [],
        is_active: true,
        created_at: '',
        updated_at: ''
      } : undefined
    }
  }

  // 🎯 学习进度和课程完成相关 API
  
  /**
   * 标记课程完成（期次制 - 已弃用，使用新的课程完成逻辑）
   */
  static async markCourseComplete(courseId: string, userId: string): Promise<boolean> {
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/courses/${courseId}/mark-complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: userId })
      })
      return res.ok
    } catch (error) {
      console.error('Error marking course complete:', error)
      return false
    }
  }

  /**
   * 获取用户学习完成统计（期次制）
   */
  static async getUserCompletionStats(userId: string): Promise<{
    completedCourses: number;
    inProgressCourses: number;
    totalEnrolledCourses: number;
    completionRate: number;
    lastActivityDate: string | null;
  }> {
    try {
      const currentSession = await this.getCurrentSession()
      if (!currentSession) {
        return {
          completedCourses: 0,
          inProgressCourses: 0,
          totalEnrolledCourses: 0,
          completionRate: 0,
          lastActivityDate: null
        }
      }

      // 获取用户在当前期次的课程完成数据
      const { data: completions, error: completionsError } = await supabase
        .from('course_completions')
        .select('*')
        .eq('session_id', currentSession.id)
        .eq('user_id', userId)

      if (completionsError) {
        throw completionsError
      }

      // 获取总课程数
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id')

      if (coursesError) {
        throw coursesError
      }

      const totalCourses = courses?.length || 0
      const completedCourses = completions?.filter(c => c.course_completed).length || 0
      const inProgressCourses = completions?.filter(c => !c.course_completed && (c.video_completed || c.assignments_completed)).length || 0
      const completionRate = totalCourses > 0 ? Math.round((completedCourses / totalCourses) * 100) : 0
      
      // 获取最后活动时间
      const { data: progressData, error: progressError } = await supabase
        .from('learning_progress')
        .select('last_accessed_at')
        .eq('user_id', userId)
        .eq('session_id', currentSession.id)
        .order('last_accessed_at', { ascending: false })
        .limit(1)
        .single()

      const lastActivityDate = progressData?.last_accessed_at || null

      return {
        completedCourses,
        inProgressCourses,
        totalEnrolledCourses: totalCourses,
        completionRate,
        lastActivityDate
      }
    } catch (error) {
      console.error('Error fetching user completion stats:', error)
      return {
        completedCourses: 0,
        inProgressCourses: 0,
        totalEnrolledCourses: 0,
        completionRate: 0,
        lastActivityDate: null
      }
    }
  }

  /**
   * 获取课程完成率统计（管理员用 - 期次制）
   */
  static async getCourseCompletionStats(): Promise<{
    totalCourses: number;
    totalStudents: number;
    overallCompletionRate: number;
    courseStats: Array<{
      courseId: string;
      courseTitle: string;
      enrolledStudents: number;
      completedStudents: number;
      completionRate: number;
    }>;
  }> {
    try {
      const currentSession = await this.getCurrentSession()
      if (!currentSession) {
        return {
          totalCourses: 0,
          totalStudents: 0,
          overallCompletionRate: 0,
          courseStats: []
        }
      }

      const sessionStats = await this.getSessionCompletionStats(currentSession.id)
      
      // 转换格式以匹配原有接口
      const courseStats = sessionStats.courseStats.map(stat => ({
        courseId: stat.courseId,
        courseTitle: stat.courseTitle,
        enrolledStudents: stat.enrolledStudents,
        completedStudents: stat.courseCompletedStudents,
        completionRate: stat.completionRate
      }))

      return {
        totalCourses: sessionStats.totalCourses,
        totalStudents: sessionStats.totalStudents,
        overallCompletionRate: sessionStats.overallCompletionRate,
        courseStats
      }
    } catch (error) {
      console.error('Error fetching course completion stats:', error)
      return {
        totalCourses: 0,
        totalStudents: 0,
        overallCompletionRate: 0,
        courseStats: []
      }
    }
  }

  /**
   * 确保用户已注册课程（期次制）
   */
  private static async ensureCourseEnrollment(userId: string, courseId: string, sessionId: string): Promise<void> {
    try {
      const { data: existingEnrollment, error: fetchError } = await supabase
        .from('course_enrollments')
        .select('id')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('session_id', sessionId)
        .single()

      if (fetchError && fetchError.code === 'PGRST116') {
        // 记录不存在，创建新的注册记录
        const { error: insertError } = await supabase
          .from('course_enrollments')
          .insert({
            user_id: userId,
            course_id: courseId,
            session_id: sessionId,
            status: 'active'
          })

        if (insertError) {
          console.error('Error creating course enrollment:', insertError)
        }
      }
    } catch (error) {
      console.error('Error ensuring course enrollment:', error)
    }
  }

  /**
   * 更新课程访问时间
   */
  static async updateCourseAccess(courseId: string, userId: string): Promise<void> {
    try {
      const currentSession = await this.getCurrentSession()
      if (!currentSession) {
        console.error('No current session found')
        return
      }

      const { data: existingProgress, error: fetchError } = await supabase
        .from('learning_progress')
        .select('*')
        .eq('user_id', userId)
        .eq('course_id', courseId)
        .eq('session_id', currentSession.id)
        .single()

      const now = new Date().toISOString()

      if (existingProgress) {
        // 更新访问时间
        await supabase
          .from('learning_progress')
          .update({ last_accessed_at: now })
          .eq('user_id', userId)
          .eq('course_id', courseId)
          .eq('session_id', currentSession.id)
      } else {
        // 创建新的进度记录
        await supabase
          .from('learning_progress')
          .insert({
            user_id: userId,
            course_id: courseId,
            session_id: currentSession.id,
            progress_percentage: 0,
            last_accessed_at: now
          })
        
        // 确保用户已注册该课程
        await this.ensureCourseEnrollment(userId, courseId, currentSession.id)
      }
    } catch (error) {
      console.error('Error updating course access:', error)
    }
  }

  // ========== 期次制培训相关 API ==========

  /**
   * 获取当前活跃期次
   */
  static async getCurrentSessionLegacy(): Promise<TrainingSession | null> {
    try {
      const role = localStorage.getItem('user_role');
      if (role === 'admin') {
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/api/training-sessions/current`);
        if (!res.ok) throw new Error(`Backend proxy error: ${res.status}`);
        const data = await res.json();
        return data;
      }

      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .eq('is_current', true)
        .eq('status', 'active')
        .single()

      if (error) {
        if ((error as any).code === 'PGRST116') {
          return null // 没有找到当前期次
        }
        throw error
      }

      return data
    } catch (error) {
      console.error('Error fetching current session:', error)
      return null
    }
  }

  /**
   * 获取所有培训期次
   */
  static async getTrainingSessionsLegacy(): Promise<TrainingSession[]> {
    try {
      const role = localStorage.getItem('user_role');
      if (role === 'admin') {
        const base = getApiBaseUrl();
        const res = await fetch(`${base}/api/training-sessions`);
        if (!res.ok) throw new Error(`Backend proxy error: ${res.status}`);
        const data = await res.json();
        return data || [];
      }

      const { data, error } = await supabase
        .from('training_sessions')
        .select('*')
        .order('created_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching training sessions:', error)
      return []
    }
  }

  /**
   * 添加课程到期次
   */
  static async addCoursesToSession(sessionId: string, courseIds: string[]): Promise<number> {
    try {
      const { data, error } = await supabase
        .rpc('add_courses_to_session', {
          p_session_id: sessionId,
          p_course_ids: courseIds
        })

      if (error) {
        throw error
      }

      return data || 0
    } catch (error) {
      console.error('Error adding courses to session:', error)
      throw error
    }
  }

  /**
   * 获取期次关联的课程列表
   */
  static async getSessionCourses(sessionId: string): Promise<Course[]> {
    try {
      console.log('ApiService.getSessionCourses: 使用后端代理获取期次课程', sessionId);
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/training-sessions/${sessionId}/courses`);
      if (!res.ok) throw new Error(`Backend proxy error: ${res.status}`);
      const data = await res.json();
      console.log('ApiService.getSessionCourses: 获取到课程', data?.length || 0, '门');
      return (data || []).map((course: any) => ({
        id: course.id,
        title: course.title,
        description: course.description || '',
        cover: course.cover_url || '',
        videoUrl: course.video_url || '',
        duration: course.duration || '',
        materials: [],
        assignments: [],
        createdAt: course.created_at,
        updatedAt: course.updated_at,
        studentCount: 0,
        completionRate: 0,
        instructor: course.instructor || ''
      }));
    } catch (error) {
      console.error('Error fetching session courses:', error);
      return [];
    }
  }

  // ========== 作业模板 API ==========
  static async getAssignmentTemplates(courseId: string): Promise<any[]> {
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/courses/${courseId}/assignment-templates`);
      if (!res.ok) throw new Error(`Backend proxy error: ${res.status}`);
      const data = await res.json();
      return data || [];
    } catch (error) {
      console.error('Error fetching assignment templates:', error);
      return [];
    }
  }

  static async createAssignmentTemplate(courseId: string, payload: { title: string; description?: string; formUrl?: string; dueDaysOffset?: number }): Promise<any | null> {
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/courses/${courseId}/assignment-templates`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      if (!res.ok) throw new Error(`Backend proxy error: ${res.status}`);
      return await res.json();
    } catch (error) {
      console.error('Error creating assignment template:', error);
      return null;
    }
  }

  static async publishTemplate(templateId: string, params: { sessionIds: string[]; dueDate?: string; formUrl?: string; sessionUrls?: Array<{ id: string; url: string }> }): Promise<boolean> {
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/assignment-templates/${templateId}/publish`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(params)
      });
      if (!res.ok) throw new Error(`Backend proxy error: ${res.status}`);
      await res.json();
      return true;
    } catch (error) {
      console.error('Error publishing from template:', error);
      return false;
    }
  }

  // ========== 作业相关 API ==========
  
  /**
   * 获取所有作业（学员版）
   */
  static async getStudentAssignments(): Promise<any[]> {
    try {
      console.log('ApiService.getStudentAssignments: 获取作业列表');
      
      // 使用后端代理获取作业数据，避免权限问题
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/assignments`);
      
      if (!res.ok) {
        throw new Error(`Backend proxy error: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('ApiService.getStudentAssignments: 获取到作业数据', data?.length || 0, '个作业');
      
      // 如果没有真实数据，默认不再自动返回模拟数据，避免干扰真实测试
      // 只有当本地显式开启 enable_assignment_demo === 'true' 时，才展示示例作业
      if (!data || data.length === 0) {
        const enableDemo = (localStorage.getItem('enable_assignment_demo') === 'true');
        if (!enableDemo) {
          console.log('ApiService.getStudentAssignments: 后端无数据，返回空列表（示例作业已关闭）');
          return [];
        }
        console.log('ApiService.getStudentAssignments: 使用模拟作业数据（已开启示例开关）');
        const mockAssignments = [
          {
            id: 'assignment-1',
            title: 'AI基础理论作业',
            description: '请完成人工智能基础概念的学习笔记，包括机器学习、深度学习等核心概念的理解。',
            course_id: 'course-1',
            due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(), // 7天后
            status: 'active',
            max_score: 100,
            created_at: new Date().toISOString(),
            courses: { title: 'AI基础入门' }
          },
          {
            id: 'assignment-2',
            title: '机器学习实践项目',
            description: '使用提供的数据集完成一个简单的分类任务，提交代码和实验报告。',
            course_id: 'course-2',
            due_date: new Date(Date.now() + 14 * 24 * 60 * 60 * 1000).toISOString(), // 14天后
            status: 'active',
            max_score: 150,
            created_at: new Date().toISOString(),
            courses: { title: '机器学习实战' }
          },
          {
            id: 'assignment-3',
            title: '深度学习算法分析',
            description: '选择一种深度学习算法进行详细分析，包括原理、优缺点和应用场景。',
            course_id: 'course-3',
            due_date: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(), // 2天前（已逾期）
            status: 'active',
            max_score: 120,
            created_at: new Date().toISOString(),
            courses: { title: '深度学习进阶' }
          }
        ];
        return mockAssignments;
      }
      
      return data;
    } catch (error) {
      console.error('Error fetching student assignments:', error);
      const enableDemo = (localStorage.getItem('enable_assignment_demo') === 'true');
      if (!enableDemo) {
        console.log('ApiService.getStudentAssignments: API失败，返回空列表（示例作业已关闭）');
        return [];
      }
      console.log('ApiService.getStudentAssignments: API失败，使用模拟数据（已开启示例开关）');
      return [{
        id: 'assignment-demo',
        title: '示例作业',
        description: '这是一个示例作业，用于演示作业管理功能。',
        course_id: 'course-demo',
        due_date: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString(),
        status: 'active',
        max_score: 100,
        created_at: new Date().toISOString(),
        courses: { title: '示例课程' }
      }];
    }
  }

  /**
   * 获取学生的作业提交
   */
  static async getStudentSubmission(assignmentId: string, studentId: string): Promise<any | null> {
    try {
      console.log('ApiService.getStudentSubmission: 获取提交记录', { assignmentId, studentId });
      
      // 使用后端代理获取提交数据
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/assignments/${assignmentId}/submissions/${studentId}`);
      
      if (!res.ok) {
        if (res.status === 404) {
          console.log('ApiService.getStudentSubmission: 未找到提交记录');
          return null;
        }
        throw new Error(`Backend proxy error: ${res.status}`);
      }
      
      const data = await res.json();
      console.log('ApiService.getStudentSubmission: 获取到提交数据', data ? '有提交' : '无提交');
      
      return data;
    } catch (error) {
      console.error('Error fetching student submission:', error);
      return null;
    }
  }

  /**
   * 学员“我已提交”/更新提交（经由后端代理）
   */
  static async markAssignmentSubmitted(assignmentId: string, studentId: string, payload?: { content?: string; fileUrl?: string }): Promise<boolean> {
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/assignments/${assignmentId}/submissions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId, content: payload?.content, fileUrl: payload?.fileUrl })
      });
      return res.ok;
    } catch (e) {
      console.error('Error markAssignmentSubmitted:', e);
      return false;
    }
  }

  /**
   * 移除期次的课程关联
   */
  static async removeCoursesFromSession(sessionId: string, courseIds: string[]): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('session_courses')
        .delete()
        .eq('session_id', sessionId)
        .in('course_id', courseIds)

      if (error) {
        throw error
      }

      return true
    } catch (error) {
      console.error('Error removing courses from session:', error)
      return false
    }
  }

  /**
   * 创建新的培训期次
   */
  static async createTrainingSession(session: Omit<TrainingSession, 'id' | 'created_at' | 'updated_at'>, courseIds?: string[]): Promise<TrainingSession | null> {
    try {
      // 如果设置为当前期次，先将其他期次设为非当前
      if (session.is_current) {
        await supabase
          .from('training_sessions')
          .update({ is_current: false })
          .eq('is_current', true)
      }

      // 准备插入数据，确保selectedCourses字段正确处理
      const insertData = {
        ...session,
        selectedcourses: session.selectedCourses || courseIds || [] // 数据库字段名为小写
      }
      
      // 移除TypeScript接口中的字段名，使用数据库字段名
      delete (insertData as any).selectedCourses

      const { data, error } = await supabase
        .from('training_sessions')
        .insert(insertData)
        .select()
        .single()

      if (error) {
        throw error
      }

      // 如果提供了课程ID，添加课程关联
      const coursesToAdd = session.selectedCourses || courseIds
      if (data && coursesToAdd && coursesToAdd.length > 0) {
        await this.addCoursesToSession(data.id, coursesToAdd)
      }

      return data
    } catch (error) {
      console.error('Error creating training session:', error)
      return null
    }
  }

  /**
   * 更新培训期次
   */
  static async updateTrainingSession(id: string, updates: Partial<TrainingSession>): Promise<TrainingSession | null> {
    try {
      // 如果设置为当前期次，先将其他期次设为非当前（使用管理员客户端以避免RLS限制）
      if (updates.is_current) {
        await adminSupabase
          .from('training_sessions')
          .update({ is_current: false })
          .eq('is_current', true)
      }

      // 映射可更新字段，避免无效字段导致更新失败
      const payload: any = {}
      if (typeof updates.name === 'string') payload.name = updates.name
      if (typeof updates.description === 'string') payload.description = updates.description
      if (typeof updates.start_date === 'string') payload.start_date = updates.start_date
      if (typeof updates.end_date === 'string') payload.end_date = updates.end_date
      if (typeof updates.status === 'string') payload.status = updates.status
      if (typeof updates.is_current === 'boolean') payload.is_current = updates.is_current
      // 统一字段名：selectedCourses(前端) -> selectedcourses(数据库)
      if (Array.isArray((updates as any).selectedCourses)) {
        payload.selectedcourses = (updates as any).selectedCourses
      }
      payload.updated_at = new Date().toISOString()

      const { data, error } = await adminSupabase
        .from('training_sessions')
        .update(payload)
        .eq('id', id)
        .select()
        .single()

      if (error) {
        throw error
      }

      return data
    } catch (error) {
      console.error('Error updating training session:', error)
      return null
    }
  }

  /**
   * 获取期次学员列表
   */
  static async getSessionStudents(sessionId: string): Promise<SessionStudent[]> {
    try {
      const { data, error } = await supabase
        .from('session_students')
        .select(`
          *,
          profiles!session_students_user_id_fkey(
            id,
            email,
            full_name
          )
        `)
        .eq('session_id', sessionId)
        .order('enrolled_at', { ascending: false })

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching session students:', error)
      return []
    }
  }

  /**
   * 删除培训期次
   */
  static async deleteTrainingSession(id: string): Promise<{ success: boolean; message: string }> {
    try {
      console.log('开始删除期次:', id);
      
      // 1. 检查期次是否为当前期次
      const { data: session, error: sessionError } = await adminSupabase
        .from('training_sessions')
        .select('is_current')
        .eq('id', id)
        .single()

      if (sessionError) {
        if (sessionError.code === 'PGRST116') {
          console.log('期次不存在');
          return {
            success: false,
            message: '期次不存在'
          }
        }
        console.error('检查期次状态失败:', sessionError);
        throw sessionError
      }

      if (session.is_current) {
        console.log('当前期次无法删除');
        return {
          success: false,
          message: '当前期次无法删除，请先设置其他期次为当前期次。'
        }
      }

      // 2. 先删除相关的session_courses关联
      const { error: courseRelationError } = await adminSupabase
        .from('session_courses')
        .delete()
        .eq('session_id', id)

      if (courseRelationError) {
        console.error('删除期次课程关联失败:', courseRelationError);
        // 不抛出错误，继续删除期次
      } else {
        console.log('期次课程关联删除成功');
      }

      // 3. 删除期次
      const { error: deleteError } = await adminSupabase
        .from('training_sessions')
        .delete()
        .eq('id', id)

      if (deleteError) {
        console.error('删除期次失败:', deleteError);
        throw deleteError
      }

      console.log('期次删除成功');
      return {
        success: true,
        message: '期次删除成功'
      }
    } catch (error) {
      console.error('Error deleting training session:', error)
      return {
        success: false,
        message: `删除期次时发生错误: ${error.message || '请稍后重试'}`
      }
    }
  }

  /**
   * 批量导入学员到指定期次
   */
  static async importStudentsToSession(
    sessionId: string, 
    students: Array<{ email: string; name: string; student_number?: string }>,
    fileName: string
  ): Promise<{ success: boolean; importRecord: StudentImport | null }> {
    try {
      const { data: { user } } = await supabase.auth.getUser()
      const importedBy = user?.id

      let successCount = 0
      let errorCount = 0
      const errorDetails: any[] = []

      for (const student of students) {
        try {
          // 1. 检查用户是否存在于authorized_users表
          const { data: authorizedUser, error: authError } = await supabase
            .from('authorized_users')
            .select('*')
            .eq('email', student.email)
            .single()

          if (authError || !authorizedUser) {
            // 如果不存在，先添加到authorized_users
            const { error: insertAuthError } = await supabase
              .from('authorized_users')
              .insert({
                email: student.email,
                name: student.name,
                status: 'active'
              })

            if (insertAuthError) {
              errorCount++
              errorDetails.push({ email: student.email, error: '添加到授权用户失败' })
              continue
            }
          }

          // 2. 检查用户是否已注册（有profile）
          const { data: profile, error: profileError } = await supabase
            .from('profiles')
            .select('*')
            .eq('email', student.email)
            .single()

          if (profileError && profileError.code === 'PGRST116') {
            // 用户还未注册，跳过（等用户首次登录时会自动创建profile）
            errorCount++
            errorDetails.push({ email: student.email, error: '用户尚未注册登录' })
            continue
          }

          if (profile) {
            // 3. 将用户添加到期次学员表
            const { error: enrollError } = await supabase
              .from('session_students')
              .insert({
                session_id: sessionId,
                user_id: profile.id,
                student_number: student.student_number,
                status: 'active'
              })

            if (enrollError) {
              if (enrollError.code === '23505') { // 唯一约束冲突
                errorDetails.push({ email: student.email, error: '学员已存在于该期次' })
              } else {
                errorDetails.push({ email: student.email, error: '添加到期次失败' })
              }
              errorCount++
            } else {
              successCount++
            }
          }
        } catch (error) {
          errorCount++
          errorDetails.push({ email: student.email, error: '处理失败' })
        }
      }

      // 记录导入结果
      const { data: importRecord, error: recordError } = await supabase
        .from('student_imports')
        .insert({
          session_id: sessionId,
          imported_by: importedBy,
          file_name: fileName,
          total_count: students.length,
          success_count: successCount,
          error_count: errorCount,
          error_details: errorDetails
        })
        .select()
        .single()

      if (recordError) {
        console.error('Error recording import:', recordError)
      }

      return {
        success: successCount > 0,
        importRecord: importRecord || null
      }
    } catch (error) {
      console.error('Error importing students:', error)
      return { success: false, importRecord: null }
    }
  }

  /**
   * 标记视频观看完成
   */
  static async markVideoCompleted(courseId: string, userId: string): Promise<boolean> {
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/courses/${courseId}/video-completed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: userId })
      })
      return res.ok
    } catch (error) {
      console.error('Error marking video completed:', error)
      return false
    }
  }

  /**
   * 标记作业完成
   */
  static async markAssignmentsCompleted(courseId: string, userId: string): Promise<boolean> {
    try {
      const base = getApiBaseUrl();
      const res = await fetch(`${base}/api/courses/${courseId}/assignments-completed`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ studentId: userId })
      })
      return res.ok
    } catch (error) {
      console.error('Error marking assignments completed:', error)
      return false
    }
  }

  /**
   * 获取用户在当前期次的课程完成情况
   */
  static async getUserCourseCompletions(userId: string): Promise<CourseCompletion[]> {
    try {
      const currentSession = await this.getCurrentSession()
      if (!currentSession) {
        return []
      }

      const { data, error } = await supabase
        .from('course_completions')
        .select(`
          *,
          courses(
            id,
            title,
            description
          )
        `)
        .eq('session_id', currentSession.id)
        .eq('user_id', userId)

      if (error) {
        throw error
      }

      return data || []
    } catch (error) {
      console.error('Error fetching user course completions:', error)
      return []
    }
  }

  /**
   * 获取期次的课程完成统计（管理员用）
   */
  static async getSessionCompletionStats(sessionId?: string): Promise<{
    totalStudents: number;
    totalCourses: number;
    overallCompletionRate: number;
    courseStats: Array<{
      courseId: string;
      courseTitle: string;
      enrolledStudents: number;
      videoCompletedStudents: number;
      assignmentsCompletedStudents: number;
      courseCompletedStudents: number;
      completionRate: number;
    }>;
  }> {
    try {
      const targetSessionId = sessionId || (await this.getCurrentSession())?.id
      if (!targetSessionId) {
        return {
          totalStudents: 0,
          totalCourses: 0,
          overallCompletionRate: 0,
          courseStats: []
        }
      }

      // 获取期次学员数
      const { data: sessionStudents, error: studentsError } = await supabase
        .from('session_students')
        .select('user_id')
        .eq('session_id', targetSessionId)
        .eq('status', 'active')

      if (studentsError) {
        throw studentsError
      }

      const totalStudents = sessionStudents?.length || 0

      // 获取所有课程
      const { data: courses, error: coursesError } = await supabase
        .from('courses')
        .select('id, title')

      if (coursesError) {
        throw coursesError
      }

      const totalCourses = courses?.length || 0

      // 获取课程完成数据
      const { data: completions, error: completionsError } = await supabase
        .from('course_completions')
        .select('*')
        .eq('session_id', targetSessionId)

      if (completionsError) {
        throw completionsError
      }

      // 统计每个课程的完成情况
      const courseStats = courses?.map(course => {
        const courseCompletions = completions?.filter(c => c.course_id === course.id) || []
        const enrolledStudents = totalStudents // 所有学员都可以访问所有课程
        const videoCompletedStudents = courseCompletions.filter(c => c.video_completed).length
        const assignmentsCompletedStudents = courseCompletions.filter(c => c.assignments_completed).length
        const courseCompletedStudents = courseCompletions.filter(c => c.course_completed).length
        const completionRate = enrolledStudents > 0 ? Math.round((courseCompletedStudents / enrolledStudents) * 100) : 0

        return {
          courseId: course.id,
          courseTitle: course.title,
          enrolledStudents,
          videoCompletedStudents,
          assignmentsCompletedStudents,
          courseCompletedStudents,
          completionRate
        }
      }) || []

      // 计算总体完成率
      const totalPossibleCompletions = totalStudents * totalCourses
      const totalActualCompletions = completions?.filter(c => c.course_completed).length || 0
      const overallCompletionRate = totalPossibleCompletions > 0 
        ? Math.round((totalActualCompletions / totalPossibleCompletions) * 100) 
        : 0

      return {
        totalStudents,
        totalCourses,
        overallCompletionRate,
        courseStats
      }
    } catch (error) {
      console.error('Error fetching session completion stats:', error)
      return {
        totalStudents: 0,
        totalCourses: 0,
        overallCompletionRate: 0,
        courseStats: []
      }
    }
  }
}

export const api = ApiService
