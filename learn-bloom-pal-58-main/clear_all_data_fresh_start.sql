-- 完整数据清理脚本 - 全新开始
-- 注意：这将删除所有现有数据！

-- 1. 清除所有业务数据表
DELETE FROM assignment_submissions;
DELETE FROM assignments;
DELETE FROM session_students;
DELETE FROM sessions;
DELETE FROM courses;

-- 2. 清除用户相关数据（保留认证用户）
DELETE FROM profiles WHERE email NOT IN ('xiewenxuan001@51Talk.com', '2440164519@qq.com');

-- 3. 重置序列（如果有的话）
-- ALTER SEQUENCE courses_id_seq RESTART WITH 1;
-- ALTER SEQUENCE sessions_id_seq RESTART WITH 1;
-- ALTER SEQUENCE assignments_id_seq RESTART WITH 1;

-- 4. 确保管理员用户存在于authorized_users表
INSERT INTO authorized_users (email, role, name, created_at) 
VALUES 
  ('xiewenxuan001@51Talk.com', 'admin', '谢文轩', NOW()),
  ('2440164519@qq.com', 'student', '测试学员', NOW())
ON CONFLICT (email) DO UPDATE SET
  role = EXCLUDED.role,
  name = EXCLUDED.name,
  updated_at = NOW();

-- 5. 验证清理结果
SELECT 'courses' as table_name, COUNT(*) as record_count FROM courses
UNION ALL
SELECT 'sessions' as table_name, COUNT(*) as record_count FROM sessions  
UNION ALL
SELECT 'assignments' as table_name, COUNT(*) as record_count FROM assignments
UNION ALL
SELECT 'assignment_submissions' as table_name, COUNT(*) as record_count FROM assignment_submissions
UNION ALL
SELECT 'authorized_users' as table_name, COUNT(*) as record_count FROM authorized_users
UNION ALL
SELECT 'profiles' as table_name, COUNT(*) as record_count FROM profiles;
