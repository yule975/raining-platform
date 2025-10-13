-- 为authorized_users表添加角色、部门和备注字段
ALTER TABLE authorized_users 
ADD COLUMN role TEXT DEFAULT 'student' CHECK (role IN ('student', 'admin')),
ADD COLUMN department TEXT,
ADD COLUMN notes TEXT;

-- 添加索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_authorized_users_role ON authorized_users(role);
CREATE INDEX IF NOT EXISTS idx_authorized_users_department ON authorized_users(department);

-- 确保anon和authenticated角色有适当的权限
GRANT SELECT, INSERT, UPDATE, DELETE ON authorized_users TO authenticated;
GRANT SELECT ON authorized_users TO anon;