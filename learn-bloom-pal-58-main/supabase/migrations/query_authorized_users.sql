-- 查看authorized_users表中的所有数据
SELECT 
  id,
  email,
  name,
  role,
  status,
  added_at,
  department,
  notes
FROM authorized_users
ORDER BY added_at DESC;

-- 统计各角色的用户数量
SELECT 
  role,
  status,
  COUNT(*) as count
FROM authorized_users
GROUP BY role, status
ORDER BY role, status;

-- 查看学生角色的用户
SELECT 
  id,
  email,
  name,
  status,
  added_at
FROM authorized_users
WHERE role = 'student'
ORDER BY added_at DESC;