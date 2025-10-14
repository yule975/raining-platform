import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { ApiService, TrainingSession } from '@/lib/api';
import { toast } from 'sonner';
import { supabase } from '@/lib/supabase';

interface SessionContextType {
  currentSession: TrainingSession | null;
  availableSessions: TrainingSession[];
  selectedSessionId: string | null;
  loading: boolean;
  error: string | null;
  switchSession: (sessionId: string) => Promise<void>;
  refreshSessions: () => Promise<void>;
}

const SessionContext = createContext<SessionContextType | undefined>(undefined);

export const useSession = () => {
  const context = useContext(SessionContext);
  if (context === undefined) {
    throw new Error('useSession must be used within a SessionProvider');
  }
  return context;
};

interface SessionProviderProps {
  children: ReactNode;
}

export const SessionProvider: React.FC<SessionProviderProps> = ({ children }) => {
  const [currentSession, setCurrentSession] = useState<TrainingSession | null>(null);
  const [availableSessions, setAvailableSessions] = useState<TrainingSession[]>([]);
  const [selectedSessionId, setSelectedSessionId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // 初始化期次数据
  const initializeSessions = async () => {
    try {
      console.log('SessionContext: 开始初始化期次数据...');
      setLoading(true);
      setError(null);

      // 获取当前学员ID
      let userId = null;
      const userProfile = localStorage.getItem('user_profile');
      if (userProfile) {
        const parsed = JSON.parse(userProfile);
        userId = parsed?.id;
      }

      let activeSessions: TrainingSession[] = [];

      if (userId) {
        // 学员：只获取被分配的期次
        console.log('SessionContext: 获取学员被分配的期次...', userId);
        const { data: studentSessions, error } = await supabase
          .from('session_students')
          .select(`
            session_id,
            training_sessions(*)
          `)
          .eq('user_id', userId)
          .eq('status', 'active');

        if (error) {
          console.error('SessionContext: 查询学员期次失败', error);
        } else {
          console.log('SessionContext: 学员期次数据', studentSessions);
          // 提取期次信息并过滤活跃状态
          activeSessions = (studentSessions || [])
            .map((ss: any) => ss.training_sessions)
            .filter((session: any) => session && (session.status === 'active' || session.status === 'upcoming'));
        }
      } else {
        // 没有用户ID时，获取所有活跃期次（兼容旧逻辑）
        console.log('SessionContext: 未找到用户ID，获取所有期次...');
        const sessions = await ApiService.getTrainingSessions();
        activeSessions = sessions.filter(session => 
          session.status === 'active' || session.status === 'upcoming'
        );
      }

      console.log('SessionContext: 活跃期次数量:', activeSessions.length);
      setAvailableSessions(activeSessions);

      // 检查localStorage中是否有选中的期次
      const savedSessionId = localStorage.getItem('selectedSessionId');
      console.log('SessionContext: localStorage中的期次ID:', savedSessionId);
      
      if (savedSessionId && savedSessionId !== 'default-session-id') {
        // 验证保存的期次ID是否仍然有效
        const savedSession = activeSessions.find(session => session.id === savedSessionId);
        if (savedSession) {
          console.log('SessionContext: 找到保存的期次:', savedSession.name);
          setCurrentSession(savedSession);
          setSelectedSessionId(savedSessionId);
        } else {
          console.log('SessionContext: 保存的期次无效，尝试使用第一个活跃期次');
          // 如果保存的期次无效，使用第一个活跃期次
          if (activeSessions.length > 0) {
            const firstSession = activeSessions[0];
            setCurrentSession(firstSession);
            setSelectedSessionId(firstSession.id);
            localStorage.setItem('selectedSessionId', firstSession.id);
            console.log('SessionContext: 自动选择第一个期次:', firstSession.name);
          } else {
            localStorage.removeItem('selectedSessionId');
          }
        }
      } else {
        console.log('SessionContext: 没有保存的期次或使用默认ID，选择第一个活跃期次');
        // 如果没有保存的期次或使用的是默认ID，选择第一个活跃期次
        if (activeSessions.length > 0) {
          const firstSession = activeSessions[0];
          setCurrentSession(firstSession);
          setSelectedSessionId(firstSession.id);
          localStorage.setItem('selectedSessionId', firstSession.id);
          console.log('SessionContext: 自动选择第一个期次:', firstSession.name);
        } else {
          console.log('SessionContext: 没有可用的活跃期次');
        }
      }
    } catch (err) {
      console.error('SessionContext: 初始化期次数据失败:', err);
      setError('获取期次信息失败');
      toast.error('获取期次信息失败');
    } finally {
      console.log('SessionContext: 期次初始化完成');
      setLoading(false);
    }
  };

  // 切换期次
  const switchSession = async (sessionId: string) => {
    try {
      const session = availableSessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('期次不存在');
      }

      setCurrentSession(session);
      setSelectedSessionId(sessionId);
      localStorage.setItem('selectedSessionId', sessionId);
      
      toast.success(`已切换到：${session.name}`);
    } catch (err) {
      console.error('切换期次失败:', err);
      toast.error('切换期次失败');
    }
  };

  // 刷新期次列表
  const refreshSessions = async () => {
    await initializeSessions();
  };

  useEffect(() => {
    initializeSessions();
  }, []);

  const value: SessionContextType = {
    currentSession,
    availableSessions,
    selectedSessionId,
    loading,
    error,
    switchSession,
    refreshSessions
  };

  return (
    <SessionContext.Provider value={value}>
      {children}
    </SessionContext.Provider>
  );
};

export default SessionContext;