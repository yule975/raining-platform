-- 修复期次分配问题的完整SQL

-- 1. 先清除其他期次的current标志
UPDATE training_sessions SET is_current = false;

-- 2. 创建三期训战营（如果不存在）
INSERT INTO training_sessions (name, description, start_date, end_date, status, is_current) 
VALUES ('三期训战营', 'AI技术培训三期', '2025-09-17', '2025-09-30', 'active', true)
ON CONFLICT (name) DO UPDATE SET
  is_current = true,
  status = 'active',
  start_date = '2025-09-17',
  end_date = '2025-09-30';

-- 3. 验证期次创建
SELECT 'training_sessions' as table_name, name, is_current, status 
FROM training_sessions 
WHERE name = '三期训战营';

-- 注意：由于无法通过SQL直接创建Auth用户，期次分配需要通过应用程序完成
-- 但现在至少期次已经正确设置了
