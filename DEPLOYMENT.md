# AI Tools Aggregator 部署指南

## 📋 部署方案：Cloudflare Pages + Railway

本项目采用 **前后端分离部署** 方案：
- **前端**：Cloudflare Pages（免费，全球 200+ CDN 节点）
- **后端**：Railway（$5/月免费额度，支持 Docker 和 PostgreSQL）

**总成本**：完全免费（在免费额度内）

---

## 🌟 方案优势

### Cloudflare Pages vs Vercel
| 特性 | Cloudflare Pages | Vercel |
|------|-----------------|--------|
| 免费流量 | ✅ 无限 | ❌ 100GB/月 |
| CDN 节点 | ✅ 200+ | ⚠️ 较少 |
| 构建时间 | ✅ 500次/月 | ⚠️ 6000分钟/月 |
| 中国访问 | ✅ 更快 | ⚠️ 较慢 |
| 自定义域名 | ✅ 免费 | ✅ 免费 |

### Railway 优势
✅ 支持 Docker 部署  
✅ 提供免费 PostgreSQL 数据库  
✅ Git 推送自动部署  
✅ 简单易用的 Web 控制台  
✅ 自动 HTTPS 和健康检查  

---

## � Monorepo 部署说明

**本项目采用单仓库（Monorepo）结构**：前后端代码在同一个 Git 仓库中。

```
ai-tools-aggregator/
├── backend/          ← Railway 只部署这个目录
│   ├── Dockerfile
│   └── app/
└── frontend/         ← Cloudflare Pages 只构建这个目录
    ├── package.json
    └── src/
```

### 关键配置

#### Railway（后端）
- **Root Directory**: `backend`
- Railway 会自动检测 `backend/Dockerfile`
- 只有 `backend/` 目录的变化会触发重新部署

#### Cloudflare Pages（前端）
- **构建命令**: `cd frontend && npm install && npm run build`
- **输出目录**: `frontend/dist`
- 构建命令中的 `cd frontend` 会切换到前端目录
- 只有 `frontend/` 目录的变化会触发重新构建

**优势**：
- ✅ 统一版本管理
- ✅ 便于协作开发
- ✅ 代码共享方便
- ✅ 独立部署互不影响

---

## 🚀 部署步骤

### 第一步：后端部署到 Railway

#### 1️⃣ 创建 Dockerfile
在 `backend/` 目录创建 `Dockerfile`：

```dockerfile
# 使用官方 Python 3.11 精简镜像
FROM python:3.11-slim

# 设置工作目录
WORKDIR /app

# 设置环境变量
ENV PYTHONUNBUFFERED=1 \
    PYTHONDONTWRITEBYTECODE=1 \
    PIP_NO_CACHE_DIR=1

# 安装系统依赖
RUN apt-get update && apt-get install -y --no-install-recommends \
    gcc \
    && rm -rf /var/lib/apt/lists/*

# 复制依赖文件并安装
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# 复制应用代码
COPY . .

# 暴露端口
EXPOSE 8000

# 启动命令
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### 2️⃣ 创建 .dockerignore
在 `backend/` 目录创建 `.dockerignore`：

```
__pycache__/
*.pyc
*.db
*.sqlite
.env
.venv
venv/
tests/
.git/
.gitignore
*.md
.DS_Store
```

#### 3️⃣ 部署到 Railway

1. 访问 [Railway.app](https://railway.app/) 并使用 GitHub 登录
2. 点击 **New Project** → **Deploy from GitHub repo**
3. 选择 `ai-tools-aggregator` 仓库

**⚠️ 重要：指定后端子目录**

4. Railway 会自动检测到 `backend/Dockerfile`
5. 如果没有自动检测，进入 **Settings** 手动配置：
   - **Root Directory**: `backend`
   - **Dockerfile Path**: `Dockerfile`（相对于 backend 目录）

这样 Railway 只会监控和部署 `backend/` 目录的变化！

#### 4️⃣ 添加 PostgreSQL 数据库（重要！）

**⚠️ 为什么必须使用 PostgreSQL？**

| 特性 | SQLite（开发） | PostgreSQL（生产） |
|------|---------------|-------------------|
| 并发支持 | ❌ 单写入锁 | ✅ 高并发 |
| 数据持久化 | ❌ Railway 重启丢失 | ✅ 永久存储 |
| 自动备份 | ❌ 无 | ✅ 每天自动备份 |
| 扩展性 | ❌ 受限 | ✅ 可扩展 |

**添加步骤：**

1. 在 Railway 项目中点击 **New** → **Database** → **Add PostgreSQL**
2. Railway 会自动创建并注入 `DATABASE_URL` 环境变量
3. 后端应用会自动检测并连接到 PostgreSQL（无需修改代码）

**数据库自动切换机制：**

```python
# backend/app/core/config.py
DATABASE_URL: str = Field(
    default="sqlite:///./aitools.db",  # 本地开发默认
    env='DATABASE_URL'                 # 生产环境自动读取 Railway 的 PostgreSQL
)
```

✅ 本地开发：使用 SQLite（简单快速）  
✅ 生产环境：自动切换到 PostgreSQL（可靠稳定）

#### 5️⃣ 配置环境变量

在 Railway 项目的 **Variables** 标签页添加：

```bash
# 数据库（Railway 自动生成，无需手动配置）
DATABASE_URL=postgresql://...

