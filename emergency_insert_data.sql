-- 🚨 紧急数据插入脚本
-- 请在 Supabase SQL Editor 中立即执行

-- 首先检查数据状态
SELECT '📊 当前数据状态' as 检查项目;
SELECT 'courses' as 表名, COUNT(*) as 数量 FROM courses;
SELECT 'authorized_users' as 表名, COUNT(*) as 数量 FROM authorized_users;
SELECT 'course_materials' as 表名, COUNT(*) as 数量 FROM course_materials;

-- 清理可能的残留数据
DELETE FROM course_materials;
DELETE FROM courses;
DELETE FROM authorized_users;

-- 插入授权用户
INSERT INTO authorized_users (name, email, role, department)
VALUES 
  ('张三', 'zhangsan@company.com', 'student', 'AI技术部'),
  ('李四', 'lisi@company.com', 'student', '产品部'),
  ('王五', 'wangwu@company.com', 'admin', 'IT部门'),
  ('赵六', 'zhaoliu@company.com', 'student', '市场部')
ON CONFLICT (email) DO NOTHING;

-- 插入课程数据（使用gen_random_uuid()生成UUID）
INSERT INTO courses (id, title, description, instructor, cover_url, video_url, duration)
VALUES 
  (
    gen_random_uuid(),
    'AI基础入门',
    '从零开始学习人工智能的基础概念、原理和应用。涵盖机器学习、深度学习、神经网络等核心技术，适合初学者快速入门AI领域。',
    '李教授',
    'https://images.unsplash.com/photo-1555949963-aa79dcee981c?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    'https://qcn9ppuir8al.feishu.cn/wiki/RXgQwzm19ifoSLklKwLcXh0znEc?from=from_copylink',
    '4小时'
  ),
  (
    gen_random_uuid(),
    '机器学习实战',
    '通过实际项目学习机器学习算法的应用。包括数据预处理、特征工程、模型训练、评估和优化等完整流程，提供丰富的代码示例。',
    '王博士',
    'https://images.unsplash.com/photo-1518186285589-2f7649de83e0?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2340&q=80',
    'https://qcn9ppuir8al.feishu.cn/wiki/RXgQwzm19ifoSLklKwLcXh0znEc?from=from_copylink',
    '6小时'
  ),
  (
    gen_random_uuid(),
    'Python编程基础',
    'Python语言入门课程，涵盖语法基础、数据结构、函数、面向对象编程等核心概念。包含大量练习题和实战项目，帮助学员快速掌握Python编程。',
    '陈老师',
    'https://images.unsplash.com/photo-1526379095098-d400fd0bf935?ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D&auto=format&fit=crop&w=2232&q=80',
    'https://qcn9ppuir8al.feishu.cn/wiki/RXgQwzm19ifoSLklKwLcXh0znEc?from=from_copylink',
    '8小时'
  );

-- 获取刚插入的课程ID
WITH course_ids AS (
  SELECT id, title FROM courses WHERE title IN ('AI基础入门', '机器学习实战', 'Python编程基础')
)

-- 为每个课程插入资料
INSERT INTO course_materials (course_id, file_name, file_type, file_size, file_url)
SELECT
  c.id,
  CASE 
    WHEN c.title = 'AI基础入门' THEN 'AI基础知识手册.pdf'
    WHEN c.title = '机器学习实战' THEN '机器学习算法代码.zip'
    WHEN c.title = 'Python编程基础' THEN 'Python入门指南.pdf'
  END as file_name,
  CASE 
    WHEN c.title = 'AI基础入门' THEN 'application/pdf'
    WHEN c.title = '机器学习实战' THEN 'application/zip'
    WHEN c.title = 'Python编程基础' THEN 'application/pdf'
  END as file_type,
  CASE 
    WHEN c.title = 'AI基础入门' THEN '2.3 MB'
    WHEN c.title = '机器学习实战' THEN '15.7 MB'
    WHEN c.title = 'Python编程基础' THEN '1.8 MB'
  END as file_size,
  CASE 
    WHEN c.title = 'AI基础入门' THEN '#demo-file-ai-manual'
    WHEN c.title = '机器学习实战' THEN '#demo-file-ml-code'
    WHEN c.title = 'Python编程基础' THEN '#demo-file-python-guide'
  END as file_url
FROM course_ids c;

-- 再为每个课程插入第二个资料
INSERT INTO course_materials (course_id, file_name, file_type, file_size, file_url)
SELECT
  c.id,
  CASE 
    WHEN c.title = 'AI基础入门' THEN 'AI发展历史.docx'
    WHEN c.title = '机器学习实战' THEN '项目案例分析.pdf'
    WHEN c.title = 'Python编程基础' THEN 'Python练习题.txt'
  END as file_name,
  CASE 
    WHEN c.title = 'AI基础入门' THEN 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    WHEN c.title = '机器学习实战' THEN 'application/pdf'
    WHEN c.title = 'Python编程基础' THEN 'text/plain'
  END as file_type,
  CASE 
    WHEN c.title = 'AI基础入门' THEN '890 KB'
    WHEN c.title = '机器学习实战' THEN '3.2 MB'
    WHEN c.title = 'Python编程基础' THEN '156 KB'
  END as file_size,
  CASE 
    WHEN c.title = 'AI基础入门' THEN '#demo-file-ai-history'
    WHEN c.title = '机器学习实战' THEN '#demo-file-ml-cases'
    WHEN c.title = 'Python编程基础' THEN '#demo-file-python-exercises'
  END as file_url
FROM course_ids c;

-- 验证插入结果
SELECT '✅ 数据插入完成！' as 状态;
SELECT '📚 课程' as 类型, COUNT(*) as 数量, STRING_AGG(title, ', ') as 列表 FROM courses;
SELECT '👥 用户' as 类型, COUNT(*) as 数量, STRING_AGG(name, ', ') as 列表 FROM authorized_users;
SELECT '📁 资料' as 类型, COUNT(*) as 数量, STRING_AGG(file_name, ', ') as 列表 FROM course_materials;

-- 显示课程ID用于调试
SELECT 
  id as 课程ID,
  title as 课程标题,
  instructor as 讲师
FROM courses
ORDER BY title;
