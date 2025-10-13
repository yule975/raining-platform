# Supabase 项目创建指南

## 问题诊断

✅ **已确认问题**：当前 `.env` 文件中的 Supabase URL `https://ixqhqjqjqjqjqjqjqj.supabase.co` 是占位符，无法解析，导致登录失败。

错误信息：`AuthRetryableFetchError: Failed to fetch`

## 解决方案：创建真实的 Supabase 项目

### 步骤 1：访问 Supabase 官网

1. 打开浏览器，访问：https://supabase.com
2. 点击右上角的 "Start your project" 或 "Sign up" 按钮
3. 使用 GitHub、Google 或邮箱注册/登录账号

### 步骤 2：创建新项目

1. 登录后，点击 "New project" 按钮
2. 选择或创建一个 Organization（组织）
3. 填写项目信息：
   - **Name**：`learn-bloom-pal`（或你喜欢的名称）
   - **Database Password**：设置一个强密码（请记住这个密码）
   - **Region**：选择 `Southeast Asia (Singapore)` 或离你最近的区域
   - **Pricing Plan**：选择 "Free" 免费计划

4. 点击 "Create new project" 按钮
5. 等待项目创建完成（通常需要 1-2 分钟）

### 步骤 3：获取项目配置信息

项目创建完成后：

1. 在项目仪表板中，点击左侧菜单的 "Settings"（设置）
2. 点击 "API" 选项卡
3. 复制以下信息：
   - **Project URL**：类似 `https://abcdefghijklmnop.supabase.co`
   - **anon public key**：以 `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 开头的长字符串
   - **service_role secret key**：另一个以 `eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...` 开头的长字符串

### 步骤 4：更新本地配置

将获取的信息填入 `.env` 文件：

```env
# Supabase 配置
VITE_SUPABASE_URL=你的项目URL
VITE_SUPABASE_ANON_KEY=你的anon_key
SUPABASE_SERVICE_ROLE_KEY=你的service_role_key
```

### 步骤 5：设置数据库表结构

1. 在 Supabase 项目中，点击左侧菜单的 "SQL Editor"
2. 执行以下 SQL 创建必要的表结构：

```sql
-- 创建用户配置表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  role TEXT NOT NULL DEFAULT 'student',
  full_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 启用 RLS
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- 创建 RLS 策略
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Users can update own profile" ON profiles
  FOR UPDATE USING (auth.uid() = id);

-- 允许 anon 和 authenticated 角色访问
GRANT SELECT, INSERT, UPDATE ON profiles TO anon;
GRANT SELECT, INSERT, UPDATE ON profiles TO authenticated;
```

### 步骤 6：创建管理员账号

1. 在 Supabase 项目中，点击 "Authentication" > "Users"
2. 点击 "Add user" 按钮
3. 填写管理员信息：
   - **Email**：`xiewenxuan001@51Talk.com`
   - **Password**：`123456`（或你设置的密码）
   - **Email Confirm**：勾选 "Auto Confirm User"

4. 创建用户后，在 SQL Editor 中执行：

```sql
-- 为管理员用户创建 profile
INSERT INTO profiles (id, email, role, full_name)
SELECT 
  id, 
  email, 
  'admin' as role,
  '谢文轩' as full_name
FROM auth.users 
WHERE email = 'xiewenxuan001@51Talk.com'
ON CONFLICT (id) DO UPDATE SET 
  role = 'admin',
  full_name = '谢文轩';
```

## 完成后的测试步骤

1. 保存 `.env` 文件
2. 重启开发服务器（Ctrl+C 停止，然后 `npm run dev` 重新启动）
3. 访问 http://localhost:3001/admin/login
4. 使用管理员账号登录：
   - 邮箱：`xiewenxuan001@51Talk.com`
   - 密码：`123456`

## 注意事项

- 免费计划限制：2 个活跃项目，500MB 数据库存储
- 项目会在 1 周不活跃后暂停，但可以随时恢复
- 请妥善保管数据库密码和 API 密钥
- 不要将 service_role_key 暴露在前端代码中

## 如果遇到问题

1. 检查网络连接
2. 确认 API 密钥复制完整
3. 检查项目 URL 格式是否正确
4. 查看浏览器开发者工具的 Console 和 Network 面板

---

**请按照以上步骤创建 Supabase 项目，然后告诉我你获取的项目 URL 和 API 密钥，我会帮你更新配置文件。**