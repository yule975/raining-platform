import * as XLSX from 'xlsx';
import { TrainingSession, SessionStudent } from '@/lib/api';
import { ApiService } from '@/lib/api';

// 导出数据类型定义
interface ExportData {
  sessions: TrainingSession[];
  studentsData?: { [sessionId: string]: SessionStudent[] };
}

// Excel导出工具类
export class ExcelExporter {
  // 导出期次基本信息
  static async exportSessions(sessions: TrainingSession[], filename?: string): Promise<void> {
    try {
      if (!sessions || sessions.length === 0) {
        throw new Error('没有可导出的期次数据');
      }

      const exportData = sessions.map((session, index) => ({
        '序号': index + 1,
        '期次名称': session.name || '未命名期次',
        '开始日期': session.start_date ? new Date(session.start_date).toLocaleDateString('zh-CN') : '未设置',
        '结束日期': session.end_date ? new Date(session.end_date).toLocaleDateString('zh-CN') : '未设置',
        '状态': this.getStatusText(session.status),
        '是否当前期次': session.is_current ? '是' : '否',
        '描述': session.description || '无',
        '创建时间': new Date(session.created_at).toLocaleString('zh-CN'),
        '更新时间': new Date(session.updated_at).toLocaleString('zh-CN')
      }));

      const worksheet = XLSX.utils.json_to_sheet(exportData);
      const workbook = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(workbook, worksheet, '期次列表');

      // 设置列宽
      const colWidths = [
        { wch: 6 },  // 序号
        { wch: 25 }, // 期次名称
        { wch: 12 }, // 开始日期
        { wch: 12 }, // 结束日期
        { wch: 10 }, // 状态
        { wch: 12 }, // 是否当前期次
        { wch: 30 }, // 描述
        { wch: 18 }, // 创建时间
        { wch: 18 }  // 更新时间
      ];
      worksheet['!cols'] = colWidths;

      // 设置表头样式
      this.setHeaderStyle(worksheet);

      const fileName = filename || `期次列表_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('导出期次数据失败:', error);
      throw error instanceof Error ? error : new Error('导出期次数据失败，请稍后重试');
    }
  }

  // 导出期次学员信息
  static async exportSessionStudents(sessionId: string, sessionName: string, filename?: string): Promise<void> {
    try {
      // 获取学员数据
      const students = await ApiService.getSessionStudents(sessionId);
      
      if (!students || students.length === 0) {
        throw new Error('该期次暂无学员数据');
      }
      
      const workbook = XLSX.utils.book_new();
      
      // 学员基本信息
      const basicData = students.map((student, index) => ({
        '序号': index + 1,
        '姓名': student.user?.full_name || '未知',
        '邮箱': student.user?.email || '未提供',
        '手机号': student.user?.phone || '未提供',
        '部门': student.user?.department || '未分配',
        '职位': student.user?.position || '未知',
        '学习状态': this.getLearningStatusText(student.learning_status),
        '学习进度': student.total_courses > 0 
          ? `${Math.round((student.completed_courses || 0) / student.total_courses * 100)}%` 
          : '0%',
        '完成课程数': student.completed_courses || 0,
        '总课程数': student.total_courses || 0,
        '学习时长(小时)': Math.round((student.study_duration || 0) / 60),
        '最后学习时间': student.last_learning_time 
          ? new Date(student.last_learning_time).toLocaleString('zh-CN') 
          : '未开始学习',
        '加入时间': new Date(student.created_at).toLocaleString('zh-CN'),
        '备注': student.notes || '无'
      }));
      
      const basicWorksheet = XLSX.utils.json_to_sheet(basicData);
      
      // 设置基本信息列宽
      const basicColWidths = [
        { wch: 6 },  // 序号
        { wch: 15 }, // 姓名
        { wch: 25 }, // 邮箱
        { wch: 15 }, // 手机号
        { wch: 15 }, // 部门
        { wch: 15 }, // 职位
        { wch: 12 }, // 学习状态
        { wch: 12 }, // 学习进度
        { wch: 12 }, // 完成课程数
        { wch: 12 }, // 总课程数
        { wch: 15 }, // 学习时长
        { wch: 18 }, // 最后学习时间
        { wch: 18 }, // 加入时间
        { wch: 20 }  // 备注
      ];
      basicWorksheet['!cols'] = basicColWidths;
      
      // 设置表头样式
      this.setHeaderStyle(basicWorksheet);
      
      XLSX.utils.book_append_sheet(workbook, basicWorksheet, '学员基本信息');
      
      // 学习统计数据
      const statsData = students.map((student, index) => {
        const stats = this.generateStudentStats(student);
        return {
          '序号': index + 1,
          '姓名': student.user?.full_name || '未知',
          '总学习天数': stats.totalDays,
          '连续学习天数': stats.consecutiveDays,
          '平均每日学习时长(分钟)': stats.avgDailyMinutes,
          '完成率': `${stats.completionRate}%`,
          '测试通过率': `${stats.testPassRate}%`,
          '活跃度评分': stats.activityScore,
          '学习效率': stats.efficiency,
          '最佳学习时段': stats.bestStudyTime
        };
      });
      
      const statsWorksheet = XLSX.utils.json_to_sheet(statsData);
      
      // 设置统计信息列宽
      const statsColWidths = [
        { wch: 6 },  // 序号
        { wch: 15 }, // 姓名
        { wch: 12 }, // 总学习天数
        { wch: 15 }, // 连续学习天数
        { wch: 20 }, // 平均每日学习时长
        { wch: 10 }, // 完成率
        { wch: 12 }, // 测试通过率
        { wch: 12 }, // 活跃度评分
        { wch: 10 }, // 学习效率
        { wch: 15 }  // 最佳学习时段
      ];
      statsWorksheet['!cols'] = statsColWidths;
      
      // 设置表头样式
      this.setHeaderStyle(statsWorksheet);
      
      XLSX.utils.book_append_sheet(workbook, statsWorksheet, '学习统计');
      
      const fileName = filename || `${sessionName}_学员数据_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('导出学员数据失败:', error);
      throw error instanceof Error ? error : new Error('导出学员数据失败，请稍后重试');
    }
  }

