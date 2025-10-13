-- 初始化学习路径和示例数据

-- 插入学习路径
INSERT INTO learning_paths (id, title, description, difficulty_level, estimated_duration, cover_url) VALUES
('550e8400-e29b-41d4-a716-446655440001', '前端开发入门路径', '从零开始学习前端开发，掌握HTML、CSS、JavaScript和React等核心技术', 'beginner', '3个月', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20frontend%20development%20workspace%20with%20code%20editor%20showing%20HTML%20CSS%20JavaScript%20colorful%20clean%20professional&image_size=landscape_16_9'),
('550e8400-e29b-41d4-a716-446655440002', '后端开发进阶路径', '深入学习后端开发技术，包括数据库设计、API开发、服务器部署等', 'intermediate', '4个月', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=backend%20development%20server%20room%20with%20databases%20APIs%20cloud%20infrastructure%20modern%20tech%20blue%20theme&image_size=landscape_16_9'),
('550e8400-e29b-41d4-a716-446655440003', '全栈开发专家路径', '成为全栈开发专家，掌握前后端完整技术栈和项目管理', 'advanced', '6个月', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=fullstack%20development%20concept%20frontend%20backend%20databases%20cloud%20deployment%20comprehensive%20tech%20stack&image_size=landscape_16_9'),
('550e8400-e29b-41d4-a716-446655440004', '设计思维与用户体验', '学习设计思维方法论，提升用户体验设计能力', 'beginner', '2个月', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=UX%20UI%20design%20workspace%20with%20wireframes%20prototypes%20user%20journey%20maps%20creative%20colorful&image_size=landscape_16_9'),
('550e8400-e29b-41d4-a716-446655440005', '商务英语提升路径', '提升商务英语沟通能力，掌握职场英语技能', 'intermediate', '3个月', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=business%20english%20learning%20office%20environment%20professional%20communication%20books%20laptop%20clean&image_size=landscape_16_9');

-- 为学习路径分配课程（使用实际存在的课程ID）
-- 前端开发入门路径
INSERT INTO learning_path_courses (learning_path_id, course_id, sequence_order, is_required, prerequisites) VALUES
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 1, true, '{}'), -- JavaScript基础入门
('550e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440002', 2, true, '{"JavaScript基础入门"}'); -- React前端开发进阶

-- 后端开发进阶路径
INSERT INTO learning_path_courses (learning_path_id, course_id, sequence_order, is_required, prerequisites) VALUES
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440003', 1, true, '{}'), -- Python数据分析实战
('550e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440008', 2, true, '{"Python数据分析实战"}'); -- 项目管理实务

-- 全栈开发专家路径
INSERT INTO learning_path_courses (learning_path_id, course_id, sequence_order, is_required, prerequisites) VALUES
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440001', 1, true, '{}'), -- JavaScript基础入门
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 2, true, '{"JavaScript基础入门"}'), -- React前端开发进阶
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440003', 3, true, '{"React前端开发进阶"}'), -- Python数据分析实战
('550e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440008', 4, true, '{"Python数据分析实战"}'); -- 项目管理实务

-- 设计思维与用户体验路径
INSERT INTO learning_path_courses (learning_path_id, course_id, sequence_order, is_required, prerequisites) VALUES
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440004', 1, true, '{}'), -- UI/UX设计基础
('550e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440005', 2, true, '{"UI/UX设计基础"}'); -- 平面设计创意实践

-- 商务英语提升路径
INSERT INTO learning_path_courses (learning_path_id, course_id, sequence_order, is_required, prerequisites) VALUES
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440006', 1, true, '{}'), -- 商务英语口语提升
('550e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440007', 2, true, '{"商务英语口语提升"}'); -- 日语入门基础

-- 注意：用户相关的示例数据（课程注册、学习进度、讨论等）需要在用户登录后动态创建
-- 这里只初始化学习路径的基础结构数据

-- 学习路径和课程关联已经创建完成
-- 用户注册课程、学习进度、讨论等数据将在用户实际使用系统时动态生成