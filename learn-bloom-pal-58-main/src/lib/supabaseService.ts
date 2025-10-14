import { supabase } from './supabase';
import { createClient } from '@supabase/supabase-js';
import { Course, Student, AssignmentSubmission } from './types';

// 管理员专用客户端（使用服务密钥）
const adminSupabase = createClient(
  import.meta.env.VITE_SUPABASE_URL!,
  import.meta.env.VITE_SUPABASE_SERVICE_ROLE_KEY || import.meta.env.VITE_SUPABASE_ANON_KEY!
);

// 课程相关服务
export class CourseService {
  // 获取所有课程
  static async getCourses(): Promise<Course[]> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .order('created_at', { ascending: false });
      
      if (error) throw error;
      
      return data?.map(course => ({
        id: course.id,
        title: course.title,
        description: course.description || '',
        cover: course.cover_url || '',
        videoUrl: course.video_url || '',
        duration: course.duration || '',
        instructor: course.instructor || '',
        createdAt: course.created_at,
        updatedAt: course.updated_at,
        materials: [], // 暂时为空，后续可扩展
        assignments: [], // 暂时为空，后续可扩展
        studentCount: 0, // 需要通过关联查询获取
        completionRate: 0 // 需要通过关联查询获取
      })) || [];
    } catch (error) {
      console.error('获取课程失败:', error);
      return [];
    }
  }

  // 获取单个课程
  static async getCourse(id: string): Promise<Course | null> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .select('*')
        .eq('id', id)
        .single();
      
      if (error) throw error;
      
      if (!data) return null;
      
      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        cover: data.cover_url || '',
        videoUrl: data.video_url || '',
        duration: data.duration || '',
        instructor: data.instructor || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        materials: [], // 暂时为空，后续可扩展
        assignments: [], // 暂时为空，后续可扩展
        studentCount: 0, // 需要通过关联查询获取
        completionRate: 0 // 需要通过关联查询获取
      };
    } catch (error) {
      console.error('获取课程失败:', error);
      return null;
    }
  }

  // 创建课程
  static async createCourse(course: Omit<Course, 'id' | 'createdAt' | 'updatedAt' | 'studentCount' | 'completionRate'>): Promise<Course | null> {
    try {
      const { data, error } = await supabase
        .from('courses')
        .insert({
          title: course.title,
          description: course.description,
          cover_url: course.cover,
          video_url: course.videoUrl,
          duration: course.duration,
          instructor: course.instructor
        })
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        cover: data.cover_url || '',
        videoUrl: data.video_url || '',
        duration: data.duration || '',
        instructor: data.instructor || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        materials: course.materials || [],
        assignments: course.assignments || [],
        studentCount: 0,
        completionRate: 0
      };
    } catch (error) {
      console.error('创建课程失败:', error);
      return null;
    }
  }

  // 更新课程
  static async updateCourse(id: string, updates: Partial<Course>): Promise<Course | null> {
    try {
      const updateData: any = {};
      if (updates.title) updateData.title = updates.title;
      if (updates.description) updateData.description = updates.description;
      if (updates.cover) updateData.cover_url = updates.cover;
      if (updates.videoUrl) updateData.video_url = updates.videoUrl;
      if (updates.duration) updateData.duration = updates.duration;
      if (updates.instructor) updateData.instructor = updates.instructor;
      updateData.updated_at = new Date().toISOString();

      const { data, error } = await supabase
        .from('courses')
        .update(updateData)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      
      return {
        id: data.id,
        title: data.title,
        description: data.description || '',
        cover: data.cover_url || '',
        videoUrl: data.video_url || '',
        duration: data.duration || '',
        instructor: data.instructor || '',
        createdAt: data.created_at,
        updatedAt: data.updated_at,
        materials: updates.materials || [],
        assignments: updates.assignments || [],
        studentCount: updates.studentCount || 0,
        completionRate: updates.completionRate || 0
      };
    } catch (error) {
      console.error('更新课程失败:', error);
      return null;
    }
  }

  // 删除课程
  static async deleteCourse(id: string): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('courses')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('删除课程失败:', error);
      return false;
    }
  }
}

