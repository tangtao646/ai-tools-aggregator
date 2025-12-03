// Package middleware provides HTTP middleware functions for authentication
package middleware

import (
	"database/sql"
	"fmt"
	"net/http"
	"strings"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	"github.com/tangtao646/ai-tools-aggregator-go/internal/auth"
)

// RequireAuth is a middleware that requires valid JWT authentication
// Matches Python's get_current_user function
func RequireAuth(db *sqlx.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"detail": "未提供认证凭证",
			})
			c.Abort()
			return
		}

		// Parse "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"detail": "认证凭证格式错误",
			})
			c.Abort()
			return
		}

		token := parts[1]

		// Verify token
		claims, err := auth.VerifyToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"detail": "无效的认证凭证",
			})
			c.Abort()
			return
		}

		// Extract user_id from claims
		userID, err := auth.GetUserIDFromClaims(claims)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"detail": "无效的认证凭证",
			})
			c.Abort()
			return
		}

		// Query user from database
		var user struct {
			ID       int    `db:"id"`
			Email    string `db:"email"`
			Username string `db:"username"`
			IsActive bool   `db:"is_active"`
		}

		// DB schema uses `name` column for the user's display name. Alias it to `username`
		// so the struct field `Username` (db:"username") can be populated.
		err = db.Get(&user, "SELECT id, email, name AS username, is_active FROM users WHERE id = $1", userID)
		if err == sql.ErrNoRows {
			c.JSON(http.StatusUnauthorized, gin.H{
				"detail": "用户不存在或已被禁用",
			})
			c.Abort()
			return
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"detail": fmt.Sprintf("数据库查询失败: %v", err),
			})
			c.Abort()
			return
		}

		// Check if user is active
		if !user.IsActive {
			c.JSON(http.StatusUnauthorized, gin.H{
				"detail": "用户不存在或已被禁用",
			})
			c.Abort()
			return
		}

		// Store user info in context for use by handlers
		c.Set("user_id", user.ID)
		c.Set("user_email", user.Email)
		c.Set("user_name", user.Username)

		c.Next()
	}
}

// OptionalAuth is a middleware that allows optional authentication
// Matches Python's get_current_user_optional function
func OptionalAuth(db *sqlx.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			// No credentials provided, continue without user
			c.Next()
			return
		}

		// Parse "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			// Invalid format, continue without user
			c.Next()
			return
		}

		token := parts[1]

		// Verify token
		claims, err := auth.VerifyToken(token)
		if err != nil {
			// Invalid token, continue without user
			c.Next()
			return
		}

		// Extract user_id from claims
		userID, err := auth.GetUserIDFromClaims(claims)
		if err != nil {
			c.Next()
			return
		}

		// Query user from database
		var user struct {
			ID       int    `db:"id"`
			Email    string `db:"email"`
			Username string `db:"username"`
			IsActive bool   `db:"is_active"`
		}

		// See above: alias `name` to `username` to match schema
		err = db.Get(&user, "SELECT id, email, name AS username, is_active FROM users WHERE id = $1", userID)
		if err != nil {
			// User not found or error, continue without user
			c.Next()
			return
		}

		// Check if user is active
		if !user.IsActive {
			c.Next()
			return
		}

		// Store user info in context
		c.Set("user_id", user.ID)
		c.Set("user_email", user.Email)
		c.Set("user_name", user.Username)

		c.Next()
	}
}

// RequireAdmin is a middleware that requires valid admin JWT authentication
// Matches Python's get_current_admin function
func RequireAdmin(db *sqlx.DB) gin.HandlerFunc {
	return func(c *gin.Context) {
		// Extract token from Authorization header
		authHeader := c.GetHeader("Authorization")
		if authHeader == "" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"detail": "未提供认证凭证",
			})
			c.Abort()
			return
		}

		// Parse "Bearer <token>"
		parts := strings.SplitN(authHeader, " ", 2)
		if len(parts) != 2 || parts[0] != "Bearer" {
			c.JSON(http.StatusUnauthorized, gin.H{
				"detail": "认证凭证格式错误",
			})
			c.Abort()
			return
		}

		token := parts[1]

		// Verify token
		claims, err := auth.VerifyToken(token)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"detail": "无效的认证凭证",
			})
			c.Abort()
			return
		}

		// Extract sub (username) from claims
		username, err := auth.GetSubFromClaims(claims)
		if err != nil {
			c.JSON(http.StatusUnauthorized, gin.H{
				"detail": "无效的认证凭证",
			})
			c.Abort()
			return
		}

		// Query admin from database
		var admin struct {
			ID       int    `db:"id"`
			Username string `db:"username"`
		}

		err = db.Get(&admin, "SELECT id, username FROM admin WHERE username = $1", username)
		if err == sql.ErrNoRows {
			c.JSON(http.StatusUnauthorized, gin.H{
				"detail": "管理员不存在",
			})
			c.Abort()
			return
		} else if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"detail": fmt.Sprintf("数据库查询失败: %v", err),
			})
			c.Abort()
			return
		}

		// Store admin info in context
		c.Set("admin_id", admin.ID)
		c.Set("admin_username", admin.Username)

		c.Next()
	}
}

// GetCurrentUserID extracts user ID from context (set by RequireAuth middleware)
func GetCurrentUserID(c *gin.Context) (int, bool) {
	userID, exists := c.Get("user_id")
	if !exists {
		return 0, false
	}
	id, ok := userID.(int)
	return id, ok
}

// GetCurrentAdminID extracts admin ID from context (set by RequireAdmin middleware)
func GetCurrentAdminID(c *gin.Context) (int, bool) {
	adminID, exists := c.Get("admin_id")
	if !exists {
		return 0, false
	}
	id, ok := adminID.(int)
	return id, ok
}
