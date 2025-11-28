# AI Tools Aggregator

一个现代化的 AI 工具聚合平台，帮助用户发现和分享优质的 AI 工具。

## ✨ 特性

- 🔍 **工具浏览**：浏览精选的 AI 工具列表
- 🔐 **社交登录**：支持 Google 和 GitHub OAuth 登录
- 📱 **响应式设计**：完美适配桌面和移动设备
- 🌙 **深色模式**：支持浅色/深色主题切换
- ⚡ **快速加载**：基于 Vite 构建，极速开发体验

## 🏗️ 技术栈

### 前端
- **React 19.2** - UI 框架
- **Vite 7.2** - 构建工具
- **Tailwind CSS 3.4** - 样式框架
- **Axios** - HTTP 客户端
- **@react-oauth/google** - Google OAuth

### 后端
- **FastAPI** - Python Web 框架
- **SQLModel** - ORM（基于 SQLAlchemy）
- **PostgreSQL** - 生产数据库
- **python-jose** - JWT 认证
- **google-auth** - Google OAuth 验证

## 🚀 快速开始

### 本地开发

#### 1. 克隆项目
```bash
git clone https://github.com/yourusername/ai-tools-aggregator.git
cd ai-tools-aggregator
```

#### 2. 后端设置
```bash
cd backend

# 创建虚拟环境
python -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate

# 安装依赖
pip install -r requirements.txt

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写 OAuth 密钥

# 启动后端
uvicorn app.main:app --reload
```

后端将在 http://localhost:8000 运行

#### 3. 前端设置
```bash
cd frontend

# 安装依赖
npm install

# 配置环境变量
cp .env.example .env
# 编辑 .env 文件，填写 OAuth Client ID

# 启动前端
npm run dev
```

前端将在 http://localhost:5173 运行

## 📦 部署

本项目推荐使用 **Cloudflare Pages + Railway** 部署方案：

- **前端**：Cloudflare Pages（免费，全球 CDN）
- **后端**：Railway（$5/月免费额度）

### 快速部署

详细步骤见：
- [📖 完整部署文档](./DEPLOYMENT.md)
- [🚀 快速部署指南](./QUICKSTART.md)

## 🌐 在线演示

- **前端**: https://your-app.pages.dev
- **后端 API**: https://your-backend.up.railway.app

## 📂 项目结构

```
ai-tools-aggregator/
├── backend/                 # FastAPI 后端
│   ├── app/
│   │   ├── main.py         # 应用入口
│   │   ├── api/            # API 路由
│   │   ├── core/           # 核心配置
│   │   ├── models/         # 数据模型
│   │   └── schemas/        # Pydantic schemas
│   ├── Dockerfile          # Docker 配置
│   ├── requirements.txt    # Python 依赖
│   └── .env.example        # 环境变量示例
│
├── frontend/                # React 前端
│   ├── src/
│   │   ├── components/     # React 组件
│   │   ├── pages/          # 页面组件
│   │   ├── api/            # API 客户端
│   │   └── App.jsx         # 应用入口
│   ├── package.json        # NPM 依赖
│   └── .env.example        # 环境变量示例
│
├── DEPLOYMENT.md           # 部署文档
├── QUICKSTART.md           # 快速部署指南
└── README.md               # 本文件
```

## 🔑 环境变量

### 后端 (.env)
```bash
DATABASE_URL=postgresql://...
GOOGLE_CLIENT_ID=your-id
GOOGLE_CLIENT_SECRET=your-secret
GITHUB_CLIENT_ID=your-id
GITHUB_CLIENT_SECRET=your-secret
SECRET_KEY=your-jwt-secret
CORS_ORIGINS=https://your-frontend.pages.dev
```

### 前端 (.env)
```bash
VITE_API_BASE_URL=https://your-backend.up.railway.app/api/v1
VITE_GOOGLE_CLIENT_ID=your-id
VITE_GITHUB_CLIENT_ID=your-id
```

## 🛠️ 开发命令

### 后端
```bash
# 启动开发服务器
uvicorn app.main:app --reload

# 运行测试
pytest

# 生成数据库迁移（如使用 Alembic）
alembic revision --autogenerate -m "message"
alembic upgrade head
```

### 前端
```bash
# 启动开发服务器
npm run dev

# 构建生产版本
npm run build

# 预览生产构建
npm run preview

# 代码检查
npm run lint
```

## 🧭 生成并导入分类映射（category mapping）

项目中包含用于自动生成「原始分类 -> 展示分类」映射的工具，位置：`backend/scripts/generate_category_mapping.py`。

主要用途：
- 从工具数据（例如 `seo_tools_validated.json` 或数据库中的 `Tool` 表）收集原始分类
- 使用 LLM（或回退的 deterministic 规则）对未映射分类聚类并生成展示分类名称
- 将生成的映射保存为 JSON 文件（默认 `backend/scripts/category_mapping.json`）
- （可选）将映射写入数据库表 `category_mapping`（脚本/后端 endpoint 已支持 upsert）

如何通过 CLI 运行（在 backend 虚拟环境中执行）：

```bash
# 在 backend 目录并激活虚拟环境
cd backend
source .venv/bin/activate  # 或你的 venv 路径

# 运行脚本：从 seo_tools_validated.json 生成映射并保存到默认文件，脚本会在保存后尝试 upsert 到 DB
python3 scripts/generate_category_mapping.py --tools_file ../data/seo_tools_validated.json --mapping_file backend/scripts/category_mapping.json
```

简短示例（如果你希望只在服务器端通过 Admin API 调用）：

```bash
# 1) 获取管理员 token（示例）
RESP=$(curl -s -X POST http://localhost:8000/api/v1/admin/login -H "Content-Type: application/json" -d '{"username":"<admin>","password":"<pw>"}')
TOKEN=$(echo "$RESP" | python3 -c "import sys,json; print(json.load(sys.stdin).get('access_token',''))")

# 2) 预览映射（不会写文件或 DB）
curl -s -X POST "http://localhost:8000/api/v1/admin/generate-category-mapping?commit=false" \
	-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}'

# 3) 提交并将映射写入文件与数据库
curl -s -X POST "http://localhost:8000/api/v1/admin/generate-category-mapping?commit=true" \
	-H "Authorization: Bearer $TOKEN" -H "Content-Type: application/json" -d '{}'
```

说明与注意事项：
- 如果 `mapping_file` 不存在或文件为空，系统会把现有映射视为 `{}`，将对数据库中所有分类进行生成（等价于全量生成）。
- 如果 LLM 不可用或返回无法解析结果，后端会使用 deterministic fallback（简单规范化规则）生成映射，保证流程不中断。
- 提交（`commit=true`）会把合并后的映射保存到指定文件，并把新映射 upsert 到 `category_mapping` 表。
- 如果你希望强制覆盖 DB 的现有值或获取更细粒度的 upsert 统计（inserted/updated/skipped），我可以在 endpoint 中增加 `force` 支持并返回更详细统计。


## 🤝 贡献

欢迎提交 Issue 和 Pull Request！

1. Fork 本项目
2. 创建特性分支 (`git checkout -b feature/AmazingFeature`)
3. 提交更改 (`git commit -m 'Add some AmazingFeature'`)
4. 推送到分支 (`git push origin feature/AmazingFeature`)
5. 开启 Pull Request

## 📄 许可证

MIT License

## 👥 作者

Your Name - [@yourhandle](https://twitter.com/yourhandle)

## 🙏 致谢

- [FastAPI](https://fastapi.tiangolo.com/)
- [React](https://react.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [Cloudflare Pages](https://pages.cloudflare.com/)
- [Railway](https://railway.app/)
