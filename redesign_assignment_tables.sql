-- 重新设计作业系统数据库表
-- 支持一课程多作业，文件上传功能

-- 1. 更新assignments表结构
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS assignment_type VARCHAR(50) DEFAULT 'general',
ADD COLUMN IF NOT EXISTS due_date TIMESTAMP,
ADD COLUMN IF NOT EXISTS max_score INTEGER DEFAULT 100,
ADD COLUMN IF NOT EXISTS allow_file_upload BOOLEAN DEFAULT true,
ADD COLUMN IF NOT EXISTS allowed_file_types TEXT DEFAULT 'pdf,jpg,jpeg,png,zip,doc,docx',
ADD COLUMN IF NOT EXISTS max_file_size_mb INTEGER DEFAULT 10,
ADD COLUMN IF NOT EXISTS instructions TEXT,
ADD COLUMN IF NOT EXISTS is_active BOOLEAN DEFAULT true;

-- 2. 更新submissions表结构 
ALTER TABLE submissions
ADD COLUMN IF NOT EXISTS files JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS file_count INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS total_file_size INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS graded_at TIMESTAMP,
ADD COLUMN IF NOT EXISTS graded_by UUID REFERENCES auth.users(id);

-- 3. 创建文件上传记录表（可选，用于跟踪文件）
CREATE TABLE IF NOT EXISTS assignment_files (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  submission_id UUID REFERENCES submissions(id) ON DELETE CASCADE,
  file_name TEXT NOT NULL,
  file_path TEXT NOT NULL,
  file_size INTEGER NOT NULL,
  file_type TEXT NOT NULL,
  uploaded_at TIMESTAMP DEFAULT NOW()
);

-- 4. 更新RLS策略
DROP POLICY IF EXISTS "assignment_files_policy" ON assignment_files;
CREATE POLICY "assignment_files_policy" ON assignment_files
FOR ALL USING (true);

-- 5. 插入一些测试数据类型
UPDATE assignments 
SET assignment_type = 'code_practice',
    allow_file_upload = true,
    allowed_file_types = 'py,js,zip,pdf,jpg,png',
    max_file_size_mb = 15,
    instructions = '请提交代码文件和运行截图'
WHERE title LIKE '%代码%' OR title LIKE '%编程%';

UPDATE assignments 
SET assignment_type = 'report',
    allow_file_upload = true, 
    allowed_file_types = 'pdf,doc,docx,jpg,png',
    max_file_size_mb = 5,
    instructions = '请提交实验报告和相关截图'
WHERE title LIKE '%报告%' OR title LIKE '%实验%';

COMMENT ON TABLE assignments IS '作业表 - 支持多种作业类型和文件上传';
COMMENT ON TABLE submissions IS '提交表 - 支持文件上传和评分';
COMMENT ON TABLE assignment_files IS '文件记录表 - 跟踪上传的文件';
