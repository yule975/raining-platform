import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { supabase } from '../lib/supabase';
import { Badge } from '@/components/ui/badge';

interface NetworkStatus {
  online: boolean;
  dns: 'testing' | 'success' | 'failed';
  supabase: 'testing' | 'success' | 'failed';
  auth: 'testing' | 'success' | 'failed';
  timing: {
    dns: number | null;
    supabase: number | null;
    auth: number | null;
  };
  errors: string[];
}

export function NetworkDebugger() {
  const [status, setStatus] = useState<NetworkStatus>({
    online: navigator.onLine,
    dns: 'testing',
    supabase: 'testing',
    auth: 'testing',
    timing: { dns: null, supabase: null, auth: null },
    errors: []
  });

  const [isVisible, setIsVisible] = useState(false);

  const testNetworkConnection = async () => {
    setStatus(prev => ({
      ...prev,
      dns: 'testing',
      supabase: 'testing',
      auth: 'testing',
      timing: { dns: null, supabase: null, auth: null },
      errors: []
    }));

    const errors: string[] = [];

    try {
      // 1. DNS/基础连接测试
      const dnsStart = Date.now();
      try {
        const response = await fetch(import.meta.env.VITE_SUPABASE_URL + '/rest/v1/', {
          method: 'HEAD',
          headers: {
            'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY
          },
          signal: AbortSignal.timeout(5000)
        });
        
        const dnsTime = Date.now() - dnsStart;
        setStatus(prev => ({
          ...prev,
          dns: response.ok || response.status === 405 ? 'success' : 'failed',
          timing: { ...prev.timing, dns: dnsTime }
        }));
        
        if (!response.ok && response.status !== 405) {
          errors.push(`DNS/连接测试失败: HTTP ${response.status}`);
        }
      } catch (dnsError: any) {
        const dnsTime = Date.now() - dnsStart;
        setStatus(prev => ({
          ...prev,
          dns: 'failed',
          timing: { ...prev.timing, dns: dnsTime }
        }));
        errors.push(`DNS/连接失败: ${dnsError.message}`);
      }

      // 2. Supabase基础服务测试
      const supabaseStart = Date.now();
      try {
        const { data, error } = await supabase
          .from('profiles')
          .select('count')
          .limit(1);
        
        const supabaseTime = Date.now() - supabaseStart;
        setStatus(prev => ({
          ...prev,
          supabase: error ? 'failed' : 'success',
          timing: { ...prev.timing, supabase: supabaseTime }
        }));
        
        if (error) {
          errors.push(`Supabase连接失败: ${error.message}`);
        }
      } catch (supabaseError: any) {
        const supabaseTime = Date.now() - supabaseStart;
        setStatus(prev => ({
          ...prev,
          supabase: 'failed',
          timing: { ...prev.timing, supabase: supabaseTime }
        }));
        errors.push(`Supabase异常: ${supabaseError.message}`);
      }

      // 3. 认证服务测试
      const authStart = Date.now();
      try {
        const { data, error } = await supabase.auth.signInWithPassword({
          email: 'test@invalid.com',
          password: 'invalid'
        });
        
        const authTime = Date.now() - authStart;
        // 期望这个会失败，但不应该是网络错误
        const isNetworkError = error?.message.includes('fetch') || 
                              error?.message.includes('network') ||
                              error?.message.includes('timeout');
        
        setStatus(prev => ({
          ...prev,
          auth: isNetworkError ? 'failed' : 'success',
          timing: { ...prev.timing, auth: authTime }
        }));
        
        if (isNetworkError) {
          errors.push(`认证服务网络错误: ${error?.message}`);
        }
      } catch (authError: any) {
        const authTime = Date.now() - authStart;
        setStatus(prev => ({
          ...prev,
          auth: 'failed',
          timing: { ...prev.timing, auth: authTime }
        }));
        errors.push(`认证服务异常: ${authError.message}`);
      }

      setStatus(prev => ({ ...prev, errors }));

    } catch (generalError: any) {
      errors.push(`总体测试异常: ${generalError.message}`);
      setStatus(prev => ({ ...prev, errors }));
    }
  };

  const getStatusBadge = (status: 'testing' | 'success' | 'failed') => {
    switch (status) {
      case 'testing':
        return <Badge variant="secondary">测试中...</Badge>;
      case 'success':
        return <Badge variant="default" className="bg-green-500">正常</Badge>;
      case 'failed':
        return <Badge variant="destructive">失败</Badge>;
    }
  };

  const formatTime = (time: number | null) => {
    return time ? `${time}ms` : '-';
  };

  useEffect(() => {
    const handleOnlineChange = () => {
      setStatus(prev => ({ ...prev, online: navigator.onLine }));
    };

    window.addEventListener('online', handleOnlineChange);
    window.addEventListener('offline', handleOnlineChange);

    return () => {
      window.removeEventListener('online', handleOnlineChange);
      window.removeEventListener('offline', handleOnlineChange);
    };
  }, []);

  if (!isVisible) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <Button
          onClick={() => setIsVisible(true)}
          variant="outline"
          size="sm"
          className="bg-blue-500 text-white hover:bg-blue-600"
        >
          网络诊断
        </Button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 z-50 w-96">
      <Card>
        <CardHeader className="pb-3">
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">网络连接诊断</CardTitle>
            <Button
              onClick={() => setIsVisible(false)}
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
            >
              ×
            </Button>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm">网络状态:</span>
              <Badge variant={status.online ? "default" : "destructive"}>
                {status.online ? "在线" : "离线"}
              </Badge>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">DNS/基础连接:</span>
              <div className="flex items-center gap-2">
                {getStatusBadge(status.dns)}
                <span className="text-xs text-gray-500">
                  {formatTime(status.timing.dns)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">Supabase数据库:</span>
              <div className="flex items-center gap-2">
                {getStatusBadge(status.supabase)}
                <span className="text-xs text-gray-500">
                  {formatTime(status.timing.supabase)}
                </span>
              </div>
            </div>
            
            <div className="flex items-center justify-between">
              <span className="text-sm">认证服务:</span>
              <div className="flex items-center gap-2">
                {getStatusBadge(status.auth)}
                <span className="text-xs text-gray-500">
                  {formatTime(status.timing.auth)}
                </span>
              </div>
            </div>
          </div>

          {status.errors.length > 0 && (
            <div className="space-y-2">
              <h4 className="text-sm font-medium text-red-600">错误信息:</h4>
              <div className="text-xs text-red-600 space-y-1">
                {status.errors.map((error, index) => (
                  <div key={index} className="break-words">
                    {error}
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Button
              onClick={testNetworkConnection}
              className="w-full"
              size="sm"
            >
              重新测试
            </Button>
            
            <div className="text-xs text-gray-500 space-y-1">
              <div>• 建议使用VPN来提高连接稳定性</div>
              <div>• 如果DNS失败，请检查网络设置</div>
              <div>• 如果认证失败，可能是防火墙问题</div>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
