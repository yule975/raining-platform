-- 修复training_sessions表的权限问题
-- 启用RLS并授予适当权限

-- 启用RLS
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;

-- 授予基本权限给anon和authenticated角色
GRANT SELECT ON training_sessions TO anon;
GRANT ALL PRIVILEGES ON training_sessions TO authenticated;

-- 创建RLS策略
-- 允许所有用户查看培训期次
CREATE POLICY "Allow public read access to training sessions" ON training_sessions
    FOR SELECT USING (true);

-- 允许认证用户进行所有操作
CREATE POLICY "Allow authenticated users full access to training sessions" ON training_sessions
    FOR ALL USING (auth.role() = 'authenticated');

-- 确保session_courses表也有正确的权限
GRANT SELECT ON session_courses TO anon;
GRANT ALL PRIVILEGES ON session_courses TO authenticated;

-- 为session_courses创建RLS策略（如果还没有的话）
ALTER TABLE session_courses ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Allow public read access to session courses" ON session_courses
    FOR SELECT USING (true);

CREATE POLICY "Allow authenticated users full access to session courses" ON session_courses
    FOR ALL USING (auth.role() = 'authenticated');