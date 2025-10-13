import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Trophy, Award, Medal, Crown, Star } from 'lucide-react';

// Mock leaderboard data
const totalLeaderboard = [
  { rank: 1, name: '张伟', department: '技术部', studyTime: '156.5小时', completedCourses: 8, avatar: '👨‍💻' },
  { rank: 2, name: '李娜', department: '产品部', studyTime: '142.3小时', completedCourses: 7, avatar: '👩‍💼' },
  { rank: 3, name: '王强', department: '运营部', studyTime: '138.7小时', completedCourses: 6, avatar: '👨‍💼' },
  { rank: 4, name: '赵敏', department: '设计部', studyTime: '135.2小时', completedCourses: 6, avatar: '👩‍🎨' },
  { rank: 5, name: '刘洋', department: '技术部', studyTime: '128.9小时', completedCourses: 5, avatar: '👨‍💻' },
  { rank: 6, name: '陈静', department: '市场部', studyTime: '126.4小时', completedCourses: 5, avatar: '👩‍💼' },
  { rank: 7, name: '孙涛', department: '人事部', studyTime: '122.8小时', completedCourses: 5, avatar: '👨‍💼' },
  { rank: 8, name: '周莉', department: '财务部', studyTime: '119.3小时', completedCourses: 4, avatar: '👩‍💼' },
  { rank: 9, name: '吴昊', department: '技术部', studyTime: '115.7小时', completedCourses: 4, avatar: '👨‍💻' },
  { rank: 10, name: '郑梅', department: '运营部', studyTime: '112.1小时', completedCourses: 4, avatar: '👩‍💼' }
];

const weeklyLeaderboard = [
  { rank: 1, name: '刘洋', department: '技术部', studyTime: '18.5小时', completedCourses: 2, avatar: '👨‍💻' },
  { rank: 2, name: '陈静', department: '市场部', studyTime: '16.2小时', completedCourses: 1, avatar: '👩‍💼' },
  { rank: 3, name: '张伟', department: '技术部', studyTime: '15.8小时', completedCourses: 1, avatar: '👨‍💻' },
  { rank: 4, name: '孙涛', department: '人事部', studyTime: '14.3小时', completedCourses: 1, avatar: '👨‍💼' },
  { rank: 5, name: '李娜', department: '产品部', studyTime: '13.7小时', completedCourses: 1, avatar: '👩‍💼' },
  { rank: 6, name: '周莉', department: '财务部', studyTime: '12.9小时', completedCourses: 1, avatar: '👩‍💼' },
  { rank: 7, name: '王强', department: '运营部', studyTime: '12.4小时', completedCourses: 1, avatar: '👨‍💼' },
  { rank: 8, name: '吴昊', department: '技术部', studyTime: '11.8小时', completedCourses: 1, avatar: '👨‍💻' },
  { rank: 9, name: '赵敏', department: '设计部', studyTime: '11.2小时', completedCourses: 0, avatar: '👩‍🎨' },
  { rank: 10, name: '郑梅', department: '运营部', studyTime: '10.6小时', completedCourses: 0, avatar: '👩‍💼' }
];

const LeaderBoard = () => {
  const [activeTab, setActiveTab] = useState('total');

  const getRankIcon = (rank: number) => {
    switch (rank) {
      case 1:
        return <Crown className="h-5 w-5 text-yellow-500" />;
      case 2:
        return <Medal className="h-5 w-5 text-gray-400" />;
      case 3:
        return <Award className="h-5 w-5 text-amber-600" />;
      default:
        return <span className="text-muted-foreground font-medium">#{rank}</span>;
    }
  };

  const getRankBadgeVariant = (rank: number) => {
    if (rank <= 3) return 'default';
    if (rank <= 5) return 'secondary';
    return 'outline';
  };

  const LeaderboardTable = ({ data, title }: { data: typeof totalLeaderboard; title: string }) => (
    <div className="space-y-4">
      <div className="text-center space-y-2">
        <h3 className="text-lg font-semibold text-foreground">{title}</h3>
        <p className="text-sm text-muted-foreground">
          {title.includes('周') ? '本周' : '总'}学习排行榜 - Top 10
        </p>
      </div>
      
      <div className="space-y-3">
        {data.map((student, index) => (
          <div
            key={student.rank}
            className={`
              flex items-center justify-between p-4 rounded-xl border transition-all duration-200
              ${student.rank <= 3 
                ? 'bg-gradient-to-r from-primary/5 to-accent/5 border-primary/20 shadow-sm' 
                : 'bg-card hover:bg-muted/30'
              }
            `}
          >
            <div className="flex items-center space-x-4">
              {/* Rank */}
              <div className="flex items-center justify-center w-8">
                {getRankIcon(student.rank)}
              </div>
              
              {/* Avatar and Name */}
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-lg">
                  {student.avatar}
                </div>
                <div>
                  <div className="font-semibold text-foreground">{student.name}</div>
                  <div className="text-sm text-muted-foreground">{student.department}</div>
                </div>
              </div>
            </div>
            
            {/* Stats */}
            <div className="flex items-center space-x-6 text-right">
              <div>
                <div className="text-sm font-medium text-foreground">{student.studyTime}</div>
                <div className="text-xs text-muted-foreground">学习时长</div>
              </div>
              <div>
                <div className="text-sm font-medium text-foreground">{student.completedCourses}</div>
                <div className="text-xs text-muted-foreground">完成课程</div>
              </div>
              <Badge 
                variant={getRankBadgeVariant(student.rank)}
                className="ml-2"
              >
                第{student.rank}名
              </Badge>
            </div>
          </div>
        ))}
      </div>
      
      {/* Legend */}
      <div className="mt-6 pt-4 border-t divider-subtle">
        <div className="flex items-center justify-center space-x-6 text-xs text-muted-foreground">
          <div className="flex items-center space-x-2">
            <Crown className="h-4 w-4 text-yellow-500" />
            <span>第一名</span>
          </div>
          <div className="flex items-center space-x-2">
            <Medal className="h-4 w-4 text-gray-400" />
            <span>第二名</span>
          </div>
          <div className="flex items-center space-x-2">
            <Award className="h-4 w-4 text-amber-600" />
            <span>第三名</span>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <Card className="card-elevated border-0">
      <CardHeader className="pb-4">
        <CardTitle className="flex items-center space-x-2">
          <Trophy className="h-6 w-6 text-primary" />
          <span>学霸榜</span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 rounded-xl bg-muted/50">
            <TabsTrigger value="total" className="rounded-lg">总榜</TabsTrigger>
            <TabsTrigger value="weekly" className="rounded-lg">周榜</TabsTrigger>
          </TabsList>
          
          <TabsContent value="total" className="mt-6 space-y-0">
            <LeaderboardTable data={totalLeaderboard} title="总学习排行榜" />
          </TabsContent>
          
          <TabsContent value="weekly" className="mt-6 space-y-0">
            <LeaderboardTable data={weeklyLeaderboard} title="本周学习排行榜" />
          </TabsContent>
        </Tabs>
      </CardContent>
    </Card>
  );
};

export default LeaderBoard;