-- 创建学习路径和进度追踪相关表

-- 用户课程注册表
CREATE TABLE IF NOT EXISTS course_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'dropped')),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, course_id)
);

-- 用户学习进度表
CREATE TABLE IF NOT EXISTS user_progress (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    assignment_id UUID REFERENCES assignments(id) ON DELETE CASCADE,
    progress_type TEXT NOT NULL CHECK (progress_type IN ('course_started', 'assignment_viewed', 'assignment_submitted', 'course_completed', 'material_downloaded')),
    progress_data JSONB,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 学习路径表
CREATE TABLE IF NOT EXISTS learning_paths (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    title TEXT NOT NULL,
    description TEXT,
    difficulty_level TEXT DEFAULT 'beginner' CHECK (difficulty_level IN ('beginner', 'intermediate', 'advanced')),
    estimated_duration TEXT,
    cover_url TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 学习路径课程关联表
CREATE TABLE IF NOT EXISTS learning_path_courses (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    learning_path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    sequence_order INTEGER NOT NULL,
    is_required BOOLEAN DEFAULT true,
    prerequisites TEXT[], -- 前置课程要求
    created_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(learning_path_id, course_id),
    UNIQUE(learning_path_id, sequence_order)
);

-- 用户学习路径注册表
CREATE TABLE IF NOT EXISTS learning_path_enrollments (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    learning_path_id UUID REFERENCES learning_paths(id) ON DELETE CASCADE,
    enrolled_at TIMESTAMPTZ DEFAULT NOW(),
    completed_at TIMESTAMPTZ,
    progress_percentage INTEGER DEFAULT 0 CHECK (progress_percentage >= 0 AND progress_percentage <= 100),
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'completed', 'paused', 'dropped')),
    current_course_id UUID REFERENCES courses(id),
    last_accessed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE(user_id, learning_path_id)
);

-- 讨论区表
CREATE TABLE IF NOT EXISTS discussions (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    course_id UUID REFERENCES courses(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    title TEXT NOT NULL,
    content TEXT NOT NULL,
    is_pinned BOOLEAN DEFAULT false,
    reply_count INTEGER DEFAULT 0,
    last_reply_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 讨论回复表
CREATE TABLE IF NOT EXISTS discussion_replies (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    discussion_id UUID REFERENCES discussions(id) ON DELETE CASCADE,
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    content TEXT NOT NULL,
    parent_reply_id UUID REFERENCES discussion_replies(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_course_enrollments_user_id ON course_enrollments(user_id);
CREATE INDEX IF NOT EXISTS idx_course_enrollments_course_id ON course_enrollments(course_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_user_id ON user_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_progress_course_id ON user_progress(course_id);
CREATE INDEX IF NOT EXISTS idx_learning_path_courses_path_id ON learning_path_courses(learning_path_id);
CREATE INDEX IF NOT EXISTS idx_discussions_course_id ON discussions(course_id);
CREATE INDEX IF NOT EXISTS idx_discussion_replies_discussion_id ON discussion_replies(discussion_id);

-- 启用行级安全策略
ALTER TABLE course_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_paths ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_courses ENABLE ROW LEVEL SECURITY;
ALTER TABLE learning_path_enrollments ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussions ENABLE ROW LEVEL SECURITY;
ALTER TABLE discussion_replies ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 用户只能查看自己的注册和进度信息
CREATE POLICY "Users can view own enrollments" ON course_enrollments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own enrollments" ON course_enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own enrollments" ON course_enrollments
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Users can view own progress" ON user_progress
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own progress" ON user_progress
    FOR INSERT WITH CHECK (auth.uid() = user_id);

-- 学习路径对所有认证用户可见
CREATE POLICY "Authenticated users can view learning paths" ON learning_paths
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can view learning path courses" ON learning_path_courses
    FOR SELECT USING (auth.role() = 'authenticated');

-- 学习路径注册策略
CREATE POLICY "Users can view own path enrollments" ON learning_path_enrollments
    FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own path enrollments" ON learning_path_enrollments
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own path enrollments" ON learning_path_enrollments
    FOR UPDATE USING (auth.uid() = user_id);

-- 讨论区策略
CREATE POLICY "Authenticated users can view discussions" ON discussions
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create discussions" ON discussions
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own discussions" ON discussions
    FOR UPDATE USING (auth.uid() = user_id);

CREATE POLICY "Authenticated users can view replies" ON discussion_replies
    FOR SELECT USING (auth.role() = 'authenticated');

CREATE POLICY "Authenticated users can create replies" ON discussion_replies
    FOR INSERT WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own replies" ON discussion_replies
    FOR UPDATE USING (auth.uid() = user_id);

-- 授权给anon和authenticated角色
GRANT SELECT, INSERT, UPDATE ON course_enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON user_progress TO authenticated;
GRANT SELECT ON learning_paths TO authenticated, anon;
GRANT SELECT ON learning_path_courses TO authenticated, anon;
GRANT SELECT, INSERT, UPDATE ON learning_path_enrollments TO authenticated;
GRANT SELECT, INSERT, UPDATE ON discussions TO authenticated;
GRANT SELECT, INSERT, UPDATE ON discussion_replies TO authenticated;