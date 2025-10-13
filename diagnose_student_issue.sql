-- 诊断学员登录问题的检查脚本
-- 用于分析 student@test.com 无法正常访问系统的原因

-- === 第一部分：检查培训期次状态 ===
SELECT 
    '=== 培训期次检查 ===' as section_title;

SELECT 
    id,
    name,
    description,
    status,
    is_current,
    start_date,
    end_date,
    created_at
FROM training_sessions
ORDER BY created_at DESC;

-- 检查当前期次
SELECT 
    '当前期次检查' as check_name,
    CASE 
        WHEN COUNT(*) = 0 THEN '❌ 没有当前期次'
        WHEN COUNT(*) = 1 THEN '✅ 有一个当前期次'
        ELSE '⚠️ 有多个当前期次（数据异常）'
    END as status,
    COUNT(*) as current_session_count
FROM training_sessions 
WHERE is_current = true;

-- === 第二部分：检查授权用户 ===
SELECT 
    '=== 授权用户检查 ===' as section_title;

SELECT 
    email,
    name,
    role,
    status
FROM authorized_users 
WHERE email = 'student@test.com';

-- 检查所有学员数量
SELECT 
    '学员账户统计' as check_name,
    COUNT(*) as total_students
FROM authorized_users 
WHERE role = 'student' AND status = 'active';

-- === 第三部分：检查用户配置表 ===
SELECT 
    '=== 用户配置检查 ===' as section_title;

SELECT 
    id,
    email,
    full_name,
    role,
    created_at,
    updated_at
FROM profiles 
WHERE email = 'student@test.com';

-- 检查所有学员配置
SELECT 
    '学员配置统计' as check_name,
    COUNT(*) as total_student_profiles
FROM profiles 
WHERE role = 'student';

-- === 第四部分：检查期次分配 ===
SELECT 
    '=== 期次分配检查 ===' as section_title;

-- 检查student@test.com的期次分配
SELECT 
    ss.id,
    ss.session_id,
    ts.name as session_name,
    ts.is_current,
    p.email,
    p.full_name,
    ss.status as enrollment_status,
    ss.enrolled_at
FROM session_students ss
JOIN training_sessions ts ON ss.session_id = ts.id
JOIN profiles p ON ss.user_id = p.id
WHERE p.email = 'student@test.com'
ORDER BY ss.enrolled_at DESC;

-- 检查当前期次的所有学员分配
SELECT 
    '当前期次学员统计' as check_name,
    COUNT(*) as enrolled_students
FROM session_students ss
JOIN training_sessions ts ON ss.session_id = ts.id
WHERE ts.is_current = true;

-- === 第五部分：数据一致性检查 ===
SELECT 
    '=== 数据一致性检查 ===' as section_title;

-- 检查orphaned records（孤立记录）
SELECT 
    'authorized_users 中有但 profiles 中没有的学员' as check_name,
    COUNT(*) as orphaned_count
FROM authorized_users au
LEFT JOIN profiles p ON au.email = p.email
WHERE au.role = 'student' 
  AND au.status = 'active'
  AND p.id IS NULL;

-- 显示具体的孤立记录
SELECT 
    'authorized_users中的孤立学员详情' as detail_title,
    au.email,
    au.name,
    au.status
FROM authorized_users au
LEFT JOIN profiles p ON au.email = p.email
WHERE au.role = 'student' 
  AND au.status = 'active'
  AND p.id IS NULL;

-- 检查profiles中有但未分配期次的学员
SELECT 
    'profiles 中有但未分配当前期次的学员' as check_name,
    COUNT(*) as unassigned_count
FROM profiles p
LEFT JOIN session_students ss ON p.id = ss.user_id 
LEFT JOIN training_sessions ts ON ss.session_id = ts.id AND ts.is_current = true
WHERE p.role = 'student' 
  AND ts.id IS NULL;

-- 显示具体的未分配学员
SELECT 
    'profiles中未分配当前期次的学员详情' as detail_title,
    p.email,
    p.full_name,
    p.role
FROM profiles p
LEFT JOIN session_students ss ON p.id = ss.user_id 
LEFT JOIN training_sessions ts ON ss.session_id = ts.id AND ts.is_current = true
WHERE p.role = 'student' 
  AND ts.id IS NULL
ORDER BY p.email;

-- === 第六部分：问题总结 ===
SELECT 
    '=== 问题诊断总结 ===' as section_title;

WITH diagnostics AS (
    SELECT 
        'current_sessions' as item,
        (SELECT COUNT(*) FROM training_sessions WHERE is_current = true) as count_val
    UNION ALL
    SELECT 
        'student_in_authorized',
        (SELECT COUNT(*) FROM authorized_users WHERE email = 'student@test.com' AND role = 'student')
    UNION ALL
    SELECT 
        'student_in_profiles',
        (SELECT COUNT(*) FROM profiles WHERE email = 'student@test.com' AND role = 'student')
    UNION ALL
    SELECT 
        'student_in_current_session',
        (SELECT COUNT(*) 
         FROM session_students ss
         JOIN training_sessions ts ON ss.session_id = ts.id
         JOIN profiles p ON ss.user_id = p.id
         WHERE p.email = 'student@test.com' AND ts.is_current = true)
)
SELECT 
    item,
    count_val,
    CASE 
        WHEN item = 'current_sessions' AND count_val = 1 THEN '✅ 正常'
        WHEN item = 'current_sessions' AND count_val = 0 THEN '❌ 缺少当前期次'
        WHEN item = 'current_sessions' AND count_val > 1 THEN '⚠️ 多个当前期次'
        WHEN item LIKE 'student%' AND count_val = 1 THEN '✅ 存在'
        WHEN item LIKE 'student%' AND count_val = 0 THEN '❌ 缺失'
        ELSE '⚠️ 异常'
    END as status
FROM diagnostics
ORDER BY item;
