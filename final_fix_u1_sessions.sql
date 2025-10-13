-- 最终修复：彻底清空U1作业的sessions限制

-- 第1步：查看当前U1的instructions内容
SELECT 
    'U1作业当前的instructions' as step,
    id,
    title, 
    instructions,
    LENGTH(instructions) as instructions_length
FROM assignments 
WHERE title = 'U1'
ORDER BY created_at DESC
LIMIT 1;

-- 第2步：简单直接修复 - 使用正则表达式替换移除sessions
UPDATE assignments 
SET instructions = 
    CASE 
        -- 如果有URL，保留URL但移除sessions
        WHEN instructions LIKE '%"url"%' THEN 
            regexp_replace(
                regexp_replace(
                    instructions,
                    ',"sessions"\s*:\s*\[[^\]]*\]', '', 'g'
                ),
                '"sessions"\s*:\s*\[[^\]]*\],?', '', 'g'
            )
        -- 如果没有URL，设为NULL
        ELSE NULL
    END
WHERE title = 'U1' AND instructions IS NOT NULL;

-- 显示更新结果
SELECT 
    '🎉 U1作业更新完成' as step,
    id,
    title,
    instructions as updated_instructions
FROM assignments 
WHERE title = 'U1';

-- 第3步：验证修复结果
SELECT 
    'U1作业修复后的状态' as step,
    id,
    title,
    instructions as new_instructions,
    CASE 
        WHEN instructions IS NULL THEN '✅ 无限制，对所有期次可见'
        WHEN instructions = '' THEN '✅ 无限制，对所有期次可见'  
        WHEN instructions NOT LIKE '%sessions%' THEN '✅ 无sessions限制'
        ELSE '❌ 仍有sessions限制'
    END as session_status
FROM assignments 
WHERE title = 'U1'
ORDER BY created_at DESC
LIMIT 1;
