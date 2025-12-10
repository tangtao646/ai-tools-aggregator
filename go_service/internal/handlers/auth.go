package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"io"
	"net/http"
	"net/url"
	"os"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	"github.com/tangtao646/ai-tools-aggregator-go/internal/auth"
	"github.com/tangtao646/ai-tools-aggregator-go/internal/middleware"
)

// AuthHandler handles authentication-related requests
type AuthHandler struct {
	db                 *sqlx.DB
	googleClientID     string
	googleClientSecret string
	githubClientID     string
	githubClientSecret string
}

// NewAuthHandler creates a new auth handler
func NewAuthHandler(db *sqlx.DB) *AuthHandler {
	return &AuthHandler{
		db:                 db,
		googleClientID:     os.Getenv("GOOGLE_CLIENT_ID"),
		googleClientSecret: os.Getenv("GOOGLE_CLIENT_SECRET"),
		githubClientID:     os.Getenv("GITHUB_CLIENT_ID"),
		githubClientSecret: os.Getenv("GITHUB_CLIENT_SECRET"),
	}
}

// GoogleLoginRequest represents Google OAuth login request
type GoogleLoginRequest struct {
	AccessToken string `json:"access_token" binding:"required"`
}

// GitHubLoginRequest represents GitHub OAuth login request
type GitHubLoginRequest struct {
	Code string `json:"code" binding:"required"`
}

// AuthResponse represents authentication response
type AuthResponse struct {
	AccessToken string      `json:"access_token"`
	TokenType   string      `json:"token_type"`
	User        UserProfile `json:"user"`
}

// UserProfile represents user profile information
type UserProfile struct {
	ID     int     `json:"id"`
	Email  *string `json:"email"`
	Name   string  `json:"name"`
	Avatar *string `json:"avatar"`
}

// GoogleUserInfo represents Google user information from API
type GoogleUserInfo struct {
	ID      string `json:"id"`
	Email   string `json:"email"`
	Name    string `json:"name"`
	Picture string `json:"picture"`
}

// GitHubUserInfo represents GitHub user information from API
type GitHubUserInfo struct {
	ID        int     `json:"id"`
	Login     string  `json:"login"`
	Name      *string `json:"name"`
	Email     *string `json:"email"`
	AvatarURL string  `json:"avatar_url"`
}

// User represents user database model
type User struct {
	ID        int            `db:"id"`
	Email     sql.NullString `db:"email"`
	Name      sql.NullString `db:"username"`
	Avatar    sql.NullString `db:"avatar"`
	GoogleID  sql.NullString `db:"google_id"`
	GitHubID  sql.NullString `db:"github_id"`
	IsActive  bool           `db:"is_active"`
	CreatedAt time.Time      `db:"created_at"`
	UpdatedAt time.Time      `db:"updated_at"`
}

// GoogleLogin handles Google OAuth login
// POST /api/v1/auth/google
func (h *AuthHandler) GoogleLogin(c *gin.Context) {
	var req GoogleLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "缺少 access_token"})
		return
	}

	// Verify Google token and get user info
	userInfo, err := h.verifyGoogleToken(req.AccessToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"detail": "无效的 Google token"})
		return
	}

	// Find or create user
	user, err := h.findOrCreateGoogleUser(userInfo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": fmt.Sprintf("用户创建失败: %v", err)})
		return
	}

	// Generate JWT
	sub := user.Email.String
	if sub == "" {
		sub = fmt.Sprintf("%d", user.ID)
	}

	token, err := auth.CreateAccessToken(sub, int64(user.ID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Token生成失败"})
		return
	}

	// Prepare response
	profile := UserProfile{
		ID:   user.ID,
		Name: user.Name.String,
	}
	if user.Email.Valid {
		profile.Email = &user.Email.String
	}
	if user.Avatar.Valid {
		profile.Avatar = &user.Avatar.String
	}

	c.JSON(http.StatusOK, AuthResponse{
		AccessToken: token,
		TokenType:   "bearer",
		User:        profile,
	})
}

// GitHubLogin handles GitHub OAuth login
// POST /api/v1/auth/github
func (h *AuthHandler) GitHubLogin(c *gin.Context) {
	var req GitHubLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "缺少 code"})
		return
	}

	// Exchange code for access token
	accessToken, err := h.exchangeGitHubCode(req.Code)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"detail": fmt.Sprintf("无法获取 GitHub access token: %v", err)})
		return
	}

	// Get user info
	userInfo, err := h.getGitHubUser(accessToken)
	if err != nil {
		c.JSON(http.StatusUnauthorized, gin.H{"detail": fmt.Sprintf("无法获取 GitHub 用户信息: %v", err)})
		return
	}

	// Get primary email if not public
	if userInfo.Email == nil || *userInfo.Email == "" {
		if email, _ := h.getGitHubPrimaryEmail(accessToken); email != "" {
			userInfo.Email = &email
		}
	}

	// Find or create user
	user, err := h.findOrCreateGitHubUser(userInfo)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": fmt.Sprintf("用户创建失败: %v", err)})
		return
	}

	// Generate JWT
	sub := user.Email.String
	if sub == "" && user.GitHubID.Valid {
		sub = user.GitHubID.String
	}
	if sub == "" {
		sub = fmt.Sprintf("%d", user.ID)
	}

	token, err := auth.CreateAccessToken(sub, int64(user.ID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "Token生成失败"})
		return
	}

	// Prepare response
	profile := UserProfile{
		ID:   user.ID,
		Name: user.Name.String,
	}
	if user.Email.Valid {
		profile.Email = &user.Email.String
	}

	if user.Avatar.Valid {
		profile.Avatar = &user.Avatar.String
	}

	c.JSON(http.StatusOK, AuthResponse{
		AccessToken: token,
		TokenType:   "bearer",
		User:        profile,
	})
}

