-- 为training_sessions表添加selectedCourses字段
-- 用于存储创建期次时选中的课程列表

ALTER TABLE training_sessions 
ADD COLUMN IF NOT EXISTS selectedCourses JSONB DEFAULT '[]'::jsonb;

-- 添加注释说明字段用途
COMMENT ON COLUMN training_sessions.selectedCourses IS '创建期次时选中的课程ID列表，JSON格式存储';

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_training_sessions_selectedcourses ON training_sessions USING GIN (selectedCourses);

-- 授予权限
GRANT SELECT, INSERT, UPDATE ON training_sessions TO authenticated;
GRANT SELECT ON training_sessions TO anon;