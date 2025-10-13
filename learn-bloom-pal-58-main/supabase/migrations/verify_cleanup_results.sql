-- 验证清理操作的结果
-- 查看清理后的所有用户数据
SELECT 'Verification: All remaining users' as info;
SELECT 
  id,
  email,
  name,
  COALESCE(role, 'NULL') as role,
  status,
  added_at
FROM authorized_users 
ORDER BY role, id;

-- 统计各角色的用户数量
SELECT 'Verification: User counts by role' as info;
SELECT 
  COALESCE(role, 'NULL') as role,
  COUNT(*) as count
FROM authorized_users
GROUP BY role
ORDER BY role;

-- 检查是否只有一个学生账号
SELECT 'Verification: Student accounts check' as info;
SELECT 
  CASE 
    WHEN COUNT(*) = 1 THEN 'PASS: Only 1 student account exists'
    WHEN COUNT(*) = 0 THEN 'WARNING: No student accounts found'
    ELSE CONCAT('FAIL: ', COUNT(*), ' student accounts found (expected 1)')
  END as result
FROM authorized_users
WHERE role = 'student';

-- 检查管理员账号是否存在
SELECT 'Verification: Admin accounts check' as info;
SELECT 
  CASE 
    WHEN COUNT(*) >= 1 THEN CONCAT('PASS: ', COUNT(*), ' admin account(s) exist')
    ELSE 'FAIL: No admin accounts found'
  END as result
FROM authorized_users
WHERE role = 'admin';

-- 总体验证结果
SELECT 'Final Verification Summary' as info;
SELECT 
  'Total users: ' || COUNT(*) as summary
FROM authorized_users;