// GetCurrentUser returns current authenticated user info
// GET /api/v1/auth/me
func (h *AuthHandler) GetCurrentUser(c *gin.Context) {
	userID, exists := middleware.GetCurrentUserID(c)
	if !exists {
		c.JSON(http.StatusUnauthorized, gin.H{"detail": "未认证"})
		return
	}

	var user User
	err := h.db.Get(&user, "SELECT * FROM users WHERE id = $1", userID)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "查询用户失败"})
		return
	}

	profile := UserProfile{
		ID:   user.ID,
		Name: user.Name.String,
	}
	if user.Email.Valid {
		profile.Email = &user.Email.String
	}
	if user.Avatar.Valid {
		profile.Avatar = &user.Avatar.String
	}

	c.JSON(http.StatusOK, profile)
}

// Helper methods

func (h *AuthHandler) verifyGoogleToken(accessToken string) (*GoogleUserInfo, error) {
	resp, err := http.Get("https://www.googleapis.com/oauth2/v1/userinfo?access_token=" + accessToken)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("Google API returned status %d", resp.StatusCode)
	}

	var userInfo GoogleUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, err
	}

	return &userInfo, nil
}

func (h *AuthHandler) exchangeGitHubCode(code string) (string, error) {
	data := url.Values{
		"client_id":     {h.githubClientID},
		"client_secret": {h.githubClientSecret},
		"code":          {code},
	}

	req, err := http.NewRequest("POST", "https://github.com/login/oauth/access_token", strings.NewReader(data.Encode()))
	if err != nil {
		return "", err
	}

	req.Header.Set("Accept", "application/json")
	req.Header.Set("Content-Type", "application/x-www-form-urlencoded")
	// GitHub API expects a User-Agent header; include one for clarity
	req.Header.Set("User-Agent", "ai-tools-aggregator")

	// Debug: log the client_id and a masked code length to help diagnose 404s
	if h.githubClientID != "" {
		maskedCode := ""
		if len(code) > 6 {
			maskedCode = code[:3] + "..." + code[len(code)-3:]
		} else {
			maskedCode = code
		}
		fmt.Printf("GitHub token request: client_id=%s code=%s\n", h.githubClientID, maskedCode)
	}

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return "", fmt.Errorf("GitHub returned status %d: %s", resp.StatusCode, string(body))
	}

	var result struct {
		AccessToken string `json:"access_token"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}

	return result.AccessToken, nil
}

func (h *AuthHandler) getGitHubUser(accessToken string) (*GitHubUserInfo, error) {
	req, err := http.NewRequest("GET", "https://api.github.com/user", nil)
	if err != nil {
		return nil, err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		body, _ := io.ReadAll(resp.Body)
		return nil, fmt.Errorf("GitHub API returned status %d: %s", resp.StatusCode, string(body))
	}

	var userInfo GitHubUserInfo
	if err := json.NewDecoder(resp.Body).Decode(&userInfo); err != nil {
		return nil, err
	}

	return &userInfo, nil
}

func (h *AuthHandler) getGitHubPrimaryEmail(accessToken string) (string, error) {
	req, err := http.NewRequest("GET", "https://api.github.com/user/emails", nil)
	if err != nil {
		return "", err
	}

	req.Header.Set("Authorization", "Bearer "+accessToken)

	resp, err := http.DefaultClient.Do(req)
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return "", fmt.Errorf("failed to get emails")
	}

	var emails []struct {
		Email   string `json:"email"`
		Primary bool   `json:"primary"`
	}

	if err := json.NewDecoder(resp.Body).Decode(&emails); err != nil {
		return "", err
	}

	for _, e := range emails {
		if e.Primary {
			return e.Email, nil
		}
	}

	return "", nil
}

func (h *AuthHandler) findOrCreateGoogleUser(userInfo *GoogleUserInfo) (*User, error) {
	var user User

	// Try to find existing user by google_id or email
	err := h.db.Get(&user, "SELECT * FROM users WHERE google_id = $1 OR email = $2", userInfo.ID, userInfo.Email)
	if err == nil {
		// User exists, update info
		_, err = h.db.Exec(`
			UPDATE users 
			SET username = $1, avatar = $2, google_id = $3, updated_at = NOW()
			WHERE id = $4
		`, userInfo.Name, userInfo.Picture, userInfo.ID, user.ID)

		if err != nil {
			return nil, err
		}

		// Refresh user data
		err = h.db.Get(&user, "SELECT * FROM users WHERE id = $1", user.ID)
		return &user, err
	}

	// Create new user
	// Use upsert to avoid duplicate key errors in concurrent requests (unique constraint on google_id)
	err = h.db.Get(&user, `
		INSERT INTO users (email, username, avatar, google_id, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		ON CONFLICT (google_id) DO UPDATE
		SET email = COALESCE(EXCLUDED.email, users.email),
			username = EXCLUDED.username,
			avatar = COALESCE(EXCLUDED.avatar, users.avatar),
			is_active = COALESCE(EXCLUDED.is_active, users.is_active),
			updated_at = NOW()
		RETURNING *
	`, userInfo.Email, userInfo.Name, userInfo.Picture, userInfo.ID, true)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

func (h *AuthHandler) findOrCreateGitHubUser(userInfo *GitHubUserInfo) (*User, error) {
	var user User
	githubID := fmt.Sprintf("%d", userInfo.ID)

	// Try to find existing user by github_id
	err := h.db.Get(&user, "SELECT * FROM users WHERE github_id = $1", githubID)
	if err == nil {
		// User exists, update info
		name := userInfo.Login
		if userInfo.Name != nil && *userInfo.Name != "" {
			name = *userInfo.Name
		}

		updates := []string{"username = $1", "avatar = $2", "github_id = $3", "updated_at = NOW()"}
		args := []interface{}{name, userInfo.AvatarURL, githubID}
		argNum := 4

		// Update email if we got one and user doesn't have one
		if userInfo.Email != nil && *userInfo.Email != "" && !user.Email.Valid {
			updates = append(updates, fmt.Sprintf("email = $%d", argNum))
			args = append(args, *userInfo.Email)
			argNum++
		}

		args = append(args, user.ID)
		query := fmt.Sprintf("UPDATE users SET %s WHERE id = $%d", strings.Join(updates, ", "), argNum)

		_, err = h.db.Exec(query, args...)
		if err != nil {
			return nil, err
		}

		// Refresh user data
		err = h.db.Get(&user, "SELECT * FROM users WHERE id = $1", user.ID)
		return &user, err
	}

	// Try to find by email if available
	if userInfo.Email != nil && *userInfo.Email != "" {
		err = h.db.Get(&user, "SELECT * FROM users WHERE email = $1", *userInfo.Email)
		if err == nil {
			// Link GitHub account to existing user
			name := userInfo.Login
			if userInfo.Name != nil && *userInfo.Name != "" {
				name = *userInfo.Name
			}

			_, err = h.db.Exec(`
				UPDATE users 
				SET username = $1, avatar = $2, github_id = $3, updated_at = NOW()
				WHERE id = $4
			`, name, userInfo.AvatarURL, githubID, user.ID)

			if err != nil {
				return nil, err
			}

			// Refresh user data
			err = h.db.Get(&user, "SELECT * FROM users WHERE id = $1", user.ID)
			return &user, err
		}
	}

	// Create new user
	name := userInfo.Login
	if userInfo.Name != nil && *userInfo.Name != "" {
		name = *userInfo.Name
	}

	var email interface{}
	if userInfo.Email != nil && *userInfo.Email != "" {
		email = *userInfo.Email
	} else {
		email = nil
	}

	// Upsert on github_id to avoid duplicate key failures during concurrent signups
	err = h.db.Get(&user, `
		INSERT INTO users (email, username, avatar, github_id, is_active, created_at, updated_at)
		VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
		ON CONFLICT (github_id) DO UPDATE
		SET email = COALESCE(EXCLUDED.email, users.email),
			username = EXCLUDED.username,
			avatar = COALESCE(EXCLUDED.avatar, users.avatar),
			is_active = COALESCE(EXCLUDED.is_active, users.is_active),
			updated_at = NOW()
		RETURNING *
	`, email, name, userInfo.AvatarURL, githubID, true)

	if err != nil {
		return nil, err
	}

	return &user, nil
}

// RegisterAuthRoutes registers authentication routes
func RegisterAuthRoutes(rg *gin.RouterGroup, db *sqlx.DB) {
	handler := NewAuthHandler(db)

	authg := rg.Group("/auth")
	{
		// OAuth login endpoints
		authg.POST("/google", handler.GoogleLogin)
		authg.POST("/github", handler.GitHubLogin)

		// Get current user (requires authentication)
		authg.GET("/me", middleware.RequireAuth(db), handler.GetCurrentUser)

		// Debug/test endpoints
		authg.GET("/ping", func(c *gin.Context) { c.JSON(200, gin.H{"ok": true}) })
		authg.POST("/verify-token", func(c *gin.Context) {
			var body struct {
				Token string `json:"token"`
			}
			if err := c.BindJSON(&body); err != nil {
				c.JSON(http.StatusBadRequest, gin.H{"error": err.Error()})
				return
			}
			claims, err := auth.VerifyToken(body.Token)
			if err != nil {
				c.JSON(http.StatusUnauthorized, gin.H{"error": err.Error()})
				return
			}
			c.JSON(200, gin.H{"claims": claims})
		})
	}
}
