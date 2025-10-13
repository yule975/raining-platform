import { ApiService } from '../lib/api';
import { TrainingSession } from '../types';

/**
 * 期次状态自动更新服务
 * 负责根据时间自动更新期次状态
 */
export class SessionStatusService {
  private static updateInterval: NodeJS.Timeout | null = null;
  private static readonly UPDATE_INTERVAL = 60 * 1000; // 每分钟检查一次

  /**
   * 启动状态自动更新服务
   */
  static startAutoUpdate() {
    if (this.updateInterval) {
      return; // 已经启动
    }

    console.log('启动期次状态自动更新服务');
    
    // 立即执行一次更新
    this.updateAllSessionStatus();
    
    // 设置定时更新
    this.updateInterval = setInterval(() => {
      this.updateAllSessionStatus();
    }, this.UPDATE_INTERVAL);
  }

  /**
   * 停止状态自动更新服务
   */
  static stopAutoUpdate() {
    if (this.updateInterval) {
      clearInterval(this.updateInterval);
      this.updateInterval = null;
      console.log('停止期次状态自动更新服务');
    }
  }

  /**
   * 更新所有期次的状态
   */
  static async updateAllSessionStatus() {
    try {
      const sessions = await ApiService.getTrainingSessions();
      const now = new Date();
      
      for (const session of sessions) {
        const newStatus = this.calculateSessionStatus(session, now);
        
        // 如果状态发生变化，更新数据库
        if (session.status !== newStatus) {
          console.log(`更新期次 ${session.name} 状态: ${session.status} -> ${newStatus}`);
          await ApiService.updateTrainingSession(session.id, { status: newStatus });
        }
      }
    } catch (error) {
      console.error('更新期次状态失败:', error);
    }
  }

  /**
   * 计算期次状态
   */
  static calculateSessionStatus(session: TrainingSession, now: Date = new Date()): 'upcoming' | 'active' | 'completed' {
    const startDate = new Date(session.start_date);
    const endDate = new Date(session.end_date);
    
    // 设置时间为当天的开始和结束
    startDate.setHours(0, 0, 0, 0);
    endDate.setHours(23, 59, 59, 999);
    
    if (now < startDate) {
      return 'upcoming';
    } else if (now > endDate) {
      return 'completed';
    } else {
      return 'active';
    }
  }

  /**
   * 手动更新单个期次状态
   */
  static async updateSingleSessionStatus(sessionId: string) {
    try {
      const sessions = await ApiService.getTrainingSessions();
      const session = sessions.find(s => s.id === sessionId);
      
      if (!session) {
        throw new Error('期次不存在');
      }
      
      const newStatus = this.calculateSessionStatus(session);
      
      if (session.status !== newStatus) {
        console.log(`更新期次 ${session.name} 状态: ${session.status} -> ${newStatus}`);
        await ApiService.updateTrainingSession(session.id, { status: newStatus });
        return newStatus;
      }
      
      return session.status;
    } catch (error) {
      console.error('更新期次状态失败:', error);
      throw error;
    }
  }

  /**
   * 获取期次状态显示信息
   */
  static getStatusDisplay(status: string, isCurrentSession: boolean = false) {
    if (isCurrentSession) {
      return { label: '当前期次', variant: 'default' as const, color: 'bg-blue-500' };
    }
    
    switch (status) {
      case 'upcoming':
        return { label: '未开始', variant: 'secondary' as const, color: 'bg-gray-500' };
      case 'active':
        return { label: '进行中', variant: 'default' as const, color: 'bg-green-500' };
      case 'completed':
        return { label: '已结束', variant: 'outline' as const, color: 'bg-red-500' };
      default:
        return { label: '未知', variant: 'secondary' as const, color: 'bg-gray-500' };
    }
  }

  /**
   * 检查是否需要自动设置当前期次
   * 如果没有当前期次，自动将第一个active状态的期次设为当前期次
   */
  static async autoSetCurrentSession() {
    try {
      const sessions = await ApiService.getTrainingSessions();
      const currentSession = sessions.find(s => s.is_current);
      
      if (!currentSession) {
        // 没有当前期次，查找第一个active状态的期次
        const activeSessions = sessions.filter(s => s.status === 'active');
        
        if (activeSessions.length > 0) {
          const firstActiveSession = activeSessions[0];
          console.log(`自动设置当前期次: ${firstActiveSession.name}`);
          await ApiService.updateTrainingSession(firstActiveSession.id, { is_current: true });
        }
      } else if (currentSession.status === 'completed') {
        // 当前期次已结束，查找下一个active期次
        const activeSessions = sessions.filter(s => s.status === 'active' && s.id !== currentSession.id);
        
        if (activeSessions.length > 0) {
          const nextActiveSession = activeSessions[0];
          console.log(`当前期次已结束，切换到下一个期次: ${nextActiveSession.name}`);
          await ApiService.updateTrainingSession(nextActiveSession.id, { is_current: true });
        } else {
          // 没有其他active期次，取消当前期次设置
          console.log('当前期次已结束，且没有其他活跃期次');
          await ApiService.updateTrainingSession(currentSession.id, { is_current: false });
        }
      }
    } catch (error) {
      console.error('自动设置当前期次失败:', error);
    }
  }
}