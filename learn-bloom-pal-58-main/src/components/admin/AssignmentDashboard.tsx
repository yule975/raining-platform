import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { FileText, Download, Bell, TrendingUp, Users, Calendar } from 'lucide-react';
import { toast } from 'sonner';

// Mock data for assignment submissions
const assignmentData = {
  'U1': {
    name: 'Unit 1 提示词基础入门与进阶',
    submitted: 187,
    total: 245,
    rate: 76.3,
    students: {
      submitted: [
        { id: 1, name: '张三', department: '技术部', submittedAt: '2024-01-15 14:30' },
        { id: 2, name: '李四', department: '产品部', submittedAt: '2024-01-15 16:45' },
        { id: 3, name: '王五', department: '运营部', submittedAt: '2024-01-16 09:20' },
        // ... more submitted students
      ],
      notSubmitted: [
        { id: 101, name: '赵六', department: '技术部' },
        { id: 102, name: '钱七', department: '市场部' },
        { id: 103, name: '孙八', department: '人事部' },
        // ... more not submitted students
      ]
    }
  },
  'U2': {
    name: 'Unit 2 结构化提示词',
    submitted: 156,
    total: 245,
    rate: 63.7,
    students: {
      submitted: [
        { id: 4, name: '周九', department: '技术部', submittedAt: '2024-01-20 11:15' },
        { id: 5, name: '吴十', department: '产品部', submittedAt: '2024-01-20 15:30' },
        // ... more submitted students
      ],
      notSubmitted: [
        { id: 104, name: '郑十一', department: '技术部' },
        { id: 105, name: '王十二', department: '运营部' },
        // ... more not submitted students
      ]
    }
  },
  'U3': {
    name: 'Unit 3 单任务智能体',
    submitted: 98,
    total: 245,
    rate: 40.0,
    students: {
      submitted: [
        { id: 6, name: '冯十三', department: '技术部', submittedAt: '2024-01-25 10:45' },
        // ... more submitted students
      ],
      notSubmitted: [
        { id: 106, name: '陈十四', department: '市场部' },
        { id: 107, name: '褚十五', department: '人事部' },
        // ... more not submitted students
      ]
    }
  },
  'U4': {
    name: 'Unit 4 知识库',
    submitted: 45,
    total: 245,
    rate: 18.4,
    students: {
      submitted: [
        { id: 7, name: '卫十六', department: '技术部', submittedAt: '2024-01-30 14:20' },
        // ... more submitted students
      ],
      notSubmitted: [
        { id: 108, name: '蒋十七', department: '产品部' },
        { id: 109, name: '沈十八', department: '运营部' },
        // ... more not submitted students
      ]
    }
  }
};

