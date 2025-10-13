import { toast } from '@/hooks/use-toast';

// 错误类型枚举
export enum ErrorType {
  NETWORK_ERROR = 'NETWORK_ERROR',
  API_ERROR = 'API_ERROR',
  VALIDATION_ERROR = 'VALIDATION_ERROR',
  AUTHENTICATION_ERROR = 'AUTHENTICATION_ERROR',
  AUTHORIZATION_ERROR = 'AUTHORIZATION_ERROR',
  NOT_FOUND_ERROR = 'NOT_FOUND_ERROR',
  SERVER_ERROR = 'SERVER_ERROR',
  UNKNOWN_ERROR = 'UNKNOWN_ERROR'
}

// 自定义错误类
export class AppError extends Error {
  public readonly type: ErrorType;
  public readonly statusCode?: number;
  public readonly details?: unknown;

  constructor(
    message: string,
    type: ErrorType = ErrorType.UNKNOWN_ERROR,
    statusCode?: number,
    details?: unknown
  ) {
    super(message);
    this.name = 'AppError';
    this.type = type;
    this.statusCode = statusCode;
    this.details = details;

    // 确保堆栈跟踪正确
    if (Error.captureStackTrace) {
      Error.captureStackTrace(this, AppError);
    }
  }
}

// 错误消息映射
const ERROR_MESSAGES: Record<ErrorType, string> = {
  [ErrorType.NETWORK_ERROR]: '网络连接失败，请检查网络设置',
  [ErrorType.API_ERROR]: 'API请求失败，请稍后重试',
  [ErrorType.VALIDATION_ERROR]: '输入数据验证失败',
  [ErrorType.AUTHENTICATION_ERROR]: '身份验证失败，请重新登录',
  [ErrorType.AUTHORIZATION_ERROR]: '权限不足，无法执行此操作',
  [ErrorType.NOT_FOUND_ERROR]: '请求的资源不存在',
  [ErrorType.SERVER_ERROR]: '服务器内部错误，请稍后重试',
  [ErrorType.UNKNOWN_ERROR]: '发生未知错误，请稍后重试'
};

// 错误处理器类
export class ErrorHandler {
  // 处理API错误
  static handleApiError(error: unknown, context?: string): AppError {
    console.error('API Error:', error);

    // 网络错误
    if (!navigator.onLine) {
      return new AppError(
        '网络连接已断开，请检查网络设置',
        ErrorType.NETWORK_ERROR
      );
    }

    // Supabase错误处理
    if (error && typeof error === 'object' && 'code' in error) {
      switch (error.code) {
        case 'PGRST116': // 没有找到记录
          return new AppError(
            '请求的数据不存在',
            ErrorType.NOT_FOUND_ERROR,
            404,
            error
          );
        case 'PGRST301': // 权限不足
          return new AppError(
            '权限不足，无法访问此资源',
            ErrorType.AUTHORIZATION_ERROR,
            403,
            error
          );
        case '42501': // 数据库权限错误
          return new AppError(
            '数据库权限不足',
            ErrorType.AUTHORIZATION_ERROR,
            403,
            error
          );
        case '23505': // 唯一约束违反
          return new AppError(
            '数据已存在，请检查输入',
            ErrorType.VALIDATION_ERROR,
            400,
            error
          );
        case '23503': // 外键约束违反
          return new AppError(
            '数据关联错误，请检查相关数据',
            ErrorType.VALIDATION_ERROR,
            400,
            error
          );
        default:
          return new AppError(
            (error as any).message || '数据库操作失败',
            ErrorType.API_ERROR,
            500,
            error
          );
      }
    }

    // HTTP状态码错误处理
    if (error && typeof error === 'object' && ('status' in error || 'statusCode' in error)) {
      const status = (error as any).status || (error as any).statusCode;
      switch (status) {
        case 400:
          return new AppError(
            '请求参数错误',
            ErrorType.VALIDATION_ERROR,
            400,
            error
          );
        case 401:
          return new AppError(
            '身份验证失败，请重新登录',
            ErrorType.AUTHENTICATION_ERROR,
            401,
            error
          );
        case 403:
          return new AppError(
            '权限不足，无法执行此操作',
            ErrorType.AUTHORIZATION_ERROR,
            403,
            error
          );
        case 404:
          return new AppError(
            '请求的资源不存在',
            ErrorType.NOT_FOUND_ERROR,
            404,
            error
          );
        case 429:
          return new AppError(
            '请求过于频繁，请稍后重试',
            ErrorType.API_ERROR,
            429,
            error
          );
        case 500:
        case 502:
        case 503:
        case 504:
          return new AppError(
            '服务器错误，请稍后重试',
            ErrorType.SERVER_ERROR,
            status,
            error
          );
        default:
          return new AppError(
            (error as any).message || 'API请求失败',
            ErrorType.API_ERROR,
            status,
            error
          );
      }
    }

    // 网络错误
    if (error && typeof error === 'object' && ('name' in error && (error as any).name === 'NetworkError' || 'message' in error && (error as any).message?.includes('fetch'))) {
      return new AppError(
        '网络请求失败，请检查网络连接',
        ErrorType.NETWORK_ERROR,
        undefined,
        error
      );
    }

    // 默认错误处理
    return new AppError(
      (error as any)?.message || '发生未知错误',
      ErrorType.UNKNOWN_ERROR,
      undefined,
      error
    );
  }

