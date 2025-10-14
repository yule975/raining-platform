-- 检查course_completions表的数据
SELECT 
  cc.*,
  p.email as student_email,
  c.title as course_title,
  ts.name as session_name
FROM course_completions cc
LEFT JOIN profiles p ON cc.user_id = p.id
LEFT JOIN courses c ON cc.course_id = c.id
LEFT JOIN training_sessions ts ON cc.session_id = ts.id
ORDER BY cc.created_at DESC
LIMIT 20;

