-- 查询Supabase Auth中的用户列表
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at,
    updated_at,
    last_sign_in_at,
    raw_user_meta_data,
    is_super_admin,
    deleted_at
FROM auth.users 
WHERE email IN ('student@test.com', 'admin@test.com')
ORDER BY created_at DESC;

-- 查询所有用户（如果上面没有结果）
SELECT 
    id,
    email,
    email_confirmed_at,
    confirmed_at,
    created_at
FROM auth.users 
ORDER BY created_at DESC
LIMIT 10;