  // 显示错误提示
  static showError(error: unknown, toast: (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void) {
    let message: string;
    let title = '错误';

    if (error instanceof AppError) {
      message = error.message;
      title = this.getErrorTitle(error.type);
    } else {
      message = (error as any)?.message || '发生未知错误';
    }

    toast({
      title,
      description: message,
      variant: 'destructive',
    });
  }

  // 获取错误标题
  private static getErrorTitle(type: ErrorType): string {
    switch (type) {
      case ErrorType.NETWORK_ERROR:
        return '网络错误';
      case ErrorType.AUTHENTICATION_ERROR:
        return '身份验证错误';
      case ErrorType.AUTHORIZATION_ERROR:
        return '权限错误';
      case ErrorType.VALIDATION_ERROR:
        return '输入错误';
      case ErrorType.NOT_FOUND_ERROR:
        return '资源不存在';
      case ErrorType.SERVER_ERROR:
        return '服务器错误';
      default:
        return '错误';
    }
  }

  // 处理异步操作错误
  static handleAsyncError<T>(asyncFn: () => Promise<T>, errorContext?: string): (toast: (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void) => Promise<T | null> {
    return async (toast: (options: { title: string; description?: string; variant?: 'default' | 'destructive' }) => void) => {
      try {
        return await asyncFn();
      } catch (error) {
        const appError = this.handleApiError(error, errorContext);
        this.showError(appError, toast);
        return null;
      }
    };
  }

  // 重试机制
  static async retry<T>(
    asyncFn: () => Promise<T>,
    maxRetries: number = 3,
    delay: number = 1000
  ): Promise<T> {
    let lastError: Error;

    for (let i = 0; i < maxRetries; i++) {
      try {
        return await asyncFn();
      } catch (error) {
        lastError = error as Error;
        
        // 如果是最后一次重试，直接抛出错误
        if (i === maxRetries - 1) {
          throw lastError;
        }

        // 等待指定时间后重试
        await new Promise(resolve => setTimeout(resolve, delay * (i + 1)));
      }
    }

    throw lastError!;
  }

  // 记录错误日志
  static logError(error: Error | AppError, context?: string) {
    const errorInfo = {
      message: error.message,
      stack: error.stack,
      timestamp: new Date().toISOString(),
      context,
      userAgent: navigator.userAgent,
      url: window.location.href
    };

    if (error instanceof AppError) {
      errorInfo['type'] = error.type;
      errorInfo['statusCode'] = error.statusCode;
      errorInfo['details'] = error.details;
    }

    console.error('Error logged:', errorInfo);

    // 在生产环境中，可以发送到错误监控服务
    if (process.env.NODE_ENV === 'production') {
      // TODO: 发送到错误监控服务（如 Sentry）
      // Sentry.captureException(error, { extra: errorInfo });
    }
  }
}

// 导出便捷函数
export const handleApiError = ErrorHandler.handleApiError;
export const showError = ErrorHandler.showError;
export const handleAsyncError = ErrorHandler.handleAsyncError;
export const retry = ErrorHandler.retry;
export const logError = ErrorHandler.logError;