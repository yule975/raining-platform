-- 修复现有student@test.com用户的数据关联
-- 该用户已存在于auth.users中，我们只需要建立正确的关联

DO $$
DECLARE
    existing_user_id UUID;
    current_session_id UUID;
BEGIN
    -- 第一步：获取现有用户的ID
    SELECT id INTO existing_user_id 
    FROM auth.users 
    WHERE email = 'student@test.com' 
    LIMIT 1;
    
    IF existing_user_id IS NULL THEN
        RAISE EXCEPTION '未找到email为student@test.com的用户';
    END IF;
    
    RAISE NOTICE '✅ 找到现有Auth用户ID: %', existing_user_id;
    
    -- 第二步：设置当前期次
    UPDATE training_sessions SET is_current = false;
    DELETE FROM training_sessions WHERE name = '三期训战营';
    
    INSERT INTO training_sessions (name, description, start_date, end_date, status, is_current) 
    VALUES ('三期训战营', 'AI技术培训三期', '2025-09-17', '2025-12-31', 'active', true);
    
    SELECT id INTO current_session_id FROM training_sessions WHERE name = '三期训战营' AND is_current = true LIMIT 1;
    RAISE NOTICE '✅ 当前期次ID: %', current_session_id;
    
    -- 第三步：创建或更新authorized_users记录
    INSERT INTO authorized_users (name, email, status, role) 
    VALUES ('测试学员', 'student@test.com', 'active', 'student')
    ON CONFLICT (email) DO UPDATE SET
        name = '测试学员',
        status = 'active',
        role = 'student';
    
    RAISE NOTICE '✅ 更新authorized_users记录';
    
    -- 第四步：创建或更新profiles记录
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (existing_user_id, 'student@test.com', '测试学员', 'student')
    ON CONFLICT (id) DO UPDATE SET
        email = 'student@test.com',
        full_name = '测试学员',
        role = 'student';
    
    RAISE NOTICE '✅ 创建/更新profiles记录';
    
    -- 第五步：清理旧的期次分配并重新分配
    DELETE FROM session_students WHERE user_id = existing_user_id;
    INSERT INTO session_students (session_id, user_id, status)
    VALUES (current_session_id, existing_user_id, 'active');
    
    RAISE NOTICE '✅ 分配到当前期次成功';
    
    -- 第六步：重置用户密码为123456（如果需要）
    UPDATE auth.users 
    SET encrypted_password = crypt('123456', gen_salt('bf')),
        email_confirmed_at = COALESCE(email_confirmed_at, NOW())
    WHERE id = existing_user_id;
    
    RAISE NOTICE '✅ 重置密码为: 123456，确认邮箱验证';
    
    RAISE NOTICE '🎉 所有设置完成！用户可以使用以下信息登录：';
    RAISE NOTICE '   邮箱: student@test.com';
    RAISE NOTICE '   密码: 123456';
    
END $$;

-- 验证完整的数据链
SELECT '=== 🔍 验证完整数据链 ===' as title;

-- Auth用户信息
SELECT 
    '1️⃣ Auth Users' as step,
    id as user_id,
    email,
    email_confirmed_at IS NOT NULL as email_confirmed,
    created_at
FROM auth.users 
WHERE email = 'student@test.com';

-- Profiles信息  
SELECT 
    '2️⃣ Profiles' as step,
    id as user_id,
    email,
    full_name,
    role
FROM profiles 
WHERE email = 'student@test.com';

-- Authorized Users信息
SELECT 
    '3️⃣ Authorized Users' as step,
    email,
    name,
    role,
    status
FROM authorized_users 
WHERE email = 'student@test.com';

-- 当前期次信息
SELECT 
    '4️⃣ Current Session' as step,
    id as session_id,
    name,
    status,
    is_current,
    start_date,
    end_date
FROM training_sessions 
WHERE is_current = true;

-- 期次分配信息
SELECT 
    '5️⃣ Session Assignment' as step,
    ss.session_id,
    ts.name as session_name,
    p.email as student_email,
    p.full_name as student_name,
    ss.status as enrollment_status,
    ss.enrolled_at
FROM session_students ss
JOIN training_sessions ts ON ss.session_id = ts.id
JOIN profiles p ON ss.user_id = p.id
WHERE p.email = 'student@test.com';

-- 最终状态检查
SELECT '=== 📊 最终状态检查 ===' as title;

SELECT 
    '✅ 数据完整性验证' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'student@test.com' AND email_confirmed_at IS NOT NULL) 
        THEN '✅ Auth用户: 存在且已验证'
        WHEN EXISTS(SELECT 1 FROM auth.users WHERE email = 'student@test.com') 
        THEN '⚠️ Auth用户: 存在但未验证'
        ELSE '❌ Auth用户: 不存在'
    END as auth_status,
    
    CASE 
        WHEN EXISTS(SELECT 1 FROM profiles WHERE email = 'student@test.com' AND role = 'student') 
        THEN '✅ Profile: 存在且角色正确'
        WHEN EXISTS(SELECT 1 FROM profiles WHERE email = 'student@test.com') 
        THEN '⚠️ Profile: 存在但角色不正确'
        ELSE '❌ Profile: 不存在'
    END as profile_status,
    
    CASE 
        WHEN EXISTS(SELECT 1 FROM authorized_users WHERE email = 'student@test.com' AND status = 'active') 
        THEN '✅ 授权用户: 存在且激活'
        WHEN EXISTS(SELECT 1 FROM authorized_users WHERE email = 'student@test.com') 
        THEN '⚠️ 授权用户: 存在但未激活'
        ELSE '❌ 授权用户: 不存在'
    END as authorized_status,
    
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM session_students ss 
            JOIN profiles p ON ss.user_id = p.id 
            JOIN training_sessions ts ON ss.session_id = ts.id 
            WHERE p.email = 'student@test.com' AND ts.is_current = true AND ss.status = 'active'
        ) 
        THEN '✅ 期次分配: 已正确分配到当前期次'
        ELSE '❌ 期次分配: 未分配到当前期次'
    END as session_assignment_status,
    
    CASE 
        WHEN EXISTS(SELECT 1 FROM training_sessions WHERE is_current = true AND status = 'active') 
        THEN '✅ 当前期次: 存在且激活'
        ELSE '❌ 当前期次: 不存在或未激活'
    END as current_session_status;

-- API测试查询（模拟前端调用）
SELECT '=== 🔬 API测试查询 ===' as title;

-- 模拟 /api/training-sessions/current 查询
SELECT 
    'API: /api/training-sessions/current' as api_endpoint,
    id,
    name,
    description,
    status,
    is_current,
    start_date,
    end_date
FROM training_sessions 
WHERE is_current = true AND status = 'active'
LIMIT 1;

-- 模拟学员期次验证查询
SELECT 
    'API: 学员期次验证' as api_endpoint,
    p.email,
    p.full_name,
    p.role,
    ts.name as current_session,
    ss.status as enrollment_status
FROM profiles p
JOIN session_students ss ON p.id = ss.user_id
JOIN training_sessions ts ON ss.session_id = ts.id
WHERE p.email = 'student@test.com' AND ts.is_current = true;

SELECT '=== 🎯 登录测试信息 ===' as title;
SELECT 
    '现在可以使用以下信息测试登录:' as instruction,
    'student@test.com' as email,
    '123456' as password,
    '应该能够正常进入系统并看到当前期次' as expected_result;
