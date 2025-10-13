-- 查看所有profiles表中的数据
SELECT 
  id,
  email,
  full_name,
  role,
  created_at,
  updated_at
FROM profiles
ORDER BY created_at;

-- 查看学生角色的用户
SELECT 
  id,
  email,
  full_name,
  role,
  created_at
FROM profiles
WHERE role = 'student'
ORDER BY created_at;

-- 统计各角色的用户数量
SELECT 
  role,
  COUNT(*) as count
FROM profiles
GROUP BY role;