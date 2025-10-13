-- 创建期次表（如果不存在）
CREATE TABLE IF NOT EXISTS training_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name TEXT NOT NULL,
    description TEXT,
    start_date DATE,
    end_date DATE,
    is_current BOOLEAN DEFAULT FALSE,
    status TEXT DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed')),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 创建期次课程关联表
CREATE TABLE IF NOT EXISTS session_courses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES training_sessions(id) ON DELETE CASCADE,
    course_id UUID NOT NULL REFERENCES courses(id) ON DELETE CASCADE,
    added_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    added_by UUID REFERENCES profiles(id),
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- 确保同一期次中不会重复添加相同课程
    UNIQUE(session_id, course_id)
);

-- 创建索引以提高查询性能
CREATE INDEX IF NOT EXISTS idx_session_courses_session_id ON session_courses(session_id);
CREATE INDEX IF NOT EXISTS idx_session_courses_course_id ON session_courses(course_id);

-- 添加更新时间触发器
CREATE OR REPLACE FUNCTION update_session_courses_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER session_courses_updated_at
    BEFORE UPDATE ON session_courses
    FOR EACH ROW
    EXECUTE FUNCTION update_session_courses_updated_at();

-- 启用RLS
ALTER TABLE session_courses ENABLE ROW LEVEL SECURITY;

-- 创建RLS策略
-- 认证用户可以查看所有期次课程关联
CREATE POLICY "Users can view session courses" ON session_courses
    FOR SELECT USING (auth.role() = 'authenticated');

-- 管理员可以管理期次课程关联
CREATE POLICY "Admins can manage session courses" ON session_courses
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM profiles 
            WHERE profiles.id = auth.uid() 
            AND profiles.role = 'admin'
        )
    );

-- 授权给anon和authenticated角色
GRANT SELECT ON session_courses TO anon;
GRANT ALL PRIVILEGES ON session_courses TO authenticated;

-- 创建获取期次关联课程的函数
CREATE OR REPLACE FUNCTION get_session_courses(p_session_id UUID)
RETURNS TABLE (
    course_id UUID,
    title TEXT,
    description TEXT,
    difficulty_level TEXT,
    estimated_duration INTEGER,
    created_at TIMESTAMP WITH TIME ZONE
) AS $$
BEGIN
    RETURN QUERY
    SELECT 
        c.id,
        c.title,
        c.description,
        c.difficulty_level,
        c.estimated_duration,
        c.created_at
    FROM courses c
    INNER JOIN session_courses sc ON c.id = sc.course_id
    WHERE sc.session_id = p_session_id
    ORDER BY c.title;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建添加课程到期次的函数
CREATE OR REPLACE FUNCTION add_courses_to_session(
    p_session_id UUID,
    p_course_ids UUID[]
)
RETURNS INTEGER AS $$
DECLARE
    course_id UUID;
    inserted_count INTEGER := 0;
BEGIN
    -- 遍历课程ID数组
    FOREACH course_id IN ARRAY p_course_ids
    LOOP
        -- 使用ON CONFLICT DO NOTHING避免重复插入
        INSERT INTO session_courses (session_id, course_id)
        VALUES (p_session_id, course_id)
        ON CONFLICT (session_id, course_id) DO NOTHING;
        
        -- 如果插入成功，计数器加1
        IF FOUND THEN
            inserted_count := inserted_count + 1;
        END IF;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 创建从期次移除课程的函数
CREATE OR REPLACE FUNCTION remove_courses_from_session(
    p_session_id UUID,
    p_course_ids UUID[]
)
RETURNS INTEGER AS $$
DECLARE
    deleted_count INTEGER;
BEGIN
    DELETE FROM session_courses 
    WHERE session_id = p_session_id 
    AND course_id = ANY(p_course_ids);
    
    GET DIAGNOSTICS deleted_count = ROW_COUNT;
    RETURN deleted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;