-- 快速创建17个测试学员并分配到三期训战营

-- 1. 获取三期训战营ID
WITH current_session AS (
  SELECT id as session_id FROM training_sessions WHERE name = '三期训战营' LIMIT 1
)
-- 2. 批量创建测试学员
INSERT INTO authorized_users (name, email, status, role) 
SELECT 
  CASE 
    WHEN i = 1 THEN '测试学员'
    WHEN i = 2 THEN '王亚东'  
    WHEN i = 3 THEN '陈建雄'
    WHEN i = 4 THEN '刘宇豪'
    WHEN i = 5 THEN '李学菲'
    WHEN i = 6 THEN '张三'
    WHEN i = 7 THEN '李四'
    WHEN i = 8 THEN '王五'
    WHEN i = 9 THEN '赵六'
    WHEN i = 10 THEN '孙七'
    ELSE '学员' || i::text
  END as name,
  CASE 
    WHEN i = 1 THEN 'student@test.com'
    ELSE 'student' || i::text || '@example.com'
  END as email,
  'active' as status,
  'student' as role
FROM generate_series(1, 17) i
ON CONFLICT (email) DO NOTHING;

-- 验证创建结果
SELECT 
  'authorized_users学员总数' as info,
  COUNT(*)::text as value
FROM authorized_users 
WHERE role = 'student'

UNION ALL

SELECT 
  '三期训战营期次状态' as info,
  CASE WHEN is_current THEN '当前期次' ELSE '非当前期次' END as value
FROM training_sessions 
WHERE name = '三期训战营';
