-- 创建课程完成记录表
CREATE TABLE IF NOT EXISTS course_completions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  session_id UUID REFERENCES training_sessions(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  course_id UUID REFERENCES courses(id) ON DELETE CASCADE NOT NULL,
  video_completed BOOLEAN DEFAULT false,
  video_completed_at TIMESTAMP WITH TIME ZONE,
  assignments_completed BOOLEAN DEFAULT false,
  assignments_completed_at TIMESTAMP WITH TIME ZONE,
  course_completed BOOLEAN DEFAULT false,
  course_completed_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(session_id, user_id, course_id)
);

-- 创建索引
CREATE INDEX IF NOT EXISTS idx_course_completions_session ON course_completions(session_id);
CREATE INDEX IF NOT EXISTS idx_course_completions_user ON course_completions(user_id);
CREATE INDEX IF NOT EXISTS idx_course_completions_course ON course_completions(course_id);

-- 添加更新时间触发器
DROP TRIGGER IF EXISTS update_course_completions_updated_at ON course_completions;
CREATE TRIGGER update_course_completions_updated_at 
  BEFORE UPDATE ON course_completions 
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 启用RLS
ALTER TABLE course_completions ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
DROP POLICY IF EXISTS "Enable read access for authenticated users" ON course_completions;
CREATE POLICY "Enable read access for authenticated users" 
  ON course_completions FOR SELECT 
  TO authenticated 
  USING (true);

DROP POLICY IF EXISTS "Enable insert for authenticated users" ON course_completions;
CREATE POLICY "Enable insert for authenticated users" 
  ON course_completions FOR INSERT 
  TO authenticated 
  WITH CHECK (true);

DROP POLICY IF EXISTS "Enable update for authenticated users" ON course_completions;
CREATE POLICY "Enable update for authenticated users" 
  ON course_completions FOR UPDATE 
  TO authenticated 
  USING (true)
  WITH CHECK (true);

