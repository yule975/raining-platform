# AI训战营学习平台 - API设计文档

## 概述

本文档描述了AI训战营学习平台的完整API接口设计，基于Supabase后端架构，支持学员学习和管理员管理功能。

### 技术栈
- 后端：Supabase (PostgreSQL + Auth + Storage + Functions)
- 认证：飞书SSO + 白名单机制
- 存储：Supabase Storage
- 部署：Vercel (前端) + Supabase (后端)

### 基础信息
- **Base URL**: `https://your-project.supabase.co`
- **API版本**: v1
- **数据格式**: JSON
- **认证方式**: Bearer Token (Supabase JWT)

---

## 1. 用户认证模块

### 1.1 飞书SSO登录

**功能描述**: 通过飞书账号进行SSO登录，结合白名单验证

**HTTP方法**: POST

**API路径**: `/auth/v1/token?grant_type=id_token`

**请求头**:
```
Content-Type: application/json
Apikey: your-supabase-anon-key
```

**请求体**:
```json
{
  "id_token": "eyJhbGciOiJSUzI1NiIsInR5cCI6IkpXVCJ9...",
  "provider": "feishu",
  "nonce": "random-nonce-string"
}
```

**成功响应** (200):
```json
{
  "access_token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "token_type": "bearer",
  "expires_in": 3600,
  "refresh_token": "refresh_token_string",
  "user": {
    "id": "uuid-string",
    "email": "user@company.com",
    "user_metadata": {
      "full_name": "张三",
      "avatar_url": "https://avatar-url",
      "role": "student"
    }
  }
}
```

**失败响应** (401):
```json
{
  "error": "unauthorized",
  "error_description": "抱歉，您的账号未被授权访问此系统"
}
```

### 1.2 获取当前用户信息

**功能描述**: 获取当前登录用户的详细信息

**HTTP方法**: GET

**API路径**: `/auth/v1/user`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Apikey: your-supabase-anon-key
```

**成功响应** (200):
```json
{
  "id": "uuid-string",
  "email": "user@company.com",
  "user_metadata": {
    "full_name": "张三",
    "avatar_url": "https://avatar-url",
    "role": "student"
  },
  "created_at": "2024-03-01T10:00:00Z",
  "last_sign_in_at": "2024-03-15T09:30:00Z"
}
```

### 1.3 退出登录

**功能描述**: 用户退出登录，使token失效

**HTTP方法**: POST

**API路径**: `/auth/v1/logout`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Apikey: your-supabase-anon-key
```

**成功响应** (204): 无内容

---

## 2. 课程管理模块

### 2.1 获取课程列表

**功能描述**: 获取用户有权限访问的课程列表

**HTTP方法**: GET

**API路径**: `/rest/v1/courses`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Apikey: your-supabase-anon-key
Content-Type: application/json
```

**查询参数**:
- `select` (可选): 指定返回字段，如 `id,title,description,cover_url`
- `order` (可选): 排序方式，如 `created_at.desc`
- `limit` (可选): 限制返回数量

**成功响应** (200):
```json
[
  {
    "id": "course-uuid-1",
    "title": "AI基础入门",
    "description": "学习人工智能的基础概念和应用",
    "cover_url": "https://storage-url/course-cover.jpg",
    "video_url": "https://feishu-video-link",
    "duration": "2小时30分钟",
    "created_at": "2024-03-01T10:00:00Z",
    "updated_at": "2024-03-10T15:30:00Z",
    "instructor": "李老师",
    "student_count": 25,
    "completion_rate": 85
  }
]
```

### 2.2 获取课程详情

**功能描述**: 获取指定课程的详细信息，包括资料和作业

**HTTP方法**: GET

**API路径**: `/rest/v1/courses/{courseId}`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Apikey: your-supabase-anon-key
```

**路径参数**:
- `courseId` (必需): 课程ID

**查询参数**:
- `select` (可选): `*,course_materials(*),assignments(*)`

