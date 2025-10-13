import { ApiService } from '../lib/api'
import type { TrainingSession } from '../lib/api'
import { ErrorHandler, handleApiError, logError } from '@/utils/errorHandler'

/**
 * API服务的加载状态包装器
 * 提供带有加载状态管理的API调用方法
 */
export class ApiWithLoading {
  /**
   * 获取期次列表（带加载状态）
   */
  static async getTrainingSessions(
    withLoading: <T>(operation: () => Promise<T>) => Promise<T>
  ): Promise<TrainingSession[]> {
    return withLoading(() => ApiService.getTrainingSessions().catch(error => {
      const appError = handleApiError(error);
      logError(appError, 'getTrainingSessions');
      throw appError;
    }))
  }

  /**
   * 创建期次（带加载状态）
   */
  static async createTrainingSession(
    session: Omit<TrainingSession, 'id' | 'created_at' | 'updated_at'>,
    courseIds: string[],
    withLoading: <T>(operation: () => Promise<T>) => Promise<T>
  ): Promise<TrainingSession | null> {
    return withLoading(() => ApiService.createTrainingSession(session, courseIds).catch(error => {
      const appError = handleApiError(error);
      logError(appError, 'createTrainingSession');
      throw appError;
    }))
  }

  /**
   * 更新期次（带加载状态）
   */
  static async updateTrainingSession(
    id: string,
    updates: Partial<TrainingSession>,
    withLoading: <T>(operation: () => Promise<T>) => Promise<T>
  ): Promise<TrainingSession | null> {
    return withLoading(() => ApiService.updateTrainingSession(id, updates).catch(error => {
      const appError = handleApiError(error);
      logError(appError, 'updateTrainingSession');
      throw appError;
    }))
  }

  /**
   * 删除期次（带加载状态）
   */
  static async deleteTrainingSession(
    id: string,
    withLoading: <T>(operation: () => Promise<T>) => Promise<T>
  ): Promise<{ success: boolean; message: string }> {
    return withLoading(() => ApiService.deleteTrainingSession(id).catch(error => {
      const appError = handleApiError(error);
      logError(appError, 'deleteTrainingSession');
      throw appError;
    }))
  }

  /**
   * 获取期次学员列表（带加载状态）
   */
  static async getSessionStudents(
    sessionId: string,
    withLoading: <T>(operation: () => Promise<T>) => Promise<T>
  ) {
    return withLoading(() => ApiService.getSessionStudents(sessionId))
  }

  /**
   * 批量导入学员（带加载状态）
   */
  static async importStudentsToSession(
    sessionId: string,
    students: Array<{ email: string; name: string; student_number?: string }>,
    fileName: string,
    withLoading: <T>(operation: () => Promise<T>) => Promise<T>
  ) {
    return withLoading(() => ApiService.importStudentsToSession(sessionId, students, fileName))
  }

  /**
   * 获取课程列表（带加载状态）
   */
  static async getCourses(
    withLoading: <T>(operation: () => Promise<T>) => Promise<T>
  ) {
    return withLoading(() => ApiService.getCourses())
  }

  /**
   * 获取单个课程（带加载状态）
   */
  static async getCourse(
    id: string,
    withLoading: <T>(operation: () => Promise<T>) => Promise<T>
  ) {
    return withLoading(() => ApiService.getCourse(id))
  }

  /**
   * 获取当前期次（带加载状态）
   */
  static async getCurrentSession(
    withLoading: <T>(operation: () => Promise<T>) => Promise<T>
  ) {
    return withLoading(() => ApiService.getCurrentSession())
  }

  /**
   * 上传文件（带加载状态）
   */
  static async uploadFile(
    file: File,
    studentId: string,
    assignmentId: string,
    withLoading: <T>(operation: () => Promise<T>) => Promise<T>
  ) {
    return withLoading(() => ApiService.uploadFile(file, studentId, assignmentId))
  }

  /**
   * 删除文件（带加载状态）
   */
  static async deleteFile(
    filePath: string,
    withLoading: <T>(operation: () => Promise<T>) => Promise<T>
  ) {
    return withLoading(() => ApiService.deleteFile(filePath))
  }
}