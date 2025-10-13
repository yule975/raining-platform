import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session } from '@supabase/supabase-js';
import { supabase } from '../lib/supabase';
import { UserService } from '../lib/supabaseService';
import { auth } from '../lib/auth';

interface AuthContextType {
  user: User | null;
  profile: any | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<any>;
  signUp: (email: string, password: string, fullName?: string) => Promise<any>;
  signOut: () => Promise<void>;
  isAuthorized: (email: string) => Promise<boolean>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: React.ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<any | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // 初始化认证状态
    const initializeAuth = async () => {
      try {
        // 首先检查演示用户
        const demoUser = localStorage.getItem('demo_user');
        if (demoUser) {
          const parsedDemoUser = JSON.parse(demoUser);
          console.log('发现演示用户:', parsedDemoUser);
          
          // 创建模拟的User对象
          const mockUser = {
            id: parsedDemoUser.id,
            email: parsedDemoUser.email,
            user_metadata: {
              full_name: parsedDemoUser.fullName,
              avatar_url: parsedDemoUser.avatarUrl,
              role: parsedDemoUser.role
            }
          } as User;
          
          setUser(mockUser);
          setProfile(parsedDemoUser);
          setSession({ user: mockUser } as Session);
          setLoading(false);
          return;
        }
        
        // 获取当前session
        const { data: { session }, error } = await supabase.auth.getSession();
        
        if (error) {
          console.error('获取session失败:', error);
          setSession(null);
          setUser(null);
          setProfile(null);
        } else {
          console.log('初始session:', session);
          setSession(session);
          setUser(session?.user ?? null);
          
          if (session?.user) {
            try {
              // 获取用户详细信息
              const userProfile = await UserService.getCurrentUser();
              setProfile(userProfile);
            } catch (profileError) {
              console.error('获取用户资料失败:', profileError);
              setProfile(null);
            }
          } else {
            setProfile(null);
          }
        }
      } catch (error) {
        console.error('初始化认证失败:', error);
        setSession(null);
        setUser(null);
        setProfile(null);
      } finally {
        setLoading(false);
      }
    };

    // 监听认证状态变化
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log('Auth state changed:', event, session);
        
        // 处理token过期或认证错误
        if (event === 'TOKEN_REFRESHED' && !session) {
          console.log('Token刷新失败，清除认证状态');
          setSession(null);
          setUser(null);
          setProfile(null);
          // 清除可能的无效token
          localStorage.removeItem('supabase.auth.token');
          return;
        }
        
        if (event === 'SIGNED_OUT' || !session) {
          console.log('用户已登出或session无效');
          setSession(null);
          setUser(null);
          setProfile(null);
          return;
        }
        
        setSession(session);
        setUser(session?.user ?? null);
        
