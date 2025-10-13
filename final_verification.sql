-- 最终验证：作业U1现在应该对学员可见

SELECT 
    '🎉 最终验证结果' as verification_title,
    a.title as assignment_title,
    c.title as course_title,
    ts.name as session_name,
    
    -- 验证课程过滤
    CASE 
        WHEN sc.is_active = true THEN '✅ 课程过滤：通过'
        ELSE '❌ 课程过滤：失败'
    END as course_filter_result,
    
    -- 验证期次过滤
    CASE 
        WHEN a.instructions IS NULL OR a.instructions = '' THEN '✅ 期次过滤：通过（无限制）'
        WHEN a.instructions NOT LIKE '%sessions%' THEN '✅ 期次过滤：通过（无sessions限制）'
        ELSE '❌ 期次过滤：失败（仍有sessions限制）'
    END as session_filter_result,
    
    -- 最终结果
    CASE 
        WHEN sc.is_active = true 
         AND (a.instructions IS NULL OR a.instructions = '' OR a.instructions NOT LIKE '%sessions%')
        THEN '🎊 学员现在应该能看到作业U1了！'
        ELSE '❌ 学员仍然看不到作业'
    END as final_result,
    
    -- 显示修复后的instructions
    LEFT(a.instructions, 100) as current_instructions
    
FROM assignments a
LEFT JOIN courses c ON a.course_id = c.id
LEFT JOIN (
    SELECT sc.course_id, sc.is_active, ts.name as session_name
    FROM session_courses sc
    JOIN training_sessions ts ON sc.session_id = ts.id
    WHERE ts.is_current = true
) sc ON a.course_id = sc.course_id
CROSS JOIN (
    SELECT name 
    FROM training_sessions 
    WHERE is_current = true 
    LIMIT 1
) ts
WHERE a.title = 'U1'
ORDER BY a.created_at DESC
LIMIT 1;
