import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  Download, 
  Upload, 
  Trash2, 
  Database, 
  HardDrive,
  AlertTriangle,
  CheckCircle,
  Info
} from 'lucide-react';
// Removed appStore import - migrated to Supabase
import { LoadingButton } from '@/components/ui/loading-spinner';
import { useToast } from '@/hooks/use-toast';

interface StorageInfo {
  isAvailable: boolean;
  used: number;
  total: number;
  percentage: number;
}

const DataManagement: React.FC = () => {
  const [storageInfo, setStorageInfo] = useState<StorageInfo>({
    isAvailable: false,
    used: 0,
    total: 0,
    percentage: 0
  });
  const [importData, setImportData] = useState('');
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isClearing, setIsClearing] = useState(false);
  const [showClearConfirm, setShowClearConfirm] = useState(false);
  const { toast } = useToast();

  useEffect(() => {
    // Data management migrated to Supabase - local storage no longer used
    setStorageInfo({
      isAvailable: false,
      used: 0,
      total: 0,
      percentage: 0
    });
  }, []);

  // Storage info no longer needed - migrated to Supabase

  const handleExportData = async () => {
    setIsExporting(true);
    try {
      toast({
        title: "功能已迁移",
        description: "数据管理功能已迁移到Supabase，请使用Supabase控制台进行数据导出",
      });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImportData = async () => {
    if (!importData.trim()) {
      toast({
        title: "导入失败",
        description: "请输入要导入的数据",
        variant: "destructive",
      });
      return;
    }

    setIsImporting(true);
    try {
      toast({
        title: "功能已迁移",
        description: "数据管理功能已迁移到Supabase，请使用Supabase控制台进行数据导入",
      });
    } finally {
      setIsImporting(false);
    }
  };

  const handleFileImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target?.result as string;
        setImportData(content);
      };
      reader.readAsText(file);
    }
  };

  const handleClearData = async () => {
    setIsClearing(true);
    try {
      setShowClearConfirm(false);
      toast({
        title: "功能已迁移",
        description: "数据管理功能已迁移到Supabase，请使用Supabase控制台进行数据管理",
      });
    } catch (error) {
      toast({
        title: "操作失败",
        description: "清空数据时发生错误",
        variant: "destructive",
      });
    } finally {
      setIsClearing(false);
    }
  };

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };



  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">数据管理</h1>
          <p className="text-muted-foreground mt-2">
            管理系统数据，包括导出、导入和存储状态监控
          </p>
        </div>
      </div>

      {/* 存储状态 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Database className="h-5 w-5" />
            存储状态
          </CardTitle>
          <CardDescription>
            查看当前数据存储状态和使用情况
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="flex items-center gap-2">
            <Badge variant={storageInfo.isAvailable ? "default" : "secondary"}>
              {storageInfo.isAvailable ? (
                <><CheckCircle className="h-3 w-3 mr-1" />持久化存储可用</>
              ) : (
                <><AlertTriangle className="h-3 w-3 mr-1" />使用内存存储</>
              )}
            </Badge>
          </div>

          {storageInfo.isAvailable && (
            <>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <HardDrive className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">已使用空间</span>
                  </div>
                  <p className="text-2xl font-bold">{formatBytes(storageInfo.used)}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">总空间</span>
                  </div>
                  <p className="text-2xl font-bold">{formatBytes(storageInfo.total)}</p>
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <Info className="h-4 w-4 text-muted-foreground" />
                    <span className="text-sm font-medium">使用率</span>
                  </div>
                  <p className="text-2xl font-bold">{storageInfo.percentage.toFixed(1)}%</p>
                </div>
              </div>

              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>存储使用率</span>
                  <span>{storageInfo.percentage.toFixed(1)}%</span>
                </div>
                <div className="w-full bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-blue-600 h-2 rounded-full transition-all duration-300" 
                    style={{ width: `${Math.min(storageInfo.percentage, 100)}%` }}
                  />
                </div>
              </div>
            </>
          )}

          {!storageInfo.isAvailable && (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription>
                当前使用内存存储，数据在页面刷新后会丢失。建议使用支持 localStorage 的现代浏览器。
              </AlertDescription>
            </Alert>
          )}
        </CardContent>
      </Card>

      {/* 数据导出 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Download className="h-5 w-5" />
            数据导出
          </CardTitle>
          <CardDescription>
            将当前所有数据导出为 JSON 文件
          </CardDescription>
        </CardHeader>
        <CardContent>
          <LoadingButton
            onClick={handleExportData}
            loading={isExporting}
            className="w-full sm:w-auto"
          >
            <Download className="h-4 w-4 mr-2" />
            导出数据
          </LoadingButton>
        </CardContent>
      </Card>

      {/* 数据导入 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Upload className="h-5 w-5" />
            数据导入
          </CardTitle>
          <CardDescription>
            从 JSON 文件或文本导入数据（将覆盖现有数据）
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="file-import">从文件导入</Label>
            <Input
              id="file-import"
              type="file"
              accept=".json"
              onChange={handleFileImport}
            />
          </div>
          
          <Separator />
          
          <div className="space-y-2">
            <Label htmlFor="text-import">从文本导入</Label>
            <Textarea
              id="text-import"
              placeholder="粘贴 JSON 数据..."
              value={importData}
              onChange={(e) => setImportData(e.target.value)}
              rows={8}
            />
          </div>
          
          <LoadingButton
            onClick={handleImportData}
            loading={isImporting}
            disabled={!importData.trim()}
            className="w-full sm:w-auto"
          >
            <Upload className="h-4 w-4 mr-2" />
            导入数据
          </LoadingButton>
        </CardContent>
      </Card>

      {/* 数据清空 */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-destructive">
            <Trash2 className="h-5 w-5" />
            危险操作
          </CardTitle>
          <CardDescription>
            清空所有数据并重置为初始状态
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {!showClearConfirm ? (
            <Button
              variant="destructive"
              onClick={() => setShowClearConfirm(true)}
              className="w-full sm:w-auto"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              清空所有数据
            </Button>
          ) : (
            <Alert>
              <AlertTriangle className="h-4 w-4" />
              <AlertDescription className="mb-4">
                此操作将删除所有课程、学生和作业提交数据，并重置为初始状态。此操作不可撤销！
              </AlertDescription>
              <div className="flex gap-2">
                <LoadingButton
                  variant="destructive"
                  onClick={handleClearData}
                  loading={isClearing}
                >
                  确认清空
                </LoadingButton>
                <Button
                  variant="outline"
                  onClick={() => setShowClearConfirm(false)}
                  disabled={isClearing}
                >
                  取消
                </Button>
              </div>
            </Alert>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default DataManagement;