const AssignmentDashboard = () => {
  const [selectedUnits, setSelectedUnits] = useState<string[]>(['U1']);
  const [isDetailDialogOpen, setIsDetailDialogOpen] = useState(false);
  const [selectedUnit, setSelectedUnit] = useState<string>('');

  const units = Object.keys(assignmentData);

  const handleUnitChange = (value: string) => {
    if (!selectedUnits.includes(value)) {
      setSelectedUnits([...selectedUnits, value]);
    }
  };

  const removeUnit = (unit: string) => {
    setSelectedUnits(selectedUnits.filter(u => u !== unit));
  };

  const handleSubmittedClick = (unit: string) => {
    setSelectedUnit(unit);
    setIsDetailDialogOpen(true);
  };

  const sendReminder = (studentId: number, studentName: string) => {
    toast.success(`已向 ${studentName} 发送作业催交信息`);
  };

  const exportData = () => {
    toast.success('数据导出中，请稍候...');
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-foreground">作业提交数据看板</h1>
          <p className="text-muted-foreground">实时监控各单元作业提交情况</p>
        </div>
        <Button onClick={exportData} variant="outline" className="rounded-xl">
          <Download className="mr-2 h-4 w-4" />
          导出数据
        </Button>
      </div>

      {/* Unit Selection */}
      <Card className="card-elevated border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <Calendar className="h-5 w-5 text-primary" />
            <span>选择分析单元</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <Select onValueChange={handleUnitChange}>
              <SelectTrigger className="w-64">
                <SelectValue placeholder="选择要分析的单元" />
              </SelectTrigger>
              <SelectContent>
                {units.map((unit) => (
                  <SelectItem key={unit} value={unit} disabled={selectedUnits.includes(unit)}>
                    {assignmentData[unit as keyof typeof assignmentData].name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            {selectedUnits.length > 0 && (
              <div className="flex flex-wrap gap-2">
                {selectedUnits.map((unit) => (
                  <Badge key={unit} variant="secondary" className="px-3 py-1">
                    {unit}
                    <button
                      onClick={() => removeUnit(unit)}
                      className="ml-2 text-xs hover:text-destructive"
                    >
                      ×
                    </button>
                  </Badge>
                ))}
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Assignment Submission Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {selectedUnits.map((unit) => {
          const data = assignmentData[unit as keyof typeof assignmentData];
          return (
            <Card key={unit} className="stat-card">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  {data.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-2xl font-bold text-foreground">{data.rate}%</span>
                    <div className="icon-enhanced">
                      <TrendingUp className="h-5 w-5 text-primary" />
                    </div>
                  </div>
                  <Progress value={data.rate} className="h-2" />
                </div>
                
                <div className="flex items-center justify-between text-sm">
                  <span className="text-muted-foreground">提交情况</span>
                  <button
                    onClick={() => handleSubmittedClick(unit)}
                    className="text-primary hover:text-primary/80 font-medium cursor-pointer"
                  >
                    {data.submitted}
                  </button>
                  <span className="text-muted-foreground">/ {data.total}</span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Assignment Submission Details Table */}
      <Card className="card-elevated border-0">
        <CardHeader>
          <CardTitle className="flex items-center space-x-2">
            <FileText className="h-5 w-5 text-primary" />
            <span>作业提交明细</span>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            {selectedUnits.map((unit) => {
              const data = assignmentData[unit as keyof typeof assignmentData];
              return (
                <div key={unit} className="border border-border rounded-xl p-4">
                  <h3 className="font-semibold mb-4">{data.name}</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h4 className="text-sm font-medium text-success mb-3 flex items-center">
                        <span className="w-2 h-2 bg-success rounded-full mr-2"></span>
                        已提交 ({data.submitted}人)
                      </h4>
                      <div className="max-h-32 overflow-y-auto space-y-2">
                        {data.students.submitted.slice(0, 5).map((student) => (
                          <div key={student.id} className="text-sm p-2 bg-muted/50 rounded-lg">
                            <div className="flex justify-between">
                              <span className="font-medium">{student.name}</span>
                              <span className="text-muted-foreground text-xs">{student.department}</span>
                            </div>
                            <div className="text-xs text-muted-foreground">{student.submittedAt}</div>
                          </div>
                        ))}
                        {data.students.submitted.length > 5 && (
                          <div className="text-xs text-muted-foreground text-center">
                            还有 {data.students.submitted.length - 5} 人...
                          </div>
                        )}
                      </div>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-warning mb-3 flex items-center">
                        <span className="w-2 h-2 bg-warning rounded-full mr-2"></span>
                        未提交 ({data.total - data.submitted}人)
                      </h4>
                      <div className="max-h-32 overflow-y-auto space-y-2">
                        {data.students.notSubmitted.slice(0, 5).map((student) => (
                          <div key={student.id} className="text-sm p-2 bg-muted/50 rounded-lg opacity-60">
                            <div className="flex justify-between items-center">
                              <div>
                                <span className="font-medium text-muted-foreground">{student.name}</span>
                                <div className="text-xs text-muted-foreground">{student.department}</div>
                              </div>
                              <Button
                                size="sm"
                                variant="outline"
                                className="text-xs h-6 px-2"
                                onClick={() => sendReminder(student.id, student.name)}
                              >
                                <Bell className="h-3 w-3 mr-1" />
                                作业
                              </Button>
                            </div>
                          </div>
                        ))}
                        {data.students.notSubmitted.length > 5 && (
                          <div className="text-xs text-muted-foreground text-center">
                            还有 {data.students.notSubmitted.length - 5} 人...
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      {/* Student Detail Dialog */}
      <Dialog open={isDetailDialogOpen} onOpenChange={setIsDetailDialogOpen}>
        <DialogContent className="dialog-enhanced max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader className="p-6 pb-4">
            <DialogTitle className="text-xl">
              {selectedUnit && assignmentData[selectedUnit as keyof typeof assignmentData]?.name} - 学员详情
            </DialogTitle>
            <DialogDescription>
              完整的学员提交情况列表，可导出数据或发送催交信息
            </DialogDescription>
          </DialogHeader>
          <div className="p-6 pt-0">
            {selectedUnit && (
              <div className="space-y-6">
                <div className="flex justify-between items-center">
                  <div className="flex items-center space-x-4">
                    <Badge variant="secondary" className="px-3 py-1">
                      总计: {assignmentData[selectedUnit as keyof typeof assignmentData].total}人
                    </Badge>
                    <Badge variant="default" className="px-3 py-1 bg-success text-success-foreground">
                      已提交: {assignmentData[selectedUnit as keyof typeof assignmentData].submitted}人
                    </Badge>
                    <Badge variant="outline" className="px-3 py-1 text-warning border-warning">
                      未提交: {assignmentData[selectedUnit as keyof typeof assignmentData].total - assignmentData[selectedUnit as keyof typeof assignmentData].submitted}人
                    </Badge>
                  </div>
                  <Button onClick={exportData} variant="outline" size="sm" className="rounded-xl">
                    <Download className="mr-2 h-4 w-4" />
                    导出此页数据
                  </Button>
                </div>
                
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>姓名</TableHead>
                      <TableHead>部门</TableHead>
                      <TableHead>提交状态</TableHead>
                      <TableHead>提交时间</TableHead>
                      <TableHead>操作</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {/* Submitted students */}
                    {assignmentData[selectedUnit as keyof typeof assignmentData].students.submitted.map((student) => (
                      <TableRow key={student.id}>
                        <TableCell className="font-medium">{student.name}</TableCell>
                        <TableCell>{student.department}</TableCell>
                        <TableCell>
                          <Badge variant="default" className="bg-success text-success-foreground">已提交</Badge>
                        </TableCell>
                        <TableCell className="text-sm text-muted-foreground">{student.submittedAt}</TableCell>
                        <TableCell>-</TableCell>
                      </TableRow>
                    ))}
                    
                    {/* Not submitted students */}
                    {assignmentData[selectedUnit as keyof typeof assignmentData].students.notSubmitted.map((student) => (
                      <TableRow key={student.id} className="opacity-60">
                        <TableCell className="font-medium text-muted-foreground">{student.name}</TableCell>
                        <TableCell className="text-muted-foreground">{student.department}</TableCell>
                        <TableCell>
                          <Badge variant="outline" className="text-warning border-warning">未提交</Badge>
                        </TableCell>
                        <TableCell>-</TableCell>
                        <TableCell>
                          <Button
                            size="sm"
                            variant="outline"
                            className="text-xs h-7 px-3"
                            onClick={() => sendReminder(student.id, student.name)}
                          >
                            <Bell className="h-3 w-3 mr-1" />
                            催交作业
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AssignmentDashboard;