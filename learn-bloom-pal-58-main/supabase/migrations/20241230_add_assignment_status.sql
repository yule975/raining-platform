-- 为assignments表添加status字段
ALTER TABLE assignments 
ADD COLUMN IF NOT EXISTS status TEXT CHECK (status IN ('template', 'published', 'draft')) DEFAULT 'template';

-- 更新现有记录的状态
-- 假设现有作业都是已发布的
UPDATE assignments 
SET status = 'published' 
WHERE status IS NULL OR status = 'template';

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_assignments_status ON assignments(status);

-- 更新注释
COMMENT ON COLUMN assignments.status IS 'Assignment status: template (模板), published (已发布), draft (草稿)';
