import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
// import { useAppStore } from '@/hooks/useAppStore'; // Removed - migrated to Supabase
// import { dataPersistence } from '@/lib/storage'; // Removed - migrated to Supabase
import { ApiService } from '@/lib/api';
import { useToast } from '@/hooks/use-toast';
import { RefreshCw, Trash2, Database } from 'lucide-react';

const DataDebug = () => {
  // const { courses, students, submissions } = useAppStore(); // Migrated to Supabase
  // TODO: Update DataDebug to work with Supabase data
  const courses: any[] = [];
  const students: any[] = [];
  const submissions: any[] = [];
  const { toast } = useToast();

  const handleClearCache = () => {
    // dataPersistence.clearAll(); // Removed - migrated to Supabase
    toast({
      title: "功能已迁移",
      description: "数据管理功能已迁移到Supabase，请使用Supabase控制台进行数据管理"
    });
  };

  const handleRefresh = () => {
    window.location.reload();
  };

  // const storageInfo = dataPersistence.getStorageInfo(); // Removed - migrated to Supabase
  const storageInfo = { 
    totalSize: 0, 
    itemCount: 0, 
    items: [], 
    isAvailable: false, 
    used: 0, 
    percentage: 0 
  }; // Placeholder

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">数据调试面板</h1>
        <div className="flex gap-2">
          <Button onClick={handleRefresh} variant="outline">
            <RefreshCw className="w-4 h-4 mr-2" />
            刷新页面
          </Button>
          <Button onClick={handleClearCache} variant="destructive">
            <Trash2 className="w-4 h-4 mr-2" />
            清除缓存
          </Button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center">
              <Database className="w-5 h-5 mr-2" />
              存储信息
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 text-sm">
              <div>可用性: {storageInfo.isAvailable ? '✅ 可用' : '❌ 不可用'}</div>
              <div>使用空间: {storageInfo.used} bytes</div>
              <div>使用率: {storageInfo.percentage.toFixed(2)}%</div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>课程数据</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>课程数量: {courses.length}</div>
              <div className="text-xs text-gray-600">
                {courses.map(course => (
                  <div key={course.id} className="truncate">
                    {course.id}: {course.title}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>学生数据</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              <div>学生数量: {students.length}</div>
              <div className="text-xs text-gray-600">
                {students.map(student => (
                  <div key={student.id} className="truncate">
                    {student.id}: {student.name}
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>课程详细信息</CardTitle>
        </CardHeader>
        <CardContent>
          <pre className="text-xs bg-gray-100 p-4 rounded overflow-auto max-h-96">
            {JSON.stringify(courses, null, 2)}
          </pre>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>使用说明</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-sm space-y-2">
            <p>• 如果在管理员界面添加了课程，但学员界面看不到，请点击"刷新页面"</p>
            <p>• 如果数据显示异常，可以点击"清除缓存"重置所有数据</p>
            <p>• 课程数据会自动保存到浏览器的 localStorage 中</p>
            <p>• 不同浏览器标签页之间的数据可能需要手动刷新才能同步</p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};

export default DataDebug;