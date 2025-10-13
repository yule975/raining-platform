-- 修复版本：诊断作业显示问题
-- 检查作业数据、课程关联和期次过滤（兼容PostgreSQL JSON操作）

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

-- 第六步：检查instructions字段中的期次过滤（使用兼容的JSON操作）
SELECT '=== 🔍 Instructions期次过滤检查 ===' as title;

SELECT 
    a.id,
    a.title,
    a.instructions,
    CASE 
        WHEN a.instructions IS NULL OR a.instructions = '' THEN '⚠️ 无instructions'
        WHEN a.instructions LIKE '%"sessions"%' THEN '✅ 包含期次限制'
        ELSE '📝 无期次限制（对所有期次可见）'
    END as session_filter_status
FROM assignments a
WHERE a.status = 'published'
ORDER BY a.created_at DESC;

-- 第七步：模拟前端API查询
SELECT '=== 🧪 模拟前端API查询 ===' as title;

-- 模拟 /api/assignments 返回的数据
SELECT 
    a.id,
    a.title,
    a.description,
    a.course_id,
    a.status,
    a.due_date,
    a.instructions,
    a.created_at,
    c.title as course_title
FROM assignments a
LEFT JOIN courses c ON a.course_id = c.id
WHERE a.status != 'template'
ORDER BY a.created_at DESC;

-- 第八步：检查期次学员过滤逻辑（简化版）
SELECT '=== 👥 期次学员过滤逻辑 ===' as title;

-- 检查当前期次的学员是否能看到作业
SELECT 
    a.id as assignment_id,
    a.title as assignment_title,
    a.course_id,
    c.title as course_title,
    CASE 
        WHEN EXISTS(
            SELECT 1 FROM session_courses sc 
            JOIN training_sessions ts ON sc.session_id = ts.id 
            WHERE sc.course_id = a.course_id 
            AND ts.is_current = true 
            AND sc.is_active = true
        ) THEN '✅ 课程在当前期次中'
        ELSE '❌ 课程不在当前期次中'
    END as course_in_session,
    CASE 
        WHEN a.instructions IS NULL OR a.instructions = '' THEN '✅ 无期次限制'
        WHEN a.instructions NOT LIKE '%"sessions"%' THEN '✅ 无期次限制'
        ELSE '🔍 需要进一步检查期次限制'
    END as session_filter_result
FROM assignments a
JOIN courses c ON a.course_id = c.id
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

-- 第十步：详细的作业可见性分析
SELECT '=== 📋 作业可见性详细分析 ===' as title;

SELECT 
    a.id,
    a.title,
    a.status,
    c.title as course_title,
    CASE 
        WHEN a.status = 'template' THEN '❌ 模板状态，学员不可见'
        WHEN a.status != 'published' THEN '❌ 非发布状态，学员不可见'
        WHEN NOT EXISTS(
            SELECT 1 FROM session_courses sc 
            JOIN training_sessions ts ON sc.session_id = ts.id 
            WHERE sc.course_id = a.course_id 
            AND ts.is_current = true 
            AND sc.is_active = true
        ) THEN '❌ 课程不在当前期次中'
        ELSE '✅ 学员应该可见'
    END as visibility_status,
    a.instructions
FROM assignments a
LEFT JOIN courses c ON a.course_id = c.id
ORDER BY 
    CASE 
        WHEN a.status = 'published' AND EXISTS(
            SELECT 1 FROM session_courses sc 
            JOIN training_sessions ts ON sc.session_id = ts.id 
            WHERE sc.course_id = a.course_id 
            AND ts.is_current = true 
            AND sc.is_active = true
        ) THEN 1
        ELSE 2
    END,
    a.created_at DESC;
