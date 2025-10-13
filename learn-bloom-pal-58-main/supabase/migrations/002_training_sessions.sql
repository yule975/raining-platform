-- 创建期次制培训的数据库架构
-- 支持培训期次管理、学员导入、课程完成跟踪等功能

-- 1. 创建培训期次表
CREATE TABLE IF NOT EXISTS training_sessions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL, -- 期次名称，如"第三期"
  description TEXT, -- 期次描述
  start_date DATE NOT NULL, -- 开始日期
  end_date DATE, -- 结束日期
  status TEXT CHECK (status IN ('upcoming', 'active', 'completed')) DEFAULT 'upcoming',
  is_current BOOLEAN DEFAULT false, -- 是否为当前期次
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. 创建期次学员表
CREATE TABLE IF NOT EXISTS session_students (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  student_number TEXT, -- 学员编号（可选）
  enrolled_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  status TEXT CHECK (status IN ('active', 'completed', 'dropped')) DEFAULT 'active',
  completion_rate DECIMAL(5,2) DEFAULT 0.00, -- 完成率
  completed_at TIMESTAMP WITH TIME ZONE, -- 完成时间
  UNIQUE(session_id, user_id)
);

-- 3. 修改现有表结构，添加session_id字段

-- 为learning_progress表添加session_id
ALTER TABLE learning_progress 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE;

-- 为assignment_submissions表添加session_id
ALTER TABLE assignment_submissions 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE;

-- 为course_enrollments表添加session_id
ALTER TABLE course_enrollments 
ADD COLUMN IF NOT EXISTS session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE;

-- 4. 创建课程完成记录表（基于视频观看+作业完成的双重标准）
CREATE TABLE IF NOT EXISTS course_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  video_completed BOOLEAN DEFAULT false, -- 视频是否观看完成
  video_completed_at TIMESTAMP WITH TIME ZONE, -- 视频完成时间
  assignments_completed BOOLEAN DEFAULT false, -- 作业是否全部完成
  assignments_completed_at TIMESTAMP WITH TIME ZONE, -- 作业完成时间
  course_completed BOOLEAN DEFAULT false, -- 课程是否完成（视频+作业都完成）
  course_completed_at TIMESTAMP WITH TIME ZONE, -- 课程完成时间
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id, course_id)
);

