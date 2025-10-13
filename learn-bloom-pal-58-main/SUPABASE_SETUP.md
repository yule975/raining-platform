# Supabase 集成配置指南

本文档介绍如何配置和使用 Supabase 后端服务，实现真实的数据持久化。

## 1. 前置准备

### 1.1 创建 Supabase 项目

1. 访问 [Supabase](https://supabase.com) 并注册账号
2. 创建新项目
3. 等待项目初始化完成
4. 记录项目的 URL 和 API Key

### 1.2 配置环境变量

在项目根目录的 `.env` 文件中配置以下变量：

```env
# Supabase 配置
VITE_SUPABASE_URL=your_supabase_project_url
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## 2. 数据库设置

### 2.1 运行数据库迁移

在 Supabase 控制台的 SQL 编辑器中运行 `supabase/migrations/001_initial_schema.sql` 文件中的 SQL 语句。

这将创建以下表结构：
- `profiles` - 用户资料表
- `authorized_users` - 授权用户表
- `courses` - 课程表
- `assignments` - 作业表
- `course_enrollments` - 课程注册表
- `assignment_submissions` - 作业提交表
- `learning_progress` - 学习进度表

### 2.2 配置存储桶

在 Supabase 控制台的 Storage 部分创建以下存储桶：

1. `course-materials` - 存储课程资料
2. `assignment-files` - 存储作业文件
3. `user-avatars` - 存储用户头像
4. `course-covers` - 存储课程封面图片

为每个存储桶配置适当的访问策略。

## 3. 认证配置

### 3.1 启用邮箱认证

在 Supabase 控制台的 Authentication > Settings 中：
1. 启用 Email 认证提供商
2. 配置邮件模板（可选）
3. 设置重定向 URL

### 3.2 配置飞书 SSO（可选）

如需集成飞书 SSO，请在 Authentication > Providers 中配置：
1. 启用 OAuth 提供商
2. 配置飞书应用的 Client ID 和 Client Secret
3. 设置回调 URL

## 4. 使用说明

### 4.1 数据迁移

首次使用时，可以运行数据迁移工具将现有数据迁移到 Supabase：

```typescript
import { DataMigration } from './src/utils/dataMigration';

// 执行完整迁移
const result = await DataMigration.performFullMigration();
console.log(result);
```

### 4.2 系统检查

使用系统检查工具验证 Supabase 配置：

```typescript
import { SupabaseCheck } from './src/utils/supabaseCheck';

// 执行完整检查
const result = await SupabaseCheck.performFullCheck();
console.log(result);

// 生成配置报告
const report = await SupabaseCheck.generateConfigReport();
console.log(report);
```

### 4.3 切换到 Supabase 存储

项目已经集成了 `supabaseStore`，它会自动替换原有的内存存储。主要功能包括：

- 课程管理（CRUD 操作）
- 用户认证和授权
- 文件上传和存储
- 实时数据同步

## 5. API 使用示例

### 5.1 课程管理

```typescript
import { CourseService } from './src/lib/supabaseService';

// 获取所有课程
const courses = await CourseService.getCourses();

// 创建新课程
const newCourse = await CourseService.createCourse({
  title: '新课程',
  description: '课程描述',
  // ... 其他字段
});

// 更新课程
const updatedCourse = await CourseService.updateCourse(courseId, {
  title: '更新后的标题'
});

// 删除课程
const success = await CourseService.deleteCourse(courseId);
```

### 5.2 用户认证

```typescript
import { useAuth } from './src/contexts/AuthContext';

function LoginComponent() {
  const { signIn, signUp, signOut, user } = useAuth();
  
  const handleLogin = async (email: string, password: string) => {
    try {
      await signIn(email, password);
    } catch (error) {
      console.error('登录失败:', error);
    }
  };
  
  // ... 组件实现
}
```

### 5.3 文件上传

```typescript
import { StorageService } from './src/lib/supabaseService';

// 上传文件
const fileUrl = await StorageService.uploadFile(
  'course-materials',
  'path/to/file.pdf',
  file
);

// 删除文件
const success = await StorageService.deleteFile(
  'course-materials',
  'path/to/file.pdf'
);
```

## 6. 故障排除

### 6.1 常见问题

**连接失败**
- 检查环境变量配置
- 确认 Supabase 项目状态
- 验证网络连接

**权限错误**
- 检查 RLS 策略配置
- 确认用户角色设置
- 验证 API Key 权限

**数据同步问题**
- 检查数据库表结构
- 确认触发器和函数正常工作
- 验证实时订阅配置

### 6.2 调试工具

使用内置的调试工具进行问题诊断：

```typescript
// 检查系统状态
const status = await SupabaseCheck.performFullCheck();

// 生成详细报告
const report = await SupabaseCheck.generateConfigReport();
```

## 7. 性能优化

### 7.1 数据库优化

- 为常用查询字段添加索引
- 使用适当的 RLS 策略
- 优化查询语句

### 7.2 存储优化

- 压缩上传文件
- 使用 CDN 加速
- 设置合适的缓存策略

### 7.3 实时功能

- 仅订阅必要的数据变化
- 及时取消不需要的订阅
- 使用连接池管理

## 8. 安全考虑

### 8.1 数据安全

- 启用 RLS 策略
- 定期更新 API Key
- 限制数据库访问权限

### 8.2 文件安全

- 验证文件类型和大小
- 扫描恶意文件
- 设置访问权限

### 8.3 用户安全

- 强制使用强密码
- 启用多因素认证
- 监控异常登录

## 9. 监控和日志

### 9.1 性能监控

- 监控数据库查询性能
- 跟踪 API 响应时间
- 监控存储使用情况

### 9.2 错误日志

- 记录应用错误
- 监控数据库错误
- 跟踪认证失败

## 10. 部署注意事项

### 10.1 生产环境配置

- 使用生产环境的 Supabase 项目
- 配置适当的环境变量
- 启用 SSL 连接

### 10.2 备份策略

- 定期备份数据库
- 备份存储文件
- 测试恢复流程

---

如有问题，请参考 [Supabase 官方文档](https://supabase.com/docs) 或联系开发团队。