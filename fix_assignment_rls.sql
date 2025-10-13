-- 修复作业表的RLS策略
-- 允许测试环境下的数据插入

-- 删除现有的assignments表RLS策略
DROP POLICY IF EXISTS "assignments_policy" ON assignments;
DROP POLICY IF EXISTS "assignments_select_policy" ON assignments;
DROP POLICY IF EXISTS "assignments_insert_policy" ON assignments;
DROP POLICY IF EXISTS "assignments_update_policy" ON assignments;
DROP POLICY IF EXISTS "assignments_delete_policy" ON assignments;

-- 为assignments表创建宽松的RLS策略（测试环境）
CREATE POLICY "assignments_select_policy" ON assignments
  FOR SELECT USING (true);

CREATE POLICY "assignments_insert_policy" ON assignments
  FOR INSERT WITH CHECK (true);

CREATE POLICY "assignments_update_policy" ON assignments
  FOR UPDATE USING (true);

CREATE POLICY "assignments_delete_policy" ON assignments
  FOR DELETE USING (true);

-- 删除现有的submissions表RLS策略
DROP POLICY IF EXISTS "submissions_policy" ON submissions;
DROP POLICY IF EXISTS "submissions_select_policy" ON submissions;
DROP POLICY IF EXISTS "submissions_insert_policy" ON submissions;
DROP POLICY IF EXISTS "submissions_update_policy" ON submissions;
DROP POLICY IF EXISTS "submissions_delete_policy" ON submissions;

-- 为submissions表创建宽松的RLS策略（测试环境）
CREATE POLICY "submissions_select_policy" ON submissions
  FOR SELECT USING (true);

CREATE POLICY "submissions_insert_policy" ON submissions
  FOR INSERT WITH CHECK (true);

CREATE POLICY "submissions_update_policy" ON submissions
  FOR UPDATE USING (true);

CREATE POLICY "submissions_delete_policy" ON submissions
  FOR DELETE USING (true);

-- 确保RLS已启用
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;
