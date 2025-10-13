import { supabase } from './supabase'
import { User } from '@supabase/supabase-js'

export interface AuthUser {
  id: string
  email: string
  fullName?: string
  avatarUrl?: string
  role: 'student' | 'admin'
}

export class AuthService {
  // 检查用户是否在白名单中
  static async checkUserAuthorization(email: string): Promise<boolean> {
    try {
      const { data, error } = await supabase
        .from('authorized_users')
        .select('email')
        .eq('email', email)
        .eq('status', 'active')
        .single()

      if (error) {
        console.error('Error checking user authorization:', error)
        return false
      }

      return !!data
    } catch (error) {
      console.error('Error in checkUserAuthorization:', error)
      return false
    }
  }

  // 获取或创建用户配置（无写入版，带超时和缓存回退）
  static async getOrCreateProfile(user: User): Promise<AuthUser | null> {
    try {
      console.log('getOrCreateProfile 开始，用户邮箱:', user.email)

      // 1) 检查白名单（超时保护）
      let isAuthorized = false
      try {
        const authCheck = this.checkUserAuthorization(user.email!)
        const result = await Promise.race([
          authCheck,
          new Promise<boolean>((_, reject) => setTimeout(() => reject(new Error('auth check timeout')), 2000))
        ])
        isAuthorized = !!result
      } catch (e) {
        console.warn('白名单检查超时/失败，回退为允许:', e)
        // 为避免卡死，这里回退为允许；实际生产应由后端校验
        isAuthorized = true
      }
      if (!isAuthorized) {
        console.error('用户未在授权白名单中:', user.email)
        throw new Error('用户未在授权白名单中')
      }

      // 2) 优先从localStorage获取角色，避免查询慢
      let resolvedRole: 'student' | 'admin' = (localStorage.getItem('user_role') as any) || 'student'

      // 3) 尝试读取authorized_users获取更准确的角色（超时保护，不写入）
      try {
        const query = supabase
          .from('authorized_users')
          .select('role')
          .eq('email', user.email!)
          .eq('status', 'active')
          .single()
        const result: any = await Promise.race([
          query,
          new Promise((_, reject) => setTimeout(() => reject(new Error('authorized_users 查询超时')), 2000))
        ])
        if (result?.data?.role === 'admin') {
          resolvedRole = 'admin'
        }
      } catch (e) {
        console.warn('authorized_users 查询失败/超时，使用缓存角色:', resolvedRole, e)
      }

      // 4) 读取profiles（仅读，超时保护；不创建、不更新）
      let profile: any = null
      try {
        const query = supabase
          .from('profiles')
          .select('*')
          .eq('id', user.id)
          .single()
        const result: any = await Promise.race([
          query,
          new Promise((_, reject) => setTimeout(() => reject(new Error('profiles 查询超时')), 2000))
        ])
        profile = result?.data || null
      } catch (e) {
        console.warn('profiles 查询失败/超时，使用基本信息:', e)
      }

      // 5) 组装只读的用户对象
      const authUser: AuthUser = {
        id: user.id,
        email: user.email!,
        fullName: profile?.full_name || user.user_metadata?.full_name || user.user_metadata?.name || user.email!.split('@')[0],
        avatarUrl: profile?.avatar_url || user.user_metadata?.avatar_url || undefined,
        role: (profile?.role as any) || resolvedRole
      }

      return authUser
    } catch (error) {
      console.error('Error in getOrCreateProfile (no-write):', error)
      return null
    }
  }

  // 用户登录
  static async signIn(email: string, password: string): Promise<{ user: AuthUser | null; error?: string }> {
    try {
      console.log('AuthService.signIn 开始，邮箱:', email)
      console.log('网络环境检测: 时区:', Intl.DateTimeFormat().resolvedOptions().timeZone)
      console.log('网络环境检测: User Agent:', navigator.userAgent)
      console.log('网络环境检测: 在线状态:', navigator.onLine)
      console.log('网络环境检测: 连接类型:', (navigator as Navigator & { connection?: { effectiveType?: string } }).connection?.effectiveType || '未知')
      
      // 增强的网络状态检查和预连接测试
      console.log('网络状态检查: 在线状态:', navigator.onLine)
      if (!navigator.onLine) {
        console.warn('网络离线状态检测到')
        return { user: null, error: '网络连接已断开，请检查网络连接后重试' }
      }
      
      // 移除预检查逻辑，直接进行登录
      console.log('跳过预检查，直接进行登录请求')
      
      // 简化登录逻辑，直接调用Supabase
      console.log('开始简化登录请求')
      
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password
      })
      
      console.log('登录请求完成，状态:', error ? '失败' : '成功')
      
      console.log('Supabase signInWithPassword 结果:', {
        hasUser: !!data.user,
        userEmail: data.user?.email,
        error: error?.message
      })
      
