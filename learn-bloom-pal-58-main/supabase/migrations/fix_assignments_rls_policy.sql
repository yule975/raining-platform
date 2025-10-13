-- 修复assignments表的RLS策略问题
-- 解决创建作业时违反行级安全策略的错误

-- 1. 删除现有的assignments表RLS策略
DROP POLICY IF EXISTS "Authenticated users can view assignments" ON assignments;
DROP POLICY IF EXISTS "Admins can manage assignments" ON assignments;
DROP POLICY IF EXISTS "assignments_select_policy" ON assignments;
DROP POLICY IF EXISTS "assignments_insert_policy" ON assignments;
DROP POLICY IF EXISTS "assignments_update_policy" ON assignments;
DROP POLICY IF EXISTS "assignments_delete_policy" ON assignments;

-- 2. 创建新的宽松RLS策略（适用于开发环境）
-- 允许所有认证用户查看作业
CREATE POLICY "Allow authenticated users to view assignments" ON assignments
  FOR SELECT TO authenticated USING (true);

-- 允许所有认证用户创建作业（开发环境）
CREATE POLICY "Allow authenticated users to create assignments" ON assignments
  FOR INSERT TO authenticated WITH CHECK (true);

-- 允许所有认证用户更新作业（开发环境）
CREATE POLICY "Allow authenticated users to update assignments" ON assignments
  FOR UPDATE TO authenticated USING (true);

-- 允许所有认证用户删除作业（开发环境）
CREATE POLICY "Allow authenticated users to delete assignments" ON assignments
  FOR DELETE TO authenticated USING (true);

-- 3. 确保RLS已启用
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- 4. 授予必要的表权限
GRANT SELECT ON assignments TO authenticated;
GRANT INSERT ON assignments TO authenticated;
GRANT UPDATE ON assignments TO authenticated;
GRANT DELETE ON assignments TO authenticated;

-- 5. 同时修复courses表的RLS策略（如果需要）
DROP POLICY IF EXISTS "Authenticated users can view courses" ON courses;
DROP POLICY IF EXISTS "Admins can manage courses" ON courses;

-- 创建courses表的宽松策略
CREATE POLICY "Allow authenticated users to view courses" ON courses
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Allow authenticated users to manage courses" ON courses
  FOR ALL TO authenticated USING (true);

-- 授予courses表权限
GRANT SELECT ON courses TO authenticated;
GRANT INSERT ON courses TO authenticated;
GRANT UPDATE ON courses TO authenticated;
GRANT DELETE ON courses TO authenticated;

-- 6. 检查权限授予情况
SELECT 
    grantee, 
    table_name, 
    privilege_type 
FROM information_schema.role_table_grants 
WHERE table_schema = 'public' 
    AND grantee IN ('anon', 'authenticated') 
    AND table_name IN ('assignments', 'courses')
ORDER BY table_name, grantee;