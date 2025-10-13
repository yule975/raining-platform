-- 创建生产环境真实用户账号
-- 1. 管理员账号：谢雯萱 (2440164519@qq.com)
-- 2. 学员白名单：wenxuan (xiewenxuan001@51Talk.com)

-- 清理可能存在的测试数据
DELETE FROM authorized_users WHERE email IN ('2440164519@qq.com', 'xiewenxuan001@51Talk.com');

-- 创建管理员账号
INSERT INTO authorized_users (email, name, role, status, added_at)
VALUES (
  '2440164519@qq.com',
  '谢雯萱',
  'admin',
  'active',
  NOW()
);

-- 创建学员白名单账号
INSERT INTO authorized_users (email, name, role, status, added_at)
VALUES (
  'xiewenxuan001@51Talk.com',
  'wenxuan',
  'student',
  'active',
  NOW()
);

-- 验证创建结果
SELECT 
  email,
  name,
  role,
  status,
  added_at
FROM authorized_users 
WHERE email IN ('2440164519@qq.com', 'xiewenxuan001@51Talk.com')
ORDER BY role DESC, email;