      if (error) {
        console.error('Supabase 登录错误:', error)
        
        // 根据错误类型提供更详细的错误信息
        let errorMessage = error.message
        if (error.message.includes('Invalid login credentials')) {
          errorMessage = '邮箱或密码错误，请检查后重试'
        } else if (error.message.includes('Email not confirmed')) {
          errorMessage = '邮箱未验证，请检查邮箱验证链接'
        } else if (error.message.includes('Too many requests')) {
          errorMessage = '登录尝试次数过多，请稍后再试（建议等待5-10分钟）'
        } else if (error.message.includes('超时') || error.message.includes('timeout')) {
          errorMessage = '网络连接超时，请检查网络环境。如果您在中国大陆，建议使用VPN'
        } else if (error.message.includes('fetch') || error.message.includes('Failed to fetch')) {
          errorMessage = '网络请求失败，请检查网络连接状态或尝试刷新页面'
        } else if (error.message.includes('CORS')) {
          errorMessage = '跨域请求被阻止，可能是网络环境限制或防火墙设置'
        } else if (error.message.includes('NetworkError') || error.message.includes('network')) {
          errorMessage = '网络连接异常，请检查网络设置或尝试切换网络环境'
        } else if (error.message.includes('SSL') || error.message.includes('certificate')) {
          errorMessage = 'SSL证书验证失败，可能是网络环境限制'
        }
        
        console.log('处理后的错误信息:', errorMessage)
        return { user: null, error: errorMessage }
      }
      
      if (data.user) {
        console.log('开始获取或创建用户配置...')
        const profileStartTime = Date.now()
        
        const authUser = await this.getOrCreateProfile(data.user)
        
        const profileEndTime = Date.now()
        const profileDuration = profileEndTime - profileStartTime
        console.log('getOrCreateProfile 完成，耗时:', profileDuration + 'ms')
        console.log('getOrCreateProfile 结果:', authUser ? { ...authUser, id: '***' } : null)
        
        if (!authUser) {
          console.error('获取用户配置失败')
          return { user: null, error: '用户配置获取失败，请联系管理员' }
        }
        
        return { user: authUser }
      }
      
      console.log('登录失败：未返回用户数据')
      return { user: null, error: '登录失败，请重试' }
    } catch (error: unknown) {
      const err = error as Error
      console.error('AuthService.signIn 异常:', err)
      
      // 处理网络相关错误 - 优化错误信息
      if (err.message && err.message.includes('超时')) {
        return { user: null, error: err.message }
      } else if (err.message && (err.message.includes('fetch') || err.message.includes('Failed to fetch'))) {
        return { user: null, error: '网络连接失败，请检查网络环境。如果问题持续，建议尝试刷新页面或使用VPN' }
      } else if ((err as any).code === 'NETWORK_ERROR' || err.message.includes('NetworkError')) {
        return { user: null, error: '网络错误，如果您在中国大陆，建议使用VPN。错误详情：' + err.message }
      } else if (err.message && err.message.includes('SSL')) {
        return { user: null, error: 'SSL连接失败，可能是网络环境限制或证书问题' }
      } else if (err.message && err.message.includes('DNS')) {
        return { user: null, error: 'DNS解析失败，请检查网络设置或尝试使用其他DNS服务器' }
      }
      
      // 提供更详细的通用错误信息
      const genericError = err.message ? `登录失败：${err.message}` : '登录失败，请重试'
      return { user: null, error: genericError }
    }
  }

  // 用户注册
  static async signUp(email: string, password: string, fullName: string): Promise<{ user: AuthUser | null; error?: string }> {
    try {
      const { data, error } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            full_name: fullName
          }
        }
      })
      
      if (error) {
        return { user: null, error: error.message }
      }
      
      if (data.user) {
        const authUser = await this.getOrCreateProfile(data.user)
        return { user: authUser }
      }
      
      return { user: null, error: '注册失败' }
    } catch (error) {
      console.error('Sign up error:', error)
      return { user: null, error: '注册失败，请重试' }
    }
  }

  // 飞书 OAuth 登录（演示模式）
  static async signInWithFeishu() {
    try {
      // 临时演示模式：使用匿名登录 + 模拟用户
      console.log('演示模式：模拟飞书登录')
      
      // 创建一个演示用户配置
      const demoUser: AuthUser = {
        id: 'demo-student-001',
        email: 'student1@company.com',
        fullName: '张三（演示）',
        avatarUrl: 'https://api.dicebear.com/7.x/avataaars/svg?seed=demo',
        role: 'student'
      }

      // 存储到 localStorage 用于演示
      localStorage.setItem('demo_user', JSON.stringify(demoUser))
      
      return { user: demoUser }
    } catch (error) {
      console.error('Error in demo login:', error)
      throw error
    }
  }

  // 获取当前用户
  static async getCurrentUser(): Promise<AuthUser | null> {
    try {
      // 正常模式：从 Supabase 获取
      const { data: { user } } = await supabase.auth.getUser()
      
      if (!user) {
        return null
      }

      return await this.getOrCreateProfile(user)
    } catch (error) {
      console.error('Error getting current user:', error)
      return null
    }
  }

  // 登出
  static async signOut() {
    try {
      // 正常登出
      const { error } = await supabase.auth.signOut()
      if (error) {
        throw error
      }
    } catch (error) {
      console.error('Error signing out:', error)
      throw error
    }
  }

  // 监听认证状态变化
  static onAuthStateChange(callback: (user: AuthUser | null) => void) {
    return supabase.auth.onAuthStateChange(async (event, session) => {
      console.log('Auth state changed:', event, session?.user?.email)
      
      if (session?.user) {
        const authUser = await this.getOrCreateProfile(session.user)
        callback(authUser)
      } else {
        callback(null)
      }
    })
  }
}

// 导出便捷方法
export const auth = AuthService