# Google OAuth
GOOGLE_CLIENT_ID=你的Google客户端ID
GOOGLE_CLIENT_SECRET=你的Google客户端密钥

# GitHub OAuth
GITHUB_CLIENT_ID=你的GitHub客户端ID
GITHUB_CLIENT_SECRET=你的GitHub客户端密钥

# JWT 密钥（必须改成强随机字符串！）
SECRET_KEY=your-secret-key-change-this

# CORS（后面填写 Cloudflare Pages 域名）
CORS_ORIGINS=https://your-app.pages.dev
```

**生成强密钥命令：**
```bash
openssl rand -hex 32
```

#### 6️⃣ 获取后端 API 地址

部署成功后，在 **Settings** → **Networking** 获取公开 URL，例如：
```
https://your-backend-production.up.railway.app
```

记录此地址，前端需要用到！

---

### 第二步：前端部署到 Cloudflare Pages

#### 1️⃣ 修改 API 地址

编辑 `frontend/src/api/apiClient.js`：

```javascript
// 后端 API 的基础 URL
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000/api/v1';
```

#### 2️⃣ 推送代码到 GitHub

确保代码已提交：
```bash
git add .
git commit -m "准备部署到 Cloudflare Pages"
git push origin main
```

#### 3️⃣ 部署到 Cloudflare Pages

1. 访问 [Cloudflare Dashboard](https://dash.cloudflare.com/)
2. 左侧菜单选择 **Workers & Pages**
3. 点击 **Create application** → **Pages** → **Connect to Git**
4. 选择你的 GitHub 仓库 `ai-tools-aggregator`

**⚠️ 重要：配置前端子目录构建**

5. 配置构建设置：

```yaml
项目名称: ai-tools-aggregator
生产分支: main
框架预设: None（或 Vite）
构建命令: cd frontend && npm install && npm run build
构建输出目录: frontend/dist
根目录: (留空，让构建命令自己切换到 frontend)
```

**构建命令说明：**
- `cd frontend` - 切换到前端目录
- `npm install` - 安装依赖
- `npm run build` - 构建生产版本

这样 Cloudflare Pages 会只构建 `frontend/` 目录，输出到 `frontend/dist`！

#### 4️⃣ 配置环境变量

在 **Settings** → **Environment variables** 添加：

```bash
# 后端 API 地址（Railway 提供的 URL）
VITE_API_BASE_URL=https://your-backend-production.up.railway.app/api/v1

# Google OAuth Client ID
VITE_GOOGLE_CLIENT_ID=你的Google客户端ID

# GitHub OAuth Client ID  
VITE_GITHUB_CLIENT_ID=你的GitHub客户端ID
```

⚠️ **注意**：添加环境变量后需要点击 **Save** 并重新部署！

#### 5️⃣ 触发部署

点击 **Retry deployment** 或推送新代码触发自动部署。

#### 6️⃣ 获取前端域名

部署成功后，Cloudflare 会生成域名：
```
https://your-app.pages.dev
```

也可以绑定自定义域名（免费）！

---

### 第三步：更新 OAuth 回调地址

#### Google OAuth Console
1. 访问 [Google Cloud Console](https://console.cloud.google.com/)
2. 在 **OAuth 2.0 客户端 ID** 中添加：
   - **授权的 JavaScript 来源**: `https://your-app.pages.dev`
   - **授权的重定向 URI**: `https://your-app.pages.dev`

