# 🚀 快速开始：PostgreSQL 数据库设置

## 当前状态

✅ 代码已配置为使用 PostgreSQL  
❌ 本地需要安装 PostgreSQL 或 Docker

---

## 📋 三种安装方式（选择其一）

### 方式 1：Docker（最推荐，最简单）✨

#### 优点
- ✅ 一键启动，无需配置
- ✅ 不污染系统环境
- ✅ 易于删除和重建

#### 步骤

1. **安装 Docker Desktop**
   - 下载：https://www.docker.com/products/docker-desktop
   - 安装并启动 Docker Desktop

2. **启动 PostgreSQL**
   ```bash
   ./start_postgres_docker.sh
   ```

3. **运行迁移**
   ```bash
   python migrations/run_all_migrations.py
   ```

---

### 方式 2：Homebrew 本地安装

#### 优点
- ✅ 性能最好
- ✅ 系统级服务

#### 步骤

1. **安装 PostgreSQL**
   ```bash
   brew install postgresql@15
   ```

2. **启动服务**
   ```bash
   brew services start postgresql@15
   ```

3. **创建数据库**
   ```bash
   createdb aitools
   ```

4. **更新 .env 文件**
   ```bash
   # 如果使用当前用户（推荐）
   DATABASE_URL=postgresql://$(whoami)@localhost:5432/aitools
   
   # 或使用 postgres 用户
   DATABASE_URL=postgresql://postgres:postgres@localhost:5432/aitools
   ```

5. **运行迁移**
   ```bash
   python migrations/run_all_migrations.py
   ```

---

### 方式 3：Postgres.app（macOS 图形化）

#### 优点
- ✅ 图形界面，易于管理
- ✅ 无需命令行

#### 步骤

1. **下载安装**
   - https://postgresapp.com/

2. **创建数据库**
   - 打开 Postgres.app
   - 点击 "Initialize" 初始化
   - 点击 "+" 创建 `aitools` 数据库

3. **配置环境变量**
   ```bash
   echo 'export PATH="/Applications/Postgres.app/Contents/Versions/latest/bin:$PATH"' >> ~/.zshrc
   source ~/.zshrc
   ```

4. **更新 .env 文件**
   ```bash
   DATABASE_URL=postgresql://$(whoami)@localhost:5432/aitools
   ```

5. **运行迁移**
   ```bash
   python migrations/run_all_migrations.py
   ```

---

## 🔧 安装后验证

无论选择哪种方式，安装后运行以下命令验证：

```bash
# 检查 PostgreSQL 是否运行
pg_isready

# 或（Docker 方式）
docker exec aitools-postgres pg_isready

# 连接到数据库
psql -d aitools -c "SELECT version();"

# 或（Docker 方式）
docker exec -it aitools-postgres psql -U postgres -d aitools -c "SELECT version();"
```

---

## 📦 运行数据库迁移

PostgreSQL 启动后，执行迁移创建所有表：

```bash
cd /Users/tangtao/ai-tools-aggregator/backend
python migrations/run_all_migrations.py
```

预期输出：
```
✓ logo_url 列已存在
✓ short_description 列已存在
✓ review_status 列已存在
...
✅ 所有迁移执行完成！
```

---

## 🚀 启动后端服务

```bash
cd /Users/tangtao/ai-tools-aggregator/backend
uvicorn app.main:app --reload
```

访问：http://localhost:8000/docs

---

## 🆘 如果不想安装 PostgreSQL

### 临时方案：继续使用 SQLite

1. **恢复 SQLite 配置**

编辑 `backend/app/core/config.py`：

```python
DATABASE_URL: str = Field(
    default="sqlite:///./aitools.db", 
    env='DATABASE_URL'
)
```

2. **更新 .env 文件**

```env
DATABASE_URL=sqlite:///./aitools.db
```

3. **继续使用现有数据库**

SQLite 数据库已包含所有必要字段，可以直接使用。

**缺点：**
- 与生产环境不一致（生产使用 PostgreSQL）
- 需要维护两套迁移脚本
- 部分 SQL 语法可能不兼容

---

## 📚 推荐阅读

- [PostgreSQL 官方文档](https://www.postgresql.org/docs/)
- [Docker 官方文档](https://docs.docker.com/)
- [SQLAlchemy 文档](https://docs.sqlalchemy.org/)

---

## 🎯 总结

| 方案 | 难度 | 推荐度 | 适用场景 |
|------|------|--------|----------|
| **Docker** | ⭐ | ⭐⭐⭐⭐⭐ | 最简单，一键启动 |
| **Homebrew** | ⭐⭐ | ⭐⭐⭐⭐ | 性能要求高 |
| **Postgres.app** | ⭐ | ⭐⭐⭐⭐ | 喜欢图形界面 |
| **继续 SQLite** | - | ⭐⭐ | 临时方案 |

**我的建议：安装 Docker Desktop，使用 `./start_postgres_docker.sh` 一键启动！** 🐳