-- 5. 创建学员导入记录表
CREATE TABLE IF NOT EXISTS student_imports (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
  imported_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  file_name TEXT NOT NULL, -- 导入的Excel文件名
  total_count INTEGER NOT NULL, -- 总导入数量
  success_count INTEGER NOT NULL, -- 成功导入数量
  error_count INTEGER NOT NULL, -- 失败数量
  error_details JSONB, -- 错误详情
  imported_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 6. 为新表添加更新时间触发器
CREATE TRIGGER update_training_sessions_updated_at 
  BEFORE UPDATE ON training_sessions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_session_students_updated_at 
  BEFORE UPDATE ON session_students 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_course_completions_updated_at 
  BEFORE UPDATE ON course_completions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 7. 启用RLS
ALTER TABLE training_sessions ENABLE ROW LEVEL SECURITY;
ALTER TABLE session_students ENABLE ROW LEVEL SECURITY;
ALTER TABLE course_completions ENABLE ROW LEVEL SECURITY;
ALTER TABLE student_imports ENABLE ROW LEVEL SECURITY;

-- 8. 创建RLS策略

-- training_sessions表策略
CREATE POLICY "Authenticated users can view training sessions" ON training_sessions 
  FOR SELECT TO authenticated USING (true);

CREATE POLICY "Admins can manage training sessions" ON training_sessions 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- session_students表策略
CREATE POLICY "Users can view own session enrollment" ON session_students 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all session students" ON session_students 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage session students" ON session_students 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- course_completions表策略
CREATE POLICY "Users can view own course completions" ON course_completions 
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can update own course completions" ON course_completions 
  FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own course completions" ON course_completions 
  FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Admins can view all course completions" ON course_completions 
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

CREATE POLICY "Admins can manage course completions" ON course_completions 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- student_imports表策略（仅管理员可访问）
CREATE POLICY "Only admins can access student imports" ON student_imports 
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- 9. 创建有用的函数

-- 获取当前活跃期次
CREATE OR REPLACE FUNCTION get_current_session()
RETURNS UUID AS $$
DECLARE
  current_session_id UUID;
BEGIN
  SELECT id INTO current_session_id 
  FROM training_sessions 
  WHERE is_current = true AND status = 'active'
  LIMIT 1;
  
  RETURN current_session_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 更新课程完成状态的函数
CREATE OR REPLACE FUNCTION update_course_completion(
  p_session_id UUID,
  p_user_id UUID,
  p_course_id UUID,
  p_video_completed BOOLEAN DEFAULT NULL,
  p_assignments_completed BOOLEAN DEFAULT NULL
)
RETURNS VOID AS $$
DECLARE
  v_video_completed BOOLEAN;
  v_assignments_completed BOOLEAN;
  v_course_completed BOOLEAN;
BEGIN
  -- 插入或更新课程完成记录
  INSERT INTO course_completions (
    session_id, user_id, course_id, 
    video_completed, assignments_completed
  )
  VALUES (
    p_session_id, p_user_id, p_course_id,
    COALESCE(p_video_completed, false),
    COALESCE(p_assignments_completed, false)
  )
  ON CONFLICT (session_id, user_id, course_id)
  DO UPDATE SET
    video_completed = CASE 
      WHEN p_video_completed IS NOT NULL THEN p_video_completed 
      ELSE course_completions.video_completed 
    END,
    video_completed_at = CASE 
      WHEN p_video_completed = true THEN NOW() 
      ELSE course_completions.video_completed_at 
    END,
    assignments_completed = CASE 
      WHEN p_assignments_completed IS NOT NULL THEN p_assignments_completed 
      ELSE course_completions.assignments_completed 
    END,
    assignments_completed_at = CASE 
      WHEN p_assignments_completed = true THEN NOW() 
      ELSE course_completions.assignments_completed_at 
    END,
    updated_at = NOW();

  -- 获取更新后的状态
  SELECT video_completed, assignments_completed 
  INTO v_video_completed, v_assignments_completed
  FROM course_completions 
  WHERE session_id = p_session_id AND user_id = p_user_id AND course_id = p_course_id;

  -- 判断课程是否完成（视频+作业都完成）
  v_course_completed := v_video_completed AND v_assignments_completed;

  -- 更新课程完成状态
  UPDATE course_completions 
  SET 
    course_completed = v_course_completed,
    course_completed_at = CASE 
      WHEN v_course_completed AND course_completed_at IS NULL THEN NOW() 
      ELSE course_completed_at 
    END
  WHERE session_id = p_session_id AND user_id = p_user_id AND course_id = p_course_id;

END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 10. 插入初始数据

-- 创建第一个培训期次
INSERT INTO training_sessions (name, description, start_date, status, is_current) 
VALUES (
  '第一期', 
  '首期AI技术培训', 
  CURRENT_DATE, 
  'active', 
  true
) ON CONFLICT DO NOTHING;

-- 为现有用户自动加入当前期次（如果有的话）
INSERT INTO session_students (session_id, user_id)
SELECT 
  ts.id as session_id,
  p.id as user_id
FROM training_sessions ts
CROSS JOIN profiles p
WHERE ts.is_current = true 
  AND p.role = 'student'
ON CONFLICT (session_id, user_id) DO NOTHING;

-- 为现有的学习进度记录添加session_id
UPDATE learning_progress 
SET session_id = (
  SELECT id FROM training_sessions WHERE is_current = true LIMIT 1
)
WHERE session_id IS NULL;

-- 为现有的作业提交记录添加session_id
UPDATE assignment_submissions 
SET session_id = (
  SELECT id FROM training_sessions WHERE is_current = true LIMIT 1
)
WHERE session_id IS NULL;

-- 为现有的课程注册记录添加session_id
UPDATE course_enrollments 
SET session_id = (
  SELECT id FROM training_sessions WHERE is_current = true LIMIT 1
)
WHERE session_id IS NULL;