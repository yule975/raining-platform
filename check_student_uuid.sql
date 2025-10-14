-- 检查student@test的UUID
SELECT 
  au.id as authorized_id,
  au.name,
  au.email,
  p.id as profile_uuid,
  p.email as profile_email
FROM authorized_users au
LEFT JOIN profiles p ON p.email = au.email
WHERE au.email = 'student@test';

-- 同时检查auth.users中的记录
SELECT id, email FROM auth.users WHERE email = 'student@test';

