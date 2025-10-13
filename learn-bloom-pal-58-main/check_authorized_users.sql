-- 查询authorized_users表中的测试账号
SELECT 
    id,
    email,
    name,
    role,
    status,
    added_at
FROM public.authorized_users 
WHERE email IN ('student@test.com', 'admin@test.com')
ORDER BY added_at DESC;

-- 查询所有authorized_users（如果上面没有结果）
SELECT 
    id,
    email,
    name,
    role,
    status,
    added_at
FROM public.authorized_users 
ORDER BY added_at DESC;