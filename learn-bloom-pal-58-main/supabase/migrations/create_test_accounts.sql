-- 创建测试账号的SQL脚本
-- 这个脚本将创建管理员和学员测试账号

-- 首先清理可能存在的测试账号
DELETE FROM auth.users WHERE email IN ('admin@test.com', 'student@test.com');
DELETE FROM public.authorized_users WHERE email IN ('admin@test.com', 'student@test.com');

-- 创建测试管理员账号
-- 注意：在实际的Supabase环境中，用户账号需要通过Auth API创建
-- 这里我们先在authorized_users表中添加记录
INSERT INTO public.authorized_users (email, name, role, status)
VALUES 
  ('admin@test.com', '测试管理员', 'admin', 'active'),
  ('student@test.com', '测试学员', 'student', 'active')
ON CONFLICT (email) DO UPDATE SET
  name = EXCLUDED.name,
  role = EXCLUDED.role,
  status = EXCLUDED.status;

-- 验证插入结果
SELECT email, name, role FROM public.authorized_users 
WHERE email IN ('admin@test.com', 'student@test.com');