**成功响应** (200):
```json
{
  "id": "course-uuid-1",
  "title": "AI基础入门",
  "description": "学习人工智能的基础概念和应用",
  "cover_url": "https://storage-url/course-cover.jpg",
  "video_url": "https://feishu-video-link",
  "duration": "2小时30分钟",
  "created_at": "2024-03-01T10:00:00Z",
  "course_materials": [
    {
      "id": "material-uuid-1",
      "file_name": "AI基础教程.pdf",
      "file_url": "https://storage-url/materials/ai-basics.pdf",
      "file_size": "2.5MB",
      "file_type": "pdf",
      "uploaded_at": "2024-03-01T10:00:00Z"
    }
  ],
  "assignments": [
    {
      "id": "assignment-uuid-1",
      "title": "AI概念总结",
      "description": "请总结本课程中学到的AI核心概念",
      "due_date": "2024-03-20T23:59:59Z",
      "max_file_size": "10MB",
      "requirements": ["至少500字", "包含实例说明"]
    }
  ]
}
```

### 2.3 创建课程 (管理员)

**功能描述**: 管理员创建新课程

**HTTP方法**: POST

**API路径**: `/rest/v1/courses`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Apikey: your-supabase-anon-key
Content-Type: application/json
```

**请求体**:
```json
{
  "title": "机器学习进阶",
  "description": "深入学习机器学习算法和应用",
  "cover_url": "https://storage-url/new-course-cover.jpg",
  "video_url": "https://feishu-video-link",
  "duration": "3小时15分钟",
  "instructor": "王教授"
}
```

**成功响应** (201):
```json
{
  "id": "course-uuid-new",
  "title": "机器学习进阶",
  "description": "深入学习机器学习算法和应用",
  "cover_url": "https://storage-url/new-course-cover.jpg",
  "video_url": "https://feishu-video-link",
  "duration": "3小时15分钟",
  "instructor": "王教授",
  "created_at": "2024-03-15T14:30:00Z",
  "updated_at": "2024-03-15T14:30:00Z"
}
```

**失败响应** (403):
```json
{
  "error": "forbidden",
  "message": "只有管理员可以创建课程"
}
```

### 2.4 更新课程 (管理员)

**功能描述**: 管理员更新课程信息

**HTTP方法**: PATCH

**API路径**: `/rest/v1/courses/{courseId}`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Apikey: your-supabase-anon-key
Content-Type: application/json
```

**请求体**:
```json
{
  "title": "机器学习进阶 (更新版)",
  "description": "更新后的课程描述",
  "video_url": "https://new-feishu-video-link"
}
```

**成功响应** (200):
```json
{
  "id": "course-uuid-1",
  "title": "机器学习进阶 (更新版)",
  "description": "更新后的课程描述",
  "video_url": "https://new-feishu-video-link",
  "updated_at": "2024-03-15T16:45:00Z"
}
```

### 2.5 删除课程 (管理员)

**功能描述**: 管理员删除课程

**HTTP方法**: DELETE

**API路径**: `/rest/v1/courses/{courseId}`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Apikey: your-supabase-anon-key
```

**成功响应** (204): 无内容

**失败响应** (404):
```json
{
  "error": "not_found",
  "message": "课程不存在"
}
```

---

## 3. 课程资料管理

### 3.1 上传课程资料 (管理员)

**功能描述**: 管理员为课程上传资料文件

**HTTP方法**: POST

**API路径**: `/storage/v1/object/course-materials/{courseId}/{fileName}`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
```

**请求体**: 文件二进制数据

**成功响应** (200):
```json
{
  "Key": "course-materials/course-uuid-1/ai-tutorial.pdf",
  "Id": "file-uuid"
}
```

### 3.2 添加资料记录到数据库

**功能描述**: 上传文件后，在数据库中创建资料记录

**HTTP方法**: POST

