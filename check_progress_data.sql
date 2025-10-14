-- 检查学习进度数据的完整诊断查询
-- 1. 检查course_completions表是否有数据
SELECT 
  'course_completions表记录数' as check_type,
  COUNT(*) as count
FROM course_completions;

-- 2. 查看最近的course_completions记录（含详细信息）
SELECT 
  cc.id,
  cc.session_id,
  cc.user_id,
  cc.course_id,
  cc.video_completed,
  cc.assignments_completed,
  cc.course_completed,
  cc.created_at,
  cc.updated_at,
  p.email as student_email,
  c.title as course_title,
  ts.name as session_name
FROM course_completions cc
LEFT JOIN profiles p ON cc.user_id = p.id
LEFT JOIN courses c ON cc.course_id = c.id
LEFT JOIN training_sessions ts ON cc.session_id = ts.id
ORDER BY cc.updated_at DESC
LIMIT 10;

-- 3. 检查当前期次ID
SELECT 
  id,
  name,
  is_current,
  status,
  created_at
FROM training_sessions
WHERE is_current = true
ORDER BY created_at DESC
LIMIT 1;

-- 4. 检查session_students表（期次学生关联）
SELECT 
  'session_students表记录数' as check_type,
  COUNT(*) as count
FROM session_students
WHERE session_id = (SELECT id FROM training_sessions WHERE is_current = true LIMIT 1);

-- 5. 检查student@test用户信息
SELECT 
  p.id as user_id,
  p.email,
  p.full_name,
  p.role
FROM profiles p
WHERE p.email = 'student@test.com';

-- 6. 检查student@test在当前期次的学习记录
SELECT 
  cc.*,
  c.title as course_title
FROM course_completions cc
LEFT JOIN courses c ON cc.course_id = c.id
WHERE cc.user_id = (SELECT id FROM profiles WHERE email = 'student@test.com')
  AND cc.session_id = (SELECT id FROM training_sessions WHERE is_current = true LIMIT 1);

