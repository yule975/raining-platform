import React, { createContext, useContext, useState, ReactNode } from 'react';

interface LoadingState {
  [key: string]: boolean;
}

interface LoadingContextType {
  loadingStates: LoadingState;
  setLoading: (key: string, isLoading: boolean) => void;
  isLoading: (key?: string) => boolean;
  isAnyLoading: () => boolean;
  clearLoading: (key: string) => void;
  clearAllLoading: () => void;
}

const LoadingContext = createContext<LoadingContextType | undefined>(undefined);

export const useLoading = () => {
  const context = useContext(LoadingContext);
  if (!context) {
    throw new Error('useLoading must be used within a LoadingProvider');
  }
  return context;
};

interface LoadingProviderProps {
  children: ReactNode;
}

export const LoadingProvider: React.FC<LoadingProviderProps> = ({ children }) => {
  const [loadingStates, setLoadingStates] = useState<LoadingState>({});

  const setLoading = (key: string, isLoading: boolean) => {
    setLoadingStates(prev => {
      if (isLoading) {
        return { ...prev, [key]: true };
      } else {
        const newState = { ...prev };
        delete newState[key];
        return newState;
      }
    });
  };

  const isLoading = (key?: string) => {
    if (key) {
      return loadingStates[key] || false;
    }
    return Object.keys(loadingStates).length > 0;
  };

  const isAnyLoading = () => {
    return Object.keys(loadingStates).length > 0;
  };

  const clearLoading = (key: string) => {
    setLoadingStates(prev => {
      const newState = { ...prev };
      delete newState[key];
      return newState;
    });
  };

  const clearAllLoading = () => {
    setLoadingStates({});
  };

  const value: LoadingContextType = {
    loadingStates,
    setLoading,
    isLoading,
    isAnyLoading,
    clearLoading,
    clearAllLoading,
  };

  return (
    <LoadingContext.Provider value={value}>
      {children}
    </LoadingContext.Provider>
  );
};

// 便捷的Hook，用于特定操作的加载状态管理
export const useOperationLoading = (operationKey: string) => {
  const { setLoading, isLoading, clearLoading } = useLoading();

  const startLoading = () => setLoading(operationKey, true);
  const stopLoading = () => clearLoading(operationKey);
  const loading = isLoading(operationKey);

  // 包装异步操作的便捷方法
  const withLoading = async <T,>(operation: () => Promise<T>): Promise<T> => {
    try {
      startLoading();
      return await operation();
    } finally {
      stopLoading();
    }
  };

  return {
    loading,
    startLoading,
    stopLoading,
    withLoading,
  };
};