  // 导出完整期次报告（包含期次信息和学员数据）
  static async exportFullSessionReport(sessionId: string, filename?: string): Promise<void> {
    try {
      const [sessions, students] = await Promise.all([
        ApiService.getTrainingSessions(),
        ApiService.getSessionStudents(sessionId)
      ]);

      const session = sessions.find(s => s.id === sessionId);
      if (!session) {
        throw new Error('期次不存在');
      }

      const workbook = XLSX.utils.book_new();

      // 期次基本信息工作表
      const sessionInfo = [{
        '期次名称': session.name || '未命名期次',
        '开始日期': session.start_date ? new Date(session.start_date).toLocaleDateString('zh-CN') : '未设置',
        '结束日期': session.end_date ? new Date(session.end_date).toLocaleDateString('zh-CN') : '未设置',
        '状态': this.getStatusText(session.status),
        '是否当前期次': session.is_current ? '是' : '否',
        '学员总数': students?.length || 0,
        '活跃学员数': students?.filter(s => s.learning_status === 'active').length || 0,
        '完成学员数': students?.filter(s => s.learning_status === 'completed').length || 0,
        '平均完成率': this.calculateAverageCompletion(students),
        '描述': session.description || '无',
        '创建时间': new Date(session.created_at).toLocaleString('zh-CN'),
        '更新时间': new Date(session.updated_at).toLocaleString('zh-CN')
      }];

      const sessionWorksheet = XLSX.utils.json_to_sheet(sessionInfo);
      // 设置期次信息列宽
      sessionWorksheet['!cols'] = Array(12).fill({ wch: 18 });
      this.setHeaderStyle(sessionWorksheet);
      XLSX.utils.book_append_sheet(workbook, sessionWorksheet, '期次概览');

      // 学员详细信息工作表
      if (students && students.length > 0) {
        const studentsData = students.map((student, index) => ({
          '序号': index + 1,
          '学员姓名': student.user?.full_name || '未知',
          '邮箱': student.user?.email || '未提供',
          '手机号': student.user?.phone || '未提供',
          '部门': student.user?.department || '未分配',
          '职位': student.user?.position || '未知',
          '加入时间': new Date(student.created_at).toLocaleString('zh-CN'),
          '学习状态': this.getLearningStatusText(student.learning_status),
          '完成课程数': student.completed_courses || 0,
          '总课程数': student.total_courses || 0,
          '学习进度': student.total_courses > 0 
            ? `${Math.round((student.completed_courses || 0) / student.total_courses * 100)}%` 
            : '0%',
          '学习时长(小时)': Math.round((student.study_duration || 0) / 60),
          '最后学习时间': student.last_learning_time 
            ? new Date(student.last_learning_time).toLocaleString('zh-CN') 
            : '未开始学习',
          '备注': student.notes || '无'
        }));

        const studentsWorksheet = XLSX.utils.json_to_sheet(studentsData);
        // 设置学员信息列宽
        studentsWorksheet['!cols'] = [
          { wch: 6 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 15 },
          { wch: 15 }, { wch: 18 }, { wch: 12 }, { wch: 12 }, { wch: 12 },
          { wch: 12 }, { wch: 15 }, { wch: 18 }, { wch: 20 }
        ];
        this.setHeaderStyle(studentsWorksheet);
        XLSX.utils.book_append_sheet(workbook, studentsWorksheet, '学员详情');
      }

      // 学习统计工作表
      const stats = this.generateLearningStats(students);
      const statsWorksheet = XLSX.utils.json_to_sheet(stats);
      // 设置统计信息列宽
      statsWorksheet['!cols'] = [
        { wch: 20 }, { wch: 10 }, { wch: 12 }
      ];
      this.setHeaderStyle(statsWorksheet);
      XLSX.utils.book_append_sheet(workbook, statsWorksheet, '学习统计');

      const fileName = filename || `${session.name}_完整报告_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('导出完整报告失败:', error);
      throw error instanceof Error ? error : new Error('导出完整报告失败，请稍后重试');
    }
  }

  // 批量导出所有期次数据
  static async exportAllSessions(filename?: string): Promise<void> {
    try {
      const sessions = await ApiService.getTrainingSessions();
      
      if (!sessions || sessions.length === 0) {
        throw new Error('没有可导出的期次数据');
      }
      
      const workbook = XLSX.utils.book_new();

      // 期次概览工作表
      const sessionsOverview = sessions.map((session, index) => ({
        '序号': index + 1,
        '期次名称': session.name || '未命名期次',
        '开始日期': session.start_date ? new Date(session.start_date).toLocaleDateString('zh-CN') : '未设置',
        '结束日期': session.end_date ? new Date(session.end_date).toLocaleDateString('zh-CN') : '未设置',
        '状态': this.getStatusText(session.status),
        '是否当前期次': session.is_current ? '是' : '否',
        '描述': session.description || '无',
        '创建时间': new Date(session.created_at).toLocaleString('zh-CN'),
        '更新时间': new Date(session.updated_at).toLocaleString('zh-CN')
      }));

      const overviewWorksheet = XLSX.utils.json_to_sheet(sessionsOverview);
      // 设置概览工作表列宽
      overviewWorksheet['!cols'] = [
        { wch: 6 }, { wch: 25 }, { wch: 12 }, { wch: 12 }, { wch: 10 },
        { wch: 12 }, { wch: 30 }, { wch: 18 }, { wch: 18 }
      ];
      this.setHeaderStyle(overviewWorksheet);
      XLSX.utils.book_append_sheet(workbook, overviewWorksheet, '期次概览');

      // 为每个期次创建单独的工作表（限制前10个期次以避免文件过大）
      const limitedSessions = sessions.slice(0, 10);
      for (const session of limitedSessions) {
        try {
          const students = await ApiService.getSessionStudents(session.id);
          
          if (students && students.length > 0) {
            const studentsData = students.map((student, index) => ({
              '序号': index + 1,
              '学员姓名': student.user?.full_name || '未知',
              '邮箱': student.user?.email || '未提供',
              '部门': student.user?.department || '未分配',
              '学习状态': this.getLearningStatusText(student.learning_status),
              '学习进度': student.total_courses > 0 
                ? `${Math.round((student.completed_courses || 0) / student.total_courses * 100)}%` 
                : '0%',
              '完成课程数': student.completed_courses || 0,
              '总课程数': student.total_courses || 0,
              '学习时长(小时)': Math.round((student.study_duration || 0) / 60),
              '加入时间': new Date(student.created_at).toLocaleString('zh-CN')
            }));

            const worksheet = XLSX.utils.json_to_sheet(studentsData);
            // 设置学员数据列宽
            worksheet['!cols'] = [
              { wch: 6 }, { wch: 15 }, { wch: 25 }, { wch: 15 }, { wch: 12 },
              { wch: 12 }, { wch: 12 }, { wch: 12 }, { wch: 15 }, { wch: 18 }
            ];
            this.setHeaderStyle(worksheet);
            
            // 工作表名称长度限制和特殊字符处理
            let sheetName = session.name || '未命名期次';
            sheetName = sheetName.replace(/[[\]*?:/\\]/g, '_'); // 替换Excel不支持的字符
            if (sheetName.length > 25) {
              sheetName = sheetName.substring(0, 25) + '...';
            }
            XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);
          }
        } catch (error) {
          console.warn(`获取期次 ${session.name} 的学员数据失败:`, error);
        }
      }

      // 添加汇总统计工作表
      const summaryStats = await this.generateAllSessionsSummary(sessions);
      const summaryWorksheet = XLSX.utils.json_to_sheet(summaryStats);
      summaryWorksheet['!cols'] = [
        { wch: 20 }, { wch: 15 }, { wch: 15 }
      ];
      this.setHeaderStyle(summaryWorksheet);
      XLSX.utils.book_append_sheet(workbook, summaryWorksheet, '汇总统计');

      const fileName = filename || `所有期次数据_${new Date().toLocaleDateString('zh-CN').replace(/\//g, '-')}.xlsx`;
      XLSX.writeFile(workbook, fileName);
    } catch (error) {
      console.error('批量导出失败:', error);
      throw error instanceof Error ? error : new Error('批量导出失败，请稍后重试');
    }
  }

  // 生成学习统计数据
  private static generateLearningStats(students: SessionStudent[]) {
    const totalStudents = students.length;
    const activeStudents = students.filter(s => s.learning_status === 'active').length;
    const completedStudents = students.filter(s => s.learning_status === 'completed').length;
    const inactiveStudents = students.filter(s => s.learning_status === 'inactive').length;

    const progressRanges = {
      '0%': 0,
      '1-25%': 0,
      '26-50%': 0,
      '51-75%': 0,
      '76-99%': 0,
      '100%': 0
    };

    students.forEach(student => {
      const progress = student.total_courses > 0 
        ? Math.round((student.completed_courses || 0) / student.total_courses * 100)
        : 0;
      
      if (progress === 0) progressRanges['0%']++;
      else if (progress <= 25) progressRanges['1-25%']++;
      else if (progress <= 50) progressRanges['26-50%']++;
      else if (progress <= 75) progressRanges['51-75%']++;
      else if (progress < 100) progressRanges['76-99%']++;
      else progressRanges['100%']++;
    });

    return [
      { '统计项目': '学员总数', '数值': totalStudents, '百分比': '100%' },
      { '统计项目': '活跃学员', '数值': activeStudents, '百分比': totalStudents > 0 ? `${Math.round(activeStudents / totalStudents * 100)}%` : '0%' },
      { '统计项目': '完成学员', '数值': completedStudents, '百分比': totalStudents > 0 ? `${Math.round(completedStudents / totalStudents * 100)}%` : '0%' },
      { '统计项目': '非活跃学员', '数值': inactiveStudents, '百分比': totalStudents > 0 ? `${Math.round(inactiveStudents / totalStudents * 100)}%` : '0%' },
      { '统计项目': '', '数值': '', '百分比': '' }, // 空行分隔
      { '统计项目': '学习进度分布', '数值': '', '百分比': '' },
      { '统计项目': '未开始 (0%)', '数值': progressRanges['0%'], '百分比': totalStudents > 0 ? `${Math.round(progressRanges['0%'] / totalStudents * 100)}%` : '0%' },
      { '统计项目': '初级 (1-25%)', '数值': progressRanges['1-25%'], '百分比': totalStudents > 0 ? `${Math.round(progressRanges['1-25%'] / totalStudents * 100)}%` : '0%' },
      { '统计项目': '中级 (26-50%)', '数值': progressRanges['26-50%'], '百分比': totalStudents > 0 ? `${Math.round(progressRanges['26-50%'] / totalStudents * 100)}%` : '0%' },
      { '统计项目': '高级 (51-75%)', '数值': progressRanges['51-75%'], '百分比': totalStudents > 0 ? `${Math.round(progressRanges['51-75%'] / totalStudents * 100)}%` : '0%' },
      { '统计项目': '接近完成 (76-99%)', '数值': progressRanges['76-99%'], '百分比': totalStudents > 0 ? `${Math.round(progressRanges['76-99%'] / totalStudents * 100)}%` : '0%' },
      { '统计项目': '已完成 (100%)', '数值': progressRanges['100%'], '百分比': totalStudents > 0 ? `${Math.round(progressRanges['100%'] / totalStudents * 100)}%` : '0%' }
    ];
  }

  // 获取状态文本
  private static getStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'upcoming': '即将开始',
      'active': '进行中',
      'completed': '已结束',
      'cancelled': '已取消'
    };
    return statusMap[status] || status;
  }

