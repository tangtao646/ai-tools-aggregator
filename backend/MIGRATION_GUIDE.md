# 数据库迁移指南 - P0 SEO 功能

## 变更概述

本次更新添加了 SEO 优化和内容增强字段，并将 `review_status` 从数字类型改为字符串枚举。

## 数据库变更

### 1. 新增字段

```sql
-- SEO 优化字段
ALTER TABLE tool ADD COLUMN slug VARCHAR UNIQUE NOT NULL DEFAULT '';
ALTER TABLE tool ADD COLUMN meta_title VARCHAR(60);
ALTER TABLE tool ADD COLUMN meta_description VARCHAR(160);

-- P1 内容增强字段
ALTER TABLE tool ADD COLUMN pros JSON;
ALTER TABLE tool ADD COLUMN cons JSON;
ALTER TABLE tool ADD COLUMN faqs JSON;
ALTER TABLE tool ADD COLUMN rating FLOAT;
ALTER TABLE tool ADD COLUMN screenshots JSON;
ALTER TABLE tool ADD COLUMN video_url VARCHAR;
```

### 2. 修改字段

```sql
-- 将 review_status 从 INT 改为 VARCHAR
-- 旧值映射: 0 -> "PENDING", 1 -> "REJECTED", 2 -> "PUBLISHED"
ALTER TABLE tool ALTER COLUMN review_status TYPE VARCHAR;

-- 更新现有数据
UPDATE tool SET review_status = 'PENDING' WHERE review_status = '0';
UPDATE tool SET review_status = 'REJECTED' WHERE review_status = '1';
UPDATE tool SET review_status = 'PUBLISHED' WHERE review_status = '2';
```

### 3. 为现有数据生成 slug

```python
# 在 Python 环境中运行
from app.core.db import get_session
from app.models.tool import Tool
from app.utils.slug import generate_unique_slug
from sqlmodel import Session, select

def migrate_slugs():
    with Session(engine) as session:
        tools = session.exec(select(Tool)).all()
        for tool in tools:
            if not tool.slug:
                tool.slug = generate_unique_slug(session, Tool, tool.name, instance_id=tool.id)
        session.commit()
        print(f"Generated slugs for {len(tools)} tools")

migrate_slugs()
```

## 迁移步骤

### 方案 A: 删除并重建数据库（开发环境推荐）

```bash
# 1. 备份现有数据（如果需要）
cp backend/aitools.db backend/aitools.db.backup

# 2. 删除数据库
rm backend/aitools.db

# 3. 重新启动后端，自动创建新表结构
cd backend
uvicorn app.main:app --reload
```

### 方案 B: 使用 Alembic 进行迁移（生产环境推荐）

```bash
# 1. 安装 Alembic
pip install alembic

# 2. 初始化 Alembic
cd backend
alembic init migrations

# 3. 编辑 alembic.ini 和 env.py
# ... (配置数据库连接)

# 4. 生成迁移脚本
alembic revision --autogenerate -m "Add SEO fields and change review_status to enum"

# 5. 执行迁移
alembic upgrade head
```

## 验证迁移

```python
# 测试脚本
from app.models.tool import Tool, ReviewStatus
from app.core.db import get_session

with get_session() as session:
    # 创建测试工具
    test_tool = Tool(
        name="Test Tool",
        slug="test-tool",
        description="Test description",
        short_description="Test",
        official_link="https://example.com",
        category="Test",
        review_status=ReviewStatus.PENDING
    )
    session.add(test_tool)
    session.commit()
    print("✅ Migration successful!")
```

## 回滚方案

如果迁移失败，可以恢复备份：

```bash
rm backend/aitools.db
cp backend/aitools.db.backup backend/aitools.db
git checkout backend/app/models/tool.py
```

## 注意事项

1. **slug 唯一性**：确保所有工具的 slug 是唯一的
2. **review_status 兼容性**：前端和管理后台需要同步更新以使用新的字符串值
3. **数据迁移**：现有工具需要生成 slug 和默认的 meta 信息
4. **索引优化**：slug 字段已添加唯一索引，提高查询性能
