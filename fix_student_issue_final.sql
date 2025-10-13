-- 最终修复版本：解决学员登录问题
-- 修复SQL约束错误并确保数据完整性

-- 第一步：清理和重新设置当前期次
-- 先清除所有期次的current标记
UPDATE training_sessions SET is_current = false;

-- 删除可能存在的测试期次（避免重复）
DELETE FROM training_sessions WHERE name = '三期训战营';

-- 创建新的当前期次
INSERT INTO training_sessions (name, description, start_date, end_date, status, is_current) 
VALUES ('三期训战营', 'AI技术培训三期', '2025-09-17', '2025-12-31', 'active', true);

-- 第二步：确保测试学员存在于authorized_users表
INSERT INTO authorized_users (name, email, status, role) 
VALUES ('测试学员', 'student@test.com', 'active', 'student')
ON CONFLICT (email) DO UPDATE SET
    name = '测试学员',
    status = 'active',
    role = 'student';

-- 第三步：处理profiles表中的学员记录
DO $$
DECLARE
    current_session_id UUID;
    student_user_id UUID;
BEGIN
    -- 获取刚创建的当前期次ID
    SELECT id INTO current_session_id FROM training_sessions WHERE name = '三期训战营' AND is_current = true LIMIT 1;
    
    IF current_session_id IS NULL THEN
        RAISE EXCEPTION '无法找到当前期次';
    END IF;
    
    RAISE NOTICE '当前期次ID: %', current_session_id;
    
    -- 检查profiles表中是否存在该学员
    SELECT id INTO student_user_id FROM profiles WHERE email = 'student@test.com' LIMIT 1;
    
    IF student_user_id IS NULL THEN
        -- 不存在，创建新记录
        INSERT INTO profiles (id, email, full_name, role)
        VALUES (
            gen_random_uuid(),
            'student@test.com',
            '测试学员',
            'student'
        )
        RETURNING id INTO student_user_id;
        
        RAISE NOTICE '创建了新的profile记录: %', student_user_id;
    ELSE
        -- 存在，更新信息
        UPDATE profiles 
        SET full_name = '测试学员',
            role = 'student'
        WHERE id = student_user_id;
        
        RAISE NOTICE '更新了现有profile记录: %', student_user_id;
    END IF;
    
    -- 第四步：清理该学员的旧期次分配
    DELETE FROM session_students WHERE user_id = student_user_id;
    
    -- 重新分配学员到当前期次
    INSERT INTO session_students (session_id, user_id, status)
    VALUES (current_session_id, student_user_id, 'active');
    
    RAISE NOTICE '成功分配学员到期次: % -> %', student_user_id, current_session_id;
END $$;

-- 第五步：创建其他测试学员
INSERT INTO authorized_users (name, email, status, role) VALUES
('王亚东', 'student2@example.com', 'active', 'student'),
('陈建雄', 'student3@example.com', 'active', 'student'),
('刘宇豪', 'student4@example.com', 'active', 'student'),
('李学菲', 'student5@example.com', 'active', 'student')
ON CONFLICT (email) DO NOTHING;

-- 为其他测试学员创建profiles并分配期次
DO $$
DECLARE
    session_id UUID;
    student_record RECORD;
    user_id UUID;
BEGIN
    SELECT id INTO session_id FROM training_sessions WHERE name = '三期训战营' AND is_current = true LIMIT 1;
    
    FOR student_record IN 
        SELECT 'student2@example.com' as email, '王亚东' as name
        UNION ALL SELECT 'student3@example.com', '陈建雄'
        UNION ALL SELECT 'student4@example.com', '刘宇豪'
        UNION ALL SELECT 'student5@example.com', '李学菲'
    LOOP
        -- 创建或获取profile
        SELECT id INTO user_id FROM profiles WHERE email = student_record.email;
        IF user_id IS NULL THEN
            INSERT INTO profiles (id, email, full_name, role)
            VALUES (gen_random_uuid(), student_record.email, student_record.name, 'student')
            RETURNING id INTO user_id;
        END IF;
        
        -- 清理旧分配并重新分配
        DELETE FROM session_students WHERE user_id = user_id;
        INSERT INTO session_students (session_id, user_id, status)
        VALUES (session_id, user_id, 'active');
    END LOOP;
END $$;

-- 第六步：验证结果
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

SELECT '=== 验证学员数据 ===' as title;

-- 检查student@test.com的完整数据链
SELECT 
    'student@test.com 数据验证' as check_type,
    au.email as authorized_email,
    au.name as authorized_name,
    p.email as profile_email,
    p.full_name as profile_name,
    ts.name as session_name,
    ss.status as enrollment_status
FROM authorized_users au
LEFT JOIN profiles p ON au.email = p.email
LEFT JOIN session_students ss ON p.id = ss.user_id
LEFT JOIN training_sessions ts ON ss.session_id = ts.id AND ts.is_current = true
WHERE au.email = 'student@test.com';

-- 统计信息
SELECT '=== 统计信息 ===' as title;

SELECT 
    (SELECT COUNT(*) FROM training_sessions WHERE is_current = true) as current_sessions,
    (SELECT COUNT(*) FROM authorized_users WHERE role = 'student') as total_authorized_students,
    (SELECT COUNT(*) FROM profiles WHERE role = 'student') as total_student_profiles,
    (SELECT COUNT(*) FROM session_students ss JOIN training_sessions ts ON ss.session_id = ts.id WHERE ts.is_current = true) as current_session_enrollments;