  // 获取学习状态文本
  private static getLearningStatusText(status: string): string {
    const statusMap: { [key: string]: string } = {
      'active': '学习中',
      'completed': '已完成',
      'inactive': '未活跃',
      'dropped': '已退出'
    };
    return statusMap[status] || status;
  }

  // 设置表头样式
  private static setHeaderStyle(worksheet: XLSX.WorkSheet) {
    if (!worksheet['!ref']) return;
    
    const range = XLSX.utils.decode_range(worksheet['!ref']);
    for (let col = range.s.c; col <= range.e.c; col++) {
      const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
      if (!worksheet[cellAddress]) continue;
      worksheet[cellAddress].s = {
        font: { bold: true, color: { rgb: 'FFFFFF' } },
        fill: { fgColor: { rgb: '4472C4' } },
        alignment: { horizontal: 'center', vertical: 'center' },
        border: {
          top: { style: 'thin', color: { rgb: '000000' } },
          bottom: { style: 'thin', color: { rgb: '000000' } },
          left: { style: 'thin', color: { rgb: '000000' } },
          right: { style: 'thin', color: { rgb: '000000' } }
        }
      };
    }
  }

  // 生成学员统计数据
  private static generateStudentStats(student: SessionStudent) {
    return {
      totalDays: student.total_study_days || 0,
      consecutiveDays: student.consecutive_days || 0,
      avgDailyMinutes: Math.round((student.study_duration || 0) / (student.total_study_days || 1)),
      completionRate: student.total_courses > 0 
        ? Math.round((student.completed_courses || 0) / student.total_courses * 100)
        : 0,
      testPassRate: student.total_tests > 0 
        ? Math.round((student.passed_tests || 0) / student.total_tests * 100)
        : 0,
      activityScore: student.activity_score || 0,
      efficiency: student.learning_efficiency || '中等',
      bestStudyTime: student.best_study_time || '未知'
    };
  }

