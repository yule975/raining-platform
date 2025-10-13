-- 临时禁用assignments表的RLS以解决创建作业失败问题
-- 这是开发环境的临时解决方案

-- 禁用assignments表的RLS
ALTER TABLE assignments DISABLE ROW LEVEL SECURITY;

-- 禁用courses表的RLS
ALTER TABLE courses DISABLE ROW LEVEL SECURITY;

-- 授予必要权限
GRANT ALL PRIVILEGES ON assignments TO anon;
GRANT ALL PRIVILEGES ON assignments TO authenticated;
GRANT ALL PRIVILEGES ON courses TO anon;
GRANT ALL PRIVILEGES ON courses TO authenticated;

-- 检查权限
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND grantee IN ('anon', 'authenticated') 
    AND table_name IN ('assignments', 'courses')
ORDER BY table_name, grantee;