**API路径**: `/rest/v1/course_materials`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Apikey: your-supabase-anon-key
Content-Type: application/json
```

**请求体**:
```json
{
  "course_id": "course-uuid-1",
  "file_name": "AI基础教程.pdf",
  "file_url": "https://storage-url/course-materials/course-uuid-1/ai-tutorial.pdf",
  "file_size": "2.5MB",
  "file_type": "pdf"
}
```

**成功响应** (201):
```json
{
  "id": "material-uuid-new",
  "course_id": "course-uuid-1",
  "file_name": "AI基础教程.pdf",
  "file_url": "https://storage-url/course-materials/course-uuid-1/ai-tutorial.pdf",
  "file_size": "2.5MB",
  "file_type": "pdf",
  "uploaded_at": "2024-03-15T10:30:00Z"
}
```

### 3.3 下载课程资料

**功能描述**: 学员下载课程资料

**HTTP方法**: GET

**API路径**: `/storage/v1/object/course-materials/{courseId}/{fileName}`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**成功响应** (200): 文件二进制流

**响应头**:
```
Content-Type: application/pdf
Content-Disposition: attachment; filename="ai-tutorial.pdf"
Content-Length: 2621440
```

---

## 4. 学员管理模块

### 4.1 获取学员白名单 (管理员)

**功能描述**: 管理员获取授权学员列表

**HTTP方法**: GET

**API路径**: `/rest/v1/authorized_users`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Apikey: your-supabase-anon-key
```

**查询参数**:
- `select` (可选): 指定返回字段
- `order` (可选): 排序方式
- `email` (可选): 按邮箱筛选，如 `email.ilike.*@company.com`

**成功响应** (200):
```json
[
  {
    "id": 1,
    "email": "zhangsan@company.com",
    "name": "张三",
    "added_at": "2024-03-01T10:00:00Z",
    "status": "active"
  },
  {
    "id": 2,
    "email": "lisi@company.com",
    "name": "李四",
    "added_at": "2024-03-02T11:00:00Z",
    "status": "active"
  }
]
```

### 4.2 添加学员到白名单 (管理员)

**功能描述**: 管理员添加学员到授权名单

**HTTP方法**: POST

**API路径**: `/rest/v1/authorized_users`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Apikey: your-supabase-anon-key
Content-Type: application/json
```

**请求体**:
```json
{
  "email": "newstudent@company.com",
  "name": "新学员"
}
```

**成功响应** (201):
```json
{
  "id": 3,
  "email": "newstudent@company.com",
  "name": "新学员",
  "added_at": "2024-03-15T14:20:00Z",
  "status": "active"
}
```

**失败响应** (409):
```json
{
  "error": "conflict",
  "message": "该邮箱已存在于白名单中"
}
```

### 4.3 批量导入学员 (管理员)

**功能描述**: 管理员通过CSV文件批量导入学员

**HTTP方法**: POST

**API路径**: `/functions/v1/import-students`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
```

**请求体**: CSV文件 (包含email, name列)

**成功响应** (200):
```json
{
  "success": true,
  "imported_count": 15,
  "skipped_count": 2,
  "errors": [
    {
      "row": 3,
      "email": "invalid-email",
      "error": "邮箱格式不正确"
    }
  ]
}
```

### 4.4 移除学员 (管理员)

**功能描述**: 管理员从白名单中移除学员

**HTTP方法**: DELETE

**API路径**: `/rest/v1/authorized_users/{userId}`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Apikey: your-supabase-anon-key
```

**成功响应** (204): 无内容

---

## 5. 作业管理模块

### 5.1 创建作业 (管理员)

**功能描述**: 管理员为课程创建作业

**HTTP方法**: POST

**API路径**: `/rest/v1/assignments`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Apikey: your-supabase-anon-key
Content-Type: application/json
```

**请求体**:
```json
{
  "course_id": "course-uuid-1",
  "title": "AI概念总结作业",
  "description": "请总结本课程中学到的AI核心概念，并结合实际案例进行说明",
  "due_date": "2024-03-25T23:59:59Z",
  "max_file_size": "10MB",
  "requirements": ["至少500字", "包含实例说明", "格式为PDF或Word"]
}
```

