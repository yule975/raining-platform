-- 完整的学员账户创建脚本
-- 一键创建真实的Supabase Auth用户和完整的数据关联
-- 请在Supabase SQL Editor中执行（需要service_role权限）

-- 第一步：创建真实的Auth用户
DO $$
DECLARE
    new_user_id UUID := gen_random_uuid();
    current_session_id UUID;
BEGIN
    -- 创建auth.users记录
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        recovery_sent_at,
        last_sign_in_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        new_user_id,
        'authenticated',
        'authenticated',
        'student@test.com',
        '$2a$10$XYZ123...', -- 默认密码hash，实际会被重置
        NOW(),
        NOW(),
        NOW(),
        '{"provider":"email","providers":["email"]}',
        '{"full_name":"测试学员","avatar_url":""}',
        NOW(),
        NOW(),
        '',
        '',
        '',
        ''
    );
    
    RAISE NOTICE '创建Auth用户成功，ID: %', new_user_id;
    
    -- 第二步：设置当前期次
    UPDATE training_sessions SET is_current = false;
    DELETE FROM training_sessions WHERE name = '三期训战营';
    
    INSERT INTO training_sessions (name, description, start_date, end_date, status, is_current) 
    VALUES ('三期训战营', 'AI技术培训三期', '2025-09-17', '2025-12-31', 'active', true);
    
    SELECT id INTO current_session_id FROM training_sessions WHERE name = '三期训战营' AND is_current = true LIMIT 1;
    RAISE NOTICE '当前期次ID: %', current_session_id;
    
    -- 第三步：创建authorized_users记录
    INSERT INTO authorized_users (name, email, status, role) 
    VALUES ('测试学员', 'student@test.com', 'active', 'student')
    ON CONFLICT (email) DO UPDATE SET
        name = '测试学员',
        status = 'active',
        role = 'student';
    
    -- 第四步：创建profiles记录
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
        new_user_id,
        'student@test.com',
        '测试学员',
        'student'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = 'student@test.com',
        full_name = '测试学员',
        role = 'student';
    
    RAISE NOTICE '创建profiles记录成功';
    
    -- 第五步：分配到期次
    DELETE FROM session_students WHERE user_id = new_user_id;
    INSERT INTO session_students (session_id, user_id, status)
    VALUES (current_session_id, new_user_id, 'active');
    
    RAISE NOTICE '分配到期次成功';
    
    -- 第六步：设置用户密码（使用简单密码）
    UPDATE auth.users 
    SET encrypted_password = crypt('123456', gen_salt('bf'))
    WHERE id = new_user_id;
    
    RAISE NOTICE '设置密码成功，密码为: 123456';
    
END $$;

-- 验证创建结果
SELECT '=== 🎉 创建完成，验证结果 ===' as title;

-- 显示Auth用户
SELECT 
    '✅ Auth Users' as table_name,
    id,
    email,
    email_confirmed_at,
    created_at
FROM auth.users 
WHERE email = 'student@test.com'
ORDER BY created_at DESC
LIMIT 1;

-- 显示Profiles
SELECT 
    '✅ Profiles' as table_name,
    id,
    email,
    full_name,
    role
FROM profiles 
WHERE email = 'student@test.com';

-- 显示Authorized Users
SELECT 
    '✅ Authorized Users' as table_name,
    email,
    name,
    role,
    status
FROM authorized_users 
WHERE email = 'student@test.com';

-- 显示期次分配
SELECT 
    '✅ Session Assignment' as table_name,
    ts.name as session_name,
    ts.is_current,
    p.email as student_email,
    p.full_name as student_name,
    ss.status as enrollment_status
FROM session_students ss
JOIN training_sessions ts ON ss.session_id = ts.id
JOIN profiles p ON ss.user_id = p.id
WHERE p.email = 'student@test.com';

-- 最终状态检查
SELECT 
    '=== 📊 最终状态 ===' as title,
    (SELECT COUNT(*) FROM auth.users WHERE email = 'student@test.com') as auth_users_count,
    (SELECT COUNT(*) FROM profiles WHERE email = 'student@test.com') as profiles_count,
    (SELECT COUNT(*) FROM authorized_users WHERE email = 'student@test.com') as authorized_count,
    (SELECT COUNT(*) FROM session_students ss JOIN profiles p ON ss.user_id = p.id WHERE p.email = 'student@test.com') as session_assignment_count,
    (SELECT COUNT(*) FROM training_sessions WHERE is_current = true) as current_sessions_count;
