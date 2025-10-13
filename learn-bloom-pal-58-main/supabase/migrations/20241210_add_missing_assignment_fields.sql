-- 添加assignments表缺少的字段
-- 修复创建课程时的字段不匹配问题

-- 添加allow_file_upload字段
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS allow_file_upload BOOLEAN DEFAULT true;

-- 添加allowed_file_types字段（如果不存在）
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS allowed_file_types TEXT DEFAULT 'pdf,jpg,png,zip,doc,docx';

-- 添加max_file_size_mb字段（如果不存在）
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS max_file_size_mb INTEGER DEFAULT 10;

-- 添加assignment_type字段（如果不存在）
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS assignment_type TEXT CHECK (assignment_type IN ('general', 'code_practice', 'report', 'design', 'quiz')) DEFAULT 'general';

-- 添加max_score字段（如果不存在）
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 100;

-- 添加instructions字段（如果不存在）
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS instructions TEXT;

-- 添加is_active字段（如果不存在）
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 确保anon和authenticated角色有适当的权限
GRANT SELECT ON assignments TO anon;
GRANT ALL PRIVILEGES ON assignments TO authenticated;

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_assignments_course_id ON assignments(course_id);
CREATE INDEX IF NOT EXISTS idx_assignments_assignment_type ON assignments(assignment_type);
CREATE INDEX IF NOT EXISTS idx_assignments_is_active ON assignments(is_active);