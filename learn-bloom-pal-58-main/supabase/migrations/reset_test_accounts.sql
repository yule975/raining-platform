-- 完全删除现有测试账号并重新创建
-- 1. 删除authorized_users表中的测试账号记录
DELETE FROM authorized_users WHERE email IN ('student@test.com', 'admin@test.com');

-- 2. 删除Supabase Auth中的用户（需要使用service_role权限）
-- 注意：这需要在Supabase Dashboard中手动删除或使用管理API

-- 3. 重新创建测试账号记录
INSERT INTO authorized_users (email, name, role, status, department, notes) VALUES
('student@test.com', '测试学员', 'student', 'active', '测试部门', '测试学员账号'),
('admin@test.com', '测试管理员', 'admin', 'active', '管理部门', '测试管理员账号');

-- 4. 确保权限设置正确
GRANT SELECT, INSERT, UPDATE, DELETE ON authorized_users TO authenticated;
GRANT SELECT ON authorized_users TO anon;

-- 5. 验证数据
SELECT * FROM authorized_users WHERE email IN ('student@test.com', 'admin@test.com');