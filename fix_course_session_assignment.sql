-- 修复课程期次关联问题
-- 将所有已发布的课程分配给当前期次

DO $$
DECLARE
    current_session_id UUID;
    course_record RECORD;
    assigned_count INTEGER := 0;
BEGIN
    -- 第一步：获取当前期次ID
    SELECT id INTO current_session_id 
    FROM training_sessions 
    WHERE is_current = true AND status = 'active'
    LIMIT 1;
    
    IF current_session_id IS NULL THEN
        RAISE EXCEPTION '未找到当前活跃的期次';
    END IF;
    
    RAISE NOTICE '✅ 找到当前期次ID: %', current_session_id;
    
    -- 第二步：为所有已发布的课程创建期次关联
    FOR course_record IN 
        SELECT id, title, instructor, status 
        FROM courses 
        WHERE status = 'published'
        ORDER BY created_at
    LOOP
        -- 检查是否已经存在关联
        IF NOT EXISTS(
            SELECT 1 FROM session_courses 
            WHERE session_id = current_session_id 
            AND course_id = course_record.id
        ) THEN
            -- 创建新的关联
            INSERT INTO session_courses (session_id, course_id, is_active, added_at)
            VALUES (current_session_id, course_record.id, true, NOW());
            
            assigned_count := assigned_count + 1;
            RAISE NOTICE '✅ 分配课程: % (ID: %)', course_record.title, course_record.id;
        ELSE
            RAISE NOTICE '⚠️ 课程已关联: % (ID: %)', course_record.title, course_record.id;
        END IF;
    END LOOP;
    
    RAISE NOTICE '🎉 完成！共分配 % 门课程到当前期次', assigned_count;
    
END $$;

-- 验证修复结果
SELECT '=== 📊 修复结果验证 ===' as title;

-- 显示当前期次信息
SELECT 
    '1️⃣ 当前期次' as step,
    id,
    name,
    status,
    is_current,
    start_date,
    end_date
FROM training_sessions 
WHERE is_current = true;

-- 显示所有课程
SELECT 
    '2️⃣ 所有课程' as step,
    id,
    title,
    instructor,
    status,
    created_at
FROM courses 
ORDER BY created_at DESC;

-- 显示期次课程关联
SELECT 
    '3️⃣ 期次课程关联' as step,
    sc.id as relation_id,
    ts.name as session_name,
    c.title as course_title,
    c.instructor,
    sc.is_active,
    sc.added_at
FROM session_courses sc
JOIN training_sessions ts ON sc.session_id = ts.id
JOIN courses c ON sc.course_id = c.id
WHERE ts.is_current = true
ORDER BY sc.added_at;

-- 统计信息
SELECT 
    '4️⃣ 统计数据' as step,
    (SELECT COUNT(*) FROM courses WHERE status = 'published') as total_published_courses,
    (SELECT COUNT(*) FROM training_sessions WHERE is_current = true) as current_sessions,
    (SELECT COUNT(*) FROM session_courses sc JOIN training_sessions ts ON sc.session_id = ts.id WHERE ts.is_current = true) as assigned_courses_count;

-- 检查未分配的课程
SELECT 
    '5️⃣ 未分配课程检查' as step,
    c.id,
    c.title,
    c.instructor,
    c.status,
    '❌ 未分配到当前期次' as issue
FROM courses c
LEFT JOIN session_courses sc ON c.id = sc.course_id 
LEFT JOIN training_sessions ts ON sc.session_id = ts.id AND ts.is_current = true
WHERE ts.id IS NULL 
  AND c.status = 'published'
ORDER BY c.created_at DESC;

-- 模拟API调用结果
SELECT '=== 🧪 API调用模拟 ===' as title;

-- 模拟前端 getSessionCourses 调用
SELECT 
    'API: getSessionCourses 结果' as api_test,
    c.id,
    c.title,
    c.description,
    c.instructor,
    c.status,
    c.video_url,
    c.duration,
    c.thumbnail_url
FROM courses c
JOIN session_courses sc ON c.id = sc.course_id
JOIN training_sessions ts ON sc.session_id = ts.id
WHERE ts.is_current = true 
  AND ts.status = 'active'
  AND c.status = 'published'
  AND sc.is_active = true
ORDER BY sc.added_at;

-- 最终状态检查
SELECT '=== ✅ 最终状态 ===' as title;

SELECT 
    '课程显示状态检查' as check_type,
    CASE 
        WHEN EXISTS(SELECT 1 FROM training_sessions WHERE is_current = true AND status = 'active') 
        THEN '✅ 当前期次: 存在且活跃'
        ELSE '❌ 当前期次: 不存在或未激活'
    END as session_status,
    
    CASE 
        WHEN (SELECT COUNT(*) FROM courses WHERE status = 'published') > 0
        THEN '✅ 已发布课程: ' || (SELECT COUNT(*) FROM courses WHERE status = 'published') || ' 门'
        ELSE '❌ 已发布课程: 无'
    END as courses_status,
    
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM session_courses sc 
            JOIN training_sessions ts ON sc.session_id = ts.id 
            WHERE ts.is_current = true AND sc.is_active = true
        )
        THEN '✅ 期次课程关联: ' || (
            SELECT COUNT(*) FROM session_courses sc 
            JOIN training_sessions ts ON sc.session_id = ts.id 
            WHERE ts.is_current = true AND sc.is_active = true
        ) || ' 个关联'
        ELSE '❌ 期次课程关联: 无'
    END as assignment_status,
    
    CASE 
        WHEN (
            SELECT COUNT(*) FROM session_courses sc 
            JOIN training_sessions ts ON sc.session_id = ts.id 
            WHERE ts.is_current = true AND sc.is_active = true
        ) = (SELECT COUNT(*) FROM courses WHERE status = 'published')
        THEN '✅ 所有课程已正确关联到当前期次'
        ELSE '⚠️ 还有课程未关联到当前期次'
    END as final_status;

SELECT '🎯 修复完成！现在刷新课程中心页面应该能看到课程了！' as success_message;
