-- 验证作业期次限制修复结果
-- 检查学员是否能看到作业

SELECT '=== 🔍 验证修复结果 ===' as title;

-- 1. 检查当前期次
WITH current_session_info AS (
    SELECT id, name, is_current 
    FROM training_sessions 
    WHERE is_current = true
)
SELECT 
    '✅ 当前期次信息' as check_type,
    csi.name as session_name,
    csi.id as session_id,
    csi.is_current
FROM current_session_info csi;

-- 2. 检查所有已发布作业的sessions限制状态
SELECT '=== 📋 作业期次限制状态 ===' as title;

SELECT 
    a.id,
    a.title,
    a.status,
    CASE 
        WHEN a.instructions IS NULL THEN '✅ 无限制（NULL）'
        WHEN a.instructions = '' THEN '✅ 无限制（空字符串）'
        WHEN a.instructions NOT LIKE '%"sessions"%' THEN '✅ 无sessions限制'
        ELSE '⚠️ 仍有sessions限制'
    END as session_limit_status,
    LEFT(a.instructions, 100) as instructions_preview,
    c.title as course_title
FROM assignments a
LEFT JOIN courses c ON a.course_id = c.id
WHERE a.status = 'published'
ORDER BY a.created_at DESC;

-- 3. 模拟前端学员视图 - 检查作业可见性
SELECT '=== 🎯 学员作业可见性检查 ===' as title;

WITH current_session AS (
    SELECT id as session_id 
    FROM training_sessions 
    WHERE is_current = true 
    LIMIT 1
),
student_allowed_courses AS (
    -- 当前期次中激活的课程
    SELECT sc.course_id
    FROM session_courses sc
    JOIN training_sessions ts ON sc.session_id = ts.id
    WHERE ts.is_current = true AND sc.is_active = true
),
assignment_visibility AS (
    SELECT 
        a.id,
        a.title,
        a.course_id,
        c.title as course_title,
        
        -- 课程检查
        CASE 
            WHEN sac.course_id IS NOT NULL THEN true
            ELSE false
        END as passes_course_filter,
        
        -- 期次检查（修复后应该都通过）
        CASE 
            WHEN a.instructions IS NULL OR a.instructions = '' THEN true
            WHEN a.instructions NOT LIKE '%"sessions"%' THEN true
            ELSE false
        END as passes_session_filter,
        
        a.instructions
        
    FROM assignments a
    LEFT JOIN courses c ON a.course_id = c.id
    LEFT JOIN student_allowed_courses sac ON a.course_id = sac.course_id
    WHERE a.status = 'published'
)
SELECT 
    av.id,
    av.title,
    av.course_title,
    av.passes_course_filter,
    av.passes_session_filter,
    
    -- 最终可见性
    CASE 
        WHEN av.passes_course_filter AND av.passes_session_filter THEN '🎉 学员可见'
        WHEN NOT av.passes_course_filter THEN '❌ 课程过滤失败'
        WHEN NOT av.passes_session_filter THEN '❌ 期次过滤失败'
        ELSE '❌ 不可见'
    END as final_visibility,
    
    LEFT(av.instructions, 80) as instructions_preview
    
FROM assignment_visibility av
ORDER BY av.title;

-- 4. 统计修复效果
SELECT '=== 📊 修复统计 ===' as title;

SELECT 
    (SELECT COUNT(*) FROM assignments WHERE status = 'published') as total_published_assignments,
    
    (SELECT COUNT(*) 
     FROM assignments 
     WHERE status = 'published' 
     AND (instructions IS NULL OR instructions = '' OR instructions NOT LIKE '%"sessions"%')
    ) as assignments_without_session_limits,
    
    (SELECT COUNT(*) 
     FROM assignments a
     JOIN session_courses sc ON a.course_id = sc.course_id 
     JOIN training_sessions ts ON sc.session_id = ts.id
     WHERE a.status = 'published' 
     AND ts.is_current = true 
     AND sc.is_active = true
     AND (a.instructions IS NULL OR a.instructions = '' OR a.instructions NOT LIKE '%"sessions"%')
    ) as assignments_student_should_see;

-- 5. 特别检查作业U1
SELECT '=== 🎯 作业U1特别检查 ===' as title;

SELECT 
    a.id,
    a.title,
    a.status,
    c.title as course_title,
    
    -- 检查课程是否在当前期次
    CASE 
        WHEN sc.course_id IS NOT NULL THEN '✅ 课程在当前期次'
        ELSE '❌ 课程不在当前期次'
    END as course_status,
    
    -- 检查期次限制
    CASE 
        WHEN a.instructions IS NULL OR a.instructions = '' THEN '✅ 无期次限制'
        WHEN a.instructions NOT LIKE '%"sessions"%' THEN '✅ 无sessions限制'
        ELSE '❌ 仍有期次限制'
    END as session_limit_status,
    
    -- 最终结果
    CASE 
        WHEN sc.course_id IS NOT NULL 
         AND (a.instructions IS NULL OR a.instructions = '' OR a.instructions NOT LIKE '%"sessions"%')
        THEN '🎉 学员应该能看到作业U1了！'
        ELSE '❌ 学员仍然看不到作业U1'
    END as u1_visibility,
    
    a.instructions
    
FROM assignments a
LEFT JOIN courses c ON a.course_id = c.id
LEFT JOIN session_courses sc ON (a.course_id = sc.course_id 
                                AND sc.session_id = (SELECT id FROM training_sessions WHERE is_current = true LIMIT 1)
                                AND sc.is_active = true)
WHERE a.title LIKE '%U1%' OR a.title = 'U1'
ORDER BY a.created_at DESC;

SELECT '🎯 验证完成！如果看到"学员应该能看到作业U1了！"，说明修复成功！' as final_message;
