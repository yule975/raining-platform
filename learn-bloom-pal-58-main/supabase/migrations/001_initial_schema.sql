-- 创建用户资料表
CREATE TABLE IF NOT EXISTS profiles (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  role TEXT CHECK (role IN ('student', 'admin')) DEFAULT 'student',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建授权用户表
CREATE TABLE IF NOT EXISTS authorized_users (
  id SERIAL PRIMARY KEY,
  email TEXT UNIQUE NOT NULL,
  name TEXT,
  added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('active', 'inactive')) DEFAULT 'active'
);

-- 创建课程表
CREATE TABLE IF NOT EXISTS courses (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  title TEXT NOT NULL,
  description TEXT,
  cover_url TEXT,
  video_url TEXT,
  duration TEXT,
  instructor TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建作业表
CREATE TABLE IF NOT EXISTS assignments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  assignment_type TEXT CHECK (assignment_type IN ('general', 'code_practice', 'report', 'design', 'quiz')) DEFAULT 'general',
  due_date TIMESTAMP WITH TIME ZONE,
  max_score INTEGER DEFAULT 100,
  allow_file_upload BOOLEAN DEFAULT true,
  allowed_file_types TEXT DEFAULT 'pdf,jpg,png,zip,doc,docx',
  max_file_size_mb INTEGER DEFAULT 10,
  instructions TEXT,
  requirements JSONB,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建课程注册表
CREATE TABLE IF NOT EXISTS course_enrollments (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('active', 'completed', 'dropped')) DEFAULT 'active',
  UNIQUE(user_id, course_id)
);

-- 创建作业提交表
CREATE TABLE IF NOT EXISTS assignment_submissions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE NOT NULL,
  student_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  content TEXT,
  files JSONB DEFAULT '[]'::jsonb,
  file_count INTEGER DEFAULT 0,
  total_file_size INTEGER DEFAULT 0,
  score INTEGER,
  feedback TEXT,
  status TEXT CHECK (status IN ('draft', 'submitted', 'graded')) DEFAULT 'draft',
  submitted_at TIMESTAMP WITH TIME ZONE,
  graded_at TIMESTAMP WITH TIME ZONE,
  graded_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(assignment_id, student_id)
);

-- 创建学习进度表
CREATE TABLE IF NOT EXISTS learning_progress (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
  last_accessed_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(user_id, course_id)
);

-- 创建更新时间触发器函数
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

-- 为所有表添加更新时间触发器
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON profiles FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_courses_updated_at BEFORE UPDATE ON courses FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignments_updated_at BEFORE UPDATE ON assignments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_assignment_submissions_updated_at BEFORE UPDATE ON assignment_submissions FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_learning_progress_updated_at BEFORE UPDATE ON learning_progress FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 启用行级安全策略 (RLS)
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE authorized_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignments ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE assignment_submissions ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_progress ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略

-- profiles表策略
CREATE POLICY "Users can view own profile" ON profiles FOR SELECT USING (auth.uid() = id);
CREATE POLICY "Users can update own profile" ON profiles FOR UPDATE USING (auth.uid() = id);
CREATE POLICY "Admins can view all profiles" ON profiles FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Admins can update all profiles" ON profiles FOR UPDATE USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- authorized_users表策略（仅管理员可访问）
CREATE POLICY "Only admins can access authorized_users" ON authorized_users FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- courses表策略（所有认证用户可查看，管理员可修改）
CREATE POLICY "Authenticated users can view courses" ON courses FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage courses" ON courses FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- assignments表策略
CREATE POLICY "Authenticated users can view assignments" ON assignments FOR SELECT TO authenticated USING (true);
CREATE POLICY "Admins can manage assignments" ON assignments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- course_enrollments表策略
CREATE POLICY "Users can view own enrollments" ON course_enrollments FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can enroll in courses" ON course_enrollments FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Admins can view all enrollments" ON course_enrollments FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Admins can manage all enrollments" ON course_enrollments FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- assignment_submissions表策略
CREATE POLICY "Students can view own submissions" ON assignment_submissions FOR SELECT USING (auth.uid() = student_id);
CREATE POLICY "Students can create own submissions" ON assignment_submissions FOR INSERT WITH CHECK (auth.uid() = student_id);
CREATE POLICY "Students can update own submissions" ON assignment_submissions FOR UPDATE USING (auth.uid() = student_id AND status != 'graded');
CREATE POLICY "Admins can view all submissions" ON assignment_submissions FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);
CREATE POLICY "Admins can manage all submissions" ON assignment_submissions FOR ALL USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- learning_progress表策略
CREATE POLICY "Users can view own progress" ON learning_progress FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON learning_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own progress" ON learning_progress FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Admins can view all progress" ON learning_progress FOR SELECT USING (
  EXISTS (
    SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
  )
);

-- 创建函数：用户注册时自动创建profile
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建触发器：新用户注册时自动创建profile
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- 插入一些初始数据

-- 插入管理员授权用户（请根据实际情况修改邮箱）
INSERT INTO authorized_users (email, name, status) VALUES 
('admin@company.com', '系统管理员', 'active'),
('teacher@company.com', '教师', 'active')
ON CONFLICT (email) DO NOTHING;

-- 插入示例课程
INSERT INTO courses (id, title, description, cover_url, video_url, duration, instructor) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '大语言模型基础', '深入学习大语言模型的原理、架构和应用，掌握Transformer、GPT等核心技术。', '', 'https://www.youtube.com/embed/jNQXAC9IVRw', '2小时30分钟', 'AI研究院'),
('550e8400-e29b-41d4-a716-446655440002', 'AI绘画与创意设计', '学习AI绘画技术，掌握GAN、扩散模型等生成技术，探索AI在创意设计中的应用。', '', 'https://www.youtube.com/embed/jNQXAC9IVRw', '3小时15分钟', '创意设计团队')
ON CONFLICT (id) DO NOTHING;

-- 插入示例作业
INSERT INTO assignments (course_id, title, description, assignment_type, due_date, requirements) VALUES 
('550e8400-e29b-41d4-a716-446655440001', '实现简单的Transformer模型', '使用PyTorch实现一个基础的Transformer编码器，包含多头注意力机制和位置编码。', 'code_practice', '2024-04-15 23:59:59+00', '["实现多头注意力机制", "添加位置编码", "包含完整的前向传播", "提供详细代码注释"]'::jsonb),
('550e8400-e29b-41d4-a716-446655440002', 'AI绘画风格迁移项目', '选择一幅名画作为风格图片，使用神经风格迁移技术创作新作品。', 'design', '2024-04-20 23:59:59+00', '["提供原始内容图片", "提供风格参考图片", "展示最终生成结果", "撰写技术实现报告"]'::jsonb)
ON CONFLICT DO NOTHING;

-- 创建存储桶（需要在Supabase控制台中手动创建，或使用Supabase CLI）
-- 这里只是注释说明需要创建的存储桶：
-- 1. course-materials: 存储课程资料
-- 2. assignment-files: 存储作业文件
-- 3. user-avatars: 存储用户头像
-- 4. course-covers: 存储课程封面图片