-- 简化版：适用于权限受限的情况
-- 如果无法直接操作auth.users表，请先手动创建用户，然后执行此脚本

-- 第一步：设置当前期次
UPDATE training_sessions SET is_current = false;
DELETE FROM training_sessions WHERE name = '三期训战营';

INSERT INTO training_sessions (name, description, start_date, end_date, status, is_current) 
VALUES ('三期训战营', 'AI技术培训三期', '2025-09-17', '2025-12-31', 'active', true);

-- 第二步：创建authorized_users记录
INSERT INTO authorized_users (name, email, status, role) 
VALUES ('测试学员', 'student@test.com', 'active', 'student')
ON CONFLICT (email) DO UPDATE SET
    name = '测试学员',
    status = 'active',
    role = 'student';

-- 第三步：为任何email为student@test.com的现有auth用户创建关联
-- 这个脚本会自动找到对应的auth用户ID
DO $$
DECLARE
    auth_user_id UUID;
    current_session_id UUID;
BEGIN
    -- 尝试从现有的auth用户中找到student@test.com
    -- 注意：这需要该用户已经在Supabase Auth中存在
    
    -- 获取当前期次ID
    SELECT id INTO current_session_id FROM training_sessions WHERE name = '三期训战营' AND is_current = true LIMIT 1;
    
    IF current_session_id IS NULL THEN
        RAISE EXCEPTION '无法找到当前期次';
    END IF;
    
    -- 方法1：尝试从auth.users获取ID（如果有权限）
    BEGIN
        SELECT id INTO auth_user_id FROM auth.users WHERE email = 'student@test.com' LIMIT 1;
        
        IF auth_user_id IS NOT NULL THEN
            RAISE NOTICE '找到现有Auth用户: %', auth_user_id;
            
            -- 创建profiles记录
            INSERT INTO profiles (id, email, full_name, role)
            VALUES (auth_user_id, 'student@test.com', '测试学员', 'student')
            ON CONFLICT (id) DO UPDATE SET
                email = 'student@test.com',
                full_name = '测试学员',
                role = 'student';
            
            -- 分配到期次
            DELETE FROM session_students WHERE user_id = auth_user_id;
            INSERT INTO session_students (session_id, user_id, status)
            VALUES (current_session_id, auth_user_id, 'active');
            
            RAISE NOTICE '✅ 成功创建完整的用户关联';
        ELSE
            RAISE NOTICE '❌ 未找到email为student@test.com的Auth用户';
            RAISE NOTICE '请先在Supabase Dashboard中创建该用户，然后重新执行此脚本';
        END IF;
        
    EXCEPTION WHEN OTHERS THEN
        RAISE NOTICE '❌ 无法访问auth.users表，可能权限不足';
        RAISE NOTICE '请先在Supabase Dashboard中创建用户：';
        RAISE NOTICE '1. 进入Authentication > Users';
        RAISE NOTICE '2. 点击Add user > Create new user';
        RAISE NOTICE '3. Email: student@test.com, Password: 123456';
        RAISE NOTICE '4. 勾选Email Confirm，然后Create user';
        RAISE NOTICE '5. 创建用户后，重新执行此脚本';
    END;
END $$;

-- 验证结果
SELECT '=== 验证创建结果 ===' as title;

-- 显示Profiles（如果创建成功）
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

-- 状态检查
SELECT 
    '=== 状态检查 ===' as title,
    CASE 
        WHEN EXISTS(SELECT 1 FROM authorized_users WHERE email = 'student@test.com') 
        THEN '✅ authorized_users: 存在'
        ELSE '❌ authorized_users: 缺失'
    END as authorized_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM profiles WHERE email = 'student@test.com') 
        THEN '✅ profiles: 存在'
        ELSE '❌ profiles: 需要先创建Auth用户'
    END as profile_status,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM session_students ss 
            JOIN profiles p ON ss.user_id = p.id 
            WHERE p.email = 'student@test.com'
        ) 
        THEN '✅ session_students: 已分配'
        ELSE '❌ session_students: 未分配'
    END as session_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM training_sessions WHERE is_current = true) 
        THEN '✅ 当前期次: 存在'
        ELSE '❌ 当前期次: 缺失'
    END as current_session_status;