**成功响应** (201):
```json
{
  "id": "assignment-uuid-new",
  "course_id": "course-uuid-1",
  "title": "AI概念总结作业",
  "description": "请总结本课程中学到的AI核心概念，并结合实际案例进行说明",
  "due_date": "2024-03-25T23:59:59Z",
  "max_file_size": "10MB",
  "requirements": ["至少500字", "包含实例说明", "格式为PDF或Word"],
  "created_at": "2024-03-15T15:00:00Z"
}
```

### 5.2 提交作业 (学员)

**功能描述**: 学员提交作业内容和文件

**HTTP方法**: POST

**API路径**: `/rest/v1/submissions`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Apikey: your-supabase-anon-key
Content-Type: application/json
```

**请求体**:
```json
{
  "assignment_id": "assignment-uuid-1",
  "content": "AI是人工智能的缩写，主要包括机器学习、深度学习等技术...",
  "file_url": "https://storage-url/submissions/student-uuid/assignment.pdf"
}
```

**成功响应** (201):
```json
{
  "id": "submission-uuid-new",
  "assignment_id": "assignment-uuid-1",
  "student_id": "student-uuid",
  "content": "AI是人工智能的缩写，主要包括机器学习、深度学习等技术...",
  "file_url": "https://storage-url/submissions/student-uuid/assignment.pdf",
  "submitted_at": "2024-03-20T16:30:00Z",
  "status": "submitted"
}
```

**失败响应** (409):
```json
{
  "error": "conflict",
  "message": "您已经提交过该作业，请使用更新接口"
}
```

### 5.3 更新作业提交 (学员)

**功能描述**: 学员更新已提交的作业

**HTTP方法**: PATCH

**API路径**: `/rest/v1/submissions/{submissionId}`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Apikey: your-supabase-anon-key
Content-Type: application/json
```

**请求体**:
```json
{
  "content": "更新后的作业内容...",
  "file_url": "https://storage-url/submissions/student-uuid/updated-assignment.pdf"
}
```

**成功响应** (200):
```json
{
  "id": "submission-uuid-1",
  "content": "更新后的作业内容...",
  "file_url": "https://storage-url/submissions/student-uuid/updated-assignment.pdf",
  "submitted_at": "2024-03-21T10:15:00Z",
  "status": "submitted"
}
```

### 5.4 上传作业文件 (学员)

**功能描述**: 学员上传作业附件

**HTTP方法**: POST

**API路径**: `/storage/v1/object/submissions/{studentId}/{fileName}`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: multipart/form-data
```

**请求体**: 文件二进制数据

**成功响应** (200):
```json
{
  "Key": "submissions/student-uuid/assignment.pdf",
  "Id": "file-uuid"
}
```

### 5.5 获取作业提交列表 (管理员)

**功能描述**: 管理员查看指定作业的所有提交情况

**HTTP方法**: GET

**API路径**: `/rest/v1/submissions`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Apikey: your-supabase-anon-key
```

**查询参数**:
- `assignment_id` (可选): 按作业ID筛选
- `course_id` (可选): 按课程ID筛选
- `status` (可选): 按状态筛选 (submitted, not_submitted, graded)
- `select` (可选): 指定返回字段

**成功响应** (200):
```json
[
  {
    "id": "submission-uuid-1",
    "assignment_id": "assignment-uuid-1",
    "student_id": "student-uuid-1",
    "student_name": "张三",
    "student_email": "zhangsan@company.com",
    "content": "作业内容摘要...",
    "file_url": "https://storage-url/submissions/student-uuid-1/assignment.pdf",
    "submitted_at": "2024-03-20T16:30:00Z",
    "status": "submitted",
    "score": null,
    "feedback": null
  }
]
```

### 5.6 获取学员作业提交记录 (学员)

**功能描述**: 学员查看自己的作业提交记录

**HTTP方法**: GET

