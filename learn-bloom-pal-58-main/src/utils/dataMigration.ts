import { ApiService } from '../lib/api';
// Removed legacy imports - migrated to unified ApiService

// 数据迁移工具
export class DataMigration {
  // 将现有课程数据迁移到Supabase
  static async migrateCourses() {
    try {
      console.log('开始迁移课程数据...');
      
      // Legacy migration no longer needed - data now managed by Supabase
      console.log('数据迁移工具已更新为使用Supabase API');
      
      // Get existing courses from Supabase
      const existingCourses = await ApiService.getCourses();
      
      console.log(`找到 ${existingCourses.length} 个课程需要迁移`);
      
      // 逐个迁移课程
      for (const course of existingCourses) {
        try {
          // 检查课程是否已存在
          const existingCourse = await ApiService.getCourse(course.id);
          
          if (!existingCourse) {
            // 创建新课程
            const newCourse = await ApiService.createCourse({
              title: course.title,
              description: course.description,
              cover: course.cover,
              videoUrl: course.videoUrl,
              duration: course.duration,
              instructor: course.instructor,
              materials: course.materials,
              assignments: course.assignments,
              studentCount: course.studentCount || 0,
              completionRate: course.completionRate || 0
            });
            
            if (newCourse) {
              console.log(`成功迁移课程: ${course.title}`);
            } else {
              console.error(`迁移课程失败: ${course.title}`);
            }
          } else {
            console.log(`课程已存在，跳过: ${course.title}`);
          }
        } catch (error) {
          console.error(`迁移课程 ${course.title} 时出错:`, error);
        }
      }
      
      console.log('课程数据迁移完成');
    } catch (error) {
      console.error('课程数据迁移失败:', error);
      throw error;
    }
  }
  
  // 检查迁移状态
  static async checkMigrationStatus() {
    try {
      const supabaseCourses = await ApiService.getCourses();
      // Migration status check simplified - all data now in Supabase
      const localCourses = [];
      
      return {
        supabaseCount: supabaseCourses.length,
        localCount: localCourses.length,
        needsMigration: supabaseCourses.length === 0 && localCourses.length > 0
      };
    } catch (error) {
      console.error('检查迁移状态失败:', error);
      return {
        supabaseCount: 0,
        localCount: 0,
        needsMigration: false,
        error: error.message
      };
    }
  }
  
  // 完整的数据迁移流程
  static async performFullMigration() {
    try {
      console.log('开始完整数据迁移...');
      
      // 检查迁移状态
      const status = await this.checkMigrationStatus();
      console.log('迁移状态:', status);
      
      if (status.needsMigration) {
        // 迁移课程数据
        await this.migrateCourses();
        
        console.log('数据迁移完成！');
        return { success: true, message: '数据迁移成功完成' };
      } else {
        console.log('无需迁移数据');
        return { success: true, message: '数据已是最新状态，无需迁移' };
      }
    } catch (error) {
      console.error('数据迁移失败:', error);
      return { success: false, message: `数据迁移失败: ${error.message}` };
    }
  }
}