#### GitHub OAuth Settings
1. 访问 [GitHub Developer Settings](https://github.com/settings/developers)
2. 编辑你的 OAuth App：
   - **Homepage URL**: `https://your-app.pages.dev`
   - **Authorization callback URL**: `https://your-app.pages.dev`

---

### 第四步：更新后端 CORS 配置

#### 方法一：使用环境变量（推荐）

在 Railway 环境变量中更新 `CORS_ORIGINS`：
```bash
CORS_ORIGINS=https://your-app.pages.dev
```

如果有多个域名（如自定义域名），用逗号分隔：
```bash
CORS_ORIGINS=https://your-app.pages.dev,https://yourdomain.com
```

然后修改 `backend/app/main.py`：

```python
import os

# 从环境变量读取允许的域名
cors_origins_env = os.getenv("CORS_ORIGINS", "")
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
]

# 添加生产环境域名
if cors_origins_env:
    production_origins = [origin.strip() for origin in cors_origins_env.split(",")]
    origins.extend(production_origins)

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
```

#### 方法二：直接修改代码

编辑 `backend/app/main.py`：

```python
origins = [
    "http://localhost",
    "http://localhost:5173",
    "http://127.0.0.1:5173",
    "https://your-app.pages.dev",  # Cloudflare Pages 域名
]
```

提交后 Railway 会自动重新部署。

---

## 🔄 持续部署（自动化）

### 工作流程
```
本地修改代码
    ↓
git push origin main
    ↓
├─→ Cloudflare Pages 自动检测 → 构建前端 → 部署
└─→ Railway 自动检测 → 构建后端 → 部署
```

**完全自动化，零手动操作！**

---

## 📁 项目文件结构

部署后你的项目应该包含这些文件：

```
ai-tools-aggregator/
├── backend/
│   ├── Dockerfile           # Railway 部署配置 ✅
│   ├── .dockerignore       # Docker 忽略文件 ✅
│   ├── .env.example        # 环境变量示例
│   ├── requirements.txt
│   └── app/
│       ├── main.py         # 已更新 CORS 配置
│       └── ...
├── frontend/
│   ├── .env.example        # 环境变量示例
│   ├── package.json
│   └── src/
│       └── api/
│           └── apiClient.js  # 已支持环境变量
└── DEPLOYMENT.md           # 本文档 ✅
```

---

## 💰 成本分析

| 服务 | 免费额度 | 超出后费用 |
|------|---------|-----------|
| **Cloudflare Pages** | 无限流量<br>500次构建/月 | 免费 |
| **Railway** | $5/月额度<br>500小时运行时间 | $0.000231/分钟 |
| **Railway PostgreSQL** | 包含在 $5 额度内 | 同上 |

**预估成本**：小型项目完全在免费额度内，**¥0/月**

---

## 🔍 监控与日志

### Railway 后端日志
1. 进入 Railway 项目
2. 选择你的服务
3. 点击 **Deployments** → **View Logs**
4. 实时查看应用日志和错误

### Cloudflare Pages 构建日志
1. 进入 Cloudflare Pages 项目
2. 点击 **Deployments**
3. 选择具体部署查看构建日志

### 数据库管理

Railway PostgreSQL 提供：
- **在线查询编辑器**：直接在 Web 界面执行 SQL 查询
- **自动备份**：每天自动备份数据库
- **连接信息**：可用 TablePlus、DBeaver、pgAdmin 等工具连接
- **监控面板**：查看数据库大小、连接数、查询性能

**查看数据库信息：**
```bash
# 在 Railway PostgreSQL 面板中获取连接信息
Host: containers-us-west-xxx.railway.app
Port: 5432
Database: railway
User: postgres
Password: ***
```

**备份数据库（重要！）：**
```bash
# 使用 pg_dump 导出数据
pg_dump $DATABASE_URL > backup.sql

# 恢复数据
psql $DATABASE_URL < backup.sql
```
- 连接信息（可用 TablePlus、DBeaver 等工具连接）

---

## 🚨 常见问题排查

### 1. 跨域错误 (CORS)
**症状**：浏览器控制台显示 CORS policy 错误

**解决**：
- 检查 Railway 环境变量 `CORS_ORIGINS` 是否包含前端域名
- 确保前端域名格式正确（包含 https://）
- 重启 Railway 服务

### 2. 环境变量未生效
**症状**：前端无法连接到后端 API

**解决**：
- Cloudflare Pages: 检查环境变量名是否以 `VITE_` 开头
- 添加/修改环境变量后必须 **重新部署**
- 清除浏览器缓存

### 3. OAuth 回调失败
**症状**：登录后显示 redirect_uri_mismatch

**解决**：
- 检查 Google/GitHub OAuth 配置的回调 URL
- 确保使用生产环境域名（https://your-app.pages.dev）
- 不要包含 /callback 等路径，只需域名

### 4. Railway 构建失败
**症状**：部署时显示 Build failed

**解决**：
- 检查 Dockerfile 语法
- 确保 requirements.txt 包含所有依赖
- 查看 Railway 构建日志定位错误

### 5. 数据库连接失败
**症状**：Railway 日志显示数据库连接错误

**解决**：
- 确保 Railway PostgreSQL 已添加
- 检查 `DATABASE_URL` 环境变量是否自动生成
- 查看 Railway 日志确认数据库连接字符串格式
- ⚠️ **重要**：生产环境必须用 PostgreSQL，SQLite 在 Railway 重启后会丢失数据

### 6. 数据库迁移问题
**症状**：应用启动但数据库表未创建

**解决**：
```python
# 你的代码已自动处理（app/main.py）
@asynccontextmanager
async def lifespan(app: FastAPI):
    create_db_and_tables()  # 自动创建表
    yield
```

如果需要手动迁移，可以使用 Alembic：
```bash
# 初始化迁移
alembic init migrations

# 生成迁移文件
alembic revision --autogenerate -m "Initial migration"

# 应用迁移
alembic upgrade head
```

### 7. Railway 数据丢失
**症状**：应用重启后数据消失

**原因**：使用了 SQLite（文件存储在临时容器中）

**解决**：
- ✅ 切换到 PostgreSQL（数据永久存储）
- 在 Railway 添加 PostgreSQL 数据库
- 应用会自动检测并使用 PostgreSQL

---

## 🎯 性能优化建议

### 前端优化
```bash
# 1. 启用 Cloudflare 缓存
# 在 frontend/ 创建 _headers 文件：
/assets/*
  Cache-Control: public, max-age=31536000, immutable

# 2. 压缩图片
npm install -D vite-plugin-imagemin

# 3. 代码分割（Vite 自动支持）
```

### 后端优化
```python
# 1. 启用 Gzip 压缩
from fastapi.middleware.gzip import GZipMiddleware
app.add_middleware(GZipMiddleware, minimum_size=1000)

# 2. 添加响应缓存
from fastapi_cache import FastAPICache
from fastapi_cache.backends.redis import RedisBackend
```

---

## 🔒 安全检查清单

- [ ] `SECRET_KEY` 已改为强随机字符串
- [ ] 生产环境使用 PostgreSQL（非 SQLite）
- [ ] CORS 只允许必要的域名
- [ ] OAuth 密钥存储在环境变量中
- [ ] `.env` 文件已添加到 `.gitignore`
- [ ] 数据库定期备份
- [ ] HTTPS 已启用（Cloudflare 和 Railway 默认启用）

---

## 📚 相关文档

- [Cloudflare Pages 官方文档](https://developers.cloudflare.com/pages/)
- [Railway 官方文档](https://docs.railway.app/)
- [FastAPI 部署指南](https://fastapi.tiangolo.com/deployment/)
- [Vite 环境变量](https://vitejs.dev/guide/env-and-mode.html)

---

## ✅ 部署完成确认

部署成功后，访问你的应用并测试：

1. ✅ 前端页面能正常访问
2. ✅ 工具列表能正常加载（调用后端 API）
3. ✅ Google 登录功能正常
4. ✅ GitHub 登录功能正常
5. ✅ 用户信息正确显示
6. ✅ 刷新页面保持登录状态

---

## 🎉 恭喜部署成功！

你的应用现在：
- 🌍 全球访问速度极快（Cloudflare 200+ 节点）
- 🔒 自动 HTTPS 加密
- 🚀 Git 推送自动部署
- 💾 数据持久化存储
- 📊 完善的日志监控

**下次更新只需：**
```bash
git add .
git commit -m "更新功能"
git push
```

然后喝杯咖啡，等待自动部署完成！☕
