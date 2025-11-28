# PostgreSQL 本地开发环境设置指南

## 为什么切换到 PostgreSQL？

1. **环境一致性**：本地和生产环境使用相同数据库
2. **迁移统一**：所有迁移脚本只需写一次
3. **功能完整**：PostgreSQL 功能更强大（JSON、全文搜索等）
4. **避免问题**：消除 SQLite 与 PostgreSQL 的差异导致的 bug

---

## 方案一：安装本地 PostgreSQL（推荐）

### macOS 安装方式

#### 选项 1：使用 Homebrew（推荐）

```bash
# 1. 安装 PostgreSQL
brew install postgresql@15

# 2. 启动 PostgreSQL 服务
brew services start postgresql@15

# 3. 创建数据库
createdb aitools

# 4. 验证安装
psql -d aitools -c "SELECT version();"
```

#### 选项 2：使用 Postgres.app（图形化）

1. 下载并安装：https://postgresapp.com/
2. 打开 Postgres.app，点击 "Initialize" 创建数据库集群
3. 点击数据库列表中的 "+"，创建 `aitools` 数据库
4. 配置环境变量（添加到 `~/.zshrc`）：
   ```bash
   export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"
   ```

### 配置后端连接

在 `backend/.env` 文件中设置：

```env
# Homebrew 安装
DATABASE_URL=postgresql://$(whoami)@localhost:5432/aitools

# 或使用默认用户
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aitools
```

### 运行迁移

```bash
cd backend
python migrations/run_all_migrations.py
```

---

## 方案二：使用 Docker PostgreSQL（最简单）

无需本地安装，使用 Docker 容器运行 PostgreSQL。

### 1. 安装 Docker Desktop

下载安装：https://www.docker.com/products/docker-desktop

### 2. 启动 PostgreSQL 容器

```bash
# 创建并启动 PostgreSQL 容器
docker run --name aitools-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=aitools \
  -p 5432:5432 \
  -d postgres:15-alpine

# 查看容器状态
docker ps
```

### 3. 配置后端连接

在 `backend/.env` 文件中设置：

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aitools
```

### 4. 运行迁移

```bash
cd backend
python migrations/run_all_migrations.py
```

### Docker 常用命令

```bash
# 停止容器
docker stop aitools-postgres

# 启动容器
docker start aitools-postgres

# 查看日志
docker logs aitools-postgres

# 删除容器（删除前请备份数据）
docker rm -f aitools-postgres

# 进入 PostgreSQL 命令行
docker exec -it aitools-postgres psql -U postgres -d aitools
```

---

## 方案三：继续使用 SQLite（简单但不推荐）

如果不想安装 PostgreSQL，可以继续使用 SQLite，但需要注意：

### 恢复 SQLite 配置

在 `backend/app/core/config.py` 中改回：

```python
DATABASE_URL: str = Field(
    default="sqlite:///./aitools.db", 
    env='DATABASE_URL'
)
```

### SQLite 的限制

- ❌ 与生产环境不一致（生产用 PostgreSQL）
- ❌ 迁移脚本需要维护两套（SQLite 和 PostgreSQL）
- ❌ 部分 SQL 语法不兼容
- ❌ 并发写入性能差
- ✅ 无需安装，开箱即用

---

## 推荐方案总结

| 方案 | 优点 | 缺点 | 推荐度 |
|------|------|------|--------|
| **Docker PostgreSQL** | 最简单，不污染系统 | 需要 Docker | ⭐⭐⭐⭐⭐ |
| **Homebrew PostgreSQL** | 性能最好，原生支持 | 安装复杂一点 | ⭐⭐⭐⭐ |
| **Postgres.app** | 图形化，易管理 | 仅限 macOS | ⭐⭐⭐⭐ |
| **继续用 SQLite** | 零配置 | 与生产环境不一致 | ⭐⭐ |

---

## 快速开始（推荐：Docker 方案）

```bash
# 1. 确保 Docker Desktop 已运行

# 2. 启动 PostgreSQL 容器
docker run --name aitools-postgres \
  -e POSTGRES_PASSWORD=postgres \
  -e POSTGRES_DB=aitools \
  -p 5432:5432 \
  -d postgres:15-alpine

# 3. 等待几秒让数据库启动
sleep 3

# 4. 验证数据库
docker exec aitools-postgres psql -U postgres -d aitools -c "SELECT version();"

# 5. 运行迁移
cd backend
python migrations/run_all_migrations.py

# 6. 启动后端
uvicorn app.main:app --reload
```

---

## 故障排查

### 端口被占用

```bash
# 查看端口占用
lsof -i :5432

# 杀死进程
kill -9 <PID>
```

### 无法连接数据库

1. 检查 PostgreSQL 是否运行：`pg_isready` 或 `docker ps`
2. 检查 `.env` 文件中的连接字符串
3. 检查防火墙设置

### 迁移失败

```bash
# 删除数据库重新创建
dropdb aitools
createdb aitools

# 或 Docker 方式
docker exec aitools-postgres psql -U postgres -c "DROP DATABASE aitools;"
docker exec aitools-postgres psql -U postgres -c "CREATE DATABASE aitools;"
```

---

## 数据迁移（从 SQLite 到 PostgreSQL）

如果需要保留 SQLite 中的数据：

```bash
# 1. 导出 SQLite 数据为 SQL
sqlite3 aitools.db .dump > dump.sql

# 2. 转换为 PostgreSQL 格式（需要手动调整）
# - 移除 SQLite 特定语法
# - 调整数据类型

# 3. 导入到 PostgreSQL
psql -U postgres -d aitools -f dump.sql
```

建议：如果是开发环境，直接重新创建数据更简单。

---

## 联系支持

如有问题，请查看：
- PostgreSQL 官方文档：https://www.postgresql.org/docs/
- Docker 官方文档：https://docs.docker.com/
