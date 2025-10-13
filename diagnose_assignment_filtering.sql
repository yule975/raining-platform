-- 深度诊断作业前端过滤问题
-- 重点检查前端两层过滤逻辑

-- 第一步：获取当前期次信息
SELECT '=== 🎯 当前期次信息 ===' as title;

SELECT 
    id as session_id,
    name as session_name,
    is_current,
    status
FROM training_sessions 
WHERE is_current = true;

-- 第二步：获取当前期次的课程列表（前端allowedCourses）
SELECT '=== 📚 当前期次允许的课程列表 ===' as title;

SELECT 
    sc.course_id,
    c.title as course_title,
    c.instructor,
    sc.is_active,
    '这些是前端allowedCourses数组中的课程ID' as note
FROM session_courses sc
JOIN courses c ON sc.course_id = c.id
JOIN training_sessions ts ON sc.session_id = ts.id
WHERE ts.is_current = true AND sc.is_active = true
ORDER BY c.title;

-- 第三步：检查已发布作业的课程关联
SELECT '=== 🔍 作业课程过滤检查 ===' as title;

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
        ) THEN '✅ PASS: 课程在allowedCourses中'
        ELSE '❌ FAIL: 课程不在allowedCourses中'
    END as course_filter_result,
    a.instructions
FROM assignments a
JOIN courses c ON a.course_id = c.id
WHERE a.status = 'published'
ORDER BY a.created_at DESC;

-- 第四步：解析instructions中的sessions数组
SELECT '=== 🎯 期次过滤检查 ===' as title;

SELECT 
    a.id,
    a.title,
    a.instructions,
    CASE 
        WHEN a.instructions IS NULL OR a.instructions = '' THEN '✅ PASS: 无期次限制'
        WHEN a.instructions NOT LIKE '%"sessions"%' THEN '✅ PASS: 无期次限制'
        ELSE '🔍 需要检查期次ID匹配'
    END as sessions_filter_result,
    (SELECT id FROM training_sessions WHERE is_current = true LIMIT 1) as current_session_id
FROM assignments a
WHERE a.status = 'published'
ORDER BY a.created_at DESC;

-- 第五步：模拟前端完整过滤逻辑
SELECT '=== 🧪 模拟前端完整过滤 ===' as title;

WITH current_session_data AS (
    SELECT id as session_id, name 
    FROM training_sessions 
    WHERE is_current = true 
    LIMIT 1
),
allowed_courses AS (
    SELECT sc.course_id
    FROM session_courses sc
    JOIN training_sessions ts ON sc.session_id = ts.id
    WHERE ts.is_current = true AND sc.is_active = true
)
SELECT 
    a.id,
    a.title,
    a.course_id,
    c.title as course_title,
    
    -- 第一层过滤：课程必须在当前期次中
    CASE 
        WHEN ac.course_id IS NOT NULL THEN '✅ 课程过滤通过'
        ELSE '❌ 课程过滤失败'
    END as course_filter,
    
    -- 第二层过滤：期次限制检查
    CASE 
        WHEN a.instructions IS NULL OR a.instructions = '' THEN '✅ 期次过滤通过（无限制）'
        WHEN a.instructions NOT LIKE '%"sessions"%' THEN '✅ 期次过滤通过（无限制）'
        ELSE '🔍 需要解析sessions数组'
    END as session_filter,
    
    -- 最终结果
    CASE 
        WHEN ac.course_id IS NOT NULL 
         AND (a.instructions IS NULL OR a.instructions = '' OR a.instructions NOT LIKE '%"sessions"%')
        THEN '🎉 应该显示给学员'
        WHEN ac.course_id IS NULL 
        THEN '❌ 被课程过滤器拦截'
        ELSE '❓ 被期次过滤器拦截或需要进一步检查'
    END as final_result,
    
    a.instructions
FROM assignments a
JOIN courses c ON a.course_id = c.id
LEFT JOIN allowed_courses ac ON a.course_id = ac.course_id
CROSS JOIN current_session_data csd
WHERE a.status = 'published'
ORDER BY a.created_at DESC;

-- 第六步：检查API返回格式
SELECT '=== 📡 API返回数据格式检查 ===' as title;

-- 模拟 /api/assignments 的确切返回格式
SELECT 
    a.id,
    a.title,
    a.description,
    a.course_id,
    a.due_date,
    a.status,
    a.max_score,
    a.created_at,
    jsonb_build_object('title', c.title) as courses,
    0 as submissions_count,
    a.instructions,
    '这是后端API的确切返回格式' as note
FROM assignments a
LEFT JOIN courses c ON a.course_id = c.id
WHERE a.status != 'template'
ORDER BY a.created_at DESC;

-- 第七步：详细的instructions解析
SELECT '=== 🔬 Instructions详细解析 ===' as title;

SELECT 
    a.id,
    a.title,
    a.instructions,
    
    -- 尝试提取URL
    CASE 
        WHEN a.instructions LIKE '%"url"%' THEN '包含URL'
        ELSE '不包含URL'
    END as has_url,
    
    -- 尝试提取sessions
    CASE 
        WHEN a.instructions LIKE '%"sessions"%' THEN '包含sessions限制'
        ELSE '无sessions限制'
    END as has_sessions,
    
    -- 显示原始instructions用于手动检查
    a.instructions as raw_instructions
FROM assignments a
WHERE a.status = 'published'
ORDER BY a.created_at DESC;
