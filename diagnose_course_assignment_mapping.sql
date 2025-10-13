-- 诊断课程和作业映射问题
-- 检查作业U1的课程是否在当前期次中

SELECT '=== 🔍 课程作业映射诊断 ===' as title;

-- 1. 检查当前期次信息
WITH current_session_info AS (
    SELECT id, name, is_current 
    FROM training_sessions 
    WHERE is_current = true
    LIMIT 1
)
SELECT 
    '✅ 当前期次信息' as check_type,
    csi.name as session_name,
    csi.id as session_id
FROM current_session_info csi;

-- 2. 检查作业U1的详细信息
SELECT '=== 📋 作业U1详细信息 ===' as title;

SELECT 
    a.id as assignment_id,
    a.title,
    a.status,
    a.course_id,
    c.title as course_title,
    c.created_at as course_created_at,
    a.instructions,
    a.created_at as assignment_created_at
FROM assignments a
LEFT JOIN courses c ON a.course_id = c.id
WHERE a.title = 'U1' OR a.title LIKE '%U1%'
ORDER BY a.created_at DESC;

-- 3. 检查当前期次的课程列表（allowedCourses）
SELECT '=== 🎯 当前期次的课程列表 ===' as title;

WITH current_session AS (
    SELECT id 
    FROM training_sessions 
    WHERE is_current = true 
    LIMIT 1
)
SELECT 
    sc.course_id,
    c.title as course_title,
    sc.is_active,
    sc.created_at as session_course_created_at,
    c.created_at as course_created_at,
    CASE 
        WHEN sc.is_active = true THEN '✅ 在当前期次中且激活'
        ELSE '❌ 在当前期次中但未激活'
    END as course_status
FROM session_courses sc
JOIN current_session cs ON sc.session_id = cs.id
LEFT JOIN courses c ON sc.course_id = c.id
ORDER BY sc.created_at DESC;

-- 4. 关键诊断：作业U1的课程是否在当前期次的允许课程中？
SELECT '=== 🎯 关键诊断：U1课程映射 ===' as title;

WITH current_session AS (
    SELECT id 
    FROM training_sessions 
    WHERE is_current = true 
    LIMIT 1
),
u1_assignment AS (
    SELECT course_id, title
    FROM assignments 
    WHERE title = 'U1' OR title LIKE '%U1%'
    ORDER BY created_at DESC 
    LIMIT 1
),
allowed_courses AS (
    SELECT sc.course_id
    FROM session_courses sc
    JOIN current_session cs ON sc.session_id = cs.id
    WHERE sc.is_active = true
)
SELECT 
    u1.course_id as u1_course_id,
    u1.title as u1_title,
    c.title as course_title,
    CASE 
        WHEN ac.course_id IS NOT NULL THEN '✅ 课程在当前期次中'
        ELSE '❌ 课程不在当前期次中'
    END as course_mapping_status,
    CASE 
        WHEN ac.course_id IS NOT NULL THEN '🎉 前端课程过滤应该通过'
        ELSE '❌ 前端课程过滤会拦截！这就是问题所在！'
    END as filter_result
FROM u1_assignment u1
LEFT JOIN courses c ON u1.course_id = c.id
LEFT JOIN allowed_courses ac ON u1.course_id = ac.course_id;

-- 5. 检查所有课程的期次分配情况
SELECT '=== 📊 所有课程的期次分配情况 ===' as title;

SELECT 
    c.id as course_id,
    c.title as course_title,
    c.created_at as course_created_at,
    
    -- 检查是否在当前期次中
    CASE 
        WHEN current_sc.course_id IS NOT NULL AND current_sc.is_active = true THEN '✅ 在当前期次且激活'
        WHEN current_sc.course_id IS NOT NULL AND current_sc.is_active = false THEN '⚠️ 在当前期次但未激活'
        ELSE '❌ 不在当前期次'
    END as current_session_status,
    
    -- 统计该课程的作业数量
    (SELECT COUNT(*) FROM assignments WHERE course_id = c.id AND status = 'published') as published_assignments_count
    
FROM courses c
LEFT JOIN (
    SELECT sc.course_id, sc.is_active
    FROM session_courses sc
    JOIN training_sessions ts ON sc.session_id = ts.id
    WHERE ts.is_current = true
) current_sc ON c.id = current_sc.course_id
ORDER BY c.created_at DESC;

-- 6. 修复建议
SELECT '=== 🔧 修复建议 ===' as title;

WITH current_session AS (
    SELECT id, name 
    FROM training_sessions 
    WHERE is_current = true 
    LIMIT 1
),
u1_assignment AS (
    SELECT course_id, title
    FROM assignments 
    WHERE title = 'U1' OR title LIKE '%U1%'
    ORDER BY created_at DESC 
    LIMIT 1
),
allowed_courses AS (
    SELECT sc.course_id
    FROM session_courses sc
    JOIN current_session cs ON sc.session_id = cs.id
    WHERE sc.is_active = true
)
SELECT 
    CASE 
        WHEN ac.course_id IS NOT NULL THEN 
            '✅ 作业U1的课程已在当前期次中，问题可能在别处'
        ELSE 
            '❌ 需要将作业U1的课程添加到当前期次中！
            
修复SQL:
INSERT INTO session_courses (session_id, course_id, is_active)
SELECT cs.id, u1.course_id, true
FROM current_session cs, u1_assignment u1
WHERE NOT EXISTS (
    SELECT 1 FROM session_courses 
    WHERE session_id = cs.id AND course_id = u1.course_id
);'
    END as fix_recommendation
FROM current_session cs, u1_assignment u1
LEFT JOIN allowed_courses ac ON u1.course_id = ac.course_id;

SELECT '🎯 诊断完成！检查上面的结果找到问题根源。' as final_message;