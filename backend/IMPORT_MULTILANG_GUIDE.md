# 多语言数据导入指南

## 功能概述

数据导入功能现在支持多语言翻译，可以通过前端界面或API直接指定语言代码。

## 支持的语言

| 语言代码 | 语言名称 | Language Name |
|---------|---------|---------------|
| `zh` | 中文 | Chinese |
| `en` | 英文 | English |
| `ja` | 日文 | Japanese |
| `ko` | 韩文 | Korean |
| `es` | 西班牙文 | Spanish |
| `fr` | 法文 | French |
| `de` | 德文 | German |

## 使用方法

### 1. 前端界面导入

访问 **Data Manager** 页面 (`/admin/data`)：

1. 在 **Tools** 区域，从下拉菜单选择目标语言
2. 选择包含工具数据的 JSON 文件
3. 点击 **Import** 按钮
4. 系统会显示导入结果：
   - `inserted`: 成功插入的记录数
   - `skipped`: 跳过的记录数（已存在）
   - `failed`: 失败的记录数
   - `lang_code`: 使用的语言代码

### 2. API 调用

**端点**: `POST /api/v1/admin/import-seo-auto-split`

**请求格式**: `multipart/form-data`

**参数**:
- `file`: JSON 文件（必需）
- `lang_code`: 语言代码（可选，默认为 "zh"）

**示例**:

```bash
# 导入中文数据（默认）
curl -X POST http://localhost:8002/api/v1/admin/import-seo-auto-split \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "file=@tools_zh.json"

# 导入英文数据
curl -X POST http://localhost:8002/api/v1/admin/import-seo-auto-split \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "file=@tools_en.json" \
  -F "lang_code=en"

# 导入日文数据
curl -X POST http://localhost:8002/api/v1/admin/import-seo-auto-split \
  -H "Authorization: Bearer YOUR_ADMIN_TOKEN" \
  -F "file=@tools_ja.json" \
  -F "lang_code=ja"
```

**响应示例**:

```json
{
  "success": true,
  "inserted": 150,
  "skipped": 5,
  "failed": 0,
  "errors": [],
  "uploaded_file": "tools_en.json",
  "lang_code": "en"
}
```

## 数据格式

JSON 文件应包含工具数组，每个工具包含以下字段：

### 核心字段（所有语言共用）
- `name`: 工具名称
- `official_link`: 官方链接
- `category`: 分类
- `pricing_model`: 定价模式
- `tags`: 标签数组
- `logo_url`: Logo URL
- `rating`: 评分
- `screenshots`: 截图数组
- `video_url`: 视频URL
- `supported_platforms`: 支持平台数组

### 翻译字段（根据语言不同）
- `description`: 详细描述
- `short_description`: 简短描述
- `category_name`: 分类名称
- `features`: 功能列表
- `use_cases`: 使用场景
- `key_differentiators`: 关键差异点
- `pricing_details`: 定价详情
- `meta_title`: SEO 标题
- `meta_description`: SEO 描述
- `pros`: 优点列表
- `cons`: 缺点列表
- `faqs`: 常见问题数组

## 工作原理

1. **工具去重**: 系统根据 `name` 字段检查工具是否已存在
2. **翻译去重**: 系统根据 `tool_id` + `lang_code` 检查翻译是否已存在
3. **自动Slug**: 为新工具自动生成唯一的URL slug
4. **事务管理**: 每个工具的导入使用独立事务，确保数据一致性
5. **字段截断**: 自动截断超长字段以符合数据库限制

## 导入策略

### 同一工具的多语言导入

推荐流程：

1. **首次导入（中文）**:
   ```bash
   # 导入中文版本（创建工具核心记录 + 中文翻译）
   POST /import-seo-auto-split
   - file: tools_zh.json
   - lang_code: zh
   ```

2. **添加英文翻译**:
   ```bash
   # 为已存在的工具添加英文翻译
   POST /import-seo-auto-split
   - file: tools_en.json
   - lang_code: en
   ```

3. **添加其他语言**:
   ```bash
   # 继续添加更多语言
   POST /import-seo-auto-split
   - file: tools_ja.json
   - lang_code: ja
   ```

### 结果说明

- **Inserted**: 成功创建的新翻译记录
- **Skipped**: 该语言的翻译已存在（不会覆盖）
- **Failed**: 导入失败的记录（查看 `errors` 数组了解详情）

## 错误处理

如果导入失败，响应中会包含 `errors` 数组，每个错误包含：

```json
{
  "name": "工具名称",
  "error": "错误描述"
}
```

常见错误：
- `Tool entry is missing 'name'`: JSON 记录缺少必需的 `name` 字段
- `翻译已存在，跳过`: 该工具的该语言翻译已经存在
- `插入失败`: 数据库约束违反或字段格式错误

## 注意事项

1. **语言代码验证**: 只接受预定义的语言代码，无效代码会返回 400 错误
2. **不覆盖现有翻译**: 如果翻译已存在，会跳过而不是覆盖
3. **需要管理员权限**: 所有导入操作需要有效的管理员 JWT token
4. **文件大小**: 建议单次导入不超过 1000 条记录，大文件会自动处理但可能耗时较长

## 前端实现

前端代码已更新 (`frontend/src/pages/DataManager.jsx`):

```jsx
// 语言选择器（仅对 SEO Tools 显示）
<select value={langCode} onChange={onLangCodeChange}>
  <option value="zh">中文 (zh)</option>
  <option value="en">English (en)</option>
  <option value="ja">日本語 (ja)</option>
  {/* ... 更多语言 */}
</select>
```

API 调用已更新 (`frontend/src/api/adminApi.js`):

```javascript
importSeoToolsAutoSplit: async (file, langCode = 'zh') => {
  const form = new FormData();
  form.append('file', file);
  form.append('lang_code', langCode);
  // ...
}
```

## 数据库结构

### tools 表
存储工具核心信息（与语言无关）

### tool_translations 表
存储多语言翻译内容
- 主键: (tool_id, lang_code)
- 每个工具可以有多个语言的翻译

### tool_faqs 表  
存储多语言FAQ
- 关联: (tool_id, lang_code)
- 支持按语言组织FAQ

## 迁移说明

此功能已从 Python 脚本 (`scripts/import_tools_auto_split.py`) 完全迁移到 Go 服务：

- ✅ 无需 Python 环境依赖
- ✅ 更好的性能
- ✅ 统一的错误处理
- ✅ 原生支持多语言参数注入
