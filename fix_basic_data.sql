-- 1. 创建当前期次（如果不存在）
INSERT INTO training_sessions (name, description, start_date, end_date, status, is_current) 
VALUES (
  '第一期', 
  'AI技术培训第一期', 
  CURRENT_DATE, 
  CURRENT_DATE + INTERVAL '3 months',
  'active', 
  true
) ON CONFLICT DO NOTHING;

-- 2. 获取或创建课程（基于现有作业的course_id）
DO $$
DECLARE
    assignment_course_id UUID;
    course_exists BOOLEAN;
BEGIN
    -- 获取作业的course_id
    SELECT course_id INTO assignment_course_id 
    FROM assignments 
    WHERE course_id IS NOT NULL 
    LIMIT 1;
    
    IF assignment_course_id IS NOT NULL THEN
        -- 检查课程是否存在
        SELECT EXISTS(SELECT 1 FROM courses WHERE id = assignment_course_id) INTO course_exists;
        
        IF NOT course_exists THEN
            -- 创建课程
            INSERT INTO courses (
                id, 
                title, 
                description, 
                instructor, 
                duration,
                cover,
                video_url,
                is_active
            ) VALUES (
                assignment_course_id,
                'Unit 1 - 提示词 = 把话讲清楚',
                'AI提示词基础课程',
                '讲师',
                '60分钟',
                'https://example.com/cover.jpg',
                'https://example.com/video',
                true
            );
            
            RAISE NOTICE '创建了课程: %', assignment_course_id;
        END IF;
        
        -- 3. 创建期次-课程关联
        INSERT INTO session_courses (session_id, course_id)
        SELECT ts.id, assignment_course_id
        FROM training_sessions ts 
        WHERE ts.is_current = true
        ON CONFLICT DO NOTHING;
        
        RAISE NOTICE '创建了期次-课程关联';
        
    ELSE
        RAISE NOTICE '没有找到作业，无法创建课程';
    END IF;
END $$;

-- 4. 为作业添加飞书链接（示例）
UPDATE assignments 
SET instructions = JSON_BUILD_OBJECT(
    'url', 'https://example.feishu.cn/form/xxx',
    'sessions', ARRAY(SELECT id::text FROM training_sessions WHERE is_current = true)
)::text
WHERE instructions IS NULL OR instructions = '';

-- 5. 验证数据
SELECT 
    'training_sessions' as table_name,
    COUNT(*) as count,
    STRING_AGG(name, ', ') as names
FROM training_sessions
WHERE is_current = true

UNION ALL

SELECT 
    'courses' as table_name,
    COUNT(*) as count,
    STRING_AGG(title, ', ') as names
FROM courses

UNION ALL

SELECT 
    'session_courses' as table_name,
    COUNT(*) as count,
    'relationships' as names
FROM session_courses

UNION ALL

SELECT 
    'assignments' as table_name,
    COUNT(*) as count,
    STRING_AGG(title, ', ') as names
FROM assignments
WHERE status = 'published';
