-- 初始化示例讨论和互动内容
-- 注意：这些讨论内容不依赖特定用户，使用通用的讨论主题

-- 为前端开发课程添加示例讨论主题
INSERT INTO discussions (course_id, title, content, reply_count, created_at, updated_at) VALUES
-- HTML基础课程讨论
('550e8400-e29b-41d4-a716-446655440001', 'HTML语义化标签的最佳实践', '在编写HTML时，如何正确使用语义化标签？比如什么时候用article，什么时候用section？欢迎大家分享经验！', 0, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440001', '表单验证的前端实现方法', '除了HTML5的内置验证，还有哪些好用的表单验证方法？JavaScript验证和CSS伪类选择器哪个更好用？', 0, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

-- CSS进阶课程讨论
('550e8400-e29b-41d4-a716-446655440002', 'CSS Grid vs Flexbox 使用场景分析', 'Grid和Flexbox都很强大，但在实际项目中如何选择？什么情况下用Grid更合适，什么时候Flexbox是更好的选择？', 0, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-446655440002', '响应式设计的断点设置策略', '大家在做响应式设计时，断点是怎么设置的？移动优先还是桌面优先？有什么好的经验分享吗？', 0, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

-- JavaScript基础课程讨论
('550e8400-e29b-41d4-a716-446655440003', 'JavaScript异步编程最佳实践', 'Promise、async/await、回调函数，这些异步处理方式各有什么优缺点？在什么场景下使用哪种方式比较好？', 0, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('550e8400-e29b-41d4-a716-446655440003', 'ES6+新特性在实际项目中的应用', '箭头函数、解构赋值、模板字符串等ES6特性，大家在项目中最常用哪些？有什么使用技巧？', 0, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

-- React开发课程讨论
('550e8400-e29b-41d4-a716-446655440004', 'React Hooks使用心得分享', 'useState、useEffect、useContext等Hooks的使用场景和注意事项，有什么踩坑经验可以分享？', 0, NOW() - INTERVAL '7 days', NOW() - INTERVAL '7 days'),
('550e8400-e29b-41d4-a716-446655440004', '状态管理方案选择：Redux vs Zustand', '项目中的状态管理，Redux和Zustand各有什么优势？什么情况下选择哪个更合适？', 0, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

-- Node.js后端课程讨论
('550e8400-e29b-41d4-a716-446655440005', 'Express中间件的设计模式', 'Express的中间件机制很强大，大家在项目中是如何组织和设计中间件的？有什么好的实践模式？', 0, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440005', 'Node.js性能优化技巧', '在Node.js应用中，有哪些常见的性能瓶颈？大家都用什么方法来优化性能？', 0, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),

-- UI/UX设计课程讨论
('550e8400-e29b-41d4-a716-446655440006', '用户体验设计的核心原则', '在设计产品界面时，如何平衡美观性和易用性？有什么设计原则是必须遵循的？', 0, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-446655440006', '移动端设计适配策略', '移动端的设计适配有什么好的方法？不同屏幕尺寸和分辨率如何处理？', 0, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

-- 数据库设计课程讨论
('550e8400-e29b-41d4-a716-446655440007', 'SQL查询优化实战经验', '复杂查询的性能优化有什么技巧？索引应该如何设计才能最大化查询效率？', 0, NOW() - INTERVAL '6 days', NOW() - INTERVAL '6 days'),
('550e8400-e29b-41d4-a716-446655440007', '数据库设计范式的实际应用', '第一范式、第二范式、第三范式在实际项目中如何应用？过度规范化会带来什么问题？', 0, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

-- 商务英语课程讨论
('550e8400-e29b-41d4-a716-446655440008', '商务邮件写作技巧分享', '写商务邮件时有什么格式和用词需要注意的？如何让邮件更加专业和有效？', 0, NOW() - INTERVAL '3 days', NOW() - INTERVAL '3 days'),
('550e8400-e29b-41d4-a716-446655440008', '会议英语表达常用句型', '参加英语会议时，有哪些常用的表达方式？如何更自信地参与讨论？', 0, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day'),

-- 日语入门课程讨论
('550e8400-e29b-41d4-a716-446655440009', '日语假名记忆方法分享', '平假名和片假名的记忆有什么好方法？大家是怎么快速掌握假名的？', 0, NOW() - INTERVAL '5 days', NOW() - INTERVAL '5 days'),
('550e8400-e29b-41d4-a716-446655440009', '日语敬语使用场合解析', '日语的敬语系统比较复杂，在什么场合使用什么级别的敬语？有什么规律可循？', 0, NOW() - INTERVAL '2 days', NOW() - INTERVAL '2 days'),

-- 项目管理课程讨论
('550e8400-e29b-41d4-a716-446655440010', '敏捷开发实践心得', '在实际项目中实施敏捷开发，遇到过什么挑战？有什么成功的经验可以分享？', 0, NOW() - INTERVAL '4 days', NOW() - INTERVAL '4 days'),
('550e8400-e29b-41d4-a716-446655440010', '团队协作工具推荐', '项目管理和团队协作用什么工具比较好？Jira、Trello、Notion各有什么优缺点？', 0, NOW() - INTERVAL '1 day', NOW() - INTERVAL '1 day');

-- 为讨论主题添加一些示例回复内容（不依赖特定用户）
-- 这些回复将作为课程内容的一部分，展示讨论的活跃度

-- 添加一些通用的学习资源和参考链接作为讨论的补充内容
-- 根据course_materials表的实际结构添加资源
INSERT INTO course_materials (course_id, file_name, file_url, file_type, uploaded_at) VALUES
-- 为各课程添加讨论相关的学习资源
('550e8400-e29b-41d4-a716-446655440001', '社区讨论指南.pdf', 'https://example.com/discussion-guide.pdf', 'pdf', NOW()),
('550e8400-e29b-41d4-a716-446655440002', 'CSS最佳实践案例集.pdf', 'https://example.com/css-best-practices.pdf', 'pdf', NOW()),
('550e8400-e29b-41d4-a716-446655440003', 'JavaScript代码示例库.zip', 'https://example.com/js-examples.zip', 'zip', NOW()),
('550e8400-e29b-41d4-a716-446655440004', 'React项目实战案例.zip', 'https://example.com/react-projects.zip', 'zip', NOW()),
('550e8400-e29b-41d4-a716-446655440005', 'Node.js性能优化手册.pdf', 'https://example.com/nodejs-performance.pdf', 'pdf', NOW()),
('550e8400-e29b-41d4-a716-446655440006', 'UI设计规范文档.pdf', 'https://example.com/ui-design-guide.pdf', 'pdf', NOW()),
('550e8400-e29b-41d4-a716-446655440007', 'SQL优化实战手册.pdf', 'https://example.com/sql-optimization.pdf', 'pdf', NOW()),
('550e8400-e29b-41d4-a716-446655440008', '商务英语表达手册.pdf', 'https://example.com/business-english.pdf', 'pdf', NOW()),
('550e8400-e29b-41d4-a716-446655440009', '日语学习资料包.zip', 'https://example.com/japanese-materials.zip', 'zip', NOW()),
('550e8400-e29b-41d4-a716-446655440010', '项目管理模板集.zip', 'https://example.com/pm-templates.zip', 'zip', NOW());