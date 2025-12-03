# 数据导入工具 (Data Import Tool)

## 功能说明

这个工具用于将 JSON 格式的工具数据导入到 PostgreSQL 数据库，自动拆分数据到以下三张表：

- **tools**: 核心工具信息（名称、链接、分类、定价模式等）
- **tool_translations**: 多语言翻译内容（描述、特性、优缺点等）
- **tool_faqs**: 常见问题解答

## 核心特性

✅ **自动 Slug 生成**: 根据工具名称生成唯一的 URL 友好标识符  
✅ **重复检测**: 防止重复导入同一工具的同一语言翻译  
✅ **字段长度保护**: 自动截断超长字段防止数据库错误  
✅ **事务安全**: 每条数据使用独立事务，失败自动回滚  
✅ **错误日志**: 失败记录会写入 `errors.log` 文件  
✅ **统计汇总**: 导入完成后显示成功/跳过/失败数量

## 使用方法

### 1. 准备 JSON 数据文件

JSON 文件应包含工具数组，每个工具对象的结构示例：

```json
[
  {
    "name": "ChatGPT",
    "official_link": "https://chat.openai.com",
    "category": "AI Chatbot",
    "pricing_model": "freemium",
    "is_featured": true,
    "tags": ["AI", "NLP", "Chatbot"],
    "logo_url": "https://example.com/logo.png",
    "rating": 4.8,
    "screenshots": ["url1", "url2"],
    "video_url": "https://youtube.com/demo",
    "supported_platforms": ["Web", "iOS", "Android"],
    "review_status": "ReviewStatus.PUBLISHED",
    "description": "详细描述...",
    "short_description": "简短描述",
    "category_name": "AI 聊天机器人",
    "features": ["特性1", "特性2"],
    "use_cases": ["用例1", "用例2"],
    "key_differentiators": ["差异点1"],
    "pricing_details": "定价详情...",
    "meta_title": "SEO 标题",
    "meta_description": "SEO 描述",
    "pros": ["优点1", "优点2"],
    "cons": ["缺点1"],
    "faqs": [
      {"question": "问题1", "answer": "答案1"},
      {"question": "问题2", "answer": "答案2"}
    ]
  }
]
```

### 2. 设置环境变量

```bash
export DATABASE_URL="postgresql://user:password@localhost:5432/dbname"
```

### 3. 运行导入

**使用默认文件 (tools_to_import.json):**
```bash
cd backend/go_service
go run cmd/import/main.go
```

**指定自定义文件:**
```bash
go run cmd/import/main.go -file=/path/to/your/tools.json
```

**指定语言代码 (默认: zh):**
```bash
go run cmd/import/main.go -lang=en
```

**指定数据库 URL (覆盖环境变量):**
```bash
go run cmd/import/main.go -db="postgresql://user:pass@host:5432/db"
```

**组合参数:**
```bash
go run cmd/import/main.go -file=data/tools.json -lang=en -db="postgres://..."
```

### 4. 编译为可执行文件

```bash
cd backend/go_service
go build -o bin/import cmd/import/main.go
./bin/import -file=data/tools.json
```

## 输出示例

```
数据库连接成功
-> 正在从文件 'tools_to_import.json' 读取数据...
-> 成功读取 100 条记录。

--- 开始导入 100 条工具数据 (语言: zh) ---
❌ 失败：工具 'InvalidTool' 导入失败，已回滚事务。
   错误详情: 插入 Tool 失败: ...

--- 导入总结 ---
✅ 成功插入: 95 条
⚠️ 跳过 (已存在): 3 条
❌ 失败 (数据库/数据错误): 2 条
请检查 errors.log 文件以获取 2 条失败详情。

💡 导入完成。
```

## 导入逻辑

1. **检查工具是否存在** (通过 name 字段)
   - 如果存在：更新 `updated_at` 时间戳
   - 如果不存在：插入新工具记录并生成唯一 slug

2. **检查翻译是否存在** (通过 tool_id + lang_code)
   - 如果存在：跳过此条数据（计入 Skipped）
   - 如果不存在：插入新翻译记录

3. **插入 FAQ** (按顺序插入所有问答对)

4. **提交事务** 或 **回滚** (如有错误)

## 字段长度限制

为防止数据库错误，以下字段会自动截断：

| 字段 | 最大长度 |
|------|---------|
| slug | 60 |
| category | 60 |
| category_name | 60 |
| name | 255 |
| official_link | 255 |
| logo_url | 255 |
| video_url | 255 |
| short_description | 255 |
| meta_title | 60 |
| meta_description | 160 |

## 错误处理

- 每条数据使用独立事务，单条失败不影响其他数据
- 失败记录会记录到 `errors.log` 文件 (JSON 格式)
- 控制台会显示详细的错误原因

## 依赖包

- `github.com/jmoiron/sqlx` - SQL 扩展库
- `github.com/jackc/pgx/v5` - PostgreSQL 驱动
- `github.com/gosimple/slug` - URL 友好 slug 生成

## 注意事项

⚠️ **必填字段**: `name` 字段是必需的，缺失会导致导入失败  
⚠️ **唯一性**: 同一工具的同一语言翻译只能导入一次  
⚠️ **事务隔离**: 每条数据独立事务，确保数据一致性  
⚠️ **错误日志**: 导入完成后检查 `errors.log` 了解失败原因
