import { ApiService } from '@/lib/api'

// 兼容旧代码使用的 CourseService
export const CourseService = {
  async getAllCourses() {
    return ApiService.getCourses()
  },
  async getCourses() {
    return ApiService.getCourses()
  }
}

export default CourseService