**API路径**: `/rest/v1/submissions`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Apikey: your-supabase-anon-key
```

**查询参数**:
- `student_id`: `eq.{current_user_id}` (通过RLS自动筛选)
- `select`: 指定返回字段

**成功响应** (200):
```json
[
  {
    "id": "submission-uuid-1",
    "assignment_id": "assignment-uuid-1",
    "assignment_title": "AI概念总结",
    "course_id": "course-uuid-1",
    "course_title": "AI基础入门",
    "content": "我的作业内容...",
    "file_url": "https://storage-url/submissions/my-assignment.pdf",
    "submitted_at": "2024-03-20T16:30:00Z",
    "status": "submitted",
    "score": 85,
    "feedback": "作业完成得很好，概念理解准确"
  }
]
```

---

## 6. 文件存储模块

### 6.1 获取文件上传签名URL

**功能描述**: 获取用于直接上传文件的预签名URL

**HTTP方法**: POST

**API路径**: `/storage/v1/object/sign/{bucket}/{path}`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**请求体**:
```json
{
  "expiresIn": 3600
}
```

**成功响应** (200):
```json
{
  "signedURL": "https://storage-url/object/sign/bucket/path?token=signed-token"
}
```

### 6.2 获取文件下载URL

**功能描述**: 获取文件的临时下载链接

**HTTP方法**: POST

**API路径**: `/storage/v1/object/sign/{bucket}/{path}`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
Content-Type: application/json
```

**请求体**:
```json
{
  "expiresIn": 3600,
  "download": true
}
```

**成功响应** (200):
```json
{
  "signedURL": "https://storage-url/object/sign/bucket/path?token=signed-token&download=true"
}
```

---

## 7. 统计分析模块

### 7.1 获取课程统计信息 (管理员)

**功能描述**: 获取课程的学习统计数据

**HTTP方法**: GET

**API路径**: `/functions/v1/course-analytics/{courseId}`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**成功响应** (200):
```json
{
  "course_id": "course-uuid-1",
  "total_students": 25,
  "active_students": 20,
  "completion_rate": 80,
  "assignment_submission_rate": 75,
  "average_score": 82.5,
  "last_updated": "2024-03-15T18:00:00Z"
}
```

### 7.2 获取平台整体统计 (管理员)

**功能描述**: 获取平台的整体运营数据

**HTTP方法**: GET

**API路径**: `/functions/v1/platform-analytics`

**请求头**:
```
Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

**成功响应** (200):
```json
{
  "total_courses": 12,
  "total_students": 150,
  "active_students_this_month": 120,
  "total_assignments": 36,
  "total_submissions": 2800,
  "overall_completion_rate": 78,
  "popular_courses": [
    {
      "course_id": "course-uuid-1",
      "title": "AI基础入门",
      "student_count": 45
    }
  ],
  "last_updated": "2024-03-15T18:00:00Z"
}
```

---

## 8. 错误处理

### 通用错误响应格式

所有API的错误响应都遵循以下格式：

```json
{
  "error": "error_code",
  "message": "错误描述信息",
  "details": {
    "field": "具体字段错误信息"
  }
}
```

### 常见HTTP状态码

- **200 OK**: 请求成功
- **201 Created**: 资源创建成功
- **204 No Content**: 请求成功，无返回内容
- **400 Bad Request**: 请求参数错误
- **401 Unauthorized**: 未授权，需要登录
- **403 Forbidden**: 权限不足
- **404 Not Found**: 资源不存在
- **409 Conflict**: 资源冲突（如重复创建）
- **422 Unprocessable Entity**: 请求格式正确但语义错误
- **500 Internal Server Error**: 服务器内部错误

### 错误示例

**参数验证错误** (400):
```json
{
  "error": "validation_error",
  "message": "请求参数验证失败",
  "details": {
    "title": "课程标题不能为空",
    "video_url": "视频链接格式不正确"
  }
}
```

**权限错误** (403):
```json
{
  "error": "insufficient_permissions",
  "message": "您没有权限执行此操作"
}
```

**资源不存在** (404):
```json
{
  "error": "resource_not_found",
  "message": "请求的课程不存在"
}
```

---

## 9. 数据库行级安全策略 (RLS)

### 9.1 课程表 (courses)

```sql
-- 学员只能查看课程基本信息
CREATE POLICY "Students can view courses" ON courses
  FOR SELECT USING (auth.role() = 'authenticated');

