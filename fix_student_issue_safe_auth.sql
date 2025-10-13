-- 安全版本：处理Auth约束的学员登录修复脚本
-- 解决 profiles 表外键约束问题

-- 第一步：清理和重新设置当前期次
UPDATE training_sessions SET is_current = false;
DELETE FROM training_sessions WHERE name = '三期训战营';

INSERT INTO training_sessions (name, description, start_date, end_date, status, is_current) 
VALUES ('三期训战营', 'AI技术培训三期', '2025-09-17', '2025-12-31', 'active', true);

-- 第二步：确保测试学员在authorized_users表中存在
INSERT INTO authorized_users (name, email, status, role) 
VALUES ('测试学员', 'student@test.com', 'active', 'student')
ON CONFLICT (email) DO UPDATE SET
    name = '测试学员',
    status = 'active',
    role = 'student';

-- 第三步：安全处理profiles表（只更新现有记录，不创建新记录）
DO $$
DECLARE
    current_session_id UUID;
    student_user_id UUID;
    auth_user_record RECORD;
BEGIN
    -- 获取当前期次ID
    SELECT id INTO current_session_id FROM training_sessions WHERE name = '三期训战营' AND is_current = true LIMIT 1;
    
    IF current_session_id IS NULL THEN
        RAISE EXCEPTION '无法找到当前期次';
    END IF;
    
    RAISE NOTICE '当前期次ID: %', current_session_id;
    
    -- 查找现有的auth用户（通过email匹配）
    -- 注意：这里我们假设可能存在一些测试用户
    
    -- 方法1: 尝试查找现有的profiles记录
    SELECT id INTO student_user_id FROM profiles WHERE email = 'student@test.com' LIMIT 1;
    
    IF student_user_id IS NOT NULL THEN
        -- 存在profiles记录，更新它
        UPDATE profiles 
        SET full_name = '测试学员',
            role = 'student'
        WHERE id = student_user_id;
        
        RAISE NOTICE '更新了现有profile记录: %', student_user_id;
        
        -- 清理旧的期次分配并重新分配
        DELETE FROM session_students WHERE user_id = student_user_id;
        INSERT INTO session_students (session_id, user_id, status)
        VALUES (current_session_id, student_user_id, 'active');
        
        RAISE NOTICE '成功分配学员到期次: % -> %', student_user_id, current_session_id;
    ELSE
        -- 不存在profiles记录，检查是否有对应的auth用户
        -- 由于我们无法直接访问auth.users表，我们需要另一种方法
        
        RAISE NOTICE '未找到student@test.com的profile记录';
        RAISE NOTICE '请通过Supabase Auth创建该用户，或使用现有的认证用户';
        
        -- 为了演示，我们可以尝试查找任何现有的student角色用户
        SELECT id INTO student_user_id FROM profiles WHERE role = 'student' LIMIT 1;
        
        IF student_user_id IS NOT NULL THEN
            RAISE NOTICE '找到现有学生用户: %', student_user_id;
            -- 可以选择使用这个用户进行测试
        END IF;
    END IF;
    
END $$;

-- 第四步：为其他已存在的学员更新期次分配
DO $$
DECLARE
    session_id UUID;
    user_record RECORD;
BEGIN
    SELECT id INTO session_id FROM training_sessions WHERE name = '三期训战营' AND is_current = true LIMIT 1;
    
    -- 为所有现有的student角色用户分配到新期次
    FOR user_record IN 
        SELECT id, email, full_name FROM profiles WHERE role = 'student'
    LOOP
        -- 清理旧分配
        DELETE FROM session_students WHERE user_id = user_record.id;
        
        -- 重新分配到当前期次
        INSERT INTO session_students (session_id, user_id, status)
        VALUES (session_id, user_record.id, 'active');
        
        RAISE NOTICE '分配学员 % (%) 到期次', user_record.full_name, user_record.email;
    END LOOP;
END $$;

-- 第五步：验证结果
SELECT '=== 验证当前期次 ===' as title;

SELECT 
    id,
    name,
    status,
    is_current,
    start_date,
    end_date
FROM training_sessions 
WHERE is_current = true;

SELECT '=== 验证现有学员 ===' as title;

-- 显示所有现有的学员及其期次分配
SELECT 
    p.email,
    p.full_name,
    p.role,
    ts.name as session_name,
    ss.status as enrollment_status,
    CASE 
        WHEN p.email = 'student@test.com' THEN '✅ 目标用户'
        ELSE '📝 其他用户'
    END as user_type
FROM profiles p
LEFT JOIN session_students ss ON p.id = ss.user_id
LEFT JOIN training_sessions ts ON ss.session_id = ts.id AND ts.is_current = true
WHERE p.role = 'student'
ORDER BY user_type, p.email;

SELECT '=== 检查authorized_users ===' as title;

SELECT 
    email,
    name,
    role,
    status
FROM authorized_users 
WHERE email = 'student@test.com';

-- 第六步：统计信息
SELECT '=== 统计信息 ===' as title;

SELECT 
    (SELECT COUNT(*) FROM training_sessions WHERE is_current = true) as current_sessions,
    (SELECT COUNT(*) FROM authorized_users WHERE role = 'student') as total_authorized_students,
    (SELECT COUNT(*) FROM profiles WHERE role = 'student') as total_student_profiles,
    (SELECT COUNT(*) FROM session_students ss JOIN training_sessions ts ON ss.session_id = ts.id WHERE ts.is_current = true) as current_session_enrollments;

-- 第七步：问题诊断
SELECT '=== 问题诊断 ===' as title;

-- 检查student@test.com是否在各个表中
SELECT 
    'Data Check' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM authorized_users WHERE email = 'student@test.com') 
        THEN '✅ 在authorized_users中'
        ELSE '❌ 不在authorized_users中'
    END as authorized_status,
    CASE 
        WHEN EXISTS(SELECT 1 FROM profiles WHERE email = 'student@test.com') 
        THEN '✅ 在profiles中'
        ELSE '❌ 不在profiles中'
    END as profile_status,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM session_students ss 
            JOIN profiles p ON ss.user_id = p.id 
            JOIN training_sessions ts ON ss.session_id = ts.id 
            WHERE p.email = 'student@test.com' AND ts.is_current = true
        ) 
        THEN '✅ 已分配到当前期次'
        ELSE '❌ 未分配到当前期次'
    END as session_status;
