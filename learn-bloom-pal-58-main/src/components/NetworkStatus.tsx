import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff, AlertTriangle } from 'lucide-react';
import { Alert, AlertDescription } from './ui/alert';
import { Button } from './ui/button';
import { useToast } from '@/hooks/use-toast';

interface NetworkStatusProps {
  onNetworkChange?: (isOnline: boolean) => void;
}

const NetworkStatus: React.FC<NetworkStatusProps> = ({ onNetworkChange }) => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showOfflineAlert, setShowOfflineAlert] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      setShowOfflineAlert(false);
      onNetworkChange?.(true);
      toast({
        title: '网络已连接',
        description: '网络连接已恢复，您可以继续使用应用',
        variant: 'default',
      });
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowOfflineAlert(true);
      onNetworkChange?.(false);
      toast({
        title: '网络连接断开',
        description: '请检查您的网络连接',
        variant: 'destructive',
      });
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 初始状态检查
    if (!navigator.onLine) {
      setShowOfflineAlert(true);
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [onNetworkChange, toast]);

  const handleRetry = () => {
    // 尝试重新连接
    if (navigator.onLine) {
      setIsOnline(true);
      setShowOfflineAlert(false);
      onNetworkChange?.(true);
      toast({
        title: '网络已连接',
        description: '网络连接正常',
        variant: 'default',
      });
    } else {
      toast({
        title: '网络仍未连接',
        description: '请检查您的网络设置',
        variant: 'destructive',
      });
    }
  };

  if (!showOfflineAlert) {
    return null;
  }

  return (
    <div className="fixed top-4 left-1/2 transform -translate-x-1/2 z-50 w-full max-w-md px-4">
      <Alert variant="destructive" className="bg-red-50 border-red-200">
        <WifiOff className="h-4 w-4" />
        <AlertDescription className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="h-4 w-4" />
            <span>网络连接已断开</span>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={handleRetry}
            className="ml-2"
          >
            重试
          </Button>
        </AlertDescription>
      </Alert>
    </div>
  );
};

// 网络状态Hook
export const useNetworkStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [connectionType, setConnectionType] = useState<string>('unknown');

  useEffect(() => {
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    // 检测连接类型（如果支持）
    if ('connection' in navigator) {
      const connection = (navigator as any).connection;
      setConnectionType(connection?.effectiveType || 'unknown');
      
      const handleConnectionChange = () => {
        setConnectionType(connection?.effectiveType || 'unknown');
      };
      
      connection?.addEventListener('change', handleConnectionChange);
      
      return () => {
        window.removeEventListener('online', handleOnline);
        window.removeEventListener('offline', handleOffline);
        connection?.removeEventListener('change', handleConnectionChange);
      };
    }

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  return {
    isOnline,
    connectionType,
    isSlowConnection: connectionType === 'slow-2g' || connectionType === '2g'
  };
};

// 网络状态指示器组件
export const NetworkIndicator: React.FC = () => {
  const { isOnline, connectionType, isSlowConnection } = useNetworkStatus();

  if (isOnline && !isSlowConnection) {
    return null;
  }

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="flex items-center space-x-2 bg-white border border-gray-200 rounded-lg px-3 py-2 shadow-lg">
        {isOnline ? (
          <>
            <Wifi className="h-4 w-4 text-yellow-500" />
            <span className="text-sm text-yellow-600">
              网络较慢 ({connectionType})
            </span>
          </>
        ) : (
          <>
            <WifiOff className="h-4 w-4 text-red-500" />
            <span className="text-sm text-red-600">离线</span>
          </>
        )}
      </div>
    </div>
  );
};

export default NetworkStatus;