// Unified data types for the entire application

export interface Material {
  id: string;
  name: string;
  size: string;
  type: 'pdf' | 'document' | 'code' | 'video' | 'other';
  downloadUrl: string;
  uploadedAt: string;
}

export interface Assignment {
  id: string;
  course_id: string;
  title: string;
  description: string;
  assignment_type: 'general' | 'code_practice' | 'report' | 'design' | 'quiz';
  due_date?: string;
  max_score: number;
  allow_file_upload: boolean;
  allowed_file_types: string; // 'pdf,jpg,png,zip'
  max_file_size_mb: number;
  instructions?: string;
  requirements?: string[];
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface Course {
  id: string;
  title: string;
  description: string;
  cover: string;
  videoUrl: string;
  duration?: string;
  materials: Material[];
  assignments: Assignment[]; // 🔄 改为多个作业
  createdAt: string;
  updatedAt: string;
  studentCount: number;
  completionRate: number;
  instructor?: string;
}

export interface Student {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  addedAt: string;
  status: 'active' | 'inactive';
  enrolledCourses: string[]; // Course IDs
}

export interface UploadedFile {
  id: string;
  name: string;
  size: number;
  type: string;
  url: string;
  path: string;
}

export interface AssignmentSubmission {
  id: string;
  assignment_id: string;
  student_id: string;
  content: string;
  files: UploadedFile[];
  file_count: number;
  total_file_size: number;
  score?: number;
  feedback?: string;
  status: 'draft' | 'submitted' | 'graded';
  submitted_at?: string;
  graded_at?: string;
  graded_by?: string;
  created_at: string;
  updated_at: string;
  
  // 关联数据（查询时join获得）
  assignment?: Assignment;
  student?: {
    id: string;
    name: string;
    email: string;
  };
  course?: {
    id: string;
    title: string;
  };
}