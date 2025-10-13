-- 🔍 快速检查数据是否真的插入成功
-- 请在 Supabase SQL Editor 中执行

-- 检查课程数据
SELECT '📚 课程数据检查' as 检查项目;
SELECT COUNT(*) as 课程总数 FROM courses;

-- 显示课程详情
SELECT 
  id as 课程ID,
  title as 课程标题,
  instructor as 讲师,
  created_at as 创建时间
FROM courses
ORDER BY created_at;

-- 检查用户数据
SELECT '👥 用户数据检查' as 检查项目;
SELECT COUNT(*) as 用户总数 FROM authorized_users;

-- 检查资料数据
SELECT '📁 资料数据检查' as 检查项目;  
SELECT COUNT(*) as 资料总数 FROM course_materials;

-- 显示资料详情
SELECT 
  cm.file_name as 资料名称,
  c.title as 所属课程,
  cm.file_size as 文件大小
FROM course_materials cm
JOIN courses c ON cm.course_id = c.id
ORDER BY c.title, cm.file_name;

SELECT '✅ 数据检查完成' as 状态;
