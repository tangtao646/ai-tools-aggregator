# PostgreSQL 本地开发环境配置指南

## 方案选择

你想在本地也使用 PostgreSQL，有以下几种方式：

### 方案 1：使用 Postgres.app（最简单，推荐）

**下载安装：**
1. 访问 https://postgresapp.com/
2. 下载 Postgres.app
3. 解压并拖到 Applications 文件夹
4. 打开应用，点击 "Initialize" 创建默认数据库服务器

**配置：**
```bash
# 1. 点击应用左下角 "+" 创建新服务器（可选，默认已创建）
# 2. 服务器会自动启动在端口 5432

# 3. 创建项目数据库
# 点击 Postgres.app 中的数据库，打开终端，然后运行：
createdb aitools
```

**更新 backend/.env：**
```bash
DATABASE_URL=postgresql://localhost/aitools
```

**优势：**
- ✅ GUI 界面，易于管理
- ✅ 无需命令行配置
- ✅ 一键启动/停止
- ✅ 包含 psql 等工具

---

### 方案 2：使用 Homebrew 安装（需要先安装 Homebrew）

#### 第一步：安装 Homebrew

```bash
# 运行官方安装脚本
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 安装完成后，根据提示添加到 PATH
# M1/M2 Mac:
echo 'eval "$(/opt/homebrew/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/opt/homebrew/bin/brew shellenv)"

# Intel Mac:
echo 'eval "$(/usr/local/bin/brew shellenv)"' >> ~/.zprofile
eval "$(/usr/local/bin/brew shellenv)"
```

#### 第二步：安装 PostgreSQL

```bash
# 安装 PostgreSQL 15
brew install postgresql@15

# 启动服务
brew services start postgresql@15

# 添加到 PATH（M1/M2 Mac）
echo 'export PATH="/opt/homebrew/opt/postgresql@15/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile

# 添加到 PATH（Intel Mac）
echo 'export PATH="/usr/local/opt/postgresql@15/bin:$PATH"' >> ~/.zprofile
source ~/.zprofile
```

#### 第三步：创建数据库

```bash
# 创建项目数据库
createdb aitools

# 测试连接
psql aitools
# 输入 \q 退出
```

#### 第四步：配置项目

在 `backend/.env` 添加：
```bash
DATABASE_URL=postgresql://localhost/aitools
```

---

### 方案 3：使用 Docker（最接近生产环境）

如果你安装了 Docker Desktop：

```bash
# 1. 启动 PostgreSQL 容器
docker run -d \
  --name postgres-dev \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=aitools \
  -p 5432:5432 \
  postgres:15-alpine

# 2. 检查容器状态
docker ps

# 3. 配置 backend/.env
DATABASE_URL=postgresql://postgres:postgres@localhost/aitools
```

**管理命令：**
```bash
# 停止
docker stop postgres-dev

# 启动
docker start postgres-dev

# 删除
docker rm -f postgres-dev
```

---

## 快速开始（推荐流程）

### 如果你没有 Homebrew 且不想安装：

**使用 Postgres.app** ⭐
1. 下载：https://postgresapp.com/downloads.html
2. 安装并启动
3. 创建数据库：点击应用内的默认服务器，点击 "Open psql"
4. 运行：`CREATE DATABASE aitools;`
5. 配置 `.env`

### 如果你愿意安装 Homebrew：

```bash
# 一键安装 Homebrew + PostgreSQL
/bin/bash -c "$(curl -fsSL https://raw.githubusercontent.com/Homebrew/install/HEAD/install.sh)"

# 等待安装完成后
brew install postgresql@15
brew services start postgresql@15
createdb aitools
```

---

## 验证安装

```bash
# 检查 PostgreSQL 是否运行
psql --version

# 连接到数据库
psql aitools

# 在 psql 中执行：
\dt  # 查看表（初始为空）
\q   # 退出
```

---

## 更新项目配置

编辑 `backend/.env`：

```bash
# 数据库配置（本地开发）
DATABASE_URL=postgresql://localhost/aitools

# Google OAuth
GOOGLE_CLIENT_ID=你的ID
GOOGLE_CLIENT_SECRET=你的密钥

# GitHub OAuth
GITHUB_CLIENT_ID=你的ID
GITHUB_CLIENT_SECRET=你的密钥
```

---

## 启动后端测试

```bash
cd backend

# 启动应用
uvicorn app.main:app --reload

# 应该看到：
# Application startup event: Creating database tables...
# 表会自动创建在 PostgreSQL 中
```

---

## 数据库管理工具（可选）

### GUI 工具推荐：

1. **TablePlus**（推荐）
   - 下载：https://tableplus.com/
   - 免费版功能充足
   - 界面美观

2. **DBeaver**（免费开源）
   - 下载：https://dbeaver.io/
   - 功能强大

3. **pgAdmin**（官方工具）
   - 下载：https://www.pgadmin.org/

### 连接信息：
```
Host: localhost
Port: 5432
Database: aitools
Username: postgres（或你的系统用户名）
Password: （Postgres.app 默认无密码）
```

---

## 故障排查

### 端口被占用
```bash
# 查看 5432 端口占用
lsof -i :5432

# 杀死进程
kill -9 <PID>
```

### 无法连接数据库
```bash
# 检查 PostgreSQL 是否运行
brew services list  # 如果用 Homebrew
# 或检查 Postgres.app 是否启动

# 重启服务
brew services restart postgresql@15
```

### 数据库不存在
```bash
# 列出所有数据库
psql -l

# 创建数据库
createdb aitools
```

---

选择你觉得最方便的方案，推荐 **Postgres.app** 最简单！