// 用户相关服务
export class UserService {
  // 获取当前用户信息
  static async getCurrentUser() {
    try {
      console.log('UserService.getCurrentUser: 开始获取用户信息');
      const { data: { user }, error } = await supabase.auth.getUser();
      if (error) {
        console.error('获取认证用户失败:', error);
        return null;
      }
      
      if (!user) {
        console.log('用户未登录');
        return null;
      }
      
      console.log('UserService.getCurrentUser: 认证用户信息', { id: user.id, email: user.email });
      
      // 优先使用localStorage缓存的角色，避免数据库查询超时
      let resolvedRole: 'student' | 'admin' = 'student';
      const cachedRole = localStorage.getItem('user_role') as 'student' | 'admin' | null;
      
      if (cachedRole) {
        console.log('UserService.getCurrentUser: 使用缓存角色:', cachedRole);
        resolvedRole = cachedRole;
      } else {
        console.log('UserService.getCurrentUser: 查询 authorized_users 表...');
        try {
          // 设置查询超时，避免无限等待
          const timeoutPromise = new Promise((_, reject) => {
            setTimeout(() => reject(new Error('查询超时')), 2000);
          });
          
          const queryPromise = supabase
            .from('authorized_users')
            .select('role')
            .eq('email', user.email)
            .single();
          
          const { data: authRow, error: authError } = await Promise.race([queryPromise, timeoutPromise]) as any;
          
          if (authError) {
            console.warn('查询授权角色出错:', authError);
          } else {
            console.log('UserService.getCurrentUser: 授权角色查询结果:', authRow);
            if (authRow?.role === 'admin') {
              resolvedRole = 'admin';
            }
          }
        } catch (authLookupErr) {
          console.warn('查询授权角色异常或超时:', authLookupErr);
          // 超时或出错时，保持默认的student角色
        }
      }
      console.log('UserService.getCurrentUser: 解析后的角色:', resolvedRole);
      
      // 获取用户详细信息，添加超时处理
      console.log('UserService.getCurrentUser: 查询 profiles 表...');
      let profile = null;
      let profileError = null;
      
      try {
        // 设置查询超时，避免无限等待
        const timeoutPromise = new Promise((_, reject) => {
          setTimeout(() => reject(new Error('profiles查询超时')), 2000);
        });
        
        const queryPromise = supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single();
        
        const result = await Promise.race([queryPromise, timeoutPromise]) as any;
        profile = result.data;
        profileError = result.error;
      } catch (timeoutErr) {
        console.warn('profiles表查询超时:', timeoutErr);
        profileError = { message: 'Query timeout', code: 'TIMEOUT' };
      }
      
      if (profileError) {
        console.warn('获取用户资料失败，使用基本信息:', profileError);
        console.log('UserService.getCurrentUser: profileError详情:', JSON.stringify(profileError, null, 2));
        // 如果profiles表中没有记录，返回基本用户信息
        const basicProfile = {
          id: user.id,
          email: user.email || '',
          full_name: user.user_metadata?.full_name || user.email?.split('@')[0] || '',
          avatar_url: user.user_metadata?.avatar_url || null,
          role: resolvedRole,
          created_at: user.created_at,
          updated_at: user.updated_at || user.created_at
        };
        
        // 跳过profiles表的写入操作，避免权限问题导致超时
        console.log('UserService.getCurrentUser: 跳过profiles表写入，避免权限问题');
        // 注意：profiles表的写入应该由管理员或后端服务处理
        
      // 无论是否写入profiles表成功，都返回带有解析后角色的basicProfile
      console.log('UserService.getCurrentUser: 返回基本资料', basicProfile);
      return basicProfile;
    }
    
    // 如果存在profile，补充分辨得到的角色字段，供前端权限判断使用
    const finalProfile = { ...profile, role: (profile as any).role ?? resolvedRole };
    console.log('UserService.getCurrentUser: 返回完整资料', finalProfile);
    return finalProfile;
    } catch (error) {
      console.error('获取当前用户失败:', error);
      return null;
    }
  }

