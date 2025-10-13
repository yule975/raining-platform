-- 简化版：直接创建17个测试学员
-- 一步一步执行，避免复杂的存储过程

-- 第1步：创建测试学员到 authorized_users 表
INSERT INTO authorized_users (name, email, status, role) VALUES
('测试学员', 'student@test.com', 'active', 'student'),
('王亚东', 'student2@example.com', 'active', 'student'),
('陈建雄', 'student3@example.com', 'active', 'student'),
('刘宇豪', 'student4@example.com', 'active', 'student'),
('李学菲', 'student5@example.com', 'active', 'student'),
('张三', 'student6@example.com', 'active', 'student'),
('李四', 'student7@example.com', 'active', 'student'),
('王五', 'student8@example.com', 'active', 'student'),
('赵六', 'student9@example.com', 'active', 'student'),
('孙七', 'student10@example.com', 'active', 'student'),
('学员11', 'student11@example.com', 'active', 'student'),
('学员12', 'student12@example.com', 'active', 'student'),
('学员13', 'student13@example.com', 'active', 'student'),
('学员14', 'student14@example.com', 'active', 'student'),
('学员15', 'student15@example.com', 'active', 'student'),
('学员16', 'student16@example.com', 'active', 'student'),
('学员17', 'student17@example.com', 'active', 'student')
ON CONFLICT (email) DO NOTHING;
