-- 修复学员登录问题的完整脚本
-- 解决 student@test.com 登录后显示"访问受限"和404错误的问题

-- 第一步：检查和创建培训期次
-- 确保有当前活跃的培训期次
UPDATE training_sessions SET is_current = false; -- 清除现有的当前期次标记

INSERT INTO training_sessions (name, description, start_date, end_date, status, is_current) 
VALUES ('三期训战营', 'AI技术培训三期', '2025-09-17', '2025-12-31', 'active', true)
ON CONFLICT (name) DO UPDATE SET
    is_current = true,
    status = 'active',
    end_date = '2025-12-31';

-- 第二步：确保测试学员存在于authorized_users表
INSERT INTO authorized_users (name, email, status, role) 
VALUES ('测试学员', 'student@test.com', 'active', 'student')
ON CONFLICT (email) DO UPDATE SET
    name = '测试学员',
    status = 'active',
    role = 'student';

-- 第三步：创建或更新profiles表中的学员记录
DO $$
DECLARE
    current_session_id UUID;
    student_user_id UUID;
BEGIN
    -- 获取当前期次ID
    SELECT id INTO current_session_id FROM training_sessions WHERE is_current = true LIMIT 1;
    
    IF current_session_id IS NULL THEN
        RAISE EXCEPTION '无法找到当前期次';
    END IF;
    
    -- 检查profiles表中是否存在该学员
    SELECT id INTO student_user_id FROM profiles WHERE email = 'student@test.com' LIMIT 1;
    
    IF student_user_id IS NULL THEN
        -- 不存在，创建新记录
        INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
        VALUES (
            gen_random_uuid(),
            'student@test.com',
            '测试学员',
            'student',
            NOW(),
            NOW()
        )
        RETURNING id INTO student_user_id;
        
        RAISE NOTICE '创建了新的profile记录: %', student_user_id;
    ELSE
        -- 存在，更新信息
        UPDATE profiles 
        SET full_name = '测试学员',
            role = 'student',
            updated_at = NOW()
        WHERE id = student_user_id;
        
        RAISE NOTICE '更新了现有profile记录: %', student_user_id;
    END IF;
    
    -- 第四步：分配学员到当前期次
    INSERT INTO session_students (session_id, user_id, status, enrolled_at)
    VALUES (current_session_id, student_user_id, 'active', NOW())
    ON CONFLICT (session_id, user_id) DO UPDATE SET
        status = 'active',
        enrolled_at = NOW();
    
    RAISE NOTICE '成功分配学员到期次: % -> %', student_user_id, current_session_id;
END $$;

-- 第五步：验证修复结果
SELECT 
    '=== 验证结果 ===' as title,
    '' as spacer;

-- 检查培训期次
SELECT 
    'training_sessions' as table_name,
    name,
    status,
    is_current,
    start_date,
    end_date
FROM training_sessions 
WHERE is_current = true;

-- 检查授权用户
SELECT 
    'authorized_users' as table_name,
    email,
    name,
    role,
    status
FROM authorized_users 
WHERE email = 'student@test.com';

-- 检查用户配置
SELECT 
    'profiles' as table_name,
    id,
    email,
    full_name,
    role
FROM profiles 
WHERE email = 'student@test.com';

-- 检查期次分配
SELECT 
    'session_students' as table_name,
    ss.session_id,
    ts.name as session_name,
    p.email,
    p.full_name,
    ss.status,
    ss.enrolled_at
FROM session_students ss
JOIN training_sessions ts ON ss.session_id = ts.id
JOIN profiles p ON ss.user_id = p.id
WHERE p.email = 'student@test.com';

-- 第六步：创建其他测试学员（如果需要）
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
    student_email TEXT;
    student_name TEXT;
    user_id UUID;
BEGIN
    SELECT id INTO session_id FROM training_sessions WHERE is_current = true LIMIT 1;
    
    -- 为每个测试学员创建完整记录
    FOR student_email, student_name IN 
        VALUES 
            ('student2@example.com', '王亚东'),
            ('student3@example.com', '陈建雄'),
            ('student4@example.com', '刘宇豪'),
            ('student5@example.com', '李学菲')
    LOOP
        -- 创建或获取profile
        SELECT id INTO user_id FROM profiles WHERE email = student_email;
        IF user_id IS NULL THEN
            INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
            VALUES (gen_random_uuid(), student_email, student_name, 'student', NOW(), NOW())
            RETURNING id INTO user_id;
        END IF;
        
        -- 分配到期次
        INSERT INTO session_students (session_id, user_id, status, enrolled_at)
        VALUES (session_id, user_id, 'active', NOW())
        ON CONFLICT (session_id, user_id) DO NOTHING;
    END LOOP;
END $$;

-- 最终统计
SELECT 
    '=== 最终统计 ===' as title,
    '' as spacer;

SELECT 
    COUNT(*) as total_students,
    '总学员数（authorized_users）' as description
FROM authorized_users 
WHERE role = 'student';

SELECT 
    COUNT(*) as total_profiles,
    '总配置数（profiles）' as description
FROM profiles 
WHERE role = 'student';

SELECT 
    COUNT(*) as total_enrollments,
    '当前期次注册数（session_students）' as description
FROM session_students ss
JOIN training_sessions ts ON ss.session_id = ts.id
WHERE ts.is_current = true;