  // 检查用户是否在白名单中
  static async isUserAuthorized(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('authorized_users')
        .select('id')
        .eq('email', email)
        .eq('status', 'active')
        .single();
      
      if (error && error.code !== 'PGRST116') { // PGRST116 是没有找到记录的错误
        throw error;
      }
      
      return !!data;
    } catch (error) {
      console.error('检查用户授权失败:', error);
      return false;
    }
  }

  // 添加授权用户
  static async addAuthorizedUser(
    email: string, 
    name?: string, 
    role: 'student' | 'admin' = 'student',
    department?: string,
    notes?: string
  ): Promise<boolean> {
    try {
      const { error } = await adminSupabase
        .from('authorized_users')
        .insert({
          email,
          name: name || null,
          role,
          department: department || null,
          notes: notes || null,
          status: 'active'
        });
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('添加授权用户失败:', error);
      return false;
    }
  }

  // 获取所有授权用户
  static async getAuthorizedUsers() {
    try {
      const { data, error } = await adminSupabase
        .from('authorized_users')
        .select('*')
        .order('added_at', { ascending: false });
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取授权用户失败:', error);
      return [];
    }
  }

  // 删除授权用户
  static async removeAuthorizedUser(id: number): Promise<boolean> {
    try {
      const { error } = await adminSupabase
        .from('authorized_users')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('删除授权用户失败:', error);
      return false;
    }
  }

  // 获取用户详细信息（包含登录状态）
  static async getUsersWithLoginStatus() {
    try {
      // 获取授权用户列表
      const { data: authorizedUsers, error: authError } = await adminSupabase
        .from('authorized_users')
        .select('*')
        .order('added_at', { ascending: false });
      
      if (authError) throw authError;
      
      // 获取所有已注册用户的信息
      const { data: { users }, error: usersError } = await adminSupabase.auth.admin.listUsers();
      
      if (usersError) {
        console.warn('无法获取用户登录信息，可能需要service_role权限:', usersError);
        // 如果无法获取登录信息，返回基本的授权用户信息
        return (authorizedUsers || []).map(user => ({
          ...user,
          hasAccount: false,
          lastSignIn: null,
          isActive: user.status === 'active'
        }));
      }
      
      // 合并授权用户和登录信息
      const usersWithStatus = (authorizedUsers || []).map(authUser => {
        const registeredUser = users?.find(u => u.email === authUser.email);
        
        return {
          ...authUser,
          hasAccount: !!registeredUser,
          lastSignIn: registeredUser?.last_sign_in_at || null,
          isActive: authUser.status === 'active' && !!registeredUser,
          userId: registeredUser?.id || null,
          emailConfirmed: registeredUser?.email_confirmed_at ? true : false
        };
      });
      
      return usersWithStatus;
    } catch (error) {
      console.error('获取用户状态失败:', error);
      return [];
    }
  }

  // 更新用户状态
  static async updateUserStatus(id: number, status: 'active' | 'inactive'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('authorized_users')
        .update({ status })
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('更新用户状态失败:', error);
      return false;
    }
  }

  // 批量更新用户状态
  static async batchUpdateUserStatus(ids: number[], status: 'active' | 'inactive'): Promise<boolean> {
    try {
      const { error } = await supabase
        .from('authorized_users')
        .update({ status })
        .in('id', ids);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('批量更新用户状态失败:', error);
      return false;
    }
  }
}

// 认证相关服务
export class AuthService {
  // 登录
  static async signIn(email: string, password: string) {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('登录失败:', error);
      throw error;
    }
  }

  // 注册
  static async signUp(email: string, password: string, fullName?: string) {
    try {
      // 首先检查用户是否在白名单中
      const isAuthorized = await UserService.isUserAuthorized(email);
      if (!isAuthorized) {
        throw new Error('该邮箱未被授权访问系统');
      }

      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName || ''
          }
        }
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('注册失败:', error);
      throw error;
    }
  }

  // 登出
  static async signOut() {
    try {
      const { error } = await supabase.auth.signOut();
      if (error) throw error;
    } catch (error) {
      console.error('登出失败:', error);
      throw error;
    }
  }

  // 更新密码
  static async updatePassword(newPassword: string) {
    try {
      const { data, error } = await supabase.auth.updateUser({
        password: newPassword
      });
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('密码更新失败:', error);
      throw error;
    }
  }

  // 监听认证状态变化
  static onAuthStateChange(callback: (event: string, session: any) => void) {
    return supabase.auth.onAuthStateChange(callback);
  }
}

// 存储相关服务
export class StorageService {
  // 上传文件
  static async uploadFile(bucket: string, path: string, file: File): Promise<string | null> {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .upload(path, file, {
          cacheControl: '3600',
          upsert: false
        });
      
      if (error) throw error;
      
      // 获取公共URL
      const { data: { publicUrl } } = supabase.storage
        .from(bucket)
        .getPublicUrl(data.path);
      
      return publicUrl;
    } catch (error) {
      console.error('文件上传失败:', error);
      return null;
    }
  }

  // 删除文件
  static async deleteFile(bucket: string, path: string): Promise<boolean> {
    try {
      const { error } = await supabase.storage
        .from(bucket)
        .remove([path]);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('文件删除失败:', error);
      return false;
    }
  }

  // 获取文件列表
  static async listFiles(bucket: string, path?: string) {
    try {
      const { data, error } = await supabase.storage
        .from(bucket)
        .list(path);
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取文件列表失败:', error);
      return [];
    }
  }
}

