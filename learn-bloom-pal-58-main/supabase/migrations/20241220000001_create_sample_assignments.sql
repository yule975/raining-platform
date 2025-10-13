-- 创建示例作业数据
-- 首先确保有课程数据
INSERT INTO courses (id, title, description, instructor, created_at, updated_at)
VALUES 
  ('550e8400-e29b-41d4-a716-446655440001', '前端开发基础', '学习HTML、CSS和JavaScript基础知识', '张老师', NOW(), NOW()),
  ('550e8400-e29b-41d4-a716-446655440002', 'React进阶课程', '深入学习React框架和生态系统', '李老师', NOW(), NOW())
ON CONFLICT (id) DO NOTHING;

-- 创建示例作业
INSERT INTO assignments (id, title, description, course_id, due_date, max_score, created_at, updated_at)
VALUES 
  ('660e8400-e29b-41d4-a716-446655440001', 'HTML基础练习', '创建一个包含表格和表单的HTML页面', '550e8400-e29b-41d4-a716-446655440001', NOW() + INTERVAL '7 days', 100, NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440002', 'CSS样式设计', '为HTML页面添加响应式CSS样式', '550e8400-e29b-41d4-a716-446655440001', NOW() + INTERVAL '10 days', 100, NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440003', 'JavaScript交互功能', '使用JavaScript添加页面交互功能', '550e8400-e29b-41d4-a716-446655440001', NOW() + INTERVAL '14 days', 100, NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440004', 'React组件开发', '创建可复用的React组件', '550e8400-e29b-41d4-a716-446655440002', NOW() + INTERVAL '21 days', 150, NOW(), NOW()),
  ('660e8400-e29b-41d4-a716-446655440005', 'React状态管理', '使用useState和useEffect管理组件状态', '550e8400-e29b-41d4-a716-446655440002', NOW() + INTERVAL '28 days', 150, NOW(), NOW());

-- 创建一些示例提交记录
INSERT INTO submissions (id, assignment_id, student_id, content, status, score, submitted_at)
VALUES 
  ('770e8400-e29b-41d4-a716-446655440001', '660e8400-e29b-41d4-a716-446655440001', '392059f7-dfd5-40f3-8dc2-ca33acaed599', '我的HTML作业提交内容', 'submitted', NULL, NOW() - INTERVAL '1 day'),
  ('770e8400-e29b-41d4-a716-446655440002', '660e8400-e29b-41d4-a716-446655440002', '392059f7-dfd5-40f3-8dc2-ca33acaed599', '我的CSS作业提交内容', 'graded', 85, NOW() - INTERVAL '2 days'),
  ('770e8400-e29b-41d4-a716-446655440003', '660e8400-e29b-41d4-a716-446655440003', '392059f7-dfd5-40f3-8dc2-ca33acaed599', '我的JavaScript作业提交内容', 'submitted', NULL, NOW() - INTERVAL '3 hours');

-- 确保RLS策略允许访问
-- 为assignments表添加基本的RLS策略
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;

-- 允许已认证用户查看所有作业
CREATE POLICY "Allow authenticated users to view assignments" ON assignments
  FOR SELECT TO authenticated USING (true);

-- 允许已认证用户创建作业（如果是教师）
CREATE POLICY "Allow authenticated users to create assignments" ON assignments
  FOR INSERT TO authenticated WITH CHECK (true);

-- 允许已认证用户更新作业
CREATE POLICY "Allow authenticated users to update assignments" ON assignments
  FOR UPDATE TO authenticated USING (true);

-- 允许已认证用户删除作业
CREATE POLICY "Allow authenticated users to delete assignments" ON assignments
  FOR DELETE TO authenticated USING (true);

-- 为submissions表添加RLS策略
ALTER TABLE submissions ENABLE ROW LEVEL SECURITY;

-- 允许已认证用户查看所有提交
CREATE POLICY "Allow authenticated users to view submissions" ON submissions
  FOR SELECT TO authenticated USING (true);

-- 允许已认证用户创建提交
CREATE POLICY "Allow authenticated users to create submissions" ON submissions
  FOR INSERT TO authenticated WITH CHECK (true);

-- 允许已认证用户更新提交
CREATE POLICY "Allow authenticated users to update submissions" ON submissions
  FOR UPDATE TO authenticated USING (true);

-- 确保anon和authenticated角色有表访问权限
GRANT ALL PRIVILEGES ON assignments TO authenticated;
GRANT ALL PRIVILEGES ON submissions TO authenticated;
GRANT SELECT ON assignments TO anon;
GRANT SELECT ON submissions TO anon;