        if (session?.user) {
          const cachedRole = localStorage.getItem('user_role') as 'student' | 'admin' | null;
          const forceStudent = localStorage.getItem('force_student_role') === 'true';
          const emergencyFix = localStorage.getItem('emergency_fix');
          const forceProfile = localStorage.getItem('force_profile');
          
          // 紧急修复模式：直接使用缓存数据，跳过复杂查询
          if (emergencyFix || forceProfile) {
            console.log('AuthContext: 使用紧急修复模式');
            const emergencyProfile = {
              id: session.user.id,
              email: session.user.email!,
              full_name: session.user.email!.split('@')[0],
              role: (cachedRole || 'student') as 'student' | 'admin'
            };
            setProfile(emergencyProfile);
            console.log('AuthContext: 紧急Profile设置完成', emergencyProfile);
            setLoading(false);
            return;
          }
          
          // 立刻设置临时profile，优先使用localStorage中的完整user_profile；
          // 在管理员路由下展示为admin，其余按缓存/入口判定
          const cachedProfile = localStorage.getItem('user_profile');
          if (cachedProfile) {
            try {
              const parsed = JSON.parse(cachedProfile);
              // 如设置了强制学员标记，覆盖为student
              const adjusted = forceStudent ? { ...parsed, role: 'student' } : parsed;
              setProfile(prev => prev ?? adjusted);
            } catch {
              // 回退到仅角色
              if (cachedRole) {
                setProfile(prev => prev ?? { 
                  id: session.user.id, 
                  email: session.user.email!, 
                  full_name: session.user.email!.split('@')[0],
                  role: forceStudent ? 'student' : cachedRole 
                });
              }
            }
          } else if (cachedRole) {
            setProfile(prev => prev ?? { 
              id: session.user.id, 
              email: session.user.email!, 
              full_name: session.user.email!.split('@')[0],
              role: forceStudent ? 'student' : cachedRole 
            });
          }
          
          // 设置超时处理，避免无限loading
          const timeout = setTimeout(() => {
            console.warn('AuthContext: 用户资料获取超时，强制结束loading');
            if (cachedRole) {
              setProfile({
                id: session.user.id,
                email: session.user.email!,
                full_name: session.user.email!.split('@')[0],
                role: forceStudent ? 'student' : cachedRole
              });
            }
            setLoading(false);
          }, 3000); // 3秒超时
          
          try {
            console.log('AuthContext: 开始调用 UserService.getCurrentUser()');
            // 增加超时与一次重试，避免长时间阻塞
            const withTimeout = (p: Promise<any>, ms = 1500) => new Promise((resolve, reject) => {
              const t = setTimeout(() => reject(new Error('Profile fetch timeout')), ms);
              p.then(v => { clearTimeout(t); resolve(v); }).catch(e => { clearTimeout(t); reject(e); });
            });
            let userProfile = null;
            try {
              userProfile = await withTimeout(UserService.getCurrentUser());
            } catch (e) {
              console.warn('UserService.getCurrentUser 超时/失败，进行一次重试');
              try { userProfile = await withTimeout(UserService.getCurrentUser(), 1500); } catch {}
            }
            clearTimeout(timeout); // 成功获取，清除超时
            console.log('AuthContext: 获取到用户资料:', userProfile);
            
            if (userProfile) {
              setProfile(userProfile);
              console.log('AuthContext: Profile设置成功');
            } else {
              console.warn('UserService.getCurrentUser() 返回了 null');
              if (cachedRole) {
                console.log('AuthContext: 保持临时profile，角色:', cachedRole);
                setProfile({
                  id: session.user.id,
                  email: session.user.email!,
                  full_name: session.user.email!.split('@')[0],
                  role: cachedRole
                });
              } else {
                setProfile(null);
              }
            }
            // 确保在所有情况下都结束loading
            setLoading(false);
          } catch (profileError) {
            clearTimeout(timeout); // 出错，清除超时
            console.error('获取用户资料失败:', profileError);
            console.error('AuthContext: profileError详情:', JSON.stringify(profileError, null, 2));
            
            if (cachedRole) {
              console.log('AuthContext: 使用临时profile，角色:', cachedRole);
              setProfile({
                id: session.user.id,
                email: session.user.email!,
                full_name: session.user.email!.split('@')[0],
                role: cachedRole
              });
            } else {
              setProfile(null);
            }
            // 确保在错误情况下也结束loading
            setLoading(false);
          }
        } else {
          setProfile(null);
        }
      }
    );

    initializeAuth();

    // 监听localStorage变化（用于演示登录）
    const handleStorageChange = (e: StorageEvent) => {
      if (e.key === 'demo_user') {
        if (e.newValue) {
          // 演示用户登录
          const parsedDemoUser = JSON.parse(e.newValue);
          console.log('检测到演示用户登录:', parsedDemoUser);
          
          const mockUser = {
            id: parsedDemoUser.id,
            email: parsedDemoUser.email,
            user_metadata: {
              full_name: parsedDemoUser.fullName,
              avatar_url: parsedDemoUser.avatarUrl,
              role: parsedDemoUser.role
            }
          } as User;
          
          setUser(mockUser);
          setProfile(parsedDemoUser);
          setSession({ user: mockUser } as Session);
        } else {
          // 演示用户登出
          console.log('检测到演示用户登出');
          setUser(null);
          setProfile(null);
          setSession(null);
        }
      }
    };

    // 添加自定义事件监听器（用于同一页面内的localStorage变化）
    const handleCustomStorageChange = (e: CustomEvent) => {
      if (e.detail.key === 'demo_user') {
        if (e.detail.newValue) {
          const parsedDemoUser = JSON.parse(e.detail.newValue);
          console.log('检测到演示用户登录（自定义事件）:', parsedDemoUser);
          
          const mockUser = {
            id: parsedDemoUser.id,
            email: parsedDemoUser.email,
            user_metadata: {
              full_name: parsedDemoUser.fullName,
              avatar_url: parsedDemoUser.avatarUrl,
              role: parsedDemoUser.role
            }
          } as User;
          
          setUser(mockUser);
          setProfile(parsedDemoUser);
          setSession({ user: mockUser } as Session);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('demo-user-login', handleCustomStorageChange as EventListener);

    return () => {
      subscription?.unsubscribe();
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('demo-user-login', handleCustomStorageChange as EventListener);
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    setLoading(true);
    try {
      const result = await auth.signIn(email, password);
      
      if (result.user && !result.error) {
        // 登录成功，状态会通过onAuthStateChange自动更新
        console.log('AuthContext: 登录成功，用户:', result.user);
      }
      
      return result;
    } catch (error) {
      console.error('AuthContext signIn error:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signUp = async (email: string, password: string, fullName?: string) => {
    setLoading(true);
    try {
      const result = await supabase.auth.signUp({ email, password });
      return result;
    } catch (error) {
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const signOut = async () => {
    setLoading(true);
    try {
      // 清除演示用户数据
      localStorage.removeItem('demo_user');
      
      // 清除认证状态
      setUser(null);
      setProfile(null);
      setSession(null);
      
      // 登出Supabase（如果有session）
      await supabase.auth.signOut();
    } catch (error) {
      console.error('登出失败:', error);
      throw error;
    } finally {
      setLoading(false);
    }
  };

  const isAuthorized = async (email: string): Promise<boolean> => {
    try {
      return await UserService.isUserAuthorized(email);
    } catch (error) {
      console.error('检查用户授权失败:', error);
      return false;
    }
  };

  // 添加调试日志
  console.log('AuthContext - 当前状态:', { user: user?.email, profile: profile?.role, loading });

  const value: AuthContextType = {
    user,
    profile,
    session,
    loading,
    signIn,
    signUp,
    signOut,
    isAuthorized
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};