-- 创建测试学员数据并分配到期次

-- 1. 确保当前期次存在
INSERT INTO training_sessions (name, description, start_date, end_date, status, is_current) 
VALUES ('三期训战营', 'AI技术培训三期', '2025-09-17', '2025-09-30', 'active', true)
ON CONFLICT DO NOTHING;

-- 获取当前期次ID
DO $$
DECLARE
    current_session_id UUID;
    test_user_id UUID;
    i INTEGER;
BEGIN
    -- 获取当前期次ID
    SELECT id INTO current_session_id 
    FROM training_sessions 
    WHERE is_current = true 
    LIMIT 1;
    
    IF current_session_id IS NULL THEN
        RAISE EXCEPTION '没有找到当前期次';
    END IF;
    
    -- 创建17个测试学员
    FOR i IN 1..17 LOOP
        -- 插入到 authorized_users
        INSERT INTO authorized_users (name, email, status, role)
        VALUES (
            CASE 
                WHEN i = 1 THEN '测试学员'
                WHEN i = 2 THEN '王亚东'
                WHEN i = 3 THEN '陈建雄'
                WHEN i = 4 THEN '刘宇豪'
                WHEN i = 5 THEN '李学菲'
                ELSE '学员' || i::text
            END,
            CASE 
                WHEN i = 1 THEN 'student@test.com'
                ELSE 'student' || i::text || '@example.com'
            END,
            'active',
            'student'
        )
        ON CONFLICT (email) DO NOTHING;
        
        -- 创建对应的Auth用户和Profile
        INSERT INTO auth.users (
            id,
            instance_id,
            email,
            encrypted_password,
            email_confirmed_at,
            created_at,
            updated_at,
            raw_app_meta_data,
            raw_user_meta_data,
            role,
            aud
        )
        SELECT 
            gen_random_uuid(),
            '00000000-0000-0000-0000-000000000000',
            CASE 
                WHEN i = 1 THEN 'student@test.com'
                ELSE 'student' || i::text || '@example.com'
            END,
            crypt('password123', gen_salt('bf')),
            NOW(),
            NOW(),
            NOW(),
            '{"provider": "email", "providers": ["email"]}',
            '{"full_name": "' || 
                CASE 
                    WHEN i = 1 THEN '测试学员'
                    WHEN i = 2 THEN '王亚东'
                    WHEN i = 3 THEN '陈建雄'
                    WHEN i = 4 THEN '刘宇豪'
                    WHEN i = 5 THEN '李学菲'
                    ELSE '学员' || i::text
                END || '"}',
            'authenticated',
            'authenticated'
        WHERE NOT EXISTS (
            SELECT 1 FROM auth.users 
            WHERE email = CASE 
                WHEN i = 1 THEN 'student@test.com'
                ELSE 'student' || i::text || '@example.com'
            END
        )
        RETURNING id INTO test_user_id;
        
        -- 如果用户已存在，获取其ID
        IF test_user_id IS NULL THEN
            SELECT id INTO test_user_id 
            FROM auth.users 
            WHERE email = CASE 
                WHEN i = 1 THEN 'student@test.com'
                ELSE 'student' || i::text || '@example.com'
            END;
        END IF;
        
        -- 创建Profile
        INSERT INTO profiles (id, email, full_name, role)
        VALUES (
            test_user_id,
            CASE 
                WHEN i = 1 THEN 'student@test.com'
                ELSE 'student' || i::text || '@example.com'
            END,
            CASE 
                WHEN i = 1 THEN '测试学员'
                WHEN i = 2 THEN '王亚东'
                WHEN i = 3 THEN '陈建雄'
                WHEN i = 4 THEN '刘宇豪'
                WHEN i = 5 THEN '李学菲'
                ELSE '学员' || i::text
            END,
            'student'
        )
        ON CONFLICT (id) DO UPDATE SET
            full_name = EXCLUDED.full_name,
            email = EXCLUDED.email;
        
        -- 分配到当前期次
        INSERT INTO session_students (session_id, user_id)
        VALUES (current_session_id, test_user_id)
        ON CONFLICT (session_id, user_id) DO NOTHING;
        
    END LOOP;
    
    RAISE NOTICE '成功创建17个测试学员并分配到期次: %', current_session_id;
END $$;

-- 验证创建结果
SELECT 
    'authorized_users' as table_name,
    COUNT(*) as count
FROM authorized_users
WHERE role = 'student'

UNION ALL

SELECT 
    'profiles' as table_name,
    COUNT(*) as count
FROM profiles
WHERE role = 'student'

UNION ALL

SELECT 
    'session_students' as table_name,
    COUNT(*) as count
FROM session_students
WHERE session_id = (SELECT id FROM training_sessions WHERE is_current = true LIMIT 1);
