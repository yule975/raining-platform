-- 为真实Supabase Auth用户创建完整的学员账户
-- 请先在Supabase Auth中创建 student@test.com 用户，然后执行此脚本

-- 重要：请将下面的 'YOUR_AUTH_USER_ID' 替换为从Supabase Auth获得的真实User UID

-- 第一步：设置当前期次
UPDATE training_sessions SET is_current = false;
DELETE FROM training_sessions WHERE name = '三期训战营';

INSERT INTO training_sessions (name, description, start_date, end_date, status, is_current) 
VALUES ('三期训战营', 'AI技术培训三期', '2025-09-17', '2025-12-31', 'active', true);

-- 第二步：确保authorized_users记录存在
INSERT INTO authorized_users (name, email, status, role) 
VALUES ('测试学员', 'student@test.com', 'active', 'student')
ON CONFLICT (email) DO UPDATE SET
    name = '测试学员',
    status = 'active',
    role = 'student';

-- 第三步：创建或更新profiles记录（使用真实的Auth User ID）
-- 🚨 重要：请将 'YOUR_AUTH_USER_ID' 替换为真实的User UID
DO $$
DECLARE
    real_auth_user_id UUID := 'YOUR_AUTH_USER_ID'; -- 🔴 请替换这个ID
    current_session_id UUID;
BEGIN
    -- 获取当前期次ID
    SELECT id INTO current_session_id FROM training_sessions WHERE name = '三期训战营' AND is_current = true LIMIT 1;
    
    IF current_session_id IS NULL THEN
        RAISE EXCEPTION '无法找到当前期次';
    END IF;
    
    RAISE NOTICE '当前期次ID: %', current_session_id;
    RAISE NOTICE '使用Auth用户ID: %', real_auth_user_id;
    
    -- 创建或更新profiles记录（使用真实的Auth User ID）
    INSERT INTO profiles (id, email, full_name, role)
    VALUES (
        real_auth_user_id,  -- 使用真实的Auth User ID
        'student@test.com',
        '测试学员',
        'student'
    )
    ON CONFLICT (id) DO UPDATE SET
        email = 'student@test.com',
        full_name = '测试学员',
        role = 'student';
    
    RAISE NOTICE '创建/更新了profile记录: %', real_auth_user_id;
    
    -- 清理旧的期次分配并重新分配
    DELETE FROM session_students WHERE user_id = real_auth_user_id;
    INSERT INTO session_students (session_id, user_id, status)
    VALUES (current_session_id, real_auth_user_id, 'active');
    
    RAISE NOTICE '成功分配学员到期次: % -> %', real_auth_user_id, current_session_id;
END $$;

-- 第四步：验证创建结果
SELECT '=== 验证Auth用户和Profile关联 ===' as title;

-- 显示profiles记录
SELECT 
    'profiles验证' as check_type,
    id as user_id,
    email,
    full_name,
    role
FROM profiles 
WHERE email = 'student@test.com';

-- 显示期次分配
SELECT 
    'session_students验证' as check_type,
    ss.user_id,
    ts.name as session_name,
    p.email,
    p.full_name,
    ss.status as enrollment_status
FROM session_students ss
JOIN training_sessions ts ON ss.session_id = ts.id
JOIN profiles p ON ss.user_id = p.id
WHERE p.email = 'student@test.com' AND ts.is_current = true;

-- 显示authorized_users记录
SELECT 
    'authorized_users验证' as check_type,
    email,
    name,
    role,
    status
FROM authorized_users 
WHERE email = 'student@test.com';

-- 第五步：完整验证
SELECT '=== 完整数据链验证 ===' as title;

SELECT 
    '数据完整性检查' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM authorized_users WHERE email = 'student@test.com') 
        THEN '✅ authorized_users: 存在'
        ELSE '❌ authorized_users: 缺失'
    END as authorized_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM profiles WHERE email = 'student@test.com') 
        THEN '✅ profiles: 存在'
        ELSE '❌ profiles: 缺失'
    END as profile_status,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM session_students ss 
            JOIN profiles p ON ss.user_id = p.id 
            JOIN training_sessions ts ON ss.session_id = ts.id 
            WHERE p.email = 'student@test.com' AND ts.is_current = true
        ) 
        THEN '✅ session_students: 已分配'
        ELSE '❌ session_students: 未分配'
    END as session_assignment_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM training_sessions WHERE is_current = true) 
        THEN '✅ 当前期次: 存在'
        ELSE '❌ 当前期次: 缺失'
    END as current_session_status;