// 作业相关服务
export class AssignmentService {
  // 获取所有作业
  static async getAssignments(sessionId?: string): Promise<any[]> {
    try {
      let courseIds: string[] | null = null;
      if (sessionId) {
        const { data: sessionCourses, error: scErr } = await adminSupabase
          .from('session_courses')
          .select('course_id')
          .eq('session_id', sessionId);
        if (scErr) throw scErr;
        courseIds = (sessionCourses || []).map((r: any) => r.course_id);
        if (courseIds.length === 0) return [];
      }

      let query = adminSupabase
        .from('assignments')
        .select(`
          *,
          courses(title),
          submissions:submissions(id)
        `)
        .order('created_at', { ascending: false });

      if (courseIds && courseIds.length > 0) {
        query = query.in('course_id', courseIds as any);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      // 计算每个作业的提交数
      const assignments = data || [];
      const submissionCounts: Record<string, number> = {};
      assignments.forEach((a: any) => {
        submissionCounts[a.id] = Array.isArray(a.submissions) ? a.submissions.length : 0;
      });

      return assignments.map((a: any) => ({
        ...a,
        course: a.courses, // 将 courses 字段重命名为 course
        submissions_count: submissionCounts[a.id] || 0
      }));
    } catch (error) {
      console.error('获取作业失败:', error);
      return [];
    }
  }

  // 获取作业统计信息
  static async getAssignmentStats(sessionId?: string): Promise<{
    totalAssignments: number;
    totalSubmissions: number;
    completedSubmissions: number; // 仍保留，供历史兼容
    completionRate: number; // 简易口径
    pendingAudit: number; // 最新作业的待审核（submitted）数量
  }> {
    try {
      // 可选期次过滤：先定位该期次的课程
      let courseIds: string[] | null = null;
      if (sessionId) {
        const { data: sessionCourses, error: scErr } = await adminSupabase
          .from('session_courses')
          .select('course_id')
          .eq('session_id', sessionId);
        if (scErr) throw scErr;
        courseIds = (sessionCourses || []).map((r: any) => r.course_id);
        if (courseIds.length === 0) {
          return { totalAssignments: 0, totalSubmissions: 0, completedSubmissions: 0, completionRate: 0, pendingAudit: 0 };
        }
      }

      // 获取作业列表（按期次课程过滤）
      let aQuery = supabase.from('assignments').select('*', { count: 'exact' }).order('created_at', { ascending: false });
      if (courseIds) {
        aQuery = aQuery.in('course_id', courseIds as any);
      }
      const { data: assignmentsList, count: totalAssignments } = await aQuery;

      // 获取提交总数
      // 提交总数（限定在本期次的作业上）
      let sTotalQuery = supabase.from('submissions').select('*', { count: 'exact', head: true });
      if (assignmentsList && assignmentsList.length > 0) {
        const aIds = assignmentsList.map((a: any) => a.id);
        sTotalQuery = sTotalQuery.in('assignment_id', aIds as any);
      }
      const { count: totalSubmissions } = await sTotalQuery;

      // 已完成提交数（历史兼容）
      let sCompletedQuery = supabase
        .from('submissions')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'completed');
      if (assignmentsList && assignmentsList.length > 0) {
        const aIds = assignmentsList.map((a: any) => a.id);
        sCompletedQuery = sCompletedQuery.in('assignment_id', aIds as any);
      }
      const { count: completedSubmissions } = await sCompletedQuery;

      // 最新作业的“待审核”（submitted）数量
      let pendingAudit = 0;
      if (assignmentsList && assignmentsList.length > 0) {
        const latest = assignmentsList[0];
        const { count } = await supabase
          .from('submissions')
          .select('*', { count: 'exact', head: true })
          .eq('assignment_id', latest.id)
          .eq('status', 'submitted');
        pendingAudit = count || 0;
      }

      // 简易提交率口径：submitted/所有提交（如果要覆盖人数口径，后续接入期次学员数）
      const completionRate = totalSubmissions && totalSubmissions > 0 
        ? Math.round(((completedSubmissions || 0) / (totalSubmissions || 1)) * 1000) / 10
        : 0;

      return {
        totalAssignments: totalAssignments || 0,
        totalSubmissions: totalSubmissions || 0,
        completedSubmissions: completedSubmissions || 0,
        completionRate,
        pendingAudit
      };
    } catch (error) {
      console.error('获取作业统计失败:', error);
      return {
        totalAssignments: 0,
        totalSubmissions: 0,
        completedSubmissions: 0,
        completionRate: 0,
        pendingAudit: 0
      };
    }
  }

