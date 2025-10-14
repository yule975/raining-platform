# 紧急修复指南

## 问题1：学员无法提交作业（submissions表缺少字段）

### 错误信息
```
Could not find the 'created_at' column of 'submissions' in the schema cache
```

### 修复步骤

**请立即执行以下操作：**

1. 访问 [Supabase Dashboard](https://supabase.com/dashboard)
2. 选择你的项目：`upwrgkhpuwxkbwndxxxs`
3. 点击左侧菜单的 **"SQL Editor"**
4. 点击 **"New query"** 创建新查询
5. 粘贴以下SQL代码：

```sql
-- 修复submissions表结构
-- 添加缺失的字段

ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

ALTER TABLE submissions 
ADD COLUMN IF NOT EXISTS updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW();

-- 为已存在的记录设置时间戳（如果有的话）
UPDATE submissions 
SET created_at = submitted_at 
WHERE created_at IS NULL AND submitted_at IS NOT NULL;

UPDATE submissions 
SET created_at = NOW() 
WHERE created_at IS NULL;

UPDATE submissions 
SET updated_at = created_at 
WHERE updated_at IS NULL;

-- 验证修复结果
SELECT column_name, data_type, column_default, is_nullable
FROM information_schema.columns 
WHERE table_name = 'submissions'
ORDER BY ordinal_position;
```

6. 点击 **"Run"** 按钮执行
7. 查看执行结果，应该能看到 `created_at` 和 `updated_at` 字段已添加

### 验证修复

执行后，学员应该能够：
- ✅ 点击"我已完成"按钮
- ✅ 成功提交作业
- ✅ 看到提交成功的提示

---

## 问题2：学员能看到不属于其期次的课程/作业

### 问题描述
- 学员被分配到特定期次
- 但能看到其他期次的课程和作业

### 排查步骤

请提供以下信息以便我进一步诊断：

1. **学员账号信息**
   - 学员邮箱：
   - 分配的期次名称：

2. **能看到但不应该看到的课程/作业**
   - 课程名称：
   - 作业标题：

3. **期次配置**
   - 在管理员界面 -> 期次管理中
   - 该学员的期次是否已正确关联课程？

### 临时检查SQL

在Supabase SQL Editor中执行以下查询，帮助诊断：

```sql
-- 1. 查看学员的期次分配
SELECT 
    ss.student_id,
    p.email,
    p.full_name,
    ts.name as session_name,
    ts.id as session_id,
    ts.status
FROM session_students ss
JOIN profiles p ON ss.student_id = p.id
JOIN training_sessions ts ON ss.session_id = ts.id
WHERE p.email = '学员邮箱地址';  -- 替换为实际学员邮箱

-- 2. 查看该期次关联的课程
SELECT 
    ts.name as session_name,
    c.title as course_title,
    c.id as course_id
FROM training_sessions ts
LEFT JOIN session_courses sc ON ts.id = sc.session_id
LEFT JOIN courses c ON sc.course_id = c.id
WHERE ts.id = '期次ID';  -- 替换为实际期次ID

-- 3. 查看当前所有active期次
SELECT id, name, status, is_current, start_date, end_date
FROM training_sessions
WHERE status = 'active'
ORDER BY created_at DESC;
```

---

## 问题3：管理员修改期次保存失败

### 问题描述
管理员在期次管理界面修改配置后保存失败

### 需要的信息

请提供：
1. 具体的错误提示（如果有）
2. 浏览器控制台的错误信息（按F12打开开发者工具）
3. 正在修改的具体内容（添加课程？修改学员？）

### 检查要点

1. **网络请求状态**
   - 打开浏览器开发者工具（F12）
   - 切换到 Network 标签
   - 尝试保存
   - 查看失败的请求及其响应

2. **常见原因**
   - 数据库权限问题
   - 表结构不匹配
   - RLS策略限制

---

## 立即行动清单

- [ ] **立即执行**：修复submissions表（问题1）
- [ ] 测试学员能否提交作业
- [ ] 收集问题2的详细信息（学员邮箱、期次配置）
- [ ] 收集问题3的错误信息（控制台截图）
- [ ] 将收集到的信息反馈给开发人员

---

## 紧急联系

如果执行SQL时遇到问题，请：
1. 截图错误信息
2. 记录执行的SQL语句
3. 立即反馈

## 预期修复时间

- 问题1：**立即修复**（执行SQL后5分钟内生效）
- 问题2和3：需要更多信息后才能修复（预计1小时内）

