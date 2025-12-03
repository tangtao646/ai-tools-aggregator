# Auth 功能快速参考

## 🔑 认证流程

### Google OAuth
```
用户点击Google登录 
  → 前端获取 access_token
  → POST /api/v1/auth/google {"access_token": "..."}
  → 后端验证token → 查找/创建用户 → 生成JWT
  → 返回 {"access_token": "...", "user": {...}}
```

### GitHub OAuth
```
用户点击GitHub登录
  → GitHub重定向带code
  → POST /api/v1/auth/github {"code": "..."}
  → 后端用code换token → 获取用户信息 → 生成JWT
  → 返回 {"access_token": "...", "user": {...}}
```

### 管理员登录
```
POST /api/v1/admin/login {"username": "...", "password": "..."}
  → 验证密码(bcrypt) → 生成JWT(含username)
  → 返回 {"access_token": "...", "username": "..."}
```

---

## 🛡️ 中间件使用

### 1. 必须登录（用户）
```go
r.GET("/my-submissions", middleware.RequireAuth(db), handler.GetMySubmissions)
```

在 handler 中获取用户：
```go
func (h *Handler) GetMySubmissions(c *gin.Context) {
    userID, _ := middleware.GetCurrentUserID(c)
    // userID 是当前登录用户的ID
}
```

### 2. 可选登录
```go
r.GET("/tools", middleware.OptionalAuth(db), handler.GetTools)
```

在 handler 中检查：
```go
func (h *Handler) GetTools(c *gin.Context) {
    userID, exists := middleware.GetCurrentUserID(c)
    if exists {
        // 用户已登录，可以提供个性化内容
    } else {
        // 未登录，显示默认内容
    }
}
```

### 3. 管理员专用
```go
r.GET("/admin/tools", middleware.RequireAdmin(db), handler.GetAllTools)
```

在 handler 中获取管理员：
```go
func (h *Handler) GetAllTools(c *gin.Context) {
    adminID, _ := middleware.GetCurrentAdminID(c)
    username := c.GetString("admin_username")
}
```

---

## 🔧 工具函数

### 生成 Token
```go
import "github.com/tangtao646/ai-tools-aggregator-go/internal/auth"

// 默认24小时
token, err := auth.CreateAccessToken("user@example.com", 123)

// 自定义过期时间（分钟）
token, err := auth.CreateAccessTokenWithExpiry("admin@example.com", 1, 60*24*7) // 7天
```

### 验证 Token
```go
claims, err := auth.VerifyToken(tokenString)
if err != nil {
    // Token 无效
}

userID, _ := auth.GetUserIDFromClaims(claims)
sub, _ := auth.GetSubFromClaims(claims)
```

### 密码处理
```go
// 哈希密码
hashed := auth.HashPassword("plaintext")

// 验证密码
valid := auth.VerifyPassword("plaintext", hashed)
```

---

## 📦 Context 数据

中间件会在 context 中设置以下值：

### RequireAuth 设置
- `user_id` (int) - 用户ID
- `user_email` (string) - 用户邮箱
- `user_name` (string) - 用户名

### RequireAdmin 设置
- `admin_id` (int) - 管理员ID
- `admin_username` (string) - 管理员用户名

### 获取方式
```go
// 方式1: 使用辅助函数
userID, exists := middleware.GetCurrentUserID(c)

// 方式2: 直接从context获取
if id, exists := c.Get("user_id"); exists {
    userID := id.(int)
}
```

---

## 🚨 错误响应格式

所有认证失败都返回统一格式：

```json
{
  "detail": "错误描述"
}
```

常见错误：
- `未提供认证凭证` - 401
- `认证凭证格式错误` - 401
- `无效的认证凭证` - 401
- `用户不存在或已被禁用` - 401
- `管理员不存在` - 401

---

## ⚙️ 配置检查

启动前确保环境变量已设置：

```bash
# 检查JWT密钥
echo $JWT_SECRET

# 检查OAuth配置
echo $GOOGLE_CLIENT_ID
echo $GITHUB_CLIENT_ID

# 如果未设置，创建 .env 文件
cat > .env << EOF
JWT_SECRET=your-secret-key
GOOGLE_CLIENT_ID=xxx
GOOGLE_CLIENT_SECRET=xxx
GITHUB_CLIENT_ID=xxx
GITHUB_CLIENT_SECRET=xxx
EOF
```

---

## 📊 数据库操作示例

### 查询用户
```go
var user User
err := db.Get(&user, "SELECT * FROM users WHERE id = $1", userID)
```

### 创建用户
```go
err := db.Get(&user, `
    INSERT INTO users (email, username, avatar, google_id, is_active, created_at, updated_at)
    VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
    RETURNING *
`, email, name, avatar, googleID, true)
```

### 更新用户
```go
_, err := db.Exec(`
    UPDATE users 
    SET username = $1, avatar = $2, updated_at = NOW()
    WHERE id = $3
`, name, avatar, userID)
```

---

## 🧪 测试命令

### 1. 健康检查
```bash
curl http://localhost:8002/api/v1/auth/ping
# {"ok":true}
```

### 2. 验证Token
```bash
curl -X POST http://localhost:8002/api/v1/auth/verify-token \
  -H "Content-Type: application/json" \
  -d '{"token":"eyJhbG..."}'
```

### 3. 测试受保护路由
```bash
# 未认证（应该返回401）
curl http://localhost:8002/api/v1/auth/me

# 已认证（应该返回用户信息）
curl http://localhost:8002/api/v1/auth/me \
  -H "Authorization: Bearer eyJhbG..."
```

---

## 💡 最佳实践

1. **总是使用 HTTPS** - 生产环境必须
2. **定期更换 JWT_SECRET** - 至少每季度
3. **Token 存储** - 前端使用 httpOnly cookie 或 localStorage
4. **错误处理** - 不要暴露敏感信息
5. **日志记录** - 记录所有认证失败尝试
6. **限流** - 登录接口添加速率限制

---

## 🔗 相关文件

- `internal/auth/auth.go` - 核心认证函数
- `internal/middleware/auth.go` - 认证中间件
- `internal/handlers/auth.go` - OAuth处理器
- `internal/handlers/admin.go` - 管理员处理器
- `AUTH_MIGRATION_COMPLETE.md` - 完整迁移文档
