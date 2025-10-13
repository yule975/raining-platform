-- 诊断作业显示问题
-- 检查作业数据、课程关联和期次过滤

-- 第一步：检查assignments表结构和数据
SELECT '=== 📝 作业表数据检查 ===' as title;

SELECT 
    id,
    course_id,
    title,
    description,
    status,
    due_date,
    instructions,
    created_at
FROM assignments 
ORDER BY created_at DESC
LIMIT 10;

-- 第二步：检查作业状态分布
SELECT '=== 📊 作业状态统计 ===' as title;

SELECT 
    status,
    COUNT(*) as count,
    CASE 
        WHEN status = 'template' THEN '📋 作业模板（不显示给学员）'
        WHEN status = 'published' THEN '✅ 已发布作业（学员可见）'
        WHEN status = 'draft' THEN '📝 草稿作业'
        ELSE '❓ 其他状态'
    END as description
FROM assignments 
GROUP BY status
ORDER BY count DESC;

-- 第三步：检查作业与课程的关联
SELECT '=== 🔗 作业课程关联检查 ===' as title;

SELECT 
    a.id as assignment_id,
    a.title as assignment_title,
    a.status as assignment_status,
    c.id as course_id,
    c.title as course_title,
    c.instructor,
    a.created_at
FROM assignments a
LEFT JOIN courses c ON a.course_id = c.id
WHERE a.status != 'template'
ORDER BY a.created_at DESC;

-- 第四步：检查课程期次关联状态
SELECT '=== 🎯 课程期次关联状态 ===' as title;

SELECT 
    a.id as assignment_id,
    a.title as assignment_title,
    c.title as course_title,
    ts.name as session_name,
    ts.is_current,
    sc.is_active as course_session_active
FROM assignments a
JOIN courses c ON a.course_id = c.id
LEFT JOIN session_courses sc ON c.id = sc.course_id
LEFT JOIN training_sessions ts ON sc.session_id = ts.id
WHERE a.status = 'published'
ORDER BY a.created_at DESC;

-- 第五步：检查当前期次相关的作业
SELECT '=== 🎯 当前期次作业检查 ===' as title;

SELECT 
    a.id as assignment_id,
    a.title as assignment_title,
    a.status,
    c.title as course_title,
    ts.name as session_name,
    a.instructions,
    a.due_date
FROM assignments a
JOIN courses c ON a.course_id = c.id
JOIN session_courses sc ON c.id = sc.course_id
JOIN training_sessions ts ON sc.session_id = ts.id
WHERE ts.is_current = true 
  AND a.status = 'published'
  AND sc.is_active = true
ORDER BY a.created_at DESC;

-- 第六步：检查instructions字段中的期次过滤
SELECT '=== 🔍 Instructions期次过滤检查 ===' as title;

SELECT 
    a.id,
    a.title,
    a.instructions,
    CASE 
        WHEN a.instructions IS NULL OR a.instructions = '' THEN '⚠️ 无instructions'
        WHEN a.instructions::json ? 'sessions' THEN 
            CASE 
                WHEN jsonb_array_length((a.instructions::json->>'sessions')::jsonb) > 0 
                THEN '✅ 有期次限制: ' || (a.instructions::json->>'sessions')
                ELSE '⚠️ 期次数组为空'
            END
        ELSE '📝 无期次限制（对所有期次可见）'
    END as session_filter_status
FROM assignments a
WHERE a.status = 'published'
ORDER BY a.created_at DESC;

-- 第七步：模拟前端API查询
SELECT '=== 🧪 模拟前端API查询 ===' as title;

-- 模拟 /api/assignments 返回的数据
SELECT 
    a.*,
    c.title as course_title
FROM assignments a
LEFT JOIN courses c ON a.course_id = c.id
WHERE a.status != 'template'
ORDER BY a.created_at DESC;

-- 第八步：检查期次学员过滤逻辑
SELECT '=== 👥 期次学员过滤逻辑 ===' as title;

-- 检查当前期次的学员是否能看到作业
WITH current_session AS (
    SELECT id, name FROM training_sessions WHERE is_current = true LIMIT 1
),
current_session_courses AS (
    SELECT course_id 
    FROM session_courses sc
    JOIN current_session cs ON sc.session_id = cs.id
    WHERE sc.is_active = true
)
SELECT 
    a.id as assignment_id,
    a.title as assignment_title,
    a.course_id,
    c.title as course_title,
    CASE 
        WHEN csc.course_id IS NOT NULL THEN '✅ 课程在当前期次中'
        ELSE '❌ 课程不在当前期次中'
    END as course_in_session,
    CASE 
        WHEN a.instructions IS NULL OR a.instructions = '' THEN '✅ 无期次限制'
        WHEN a.instructions::json ? 'sessions' THEN 
            CASE 
                WHEN (SELECT id FROM current_session) = ANY(
                    SELECT jsonb_array_elements_text((a.instructions::json->>'sessions')::jsonb)::uuid
                ) THEN '✅ 当前期次在允许列表中'
                ELSE '❌ 当前期次不在允许列表中'
            END
        ELSE '✅ 无期次限制'
    END as session_filter_result
FROM assignments a
JOIN courses c ON a.course_id = c.id
LEFT JOIN current_session_courses csc ON c.id = csc.course_id
WHERE a.status = 'published'
ORDER BY a.created_at DESC;

-- 第九步：问题诊断总结
SELECT '=== 🎯 问题诊断总结 ===' as title;

SELECT 
    '数据完整性检查' as check_type,
    (SELECT COUNT(*) FROM assignments WHERE status = 'published') as published_assignments,
    (SELECT COUNT(*) FROM courses) as total_courses,
    (SELECT COUNT(*) FROM session_courses sc JOIN training_sessions ts ON sc.session_id = ts.id WHERE ts.is_current = true) as courses_in_current_session,
    (SELECT COUNT(*) FROM assignments a JOIN courses c ON a.course_id = c.id JOIN session_courses sc ON c.id = sc.course_id JOIN training_sessions ts ON sc.session_id = ts.id WHERE a.status = 'published' AND ts.is_current = true) as assignments_in_current_session;