  // 创建作业
  static async createAssignment(assignment: {
    title: string;
    description: string;
    course_id: string;
    due_date: string;
    max_score?: number;
  }): Promise<any | null> {
    try {
      const { data, error } = await adminSupabase
        .from('assignments')
        .insert(assignment)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('创建作业失败:', error);
      return null;
    }
  }

  // 更新作业
  static async updateAssignment(id: string, updates: any): Promise<any | null> {
    try {
      const { data, error } = await adminSupabase
        .from('assignments')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('更新作业失败:', error);
      return null;
    }
  }

  // 删除作业
  static async deleteAssignment(id: string): Promise<boolean> {
    try {
      const { error } = await adminSupabase
        .from('assignments')
        .delete()
        .eq('id', id);
      
      if (error) throw error;
      return true;
    } catch (error) {
      console.error('删除作业失败:', error);
      return false;
    }
  }

  // 获取作业提交列表
  static async getSubmissions(assignmentId?: string): Promise<any[]> {
    try {
      let query = adminSupabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (assignmentId) {
        query = query.eq('assignment_id', assignmentId);
      }

      const { data, error } = await query;
      
      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('获取作业提交失败:', error);
      return [];
    }
  }

  // 创建作业提交
  static async createSubmission(submission: {
    assignment_id: string;
    student_id: string;
    content: string;
    file_url?: string;
  }): Promise<any | null> {
    try {
      // 先检查是否已有提交记录
      const { data: existing } = await supabase
        .from('submissions')
        .select('*')
        .eq('assignment_id', submission.assignment_id)
        .eq('student_id', submission.student_id)
        .single();

      if (existing) {
        // 如果已存在，更新提交内容
        const { data, error } = await supabase
          .from('submissions')
          .update({
            content: submission.content,
            file_url: submission.file_url,
            status: 'submitted',
            submitted_at: new Date().toISOString()
          })
          .eq('id', existing.id)
          .select()
          .single();
        
        if (error) throw error;
        return data;
      } else {
        // 创建新提交
        const { data, error } = await supabase
          .from('submissions')
          .insert({
            ...submission,
            status: 'submitted',
            submitted_at: new Date().toISOString()
          })
          .select()
          .single();
        
        if (error) throw error;
        return data;
      }
    } catch (error) {
      console.error('创建提交失败:', error);
      return null;
    }
  }

  // 获取学生的作业提交
  static async getStudentSubmission(assignmentId: string, studentId: string): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .select(`
          *,
          assignments(title, due_date, max_score)
        `)
        .eq('assignment_id', assignmentId)
        .eq('student_id', studentId)
        .single();
      
      if (error && error.code !== 'PGRST116') throw error;
      return data;
    } catch (error) {
      console.error('获取学生提交失败:', error);
      return null;
    }
  }

  // 更新提交状态和分数
  static async updateSubmission(id: string, updates: {
    status?: string;
    score?: number;
    feedback?: string;
  }): Promise<any | null> {
    try {
      const { data, error } = await supabase
        .from('submissions')
        .update(updates)
        .eq('id', id)
        .select()
        .single();
      
      if (error) throw error;
      return data;
    } catch (error) {
      console.error('更新提交失败:', error);
      return null;
    }
  }
}

// 实时订阅服务
export class RealtimeService {
  // 订阅课程变化
  static subscribeToCourses(callback: (payload: any) => void) {
    return supabase
      .channel('courses')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'courses'
      }, callback)
      .subscribe();
  }

  // 订阅用户变化
  static subscribeToProfiles(callback: (payload: any) => void) {
    return supabase
      .channel('profiles')
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'profiles'
      }, callback)
      .subscribe();
  }

  // 取消订阅
  static unsubscribe(subscription: any) {
    return supabase.removeChannel(subscription);
  }
}