-- 管理员可以进行所有操作
CREATE POLICY "Admins can manage courses" ON courses
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );
```

### 9.2 作业提交表 (submissions)

```sql
-- 学员只能查看和修改自己的提交
CREATE POLICY "Students can manage own submissions" ON submissions
  FOR ALL USING (
    auth.uid() = student_id
  );

-- 管理员可以查看所有提交
CREATE POLICY "Admins can view all submissions" ON submissions
  FOR SELECT USING (
    auth.jwt() ->> 'role' = 'admin'
  );
```

### 9.3 学员白名单 (authorized_users)

```sql
-- 只有管理员可以管理白名单
CREATE POLICY "Only admins can manage authorized users" ON authorized_users
  FOR ALL USING (
    auth.jwt() ->> 'role' = 'admin'
  );
```

---

## 10. 部署和环境配置

### 10.1 环境变量

```bash
# Supabase配置
VITE_SUPABASE_URL=https://your-project.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key

# 飞书SSO配置
FEISHU_APP_ID=your-feishu-app-id
FEISHU_APP_SECRET=your-feishu-app-secret

# 存储配置
STORAGE_BUCKET_COURSES=course-materials
STORAGE_BUCKET_SUBMISSIONS=submissions
```

### 10.2 数据库初始化脚本

```sql
-- 启用必要的扩展
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- 创建用户角色枚举
CREATE TYPE user_role AS ENUM ('student', 'admin');

-- 创建表结构（参考需求文档中的设计）
-- ... 表创建语句

-- 启用行级安全
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;

-- 创建安全策略
-- ... RLS策略语句
```

---

## 11. 接口调用示例

### 11.1 JavaScript/TypeScript 示例

```typescript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.VITE_SUPABASE_URL!,
  process.env.VITE_SUPABASE_ANON_KEY!
)

// 获取课程列表
async function getCourses() {
  const { data, error } = await supabase
    .from('courses')
    .select('*')
    .order('created_at', { ascending: false })
  
  if (error) throw error
  return data
}

// 提交作业
async function submitAssignment(assignmentId: string, content: string, file?: File) {
  let fileUrl = null
  
  // 如果有文件，先上传
  if (file) {
    const { data: uploadData, error: uploadError } = await supabase.storage
      .from('submissions')
      .upload(`${user.id}/${file.name}`, file)
    
    if (uploadError) throw uploadError
    fileUrl = uploadData.path
  }
  
  // 创建提交记录
  const { data, error } = await supabase
    .from('submissions')
    .insert({
      assignment_id: assignmentId,
      content,
      file_url: fileUrl
    })
  
  if (error) throw error
  return data
}
```

### 11.2 cURL 示例

```bash
# 获取课程列表
curl -X GET "https://your-project.supabase.co/rest/v1/courses" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "apikey: your-anon-key" \
  -H "Content-Type: application/json"

# 创建课程
curl -X POST "https://your-project.supabase.co/rest/v1/courses" \
  -H "Authorization: Bearer your-jwt-token" \
  -H "apikey: your-anon-key" \
  -H "Content-Type: application/json" \
  -d '{
    "title": "新课程",
    "description": "课程描述",
    "video_url": "https://feishu-video-link"
  }'
```

---

## 总结

本API设计文档涵盖了AI训战营学习平台的所有核心功能：

1. **用户认证**: 基于飞书SSO的安全登录机制
2. **课程管理**: 完整的课程CRUD操作和资料管理
3. **学员管理**: 白名单机制和批量导入功能
4. **作业系统**: 作业发布、提交和管理流程
5. **文件存储**: 安全的文件上传下载机制
6. **权限控制**: 基于RLS的细粒度权限管理
7. **统计分析**: 学习数据的统计和分析

所有接口都遵循RESTful设计原则，支持标准的HTTP状态码和错误处理，确保前端能够稳定可靠地与后端进行交互。