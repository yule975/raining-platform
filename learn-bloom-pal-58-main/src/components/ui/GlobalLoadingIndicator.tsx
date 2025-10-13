import React from 'react';
import { Loader2 } from 'lucide-react';
import { useLoading } from '../../contexts/LoadingContext';
import { cn } from '../../lib/utils';

interface GlobalLoadingIndicatorProps {
  className?: string;
}

export const GlobalLoadingIndicator: React.FC<GlobalLoadingIndicatorProps> = ({ 
  className 
}) => {
  const { isAnyLoading } = useLoading();

  if (!isAnyLoading()) {
    return null;
  }

  return (
    <div className={cn(
      "fixed top-0 left-0 right-0 z-50 bg-blue-500 h-1",
      "animate-pulse",
      className
    )}>
      <div className="h-full bg-gradient-to-r from-blue-400 to-blue-600 animate-pulse" />
    </div>
  );
};

// 页面级加载指示器
export const PageLoadingIndicator: React.FC<{ 
  loading: boolean;
  message?: string;
  className?: string;
}> = ({ loading, message = '加载中...', className }) => {
  if (!loading) {
    return null;
  }

  return (
    <div className={cn(
      "flex items-center justify-center p-8",
      className
    )}>
      <div className="flex items-center space-x-2 text-gray-600">
        <Loader2 className="h-5 w-5 animate-spin" />
        <span>{message}</span>
      </div>
    </div>
  );
};

// 按钮加载状态组件
export const ButtonLoadingIndicator: React.FC<{
  loading: boolean;
  children: React.ReactNode;
  className?: string;
}> = ({ loading, children, className }) => {
  return (
    <div className={cn("flex items-center space-x-2", className)}>
      {loading && <Loader2 className="h-4 w-4 animate-spin" />}
      {children}
    </div>
  );
};

// 卡片加载骨架屏
export const CardSkeleton: React.FC<{ className?: string }> = ({ className }) => {
  return (
    <div className={cn("animate-pulse", className)}>
      <div className="bg-gray-200 rounded-lg p-4 space-y-3">
        <div className="h-4 bg-gray-300 rounded w-3/4"></div>
        <div className="h-4 bg-gray-300 rounded w-1/2"></div>
        <div className="h-4 bg-gray-300 rounded w-5/6"></div>
      </div>
    </div>
  );
};

// 表格加载骨架屏
export const TableSkeleton: React.FC<{ 
  rows?: number;
  columns?: number;
  className?: string;
}> = ({ rows = 5, columns = 4, className }) => {
  return (
    <div className={cn("animate-pulse space-y-2", className)}>
      {Array.from({ length: rows }).map((_, rowIndex) => (
        <div key={rowIndex} className="flex space-x-4">
          {Array.from({ length: columns }).map((_, colIndex) => (
            <div 
              key={colIndex} 
              className="h-4 bg-gray-200 rounded flex-1"
            />
          ))}
        </div>
      ))}
    </div>
  );
};