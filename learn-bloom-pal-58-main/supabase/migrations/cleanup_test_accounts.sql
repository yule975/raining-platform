-- 安全清理多余的测试账号脚本
-- 步骤1: 查看当前所有数据
SELECT 'Step 1: Current authorized_users data' as step;
SELECT id, email, name, role, status, added_at FROM authorized_users ORDER BY id;

-- 步骤2: 统计当前各角色数量
SELECT 'Step 2: Current role counts' as step;
SELECT 
  COALESCE(role, 'NULL') as role,
  status,
  COUNT(*) as count
FROM authorized_users
GROUP BY role, status
ORDER BY role, status;

-- 步骤3: 找出要保留的账号（每个角色保留最早创建的一个）
SELECT 'Step 3: Accounts to keep' as step;
SELECT DISTINCT ON (role) 
  id, email, name, role, status, added_at
FROM authorized_users 
WHERE role IS NOT NULL
ORDER BY role, id ASC;

-- 步骤4: 找出要删除的账号
SELECT 'Step 4: Accounts to delete' as step;
SELECT au.id, au.email, au.name, au.role, au.status, au.added_at
FROM authorized_users au
WHERE au.role IS NOT NULL
AND au.id NOT IN (
  SELECT DISTINCT ON (role) id
  FROM authorized_users 
  WHERE role IS NOT NULL
  ORDER BY role, id ASC
);

-- 步骤5: 执行删除操作（删除多余的账号）
DELETE FROM authorized_users 
WHERE role IS NOT NULL
AND id NOT IN (
  SELECT DISTINCT ON (role) id
  FROM authorized_users 
  WHERE role IS NOT NULL
  ORDER BY role, id ASC
);

-- 步骤6: 查看清理后的数据
SELECT 'Step 6: After cleanup' as step;
SELECT id, email, name, role, status, added_at FROM authorized_users ORDER BY id;

-- 步骤7: 最终统计
SELECT 'Step 7: Final counts' as step;
SELECT 
  COALESCE(role, 'NULL') as role,
  COUNT(*) as count
FROM authorized_users
GROUP BY role
ORDER BY role;