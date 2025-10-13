-- 初始化示例课程数据
-- 清理现有数据（如果需要）
DELETE FROM course_materials;
DELETE FROM assignments;
DELETE FROM courses;

-- 插入示例课程
INSERT INTO courses (id, title, description, cover_url, video_url, duration, instructor, created_at, updated_at) VALUES
-- 编程类课程
('550e8400-e29b-41d4-a716-446655440001', 'JavaScript基础入门', '从零开始学习JavaScript编程语言，掌握前端开发的核心技能。本课程将带你了解变量、函数、对象、数组等基础概念，并通过实际项目练习巩固所学知识。', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=modern%20javascript%20programming%20course%20cover%20with%20code%20editor%20and%20laptop%20screen%20showing%20colorful%20syntax%20highlighting&image_size=landscape_4_3', 'https://example.com/videos/js-basics.mp4', '8小时', '张老师', NOW(), NOW()),

('550e8400-e29b-41d4-a716-446655440002', 'React前端开发进阶', '深入学习React框架，掌握组件化开发、状态管理、路由配置等高级技能。适合有JavaScript基础的学员进一步提升前端开发能力。', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=react%20framework%20course%20cover%20with%20component%20tree%20structure%20and%20modern%20web%20interface%20design&image_size=landscape_4_3', 'https://example.com/videos/react-advanced.mp4', '12小时', '李老师', NOW(), NOW()),

('550e8400-e29b-41d4-a716-446655440003', 'Python数据分析实战', '使用Python进行数据分析，学习pandas、numpy、matplotlib等核心库的使用。通过真实数据集练习，掌握数据清洗、可视化和统计分析技能。', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=python%20data%20analysis%20course%20with%20charts%20graphs%20and%20data%20visualization%20on%20computer%20screen&image_size=landscape_4_3', 'https://example.com/videos/python-data.mp4', '15小时', '王老师', NOW(), NOW()),

-- 设计类课程
('550e8400-e29b-41d4-a716-446655440004', 'UI/UX设计基础', '学习用户界面和用户体验设计的基本原理，掌握设计思维、原型制作、用户研究等核心技能。使用Figma等专业工具完成设计项目。', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=ui%20ux%20design%20course%20cover%20with%20wireframes%20mockups%20and%20design%20tools%20interface&image_size=landscape_4_3', 'https://example.com/videos/ui-ux-basics.mp4', '10小时', '陈老师', NOW(), NOW()),

('550e8400-e29b-41d4-a716-446655440005', '平面设计创意实践', '从基础的设计原理到创意表达，学习色彩搭配、排版设计、品牌视觉等技能。使用Adobe Creative Suite完成各类设计项目。', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=graphic%20design%20course%20with%20creative%20posters%20logos%20and%20design%20elements%20colorful%20artistic&image_size=landscape_4_3', 'https://example.com/videos/graphic-design.mp4', '14小时', '刘老师', NOW(), NOW()),

-- 语言类课程
('550e8400-e29b-41d4-a716-446655440006', '商务英语口语提升', '针对职场环境的英语口语训练，包括会议发言、商务谈判、邮件沟通等实用场景。通过角色扮演和实战练习提升口语表达能力。', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=business%20english%20course%20with%20professional%20meeting%20room%20and%20people%20having%20discussion&image_size=landscape_4_3', 'https://example.com/videos/business-english.mp4', '6小时', 'Smith老师', NOW(), NOW()),

('550e8400-e29b-41d4-a716-446655440007', '日语入门基础', '从五十音图开始，系统学习日语的基础语法、词汇和表达方式。通过情景对话和文化介绍，培养日语学习兴趣和实用能力。', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=japanese%20language%20course%20with%20hiragana%20katakana%20characters%20and%20traditional%20japanese%20elements&image_size=landscape_4_3', 'https://example.com/videos/japanese-basics.mp4', '20小时', '田中老师', NOW(), NOW()),

-- 商务管理类课程
('550e8400-e29b-41d4-a716-446655440008', '项目管理实务', '学习项目管理的核心理念和实践方法，掌握项目规划、执行、监控和收尾的全流程管理技能。适合团队负责人和项目经理。', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=project%20management%20course%20with%20gantt%20charts%20team%20collaboration%20and%20business%20planning&image_size=landscape_4_3', 'https://example.com/videos/project-management.mp4', '16小时', '赵老师', NOW(), NOW()),

('550e8400-e29b-41d4-a716-446655440009', '数字营销策略', '掌握现代数字营销的核心策略和工具，包括社交媒体营销、内容营销、SEO优化等。通过案例分析学习营销实战技巧。', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=digital%20marketing%20course%20with%20social%20media%20analytics%20charts%20and%20marketing%20campaigns&image_size=landscape_4_3', 'https://example.com/videos/digital-marketing.mp4', '11小时', '周老师', NOW(), NOW()),

-- 技能提升类课程
('550e8400-e29b-41d4-a716-446655440010', '数据可视化与图表制作', '学习使用各种工具创建专业的数据可视化图表，包括Excel高级功能、Tableau、Power BI等。提升数据分析和展示能力。', 'https://trae-api-sg.mchost.guru/api/ide/v1/text_to_image?prompt=data%20visualization%20course%20with%20colorful%20charts%20graphs%20dashboards%20and%20analytics%20interface&image_size=landscape_4_3', 'https://example.com/videos/data-visualization.mp4', '9小时', '孙老师', NOW(), NOW());

-- 为课程添加学习材料
INSERT INTO course_materials (id, course_id, file_name, file_url, file_size, file_type, uploaded_at) VALUES
-- JavaScript基础入门材料
('650e8400-e29b-41d4-a716-446655440001', '550e8400-e29b-41d4-a716-446655440001', 'JavaScript语法速查表.pdf', 'https://example.com/materials/js-cheatsheet.pdf', '2.5MB', 'pdf', NOW()),
('650e8400-e29b-41d4-a716-446655440002', '550e8400-e29b-41d4-a716-446655440001', '练习代码示例.zip', 'https://example.com/materials/js-examples.zip', '5.2MB', 'zip', NOW()),

-- React前端开发进阶材料
('650e8400-e29b-41d4-a716-446655440003', '550e8400-e29b-41d4-a716-446655440002', 'React组件设计模式.pdf', 'https://example.com/materials/react-patterns.pdf', '3.8MB', 'pdf', NOW()),
('650e8400-e29b-41d4-a716-446655440004', '550e8400-e29b-41d4-a716-446655440002', '项目源码模板.zip', 'https://example.com/materials/react-template.zip', '12.5MB', 'zip', NOW()),

-- Python数据分析实战材料
('650e8400-e29b-41d4-a716-446655440005', '550e8400-e29b-41d4-a716-446655440003', '数据集样本.csv', 'https://example.com/materials/sample-dataset.csv', '8.9MB', 'csv', NOW()),
('650e8400-e29b-41d4-a716-446655440006', '550e8400-e29b-41d4-a716-446655440003', 'Pandas操作手册.pdf', 'https://example.com/materials/pandas-guide.pdf', '4.2MB', 'pdf', NOW()),

-- UI/UX设计基础材料
('650e8400-e29b-41d4-a716-446655440007', '550e8400-e29b-41d4-a716-446655440004', '设计规范模板.fig', 'https://example.com/materials/design-system.fig', '15.3MB', 'fig', NOW()),
('650e8400-e29b-41d4-a716-446655440008', '550e8400-e29b-41d4-a716-446655440004', '用户研究方法指南.pdf', 'https://example.com/materials/user-research.pdf', '6.7MB', 'pdf', NOW()),

-- 商务英语口语提升材料
('650e8400-e29b-41d4-a716-446655440009', '550e8400-e29b-41d4-a716-446655440006', '商务对话音频.mp3', 'https://example.com/materials/business-dialogues.mp3', '45.2MB', 'mp3', NOW()),
('650e8400-e29b-41d4-a716-446655440010', '550e8400-e29b-41d4-a716-446655440006', '常用商务词汇表.pdf', 'https://example.com/materials/business-vocabulary.pdf', '1.8MB', 'pdf', NOW());