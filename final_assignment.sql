-- 最后一步：确保期次和学员分配完整

-- 1. 重新创建三期训战营
UPDATE training_sessions SET is_current = false;
INSERT INTO training_sessions (name, description, start_date, end_date, status, is_current) 
VALUES ('三期训战营', 'AI技术培训三期', '2025-09-17', '2025-09-30', 'active', true);

-- 2. 分配所有学员到三期训战营
INSERT INTO session_students (session_id, user_id)
SELECT 
    ts.id as session_id,
    p.id as user_id
FROM training_sessions ts
CROSS JOIN profiles p
WHERE ts.name = '三期训战营'
  AND p.role = 'student'
  AND NOT EXISTS (
    SELECT 1 FROM session_students ss 
    WHERE ss.session_id = ts.id AND ss.user_id = p.id
  );

-- 3. 验证最终结果
SELECT 
    'session_students' as table_name,
    COUNT(*) as count,
    '三期训战营学员数量' as description
FROM session_students ss
JOIN training_sessions ts ON ss.session_id = ts.id
WHERE ts.name = '三期训战营';
