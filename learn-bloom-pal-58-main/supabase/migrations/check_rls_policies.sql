-- 检查RLS策略和权限设置

-- 1. 检查authorized_users表的RLS状态
SELECT 
    schemaname,
    tablename,
    rowsecurity as rls_enabled
FROM pg_tables 
WHERE schemaname = 'public' AND tablename = 'authorized_users';

-- 2. 检查authorized_users表的RLS策略
SELECT 
    schemaname,
    tablename,
    policyname,
    permissive,
    roles,
    cmd,
    qual,
    with_check
FROM pg_policies 
WHERE schemaname = 'public' AND tablename = 'authorized_users';

-- 3. 检查表权限
SELECT 
    grantee,
    table_name,
    privilege_type
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND table_name = 'authorized_users' 
    AND grantee IN ('anon', 'authenticated')
ORDER BY table_name, grantee;

-- 4. 如果需要，创建基本的RLS策略
-- 允许认证用户查看所有记录
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE schemaname = 'public' 
        AND tablename = 'authorized_users' 
        AND policyname = 'Users can view all authorized users'
    ) THEN
        CREATE POLICY "Users can view all authorized users" ON authorized_users
            FOR SELECT USING (true);
    END IF;
END $$;

-- 5. 确保权限正确设置
GRANT SELECT ON authorized_users TO authenticated;
GRANT SELECT ON authorized_users TO anon;

-- 6. 验证设置
SELECT 'RLS策略检查完成' as status;