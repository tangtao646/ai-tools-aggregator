# Utils Package - Slug 工具

## 功能说明

该包提供与 Python 版本 `backend/app/utils/slug.py` 等价的 slug 生成功能。

## 主要函数

### 1. GenerateSlug(text string) string

将文本转换为 SEO 友好的 slug。

**功能特性：**
- ✅ 转换为小写
- ✅ 移除重音符号（如 `é` → `e`, `ñ` → `n`）
- ✅ 移除特殊字符（保留字母、数字、连字符）
- ✅ 多个空格/连字符合并为单个连字符
- ✅ 移除首尾连字符

**示例：**
```go
import "github.com/tangtao646/ai-tools-aggregator-go/internal/utils"

slug := utils.GenerateSlug("ChatGPT AI Assistant")
// 输出: "chatgpt-ai-assistant"

slug = utils.GenerateSlug("Café & Résumé")
// 输出: "cafe-resume"

slug = utils.GenerateSlug("Special@Characters#Test!")
// 输出: "specialcharacterstest"
```

### 2. GenerateUniqueSlug(db sqlx.Ext, tableName string, text string, instanceID *int) (string, error)

生成唯一的 slug，如果重复则自动添加数字后缀。

**参数：**
- `db`: 数据库连接或事务（`*sqlx.DB` 或 `*sqlx.Tx`）
- `tableName`: 要检查的表名（如 `"tools"`, `"categories"`）
- `text`: 要转换的文本
- `instanceID`: 当前实例的 ID（更新时传入，新建时传 `nil`）

**返回值：**
- `string`: 唯一的 slug
- `error`: 错误信息（如数据库查询失败）

**示例：**

```go
import (
    "github.com/jmoiron/sqlx"
    "github.com/tangtao646/ai-tools-aggregator-go/internal/utils"
)

// 新建时生成唯一 slug
func createTool(db *sqlx.DB, name string) error {
    slug, err := utils.GenerateUniqueSlug(db, "tools", name, nil)
    if err != nil {
        return err
    }
    
    // slug 可能是 "chatgpt" 或 "chatgpt-1", "chatgpt-2" 等
    _, err = db.Exec(`
        INSERT INTO tools (name, slug) VALUES ($1, $2)
    `, name, slug)
    return err
}

// 更新时生成唯一 slug（排除自身）
func updateTool(db *sqlx.DB, id int, newName string) error {
    slug, err := utils.GenerateUniqueSlug(db, "tools", newName, &id)
    if err != nil {
        return err
    }
    
    _, err = db.Exec(`
        UPDATE tools SET name = $1, slug = $2 WHERE id = $3
    `, newName, slug, id)
    return err
}

// 在事务中使用
func createToolInTransaction(db *sqlx.DB, name string) error {
    tx, err := db.Beginx()
    if err != nil {
        return err
    }
    defer tx.Rollback()
    
    // 注意：传入 tx 而不是 db
    slug, err := utils.GenerateUniqueSlug(tx, "tools", name, nil)
    if err != nil {
        return err
    }
    
    _, err = tx.Exec(`INSERT INTO tools (name, slug) VALUES ($1, $2)`, name, slug)
    if err != nil {
        return err
    }
    
    return tx.Commit()
}
```

## 使用场景

### 1. 在 API Handler 中使用

```go
// internal/handlers/tools.go
func createTool(c *gin.Context) {
    var req CreateToolRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"error": err.Error()})
        return
    }
    
    db := c.MustGet("db").(*sqlx.DB)
    
    // 生成唯一 slug
    slug, err := utils.GenerateUniqueSlug(db, "tools", req.Name, nil)
    if err != nil {
        c.JSON(500, gin.H{"error": "Failed to generate slug"})
        return
    }
    
    // 插入数据库...
}
```

### 2. 在数据导入脚本中使用

```go
// cmd/import/main.go
func importSingleTool(tx *sqlx.Tx, toolData RawToolData) error {
    // 生成唯一 slug
    slug, err := utils.GenerateUniqueSlug(tx, "tools", toolData.Name, nil)
    if err != nil {
        return fmt.Errorf("生成 slug 失败: %w", err)
    }
    
    // 插入工具数据
    _, err = tx.Exec(`
        INSERT INTO tools (name, slug, ...) VALUES ($1, $2, ...)
    `, toolData.Name, slug, ...)
    return err
}
```

## 与 Python 版本的对比

| 功能 | Python (`slug.py`) | Go (`utils/slug.go`) |
|------|-------------------|---------------------|
| 基础 slug 生成 | `generate_slug()` | `GenerateSlug()` |
| 唯一 slug 生成 | `generate_unique_slug()` | `GenerateUniqueSlug()` |
| 重音符号移除 | `unicodedata.normalize()` | `golang.org/x/text/transform` |
| 数据库检查 | SQLModel Session | sqlx.Ext (支持 DB/Tx) |
| 更新排除自身 | `instance_id` 参数 | `instanceID` 参数 |
| 返回类型 | `str` | `(string, error)` |

## 测试

运行单元测试：

```bash
cd backend/go_service
go run cmd/test-slug/main.go
```

预期输出：
```
=== Slug Generation Tests ===

1. ✅ Input: 'ChatGPT AI Assistant'
   Expected: 'chatgpt-ai-assistant'
   Got:      'chatgpt-ai-assistant'

2. ✅ Input: 'Café & Résumé'
   Expected: 'cafe-resume'
   Got:      'cafe-resume'

...
```

## 依赖

- `github.com/jmoiron/sqlx` - SQL 扩展库
- `golang.org/x/text` - Unicode 文本处理

## 注意事项

⚠️ **空字符串处理**: 如果输入全是特殊字符，会返回空字符串  
⚠️ **数据库连接**: `GenerateUniqueSlug` 需要有效的数据库连接  
⚠️ **表名安全**: `tableName` 参数用于 SQL 查询，确保是可信的值  
⚠️ **并发安全**: 在高并发场景下，可能需要添加数据库级别的唯一约束
