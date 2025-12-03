# Python API to Go Service Migration Guide

本文档详细说明如何将 Python FastAPI 后端迁移到 Go 服务。

## 目录

- [1. Admin 模块迁移](#1-admin-模块迁移)
- [2. Auth 模块迁移](#2-auth-模块迁移)
- [3. SEO 模块迁移](#3-seo-模块迁移)
- [4. Tools 模块迁移](#4-tools-模块迁移-已完成)
- [5. Workflow Templates 模块迁移](#5-workflow-templates-模块迁移)

---

## 1. Admin 模块迁移

### 1.1 功能清单

**已扫描的 Python 端点 (`backend/app/api/endpoints/admin.py`):**

| 方法 | 路径 | 功能 | 优先级 |
|------|------|------|--------|
| POST | `/admin/login` | 管理员登录，返回JWT | P0 |
| GET | `/admin/tools/pending` | 获取待审核工具列表 | P1 |
| GET | `/admin/tools/all` | 获取所有工具（含审核状态） | P1 |
| PUT | `/admin/tools/{tool_id}/review` | 更新审核状态（两阶段审核） | P1 |
| POST | `/admin/tools/{tool_id}/generate-seo` | 生成SEO内容（调用AI） | P2 |
| POST | `/admin/import-seo` | 导入工具JSON数据 | P2 |
| POST | `/admin/import-seo-auto-split` | 自动分批导入大文件 | P2 |
| DELETE | `/admin/delete/{table_key}` | 删除表数据（tools/users/workflows） | P2 |
| GET | `/admin/is-admin` | 检查用户名是否为管理员 | P3 |
| POST | `/admin/generate-category-mapping` | 生成分类映射（调用LLM） | P2 |

### 1.2 Go 实现计划

#### 1.2.1 文件结构

```
internal/
  handlers/
    admin.go           # 管理员相关接口
  middleware/
    admin_auth.go      # 管理员认证中间件
  services/
    seo_generator.go   # SEO内容生成服务（集成AI API）
    category_mapper.go # 分类映射生成服务
```

#### 1.2.2 核心实现要点

**Admin Login (`POST /admin/login`)**

```go
// AdminLoginRequest 管理员登录请求
type AdminLoginRequest struct {
    Username string `json:"username" binding:"required"`
    Password string `json:"password" binding:"required"`
}

// AdminLoginResponse 管理员登录响应
type AdminLoginResponse struct {
    AccessToken string `json:"access_token"`
    TokenType   string `json:"token_type"`
    Username    string `json:"username"`
}

// AdminLogin 管理员登录处理器
func (h *Handler) AdminLogin(c *gin.Context) {
    var req AdminLoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"detail": "请求参数错误"})
        return
    }

    // 查询管理员
    var admin models.Admin
    err := h.db.Get(&admin, "SELECT * FROM admin WHERE username = $1", req.Username)
    if err != nil || !verifyPassword(req.Password, admin.PasswordHash) {
        c.JSON(401, gin.H{"detail": "用户名或密码错误"})
        return
    }

    // 生成JWT Token
    token, err := createAccessToken(req.Username)
    if err != nil {
        c.JSON(500, gin.H{"detail": "生成token失败"})
        return
    }

    c.JSON(200, AdminLoginResponse{
        AccessToken: token,
        TokenType:   "bearer",
        Username:    admin.Username,
    })
}
```

**审核状态更新 (`PUT /admin/tools/{tool_id}/review`)**

```go
// ReviewRequest 审核请求
type ReviewRequest struct {
    ReviewStatus    string  `json:"review_status" binding:"required"`
    RejectionReason *string `json:"rejection_reason"`
}

// UpdateReviewStatus 更新工具审核状态
func (h *Handler) UpdateReviewStatus(c *gin.Context) {
    toolID := c.Param("tool_id")
    
    var req ReviewRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"detail": "请求参数错误"})
        return
    }

    // 验证审核状态
    validStatuses := []string{"PENDING", "APPROVED_PENDING_SEO", "SEO_GENERATED", "REJECTED", "PUBLISHED"}
    if !contains(validStatuses, req.ReviewStatus) {
        c.JSON(400, gin.H{"detail": "审核状态无效"})
        return
    }

    // REJECTED 必须提供原因
    if req.ReviewStatus == "REJECTED" && (req.RejectionReason == nil || *req.RejectionReason == "") {
        c.JSON(400, gin.H{"detail": "审核不通过时必须提供拒绝原因"})
        return
    }

    // 更新数据库
    _, err := h.db.Exec(`
        UPDATE tools 
        SET review_status = $1, 
            rejection_reason = $2,
            updated_at = NOW()
        WHERE id = $3
    `, req.ReviewStatus, req.RejectionReason, toolID)

    if err != nil {
        c.JSON(500, gin.H{"detail": "更新失败"})
        return
    }

    c.JSON(200, gin.H{
        "message": "审核状态已更新",
        "tool_id": toolID,
        "new_status": req.ReviewStatus,
    })
}
```

**SEO内容生成 (`POST /admin/tools/{tool_id}/generate-seo`)**

需要集成 AI API（Gemini/OpenAI）：

```go
// GenerateSEOContent 为工具生成SEO内容
func (h *Handler) GenerateSEOContent(c *gin.Context) {
    toolID := c.Param("tool_id")
    
    // 查询工具信息
    var tool models.Tool
    err := h.db.Get(&tool, "SELECT * FROM tools WHERE id = $1", toolID)
    if err != nil {
        c.JSON(404, gin.H{"detail": "工具不存在"})
        return
    }

    // 检查状态
    if tool.ReviewStatus != "APPROVED_PENDING_SEO" {
        c.JSON(400, gin.H{"detail": "只有状态为 APPROVED_PENDING_SEO 的工具才能生成SEO"})
        return
    }

    // 调用AI生成SEO内容
    seoData, err := h.seoGenerator.Generate(tool)
    if err != nil {
        c.JSON(500, gin.H{"detail": fmt.Sprintf("SEO生成失败: %v", err)})
        return
    }

    // 更新数据库
    _, err = h.db.Exec(`
        UPDATE tool_translations
        SET meta_title = $1,
            meta_description = $2,
            pros = $3,
            cons = $4
        WHERE tool_id = $5 AND lang_code = $6
    `, seoData.MetaTitle, seoData.MetaDescription, 
       pq.Array(seoData.Pros), pq.Array(seoData.Cons), 
       toolID, "zh")

    // 插入FAQs
    for i, faq := range seoData.FAQs {
        h.db.Exec(`
            INSERT INTO tool_faqs (tool_id, lang_code, faq_order, question, answer)
            VALUES ($1, $2, $3, $4, $5)
        `, toolID, "zh", i, faq.Question, faq.Answer)
    }

    // 更新工具状态为 SEO_GENERATED
    h.db.Exec(`UPDATE tools SET review_status = 'SEO_GENERATED' WHERE id = $1`, toolID)

    c.JSON(200, gin.H{
        "message": "SEO内容已生成",
        "seo_data": seoData,
    })
}
```

#### 1.2.3 依赖项

- **bcrypt**: `golang.org/x/crypto/bcrypt` (密码验证)
- **JWT**: `github.com/golang-jwt/jwt/v5`
- **AI SDK**: 
  - Gemini: `github.com/google/generative-ai-go/genai`
  - OpenAI: `github.com/sashabaranov/go-openai`

---

## 2. Auth 模块迁移

### 2.1 功能清单

| 方法 | 路径 | 功能 | 优先级 |
|------|------|------|--------|
| POST | `/auth/google` | Google OAuth登录 | P1 |
| POST | `/auth/github` | GitHub OAuth登录 | P1 |
| GET | `/auth/me` | 获取当前用户信息 | P1 |

### 2.2 Go 实现计划

#### 2.2.1 文件结构

```
internal/
  handlers/
    auth.go         # 认证相关接口
  services/
    oauth.go        # OAuth服务（Google/GitHub）
    jwt.go          # JWT生成和验证
```

#### 2.2.2 核心实现

**Google OAuth (`POST /auth/google`)**

```go
// GoogleLoginRequest Google登录请求
type GoogleLoginRequest struct {
    AccessToken string `json:"access_token" binding:"required"`
}

// GoogleLogin Google OAuth登录
func (h *Handler) GoogleLogin(c *gin.Context) {
    var req GoogleLoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"detail": "缺少 access_token"})
        return
    }

    // 验证Google Token并获取用户信息
    userInfo, err := h.oauthService.VerifyGoogleToken(req.AccessToken)
    if err != nil {
        c.JSON(401, gin.H{"detail": "无效的 Google token"})
        return
    }

    // 查找或创建用户
    user, err := h.findOrCreateUser(userInfo.Email, userInfo.Name, userInfo.Picture, userInfo.ID, "google")
    if err != nil {
        c.JSON(500, gin.H{"detail": "用户创建失败"})
        return
    }

    // 生成JWT
    token, err := h.jwtService.CreateToken(user)
    if err != nil {
        c.JSON(500, gin.H{"detail": "Token生成失败"})
        return
    }

    c.JSON(200, gin.H{
        "access_token": token,
        "token_type":   "bearer",
        "user": gin.H{
            "id":     user.ID,
            "email":  user.Email,
            "name":   user.Username.String,
            "avatar": user.Avatar,
        },
    })
}
```

**GitHub OAuth (`POST /auth/github`)**

```go
// GitHubLoginRequest GitHub登录请求
type GitHubLoginRequest struct {
    Code string `json:"code" binding:"required"`
}

// GitHubLogin GitHub OAuth登录
func (h *Handler) GitHubLogin(c *gin.Context) {
    var req GitHubLoginRequest
    if err := c.ShouldBindJSON(&req); err != nil {
        c.JSON(400, gin.H{"detail": "缺少 code"})
        return
    }

    // 使用code换取access_token
    accessToken, err := h.oauthService.ExchangeGitHubCode(req.Code)
    if err != nil {
        c.JSON(401, gin.H{"detail": "无法获取 GitHub access token"})
        return
    }

    // 获取用户信息
    userInfo, err := h.oauthService.GetGitHubUser(accessToken)
    if err != nil {
        c.JSON(401, gin.H{"detail": "无法获取 GitHub 用户信息"})
        return
    }

    // 查找或创建用户
    user, err := h.findOrCreateUser(userInfo.Email, userInfo.Name, userInfo.AvatarURL, userInfo.ID, "github")
    if err != nil {
        c.JSON(500, gin.H{"detail": "用户创建失败"})
        return
    }

    // 生成JWT
    token, err := h.jwtService.CreateToken(user)
    if err != nil {
        c.JSON(500, gin.H{"detail": "Token生成失败"})
        return
    }

    c.JSON(200, gin.H{
        "access_token": token,
        "token_type":   "bearer",
        "user": gin.H{
            "id":     user.ID,
            "email":  user.Email,
            "name":   user.Username.String,
            "avatar": user.Avatar,
        },
    })
}
```

#### 2.2.3 JWT中间件

```go
// RequireAuth JWT认证中间件
func RequireAuth() gin.HandlerFunc {
    return func(c *gin.Context) {
        authHeader := c.GetHeader("Authorization")
        if authHeader == "" {
            c.JSON(401, gin.H{"detail": "未提供认证令牌"})
            c.Abort()
            return
        }

        // 解析 "Bearer <token>"
        parts := strings.Split(authHeader, " ")
        if len(parts) != 2 || parts[0] != "Bearer" {
            c.JSON(401, gin.H{"detail": "认证令牌格式错误"})
            c.Abort()
            return
        }

        // 验证JWT
        claims, err := verifyJWT(parts[1])
        if err != nil {
            c.JSON(401, gin.H{"detail": "无效的令牌"})
            c.Abort()
            return
        }

        // 将用户信息存入context
        c.Set("user_id", claims.UserID)
        c.Set("email", claims.Email)
        c.Next()
    }
}
```

---

## 3. SEO 模块迁移

### 3.1 功能清单

| 方法 | 路径 | 功能 | 优先级 |
|------|------|------|--------|
| GET | `/seo/sitemap.xml` | 生成动态sitemap | P2 |
| GET | `/seo/robots.txt` | 生成robots.txt | P2 |

### 3.2 Go 实现

```go
// GetSitemap 生成sitemap.xml
func (h *Handler) GetSitemap(c *gin.Context) {
    // 查询所有已发布工具
    var tools []models.Tool
    err := h.db.Select(&tools, `
        SELECT id, slug, updated_at 
        FROM tools 
        WHERE review_status = 'PUBLISHED'
    `)
    if err != nil {
        c.String(500, "Internal Server Error")
        return
    }

    // 生成XML
    var xmlContent strings.Builder
    xmlContent.WriteString(`<?xml version="1.0" encoding="UTF-8"?>`)
    xmlContent.WriteString(`<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">`)
    
    // 首页
    xmlContent.WriteString(`<url>`)
    xmlContent.WriteString(`<loc>https://aicollection.tools/</loc>`)
    xmlContent.WriteString(fmt.Sprintf(`<lastmod>%s</lastmod>`, time.Now().Format("2006-01-02")))
    xmlContent.WriteString(`<changefreq>daily</changefreq>`)
    xmlContent.WriteString(`<priority>1.0</priority>`)
    xmlContent.WriteString(`</url>`)

    // 工具页面
    for _, tool := range tools {
        xmlContent.WriteString(`<url>`)
        xmlContent.WriteString(fmt.Sprintf(`<loc>https://aicollection.tools/tool/%s</loc>`, tool.Slug.String))
        xmlContent.WriteString(fmt.Sprintf(`<lastmod>%s</lastmod>`, tool.UpdatedAt.Format("2006-01-02")))
        xmlContent.WriteString(`<changefreq>weekly</changefreq>`)
        xmlContent.WriteString(`<priority>0.8</priority>`)
        xmlContent.WriteString(`</url>`)
    }

    xmlContent.WriteString(`</urlset>`)

    c.Header("Content-Type", "application/xml")
    c.String(200, xmlContent.String())
}

// GetRobots 生成robots.txt
func (h *Handler) GetRobots(c *gin.Context) {
    robotsTxt := `User-agent: *
Allow: /
Disallow: /admin/
Disallow: /api/
Disallow: /my-submissions

# Sitemap
Sitemap: https://aicollection.tools/api/v1/seo/sitemap.xml

# Crawl-delay (optional, in seconds)
Crawl-delay: 1
`
    c.Header("Content-Type", "text/plain")
    c.String(200, robotsTxt)
}
```

---

## 4. Tools 模块迁移 (✅ 已完成)

Tools 模块已在 `internal/handlers/tools.go` 中实现，包括：

- ✅ 获取工具列表（分页、搜索、过滤）
- ✅ 获取精简工具列表
- ✅ 获取工具详情（支持ID和Slug）
- ✅ 创建工具
- ✅ 更新工具
- ✅ 删除工具
- ✅ 上传Logo
- ✅ 获取相关推荐工具
- ✅ 多语言支持（lang_code参数）

---

## 5. Workflow Templates 模块迁移

### 5.1 功能清单

| 方法 | 路径 | 功能 | 优先级 |
|------|------|------|--------|
| GET | `/workflow-templates` | 获取模板列表（分页+分类） | P2 |
| GET | `/workflow-templates/{id}` | 获取模板详情 | P2 |
| POST | `/workflow-templates` | 创建新模板 | P2 |
| PUT | `/workflow-templates/{id}` | 更新模板 | P2 |
| DELETE | `/workflow-templates/{id}` | 删除模板（管理员） | P2 |
| POST | `/workflow-templates/{id}/review` | 审核模板 | P2 |

### 5.2 Go 实现计划

```go
// WorkflowTemplateListRequest 模板列表请求
type WorkflowTemplateListRequest struct {
    Category string `form:"category"`
    Skip     int    `form:"skip"`
    Limit    int    `form:"limit" binding:"max=100"`
}

// ListWorkflowTemplates 获取工作流模板列表
func (h *Handler) ListWorkflowTemplates(c *gin.Context) {
    var req WorkflowTemplateListRequest
    if err := c.ShouldBindQuery(&req); err != nil {
        c.JSON(400, gin.H{"detail": "请求参数错误"})
        return
    }

    query := `SELECT * FROM workflowtemplate WHERE 1=1`
    args := []interface{}{}
    
    if req.Category != "" {
        query += ` AND category = $1`
        args = append(args, req.Category)
    }
    
    query += ` OFFSET $2 LIMIT $3`
    args = append(args, req.Skip, req.Limit)

    var templates []models.WorkflowTemplate
    err := h.db.Select(&templates, query, args...)
    if err != nil {
        c.JSON(500, gin.H{"detail": "查询失败"})
        return
    }

    c.JSON(200, templates)
}
```

---

## 6. 迁移优先级建议

### Phase 1 (P0 - 核心功能)
- ✅ Tools 模块 (已完成)
- 🔲 Admin Login
- 🔲 Auth (Google/GitHub OAuth)

### Phase 2 (P1 - 重要功能)
- 🔲 Admin 工具审核
- 🔲 JWT中间件

### Phase 3 (P2 - 增强功能)
- 🔲 SEO生成（AI集成）
- 🔲 Sitemap/Robots
- 🔲 Workflow Templates
- 🔲 数据导入/删除

---

## 7. 技术栈对照表

| Python | Go |
|--------|-----|
| FastAPI | Gin |
| SQLModel | sqlx + pgx |
| Pydantic | struct tags (binding/json) |
| bcrypt | golang.org/x/crypto/bcrypt |
| python-jose[cryptography] | golang-jwt/jwt |
| requests | net/http / resty |
| Google Gemini SDK | google/generative-ai-go |

---

## 8. 配置文件迁移

需要在 `.env` 或 `config.go` 中添加：

```env
# OAuth配置
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
GITHUB_CLIENT_ID=
GITHUB_CLIENT_SECRET=

# JWT配置
JWT_SECRET=your-secret-key
JWT_EXPIRE_HOURS=168

# AI API配置（选择一个）
GEMINI_API_KEY=
OPENAI_API_KEY=

# 域名配置
DOMAIN=https://aicollection.tools
```

---

## 9. 数据库兼容性

所有模块使用相同的PostgreSQL数据库，表结构已在 `internal/models/` 中定义：

- ✅ `tools` - 工具核心表
- ✅ `tool_translations` - 多语言翻译
- ✅ `tool_faqs` - 常见问题
- ✅ `users` - 用户表
- ✅ `admin` - 管理员表
- ✅ `categories` - 分类映射表
- ✅ `workflowtemplate` - 工作流模板
- ✅ `workflownode` - 工作流节点

---

## 10. 测试建议

每个模块迁移后应进行：

1. **单元测试**: 使用 `testing` 包测试handler逻辑
2. **集成测试**: 使用真实数据库测试SQL查询
3. **API测试**: 使用 `httptest` 包测试HTTP响应
4. **性能测试**: 使用 `benchstat` 对比Python性能

示例：

```go
func TestAdminLogin(t *testing.T) {
    // 创建测试数据库
    db := setupTestDB()
    defer db.Close()

    // 创建handler
    h := &Handler{db: db}

    // 创建测试请求
    req := httptest.NewRequest("POST", "/admin/login", strings.NewReader(`{"username":"test","password":"test123"}`))
    w := httptest.NewRecorder()

    // 执行
    h.AdminLogin(c)

    // 验证
    assert.Equal(t, 200, w.Code)
}
```
