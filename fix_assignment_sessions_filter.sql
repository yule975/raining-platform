-- 修复作业期次过滤问题
-- 将作业的sessions限制更新为包含当前期次，或清空限制

DO $$
DECLARE
    current_session_id UUID;
    current_session_name TEXT;
    assignment_record RECORD;
    fixed_count INTEGER := 0;
BEGIN
    -- 第一步：获取当前期次信息
    SELECT id, name INTO current_session_id, current_session_name
    FROM training_sessions 
    WHERE is_current = true 
    LIMIT 1;
    
    IF current_session_id IS NULL THEN
        RAISE EXCEPTION '未找到当前期次';
    END IF;
    
    RAISE NOTICE '✅ 当前期次: % (ID: %)', current_session_name, current_session_id;
    
    -- 第二步：处理所有已发布作业的sessions限制
    FOR assignment_record IN 
        SELECT id, title, instructions, course_id
        FROM assignments 
        WHERE status = 'published'
        ORDER BY created_at DESC
    LOOP
        RAISE NOTICE '🔍 检查作业: %', assignment_record.title;
        
        -- 检查是否有sessions限制
        IF assignment_record.instructions IS NOT NULL 
           AND assignment_record.instructions LIKE '%"sessions"%' THEN
            
            -- 方案A：清空sessions限制，让作业对所有期次可见（推荐）
            -- 这样更简单，避免复杂的JSON操作
            UPDATE assignments 
            SET instructions = CASE 
                WHEN instructions LIKE '%"url"%' THEN 
                    -- 保留URL，移除sessions
                    regexp_replace(
                        regexp_replace(instructions, ',"sessions":\[[^\]]*\]', ''),
                        '"sessions":\[[^\]]*\],?', ''
                    )
                ELSE 
                    -- 如果只有sessions，设为空
                    NULL
            END
            WHERE id = assignment_record.id;
            
            fixed_count := fixed_count + 1;
            RAISE NOTICE '✅ 已清空作业 % 的期次限制', assignment_record.title;
            
            -- 方案B的代码（备用）：
            -- 如果你想保持sessions数组但添加当前期次ID，可以用这个：
            /*
            UPDATE assignments 
            SET instructions = jsonb_set(
                instructions::jsonb,
                '{sessions}',
                (instructions::jsonb->'sessions') || ('"' || current_session_id || '"')::jsonb
            )::text
            WHERE id = assignment_record.id;
            */
            
        ELSE
            RAISE NOTICE '⚠️ 作业 % 无期次限制，无需修改', assignment_record.title;
        END IF;
    END LOOP;
    
    RAISE NOTICE '🎉 完成！共修复 % 个作业的期次限制', fixed_count;
    
END $$;

-- 验证修复结果
SELECT '=== ✅ 修复结果验证 ===' as title;

-- 显示所有已发布作业的新状态
SELECT 
    a.id,
    a.title,
    a.instructions,
    CASE 
        WHEN a.instructions IS NULL OR a.instructions = '' THEN '✅ 无期次限制（对所有期次可见）'
        WHEN a.instructions NOT LIKE '%"sessions"%' THEN '✅ 无期次限制（对所有期次可见）'
        ELSE '⚠️ 仍有期次限制'
    END as session_filter_status,
    c.title as course_title
FROM assignments a
LEFT JOIN courses c ON a.course_id = c.id
WHERE a.status = 'published'
ORDER BY a.created_at DESC;

-- 模拟前端过滤结果
SELECT '=== 🧪 前端过滤模拟结果 ===' as title;

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
    c.title as course_title,
    
    -- 课程过滤结果
    CASE 
        WHEN ac.course_id IS NOT NULL THEN '✅ 课程过滤通过'
        ELSE '❌ 课程过滤失败'
    END as course_filter_result,
    
    -- 期次过滤结果
    CASE 
        WHEN a.instructions IS NULL OR a.instructions = '' THEN '✅ 期次过滤通过'
        WHEN a.instructions NOT LIKE '%"sessions"%' THEN '✅ 期次过滤通过'
        ELSE '❌ 期次过滤失败'
    END as session_filter_result,
    
    -- 最终显示结果
    CASE 
        WHEN ac.course_id IS NOT NULL 
         AND (a.instructions IS NULL OR a.instructions = '' OR a.instructions NOT LIKE '%"sessions"%')
        THEN '🎉 学员应该能看到这个作业'
        ELSE '❌ 学员看不到这个作业'
    END as final_visibility,
    
    a.instructions
FROM assignments a
LEFT JOIN courses c ON a.course_id = c.id
LEFT JOIN allowed_courses ac ON a.course_id = ac.course_id
CROSS JOIN current_session_data csd
WHERE a.status = 'published'
ORDER BY a.created_at DESC;

-- 总结统计
SELECT '=== 📊 修复统计 ===' as title;

SELECT 
    (SELECT COUNT(*) FROM assignments WHERE status = 'published') as total_published_assignments,
    (SELECT COUNT(*) FROM assignments WHERE status = 'published' AND (instructions IS NULL OR instructions = '' OR instructions NOT LIKE '%"sessions"%')) as assignments_without_session_limits,
    (SELECT COUNT(*) FROM assignments a JOIN session_courses sc ON a.course_id = sc.course_id JOIN training_sessions ts ON sc.session_id = ts.id WHERE a.status = 'published' AND ts.is_current = true AND (a.instructions IS NULL OR a.instructions = '' OR a.instructions NOT LIKE '%"sessions"%')) as assignments_student_should_see;

SELECT '🎯 修复完成！刷新学员作业页面应该能看到作业了！' as success_message;
