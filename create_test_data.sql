-- 作业系统测试数据创建脚本
-- 执行前确保 courses 表已有数据

-- 🎯 第1步：添加测试学员到白名单
INSERT INTO authorized_users (name, email) VALUES
  ('张三', 'zhangsan@company.com'),
  ('李四', 'lisi@company.com'), 
  ('王五', 'wangwu@company.com'),
  ('赵六', 'zhaoliu@company.com'),
  ('钱七', 'qianqi@company.com')
ON CONFLICT (email) DO NOTHING;

-- 🎯 第2步：为现有课程创建作业数据
-- 首先获取现有课程ID，然后为每个课程创建1-2个作业

-- 为课程1创建作业（假设有深度学习相关课程）
INSERT INTO assignments (
  id, course_id, title, description, requirements, due_date, 
  max_file_size, created_at, updated_at
) 
SELECT 
  gen_random_uuid(),
  c.id,
  '实现Transformer模型',
  '使用PyTorch实现一个基础的Transformer编码器，要求包含多头注意力机制和位置编码。请在代码中添加详细注释，并提供README文档说明模型架构和使用方法。',
  E'1. 实现Transformer编码器结构\n2. 包含多头注意力机制\n3. 添加位置编码\n4. 提供详细的代码注释\n5. 编写README文档\n6. 代码可以成功运行',
  (CURRENT_DATE + INTERVAL '7 days')::date,
  '10MB',
  NOW(),
  NOW()
FROM courses c 
WHERE c.title LIKE '%深度学习%' OR c.title LIKE '%AI%' 
LIMIT 1;

-- 为课程1创建第二个作业
INSERT INTO assignments (
  id, course_id, title, description, requirements, due_date, 
  max_file_size, created_at, updated_at
) 
SELECT 
  gen_random_uuid(),
  c.id,
  '深度学习论文阅读报告',
  '阅读并总结一篇2023年以来发表的深度学习相关论文，要求包含论文摘要、核心创新点、实验结果分析和个人思考。',
  E'1. 选择2023年以来的深度学习论文\n2. 论文必须发表在顶级会议或期刊\n3. 报告包含：论文摘要、创新点、实验分析、个人思考\n4. 字数不少于2000字\n5. 需要包含论文链接\n6. 格式要求：PDF格式提交',
  (CURRENT_DATE + INTERVAL '14 days')::date,
  '5MB',
  NOW(),
  NOW()
FROM courses c 
WHERE c.title LIKE '%深度学习%' OR c.title LIKE '%AI%' 
LIMIT 1;

-- 为第二个课程创建作业
INSERT INTO assignments (
  id, course_id, title, description, requirements, due_date, 
  max_file_size, created_at, updated_at
) 
SELECT 
  gen_random_uuid(),
  c.id,
  'Python数据分析项目',
  '使用Python和相关库（pandas、numpy、matplotlib）完成一个完整的数据分析项目。选择一个真实数据集，进行数据清洗、探索性分析和可视化。',
  E'1. 选择合适的数据集（建议使用公开数据集）\n2. 完成数据清洗和预处理\n3. 进行探索性数据分析\n4. 创建至少5个不同类型的图表\n5. 提供分析报告和代码\n6. 代码要有详细注释',
  (CURRENT_DATE + INTERVAL '10 days')::date,
  '15MB',
  NOW(),
  NOW()
FROM courses c 
WHERE c.title LIKE '%Python%' OR c.title LIKE '%机器学习%'
LIMIT 1;

-- 为第三个课程创建作业
INSERT INTO assignments (
  id, course_id, title, description, requirements, due_date, 
  max_file_size, created_at, updated_at
) 
SELECT 
  gen_random_uuid(),
  c.id,
  'AI基础概念总结',
  '撰写一份AI基础概念的学习总结报告，包括机器学习、深度学习、神经网络等核心概念的理解和应用场景分析。',
  E'1. 总结机器学习基本概念\n2. 解释监督学习、无监督学习、强化学习\n3. 介绍深度学习和神经网络\n4. 分析不同算法的应用场景\n5. 字数不少于1500字\n6. 可以包含图表和示例',
  (CURRENT_DATE + INTERVAL '5 days')::date,
  '8MB',
  NOW(),
  NOW()
FROM courses c 
WHERE c.title LIKE '%基础%' OR c.title LIKE '%入门%'
LIMIT 1;

-- 🎯 第3步：创建模拟提交记录
-- 为不同学员创建不同状态的提交记录

-- 创建一些已提交的作业（正面案例）
INSERT INTO submissions (
  id, student_id, student_name, student_email, course_id, assignment_id,
  status, submitted_at, submitted_text, submitted_files, score, feedback, graded_at
)
SELECT 
  gen_random_uuid(),
  'student-001',
  '张三',
  'zhangsan@company.com',
  a.course_id,
  a.id,
  'graded',
  NOW() - INTERVAL '2 days',
  '项目GitHub链接: https://github.com/zhangsan/transformer-implementation

实现说明：
1. 完成了完整的Transformer编码器实现
2. 使用多头注意力机制，支持可配置的头数
3. 实现了正弦位置编码
4. 代码包含详细注释和文档
5. 通过了基础功能测试

