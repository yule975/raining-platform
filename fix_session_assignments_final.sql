-- 最终修复：将现有学员正确分配到三期训战营
-- 这是数据完整性修复，确保界面显示与数据库一致

-- 1. 清理和重建期次
UPDATE training_sessions SET is_current = false;

-- 检查三期训战营是否存在，不存在则创建
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM training_sessions WHERE name = '三期训战营') THEN
        INSERT INTO training_sessions (name, description, start_date, end_date, status, is_current) 
        VALUES ('三期训战营', 'AI技术培训三期', '2025-09-17', '2025-09-30', 'active', true);
    ELSE
        UPDATE training_sessions 
        SET is_current = true, status = 'active'
        WHERE name = '三期训战营';
    END IF;
END $$;

-- 2. 获取期次ID
DO $$
DECLARE
    current_session_id UUID;
    student_record RECORD;
    auth_user_id UUID;
BEGIN
    -- 获取三期训战营ID
    SELECT id INTO current_session_id FROM training_sessions WHERE name = '三期训战营' LIMIT 1;
    
    IF current_session_id IS NULL THEN
        RAISE EXCEPTION '无法找到三期训战营';
    END IF;
    
    RAISE NOTICE '期次ID: %', current_session_id;
    
    -- 3. 清理现有的期次分配
    DELETE FROM session_students WHERE session_id = current_session_id;
    
    -- 4. 为每个授权学员创建完整的账户链
    FOR student_record IN SELECT * FROM authorized_users WHERE role = 'student' LOOP
        BEGIN
            -- 创建或更新profiles记录
            -- 先检查是否已存在该邮箱的profile
            SELECT id INTO auth_user_id FROM profiles WHERE email = student_record.email;
            
            IF auth_user_id IS NULL THEN
                -- 不存在，创建新的
                INSERT INTO profiles (id, email, full_name, role, created_at, updated_at)
                VALUES (
                    gen_random_uuid(),
                    student_record.email,
                    student_record.name,
                    'student',
                    NOW(),
                    NOW()
                )
                RETURNING id INTO auth_user_id;
            ELSE
                -- 存在，更新信息
                UPDATE profiles 
                SET full_name = student_record.name, 
                    role = 'student', 
                    updated_at = NOW()
                WHERE id = auth_user_id;
            END IF;
            
            -- 分配到期次
            IF NOT EXISTS (SELECT 1 FROM session_students WHERE session_id = current_session_id AND user_id = auth_user_id) THEN
                INSERT INTO session_students (session_id, user_id, created_at)
                VALUES (current_session_id, auth_user_id, NOW());
            END IF;
            
            RAISE NOTICE '已分配学员: % (%) -> %', student_record.name, student_record.email, auth_user_id;
            
        EXCEPTION WHEN OTHERS THEN
            RAISE NOTICE '处理学员失败: % - %', student_record.name, SQLERRM;
        END;
    END LOOP;
END $$;

-- 5. 验证结果
SELECT 
    'authorized_users' as table_name,
    COUNT(*) as count,
    'student role' as description
FROM authorized_users 
WHERE role = 'student'

UNION ALL

SELECT 
    'profiles' as table_name,
    COUNT(*) as count,
    'student profiles' as description
FROM profiles 
WHERE role = 'student'

UNION ALL

SELECT 
    'session_students' as table_name,
    COUNT(*) as count,
    '三期训战营分配' as description
FROM session_students ss
JOIN training_sessions ts ON ss.session_id = ts.id
WHERE ts.name = '三期训战营'

UNION ALL

SELECT 
    'training_sessions' as table_name,
    1 as count,
    CASE WHEN is_current THEN '当前期次' ELSE '非当前期次' END as description
FROM training_sessions 
WHERE name = '三期训战营';
