-- 修复add_courses_to_session函数中的course_id列引用模糊问题
CREATE OR REPLACE FUNCTION add_courses_to_session(
    p_session_id UUID,
    p_course_ids UUID[]
)
RETURNS INTEGER AS $$
DECLARE
    v_course_id UUID;  -- 使用不同的变量名避免与列名冲突
    inserted_count INTEGER := 0;
BEGIN
    -- 遍历课程ID数组
    FOREACH v_course_id IN ARRAY p_course_ids
    LOOP
        -- 使用ON CONFLICT DO NOTHING避免重复插入
        INSERT INTO session_courses (session_id, course_id)
        VALUES (p_session_id, v_course_id)
        ON CONFLICT (session_id, course_id) DO NOTHING;
        
        -- 如果插入成功，计数器加1
        IF FOUND THEN
            inserted_count := inserted_count + 1;
        END IF;
    END LOOP;
    
    RETURN inserted_count;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 同时修复remove_courses_from_session函数中可能的类似问题
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