技术要点：
- 使用PyTorch 2.0实现
- 支持批处理和不同序列长度
- 包含dropout和层归一化
- 提供了简单的训练示例',
  ARRAY['transformer_implementation.py', 'README.md', 'requirements.txt', 'test_examples.py'],
  85,
  '代码实现正确，架构清晰，注释详细。建议：1. 可以增加更多的超参数配置选项；2. 测试用例可以更全面；3. 文档可以增加模型架构图。整体完成度很高！',
  NOW() - INTERVAL '1 day'
FROM assignments a
WHERE a.title = '实现Transformer模型'
LIMIT 1;

-- 创建一个最近提交但未批改的作业
INSERT INTO submissions (
  id, student_id, student_name, student_email, course_id, assignment_id,
  status, submitted_at, submitted_text, submitted_files
)
SELECT 
  gen_random_uuid(),
  'student-002',
  '李四',
  'lisi@company.com',
  a.course_id,
  a.id,
  'submitted',
  NOW() - INTERVAL '6 hours',
  '数据分析项目：电商销售数据分析

数据来源：Kaggle公开数据集 - E-commerce Sales Data
项目链接：https://github.com/lisi/ecommerce-analysis

项目概述：
本项目对电商平台的销售数据进行了全面分析，包括销售趋势、用户行为、商品类别分析等。

主要发现：
1. 销售额在节假日期间显著增长
2. 移动端用户占比持续上升
3. 电子产品和服装类目销售最佳
4. 用户复购率与客单价呈正相关

使用的技术栈：
- Python 3.9
- pandas, numpy, matplotlib, seaborn
- Jupyter Notebook',
  ARRAY['ecommerce_analysis.ipynb', 'data_cleaning.py', 'analysis_report.pdf', 'requirements.txt']
FROM assignments a
WHERE a.title = 'Python数据分析项目'
LIMIT 1;

-- 创建一个未提交的作业记录（用于显示未完成状态）
INSERT INTO submissions (
  id, student_id, student_name, student_email, course_id, assignment_id,
  status, submitted_at, submitted_text, submitted_files
)
SELECT 
  gen_random_uuid(),
  'student-003',
  '王五',
  'wangwu@company.com',
  a.course_id,
  a.id,
  'not_submitted',
  NULL,
  NULL,
  NULL
FROM assignments a
WHERE a.title = 'AI基础概念总结'
LIMIT 1;

-- 再创建几个不同状态的提交记录
INSERT INTO submissions (
  id, student_id, student_name, student_email, course_id, assignment_id,
  status, submitted_at, submitted_text, submitted_files, score, feedback, graded_at
)
SELECT 
  gen_random_uuid(),
  'student-004',
  '赵六',
  'zhaoliu@company.com',
  a.course_id,
  a.id,
  'graded',
  NOW() - INTERVAL '5 days',
  '论文阅读报告：Attention Is All You Need 2.0

选择论文：《Attention Is All You Need 2.0: Improving Transformer Architecture》
发表会议：ICLR 2023

论文摘要：
本文提出了Transformer架构的改进版本，主要针对计算效率和性能进行了优化...

核心创新点：
1. 引入了新的注意力机制稀疏化方法
2. 优化了位置编码策略
3. 改进了层归一化的位置...

实验结果分析：
在多个基准测试上，新架构相比原始Transformer：
- 训练速度提升25%
- 内存使用减少30%
- 在GLUE基准上性能提升2.3%...

个人思考：
这篇论文的创新主要体现在工程优化上，虽然理论突破不大，但对实际应用很有价值...',
  ARRAY['paper_review_report.pdf', 'presentation_slides.pptx'],
  92,
  '优秀的论文分析！思路清晰，分析深入，个人思考有见解。建议可以进一步讨论该方法的局限性和未来研究方向。',
  NOW() - INTERVAL '3 days'
FROM assignments a
WHERE a.title = '深度学习论文阅读报告'
LIMIT 1;

-- 最后一个提交记录
INSERT INTO submissions (
  id, student_id, student_name, student_email, course_id, assignment_id,
  status, submitted_at, submitted_text, submitted_files
)
SELECT 
  gen_random_uuid(),
  'student-005',
  '钱七',
  'qianqi@company.com',
  a.course_id,
  a.id,
  'submitted',
  NOW() - INTERVAL '1 day',
  'AI基础概念学习总结

1. 机器学习基础
机器学习是人工智能的一个重要分支，通过算法使计算机能够从数据中学习并做出预测或决策...

2. 监督学习、无监督学习、强化学习
- 监督学习：使用标记数据进行训练，如分类和回归问题
- 无监督学习：从无标记数据中发现模式，如聚类和降维
- 强化学习：通过与环境交互学习最优策略...

3. 深度学习与神经网络
深度学习是机器学习的一个子集，使用多层神经网络来学习数据的层次化表示...

4. 应用场景分析
- 计算机视觉：图像识别、目标检测、人脸识别
- 自然语言处理：机器翻译、情感分析、对话系统
- 推荐系统：个性化推荐、内容过滤
- 自动驾驶：环境感知、路径规划、决策控制...',
  ARRAY['ai_concepts_summary.pdf']
FROM assignments a
WHERE a.title = 'AI基础概念总结'
LIMIT 1;

-- 🎯 验证数据插入
-- 显示插入结果的统计信息
SELECT 
  '数据插入完成' as message,
  (SELECT COUNT(*) FROM authorized_users WHERE email LIKE '%@company.com') as test_users_count,
  (SELECT COUNT(*) FROM assignments) as assignments_count,
  (SELECT COUNT(*) FROM submissions) as submissions_count;
