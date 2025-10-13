-- 完整的测试用户重建脚本
-- 1. 首先删除现有的测试用户（如果存在）
DELETE FROM auth.users WHERE email IN ('student@test.com', 'admin@test.com');
DELETE FROM public.authorized_users WHERE email IN ('student@test.com', 'admin@test.com');

-- 2. 重新插入authorized_users记录
INSERT INTO public.authorized_users (email, name, role, status) VALUES
('student@test.com', '测试学员', 'student', 'active'),
('admin@test.com', '测试管理员', 'admin', 'active')
ON CONFLICT (email) DO UPDATE SET
    name = EXCLUDED.name,
    role = EXCLUDED.role,
    status = EXCLUDED.status;

-- 3. 创建Auth用户（使用Supabase的内置函数）
-- 注意：这些用户需要通过Supabase Auth API创建，不能直接插入auth.users表
-- 以下是验证脚本，用于检查用户是否正确创建

-- 验证authorized_users表
SELECT 'authorized_users检查:' as check_type, email, name, role, status 
FROM public.authorized_users 
WHERE email IN ('student@test.com', 'admin@test.com');

-- 验证auth.users表
SELECT 'auth.users检查:' as check_type, email, email_confirmed_at, confirmed_at, created_at
FROM auth.users 
WHERE email IN ('student@test.com', 'admin@test.com');

-- 检查是否有其他用户
SELECT 'all_auth_users:' as check_type, email, created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;