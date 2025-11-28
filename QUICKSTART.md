# 🚀 快速部署指南

## ⚠️ Monorepo 部署说明

本项目前后端在**同一个仓库**，通过配置子目录分别部署：
- **Railway**：只部署 `backend/` 目录
- **Cloudflare Pages**：只构建 `frontend/` 目录

---

## 一、后端部署到 Railway（5分钟）

### 1. 访问 Railway
https://railway.app/ → 用 GitHub 登录

### 2. 创建项目
New Project → Deploy from GitHub repo → 选择 `ai-tools-aggregator`

### 3. 配置子目录（重要！）
如果 Railway 没有自动检测到 Dockerfile：
- 点击服务 → **Settings**
- **Root Directory**: 设置为 `backend`
- **Dockerfile Path**: 设置为 `Dockerfile`

### 4. 添加数据库
点击 **New** → **Database** → **Add PostgreSQL**

### 5. 配置环境变量
点击后端服务 → **Variables** → 添加：

```bash
GOOGLE_CLIENT_ID=你的值
GOOGLE_CLIENT_SECRET=你的值
GITHUB_CLIENT_ID=你的值
GITHUB_CLIENT_SECRET=你的值
SECRET_KEY=你的强随机密钥
CORS_ORIGINS=https://your-app.pages.dev
```

生成密钥：`openssl rand -hex 32`

### 5. 获取后端地址
Settings → Networking → 复制公开 URL
例如：`https://your-backend-production.up.railway.app`

---

## 二、前端部署到 Cloudflare Pages（5分钟）

### 1. 访问 Cloudflare
https://dash.cloudflare.com/ → Workers & Pages

### 2. 创建项目
Create application → Pages → Connect to Git → 选择仓库

### 3. 配置构建
```
构建命令: cd frontend && npm install && npm run build
输出目录: frontend/dist
```

### 4. 配置环境变量
Settings → Environment variables → 添加：

```bash
VITE_API_BASE_URL=https://your-backend-production.up.railway.app/api/v1
VITE_GOOGLE_CLIENT_ID=你的值
VITE_GITHUB_CLIENT_ID=你的值
```

### 5. 重新部署
保存后点击 **Retry deployment**

### 6. 获取前端地址
例如：`https://your-app.pages.dev`

---

## 三、更新 OAuth 回调（2分钟）

### Google OAuth
https://console.cloud.google.com/
- 授权的 JavaScript 来源：`https://your-app.pages.dev`
- 授权的重定向 URI：`https://your-app.pages.dev`

### GitHub OAuth
https://github.com/settings/developers
- Homepage URL：`https://your-app.pages.dev`
- Authorization callback URL：`https://your-app.pages.dev`

---

## 四、更新 Railway CORS（1分钟）

Railway 项目 → Variables → 更新：
```bash
CORS_ORIGINS=https://your-app.pages.dev
```

---

## ✅ 完成！

访问 `https://your-app.pages.dev` 测试登录功能

详细文档见 `DEPLOYMENT.md`
