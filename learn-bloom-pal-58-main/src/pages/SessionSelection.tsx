import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useNavigate } from 'react-router-dom';
import { Calendar, Users, Clock, CheckCircle, AlertCircle, BookOpen } from 'lucide-react';
import { ApiService, TrainingSession } from '@/lib/api';
import { toast } from 'sonner';
import { useAuth } from '@/contexts/AuthContext';
import { supabase } from '@/lib/supabase';

const SessionSelection = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const [sessions, setSessions] = useState<TrainingSession[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedSession, setSelectedSession] = useState<string | null>(null);

  useEffect(() => {
    const fetchSessions = async () => {
      try {
        console.log('SessionSelection: 开始获取学员的期次列表...');
        
        // 获取当前学员ID
        let userId = null;
        const userProfile = localStorage.getItem('user_profile');
        if (userProfile) {
          const parsed = JSON.parse(userProfile);
          userId = parsed?.id;
        }
        
        if (!userId) {
          console.error('SessionSelection: 未找到学员ID');
          toast.error('无法获取用户信息，请重新登录');
          setLoading(false);
          return;
        }
        
        console.log('SessionSelection: 学员ID:', userId);
        
        // 获取学员被分配的期次
        const { data: studentSessions, error } = await supabase
          .from('session_students')
          .select(`
            session_id,
            training_sessions(*)
          `)
          .eq('user_id', userId)
          .eq('status', 'active');
        
        if (error) {
          console.error('SessionSelection: 查询失败', error);
          toast.error('获取期次信息失败');
          setLoading(false);
          return;
        }
        
        console.log('SessionSelection: 学员的期次数据', studentSessions);
        
        // 提取期次信息并过滤活跃状态
        const assignedSessions = (studentSessions || [])
          .map((ss: any) => ss.training_sessions)
          .filter((session: any) => session && (session.status === 'active' || session.status === 'upcoming'));
        
        console.log('SessionSelection: 过滤后的期次', assignedSessions);
        
        setSessions(assignedSessions);
        
        // 如果只有一个期次，自动选中并直接跳转
        if (assignedSessions.length === 1) {
          const sessionId = assignedSessions[0].id;
          setSelectedSession(sessionId);
          console.log('SessionSelection: 自动选中唯一期次', assignedSessions[0].name);
          
          // 自动保存并跳转
          localStorage.setItem('selectedSessionId', sessionId);
          setTimeout(() => {
            navigate('/student/dashboard');
            toast.success(`已进入 ${assignedSessions[0].name}`);
          }, 500);
        } else if (assignedSessions.length === 0) {
          toast.error('您还未被分配到任何培训期次，请联系管理员');
        }
      } catch (error) {
        console.error('获取期次列表失败:', error);
        toast.error(`获取期次列表失败: ${error.message || '未知错误'}`);
      } finally {
        setLoading(false);
      }
    };

    fetchSessions();
  }, [navigate]);

  const handleSessionSelect = (sessionId: string) => {
    setSelectedSession(sessionId);
  };

  const handleConfirmSelection = () => {
    if (!selectedSession) {
      toast.error('请选择一个培训期次');
      return;
    }

    // 将选中的期次保存到localStorage
    localStorage.setItem('selectedSessionId', selectedSession);
    
    // 跳转到学员主页面
    navigate('/student/dashboard');
    toast.success('已进入选中的培训期次');
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'active':
        return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">进行中</Badge>;
      case 'upcoming':
        return <Badge className="bg-blue-100 text-blue-800 hover:bg-blue-100">即将开始</Badge>;
      case 'completed':
        return <Badge className="bg-gray-100 text-gray-800 hover:bg-gray-100">已结束</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('zh-CN', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center">
        <div className="text-center space-y-4">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="text-muted-foreground">加载期次信息中...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100">
      <div className="container mx-auto px-4 py-8">
        {/* 页面标题 */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">选择培训期次</h1>
          <p className="text-gray-600">请选择您要参加的培训期次，开始您的学习之旅</p>
        </div>

        {/* 期次列表 */}
        <div className="max-w-4xl mx-auto">
          {sessions.length === 0 ? (
            <Card className="text-center py-12">
              <CardContent>
                <AlertCircle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">暂无可用期次</h3>
                <p className="text-gray-600">目前没有开放的培训期次，请联系管理员了解详情</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-6 md:grid-cols-2">
              {sessions.map((session) => (
                <Card 
                  key={session.id}
                  className={`cursor-pointer transition-all duration-200 hover:shadow-lg ${
                    selectedSession === session.id 
                      ? 'ring-2 ring-primary border-primary shadow-lg' 
                      : 'hover:border-primary/50'
                  }`}
                  onClick={() => handleSessionSelect(session.id)}
                >
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <CardTitle className="text-xl mb-2">{session.name}</CardTitle>
                        {getStatusBadge(session.status)}
                      </div>
                      {selectedSession === session.id && (
                        <CheckCircle className="h-6 w-6 text-primary" />
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    {session.description && (
                      <p className="text-gray-600 mb-4">{session.description}</p>
                    )}
                    
                    <div className="space-y-3">
                      {/* 开始时间 */}
                      <div className="flex items-center text-sm text-gray-600">
                        <Calendar className="h-4 w-4 mr-2" />
                        <span>开始时间：{formatDate(session.start_date)}</span>
                      </div>
                      
                      {/* 结束时间 */}
                      {session.end_date && (
                        <div className="flex items-center text-sm text-gray-600">
                          <Clock className="h-4 w-4 mr-2" />
                          <span>结束时间：{formatDate(session.end_date)}</span>
                        </div>
                      )}
                      
                      {/* 课程数量 */}
                      <div className="flex items-center text-sm text-gray-600">
                        <BookOpen className="h-4 w-4 mr-2" />
                        <span>包含课程：多个精品课程</span>
                      </div>
                    </div>
                    
                    {/* 期次特色 */}
                    {session.status === 'active' && (
                      <div className="mt-4 p-3 bg-green-50 rounded-lg">
                        <p className="text-sm text-green-800 font-medium">✨ 正在进行中，可立即开始学习</p>
                      </div>
                    )}
                    
                    {session.status === 'upcoming' && (
                      <div className="mt-4 p-3 bg-blue-50 rounded-lg">
                        <p className="text-sm text-blue-800 font-medium">🚀 即将开始，可提前预习</p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>

        {/* 确认按钮 */}
        {sessions.length > 0 && (
          <div className="text-center mt-8">
            <Button 
              onClick={handleConfirmSelection}
              disabled={!selectedSession}
              size="lg"
              className="px-8 py-3"
            >
              {selectedSession ? '确认进入选中期次' : '请先选择一个期次'}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
};

export default SessionSelection;