  // 计算平均完成率
  private static calculateAverageCompletion(students: SessionStudent[] | undefined): string {
    if (!students || students.length === 0) return '0%';
    
    const totalCompletion = students.reduce((sum, student) => {
      const completion = student.total_courses > 0 
        ? (student.completed_courses || 0) / student.total_courses * 100
        : 0;
      return sum + completion;
    }, 0);
    
    return `${Math.round(totalCompletion / students.length)}%`;
  }

  // 统计活跃学员数
  private static countActiveStudents(students: SessionStudent[] | undefined): number {
    if (!students) return 0;
    return students.filter(s => s.learning_status === 'active').length;
  }

  // 生成所有期次汇总统计
  private static async generateAllSessionsSummary(sessions: TrainingSession[]) {
    let totalStudents = 0;
    let totalActiveSessions = 0;
    let totalCompletedSessions = 0;
    
    for (const session of sessions) {
      try {
        const students = await ApiService.getSessionStudents(session.id);
        totalStudents += students?.length || 0;
      } catch (error) {
        console.warn(`获取期次 ${session.name} 统计失败:`, error);
      }
      
      if (session.status === 'active') totalActiveSessions++;
      if (session.status === 'completed') totalCompletedSessions++;
    }
    
    return [
      { '统计项目': '期次总数', '数值': sessions.length, '说明': '系统中所有期次数量' },
      { '统计项目': '活跃期次', '数值': totalActiveSessions, '说明': '当前正在进行的期次' },
      { '统计项目': '已完成期次', '数值': totalCompletedSessions, '说明': '已结束的期次数量' },
      { '统计项目': '学员总数', '数值': totalStudents, '说明': '所有期次的学员总和' },
      { '统计项目': '平均每期次学员数', '数值': sessions.length > 0 ? Math.round(totalStudents / sessions.length) : 0, '说明': '每个期次的平均学员数量' },
      { '统计项目': '当前期次数', '数值': sessions.filter(s => s.is_current).length, '说明': '标记为当前的期次数量' },
      { '统计项目': '报告生成时间', '数值': new Date().toLocaleString('zh-CN'), '说明': '本报告的生成时间' }
    ];
  }
}

// 导出便捷函数
export const exportSessions = ExcelExporter.exportSessions;
export const exportSessionStudents = ExcelExporter.exportSessionStudents;
export const exportFullSessionReport = ExcelExporter.exportFullSessionReport;
export const exportAllSessions = ExcelExporter.exportAllSessions;