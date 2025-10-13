-- 诊断课程显示问题
-- 检查课程数据和期次关联状态

-- 第一步：检查所有课程
SELECT '=== 📚 所有课程数据 ===' as title;

SELECT 
    id,
    title,
    description,
    instructor,
    status,
    created_at
FROM courses 
ORDER BY created_at DESC
LIMIT 10;

-- 第二步：检查当前期次
SELECT '=== 🎯 当前期次信息 ===' as title;

SELECT 
    id,
    name,
    description,
    status,
    is_current,
    start_date,
    end_date
FROM training_sessions 
WHERE is_current = true;

-- 第三步：检查期次课程关联表
SELECT '=== 🔗 期次课程关联 ===' as title;

-- 检查session_courses表是否有数据
SELECT 
    sc.id,
    sc.session_id,
    ts.name as session_name,
    sc.course_id,
    c.title as course_title,
    sc.is_active,
    sc.added_at
FROM session_courses sc
JOIN training_sessions ts ON sc.session_id = ts.id
JOIN courses c ON sc.course_id = c.id
WHERE ts.is_current = true
ORDER BY sc.added_at DESC;

-- 第四步：检查未关联的课程
SELECT '=== ❓ 未关联到当前期次的课程 ===' as title;

SELECT 
    c.id,
    c.title,
    c.instructor,
    c.status,
    c.created_at,
    '未关联到当前期次' as issue
FROM courses c
LEFT JOIN session_courses sc ON c.id = sc.course_id 
LEFT JOIN training_sessions ts ON sc.session_id = ts.id AND ts.is_current = true
WHERE ts.id IS NULL
  AND c.status = 'published'
ORDER BY c.created_at DESC;

-- 第五步：统计信息
SELECT '=== 📊 数据统计 ===' as title;

SELECT 
    (SELECT COUNT(*) FROM courses WHERE status = 'published') as total_courses,
    (SELECT COUNT(*) FROM training_sessions WHERE is_current = true) as current_sessions,
    (SELECT COUNT(*) FROM session_courses sc JOIN training_sessions ts ON sc.session_id = ts.id WHERE ts.is_current = true) as courses_in_current_session,
    (SELECT COUNT(*) FROM courses c LEFT JOIN session_courses sc ON c.id = sc.course_id LEFT JOIN training_sessions ts ON sc.session_id = ts.id AND ts.is_current = true WHERE ts.id IS NULL AND c.status = 'published') as unassigned_courses;

-- 第六步：模拟前端API查询
SELECT '=== 🔬 模拟前端课程查询 ===' as title;

-- 这是前端可能使用的查询逻辑
SELECT 
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

-- 第七步：检查课程表结构（如果有selectedCourses字段）
SELECT '=== 📋 期次选中的课程（如果使用selectedCourses字段）===' as title;

-- 检查training_sessions表是否有selectedCourses字段
SELECT 
    name,
    selectedcourses,
    jsonb_array_length(COALESCE(selectedcourses, '[]'::jsonb)) as selected_course_count
FROM training_sessions 
WHERE is_current = true;
