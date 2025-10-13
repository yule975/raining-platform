# AI智学平台 - 企业级人工智能培训系统

## 📖 项目简介

AI智学平台是一个专业的企业AI培训平台，提供大语言模型、机器学习、深度学习等前沿技术课程，助力企业数字化转型。

## 🚀 功能特性

- **📚 课程管理**：支持视频课程管理和学习跟踪
- **📝 作业系统**：完整的作业发布、提交和评分系统
- **👥 用户管理**：支持管理员、教师、学员多角色权限管理
- **📊 学习分析**：提供学习进度跟踪和数据分析
- **🔐 权限控制**：基于RLS的数据安全保护
- **📱 响应式设计**：支持PC和移动端访问

## 🛠️ 技术栈

### 前端
- **React 18** + **TypeScript**
- **Vite** - 快速构建工具
- **Tailwind CSS** - 现代化样式框架
- **Shadcn/ui** - 高质量UI组件库
- **React Router** - 路由管理
- **React Query** - 数据获取和缓存

### 后端
- **Node.js** + **Express**
- **TypeScript**
- **Supabase** - 后端即服务(BaaS)
- **PostgreSQL** - 数据库
- **Row Level Security (RLS)** - 数据安全

### 部署
- **Vercel** - 前端和API部署
- **Supabase Cloud** - 数据库和认证服务

## 🌐 在线访问

- **生产环境**：https://trae0uv01uwq.vercel.app
- **备用地址**：https://learn-bloom-pal-58-main.vercel.app

## 🏗️ 项目结构

```
培训平台/
├── api/                    # Vercel Serverless API
│   └── index.ts           # API路由和业务逻辑
├── learn-bloom-pal-58-main/ # 前端项目
│   ├── src/               # 源代码
│   ├── public/            # 静态资源
│   └── dist/              # 构建输出
├── backend/               # 独立后端服务
├── vercel.json            # Vercel部署配置
└── package.json           # 项目依赖

```

## 🚀 本地开发

### 环境要求
- Node.js >= 18.0.0
- npm 或 yarn

### 安装依赖
```bash
# 安装根目录依赖
npm install

# 安装前端依赖
cd learn-bloom-pal-58-main
npm install
```

### 环境变量配置
创建 `.env` 文件并配置以下变量：

```env
# Supabase 配置
SUPABASE_URL=你的supabase项目URL
SUPABASE_SERVICE_ROLE_KEY=你的service_role密钥
VITE_SUPABASE_URL=你的supabase项目URL
VITE_SUPABASE_ANON_KEY=你的anon密钥

# 应用配置
NODE_ENV=development
VITE_APP_ENV=development
FRONTEND_URL=http://localhost:8080
```

### 启动开发服务器
```bash
# 启动前端开发服务器
npm run dev:frontend

# 启动后端开发服务器
npm run dev:backend
```

## 📦 部署

### Vercel 部署
项目已配置自动部署到Vercel：

1. 连接GitHub仓库到Vercel
2. 配置环境变量
3. 自动部署

### 手动部署
```bash
# 构建项目
npm run build

# 部署到Vercel
vercel --prod
```

## 🗄️ 数据库

项目使用Supabase PostgreSQL数据库，主要包含以下表：

- `profiles` - 用户配置信息
- `courses` - 课程信息
- `training_sessions` - 培训期次
- `assignments` - 作业信息
- `submissions` - 作业提交
- `course_completions` - 学习完成状态

## 🔐 权限管理

使用Supabase RLS(Row Level Security)实现细粒度权限控制：

- **管理员**：全部数据的读写权限
- **教师**：课程和作业管理权限
- **学员**：个人数据和学习内容访问权限

## 🤝 贡献指南

1. Fork 项目
2. 创建功能分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 创建 Pull Request

## 🐛 问题反馈

如果你发现了bug或有功能建议，请：

1. 在GitHub Issues中创建问题
2. 详细描述问题或建议
3. 提供复现步骤或期望功能

## 📝 开发日志

- ✅ 用户认证和权限管理
- ✅ 课程和作业管理系统
- ✅ 响应式前端界面
- ✅ Vercel生产环境部署
- ✅ 数据库RLS安全策略
- 🔄 视频播放和进度跟踪优化
- 📋 移动端体验优化
- 📊 学习数据分析面板

## 📄 许可证

本项目采用 MIT 许可证 - 查看 [LICENSE](LICENSE) 文件了解详情

## 👥 开发团队

- **项目负责人**：培训平台开发团队
- **技术支持**：AI智学平台技术部

---

⭐ 如果这个项目对你有帮助，请给个star！
