# Supabase 项目修复指南

## 问题诊断

当前登录超时的根本原因是：
- Supabase 项目 URL `https://ixqhqjqjqjqjqjqjqj.supabase.co` 无法解析
- 这个项目可能已被删除或从未正确创建

## 解决方案

### 方案一：创建新的 Supabase 项目（推荐）

1. **访问 Supabase 官网**
   - 打开 https://supabase.com
   - 点击 "Start your project" 或 "Sign in"

2. **创建新项目**
   - 登录后点击 "New Project"
   - 选择组织（或创建新组织）
   - 填写项目信息：
     - Name: `learn-bloom-pal`
     - Database Password: 设置一个强密码（请记住）
     - Region: 选择 `Southeast Asia (Singapore)` 或最近的区域
   - 点击 "Create new project"

3. **等待项目创建**
   - 项目创建需要 1-2 分钟
   - 创建完成后会显示项目仪表板

4. **获取项目配置**
   - 在项目仪表板，点击左侧 "Settings" → "API"
   - 复制以下信息：
     - Project URL
     - anon public key
     - service_role secret key（仅后端使用）

5. **更新环境变量**
   - 将获取的信息更新到 `.env` 文件中

### 方案二：使用现有项目

如果您已有其他 Supabase 项目：
1. 登录 Supabase 控制台
2. 选择要使用的项目
3. 获取 API 配置信息
4. 更新 `.env` 文件

## 数据库设置

项目创建后，需要设置数据库表结构：

1. **运行 SQL 脚本**
   - 在 Supabase 控制台，点击 "SQL Editor"
   - 运行项目中的数据库迁移脚本

2. **设置 RLS 策略**
   - 确保为每个表设置适当的行级安全策略
   - 特别是 `profiles` 表的访问权限

## 测试连接

配置完成后：
1. 重启开发服务器
2. 清除浏览器缓存
3. 尝试登录管理员账号

## 注意事项

- 免费计划允许 2 个活跃项目
- 项目在 1 周不活跃后会自动暂停
- 暂停的项目可以通过访问控制台重新激活

---

**需要帮助？**
请提供新创建的项目 URL 和 anon key，我将帮您完成配置。