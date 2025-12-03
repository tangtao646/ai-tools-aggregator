// Package handlers provides HTTP request handlers for admin operations
package handlers

import (
	"database/sql"
	"encoding/json"
	"fmt"
	"net/http"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/jmoiron/sqlx"
	"github.com/tangtao646/ai-tools-aggregator-go/internal/auth"
	gen "github.com/tangtao646/ai-tools-aggregator-go/internal/generate"
	"github.com/tangtao646/ai-tools-aggregator-go/internal/scripts"
	"github.com/tangtao646/ai-tools-aggregator-go/internal/utils"
)

// AdminLoginRequest represents admin login credentials
type AdminLoginRequest struct {
	Username string `json:"username" binding:"required"`
	Password string `json:"password" binding:"required"`
}

// AdminLoginResponse represents the login response
type AdminLoginResponse struct {
	AccessToken string `json:"access_token"`
	TokenType   string `json:"token_type"`
	Username    string `json:"username"`
}

// ReviewRequest represents a review status update request
type ReviewRequest struct {
	ReviewStatus    string  `json:"review_status" binding:"required"`
	RejectionReason *string `json:"rejection_reason"`
}

// AdminHandler handles admin-related requests
type AdminHandler struct {
	db *sqlx.DB
}

// NewAdminHandler creates a new admin handler
func NewAdminHandler(db *sqlx.DB) *AdminHandler {
	return &AdminHandler{db: db}
}

// Login handles admin login
// POST /api/v1/admin/login
func (h *AdminHandler) Login(c *gin.Context) {
	var req AdminLoginRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "请求参数错误"})
		return
	}

	// Query admin record
	var row struct {
		ID             int    `db:"id"`
		HashedPassword string `db:"hashed_password"`
	}
	err := h.db.Get(&row, "SELECT id, hashed_password FROM admin WHERE username = $1", req.Username)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusUnauthorized, gin.H{"detail": "用户名或密码错误"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "查询失败"})
		tx, err := h.db.Begin()
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"detail": "事务开始失败"})
			return
		}
		defer tx.Rollback()
	}

	token, err := auth.CreateAccessToken(req.Username, int64(row.ID))
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "生成 token 失败"})
		return
	}

	c.JSON(http.StatusOK, AdminLoginResponse{
		AccessToken: token,
		TokenType:   "bearer",
		Username:    req.Username,
	})
}

// GetPendingTools returns tools with PENDING review status
// GET /api/v1/admin/tools/pending
func (h *AdminHandler) GetPendingTools(c *gin.Context) {
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	var total int
	err := h.db.Get(&total, "SELECT COUNT(*) FROM tools WHERE review_status = 'PENDING'")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "查询失败"})
		return
	}

	var tools []map[string]interface{}
	rows, err := h.db.Queryx(`
		SELECT * FROM tools 
		WHERE review_status = 'PENDING' 
		ORDER BY created_at DESC 
		OFFSET $1 LIMIT $2
	`, offset, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "查询失败"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		tool := make(map[string]interface{})
		if err := rows.MapScan(tool); err != nil {
			continue
		}
		tools = append(tools, tool)
	}

	c.JSON(http.StatusOK, gin.H{
		"items": tools,
		"total": total,
	})
	// GetAllTools returns all tools (all review statuses)
}

// GetAllTools returns all tools (all review statuses)
// GET /api/v1/admin/tools/all
func (h *AdminHandler) GetAllTools(c *gin.Context) {
	offset, _ := strconv.Atoi(c.DefaultQuery("offset", "0"))
	limit, _ := strconv.Atoi(c.DefaultQuery("limit", "20"))

	// Count total
	var total int
	err := h.db.Get(&total, "SELECT COUNT(*) FROM tools")
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "查询失败"})
		return
	}

	// Query paginated data
	var tools []map[string]interface{}
	rows, err := h.db.Queryx(`
		SELECT * FROM tools 
		ORDER BY created_at DESC 
		OFFSET $1 LIMIT $2
	`, offset, limit)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "查询失败"})
		return
	}
	defer rows.Close()

	for rows.Next() {
		tool := make(map[string]interface{})
		if err := rows.MapScan(tool); err != nil {
			continue
		}
		tools = append(tools, tool)
	}

	c.JSON(http.StatusOK, gin.H{
		"items": tools,
		"total": total,
	})
}

// UpdateReviewStatus updates the review status of a tool
// PUT /api/v1/admin/tools/:tool_id/review
func (h *AdminHandler) UpdateReviewStatus(c *gin.Context) {
	toolID := c.Param("tool_id")

	var req ReviewRequest
	if err := c.ShouldBindJSON(&req); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "请求参数错误"})
		return
	}

	// Validate review status
	validStatuses := []string{"PENDING", "APPROVED_PENDING_SEO", "SEO_GENERATED", "REJECTED", "PUBLISHED"}
	if !contains(validStatuses, req.ReviewStatus) {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "审核状态无效"})
		return
	}

	// REJECTED requires rejection reason
	if req.ReviewStatus == "REJECTED" && (req.RejectionReason == nil || *req.RejectionReason == "") {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "审核不通过时必须提供拒绝原因"})
		return
	}

	// Check if tool exists
	var oldStatus string
	err := h.db.Get(&oldStatus, "SELECT review_status FROM tools WHERE id = $1", toolID)
	if err == sql.ErrNoRows {
		c.JSON(http.StatusNotFound, gin.H{"detail": "工具不存在"})
		return
	} else if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "查询失败"})
		return
	}

	// Update database
	_, err = h.db.Exec(`
		UPDATE tools 
		SET review_status = $1, 
		    rejection_reason = $2,
		    updated_at = NOW()
		WHERE id = $3
	`, req.ReviewStatus, req.RejectionReason, toolID)

	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "更新失败"})
		return
	}

	message := "工具审核状态已更新"
	if req.ReviewStatus == "APPROVED_PENDING_SEO" {
		message += "。SEO内容生成中，完成后需要进行第二次审核。"
	} else if req.ReviewStatus == "PUBLISHED" {
		message += "，已正式发布！"
	}

	c.JSON(http.StatusOK, gin.H{
		"message":    message,
		"tool_id":    toolID,
		"old_status": oldStatus,
		"new_status": req.ReviewStatus,
	})
}

// GenerateSEO generates SEO content for a tool
// POST /api/v1/admin/tools/:tool_id/generate-seo
func (h *AdminHandler) GenerateSEO(c *gin.Context) {
	toolID := c.Param("tool_id")

	// TODO: Implement SEO generation using AI API
	// 1. Query tool information
	// 2. Call Gemini/OpenAI API to generate SEO content
	// 3. Update tool_translations table with meta_title, meta_description, pros, cons
	// 4. Insert FAQs into tool_faqs table
	// 5. Update tool status to SEO_GENERATED

	c.JSON(http.StatusNotImplemented, gin.H{
		"detail":  "SEO生成功能待实现 - 需要集成AI API",
		"tool_id": toolID,
	})
}

// IsAdmin checks if a username is an admin
// GET /api/v1/admin/is-admin
func (h *AdminHandler) IsAdmin(c *gin.Context) {
	username := c.Query("username")
	if username == "" {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "缺少username参数"})
		return
	}

	var count int
	err := h.db.Get(&count, "SELECT COUNT(*) FROM admin WHERE username = $1", username)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "查询失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"is_admin": count > 0,
	})
}

// Tool import types and constants
const (
	MaxLenSlug      = 60
	MaxLenCategory  = 60
	MaxLenName      = 255
	MaxLenLink      = 255
	MaxLenMetaTitle = 60
	MaxLenMetaDesc  = 160
	MaxLenShortDesc = 255
)

type RawToolData struct {
	Name               string                   `json:"name"`
	OfficialLink       string                   `json:"official_link"`
	Category           string                   `json:"category"`
	PricingModel       string                   `json:"pricing_model"`
	IsFeatured         bool                     `json:"is_featured"`
	Tags               []string                 `json:"tags"`
	LogoURL            string                   `json:"logo_url"`
	Rating             *float64                 `json:"rating"`
	Screenshots        []string                 `json:"screenshots"`
	VideoURL           string                   `json:"video_url"`
	SupportedPlatforms []string                 `json:"supported_platforms"`
	ReviewStatus       string                   `json:"review_status"`
	Description        string                   `json:"description"`
	ShortDescription   string                   `json:"short_description"`
	CategoryName       string                   `json:"category_name"`
	Features           []string                 `json:"features"`
	UseCases           []string                 `json:"use_cases"`
	KeyDifferentiators []string                 `json:"key_differentiators"`
	PricingDetails     string                   `json:"pricing_details"`
	MetaTitle          string                   `json:"meta_title"`
	MetaDescription    string                   `json:"meta_description"`
	Pros               []string                 `json:"pros"`
	Cons               []string                 `json:"cons"`
	FAQs               []map[string]interface{} `json:"faqs"`
}

type ImportResult struct {
	Inserted int                 `json:"inserted"`
	Skipped  int                 `json:"skipped"`
	Failed   int                 `json:"failed"`
	Errors   []map[string]string `json:"errors"`
}

// ImportSEOToolsAutoSplit handles large tool JSON uploads and imports them directly
// POST /api/v1/admin/import-seo-auto-split
func (h *AdminHandler) ImportSEOToolsAutoSplit(c *gin.Context) {
	// Get file from request
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "文件上传失败: " + err.Error()})
		return
	}

	// Get language code from form data or query parameter (default: "zh")
	langCode := c.PostForm("lang_code")
	if langCode == "" {
		langCode = c.DefaultQuery("lang_code", "zh")
	}

	// Validate language code
	validLangCodes := []string{"zh", "en", "ja", "ko", "es", "fr", "de"}
	if !contains(validLangCodes, langCode) {
		c.JSON(http.StatusBadRequest, gin.H{"detail": fmt.Sprintf("无效的语言代码: %s。支持的语言: %v", langCode, validLangCodes)})
		return
	}

	// Open and read uploaded file
	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "打开上传文件失败"})
		return
	}
	defer src.Close()

	// Parse JSON data
	var toolsData []RawToolData
	decoder := json.NewDecoder(src)
	if err := decoder.Decode(&toolsData); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "JSON解析失败: " + err.Error()})
		return
	}

	// Import tools with specified language code
	result := h.importToolData(toolsData, langCode)

	c.JSON(http.StatusOK, gin.H{
		"success":       result.Failed == 0,
		"inserted":      result.Inserted,
		"skipped":       result.Skipped,
		"failed":        result.Failed,
		"errors":        result.Errors,
		"uploaded_file": file.Filename,
		"lang_code":     langCode,
	})
}

// TranslateTools handles resumable translation of an uploaded JSON array
// POST /api/v1/admin/translate-tools
// form params:
// - file: multipart JSON file (array of objects)
// - lang_code: target language (zh/en/etc)
// - key: key property used to dedupe/resume (default: name)
// - delay: minimum seconds between LLM calls (default: 15)
// - success_path / failed_path: optional server-side file paths to persist results
func (h *AdminHandler) TranslateTools(c *gin.Context) {
	// File is optional if a server file path is provided via form/query (not implemented)
	file, err := c.FormFile("file")
	if err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "文件上传失败: " + err.Error()})
		return
	}

	src, err := file.Open()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "打开上传文件失败"})
		return
	}
	defer src.Close()

	var data []map[string]interface{}
	decoder := json.NewDecoder(src)
	if err := decoder.Decode(&data); err != nil {
		c.JSON(http.StatusBadRequest, gin.H{"detail": "JSON解析失败: " + err.Error()})
		return
	}

	langCode := c.PostForm("lang_code")
	if langCode == "" {
		langCode = c.DefaultQuery("lang_code", "zh")
	}

	keyProperty := c.PostForm("key")
	if keyProperty == "" {
		keyProperty = c.DefaultQuery("key", "name")
	}

	delayStr := c.PostForm("delay")
	if delayStr == "" {
		delayStr = c.DefaultQuery("delay", "15")
	}
	delay, err := strconv.Atoi(delayStr)
	if err != nil || delay < 1 {
		delay = 15
	}

	// default success/failed paths under ./data
	successPath := c.PostForm("success_path")
	failedPath := c.PostForm("failed_path")
	if successPath == "" {
		successPath = filepath.Join("data", fmt.Sprintf("translation_%s_success.json", langCode))
	}
	if failedPath == "" {
		failedPath = filepath.Join("data", fmt.Sprintf("translation_%s_failed.json", langCode))
	}

	// call the resumable translator
	stats, err := scripts.TranslateResumable(data, langCode, successPath, failedPath, keyProperty, delay)
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "翻译任务失败: " + err.Error()})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"success":      true,
		"stats":        stats,
		"success_path": successPath,
		"failed_path":  failedPath,
	})

}
func (h *AdminHandler) importSingleTool(tx *sqlx.Tx, toolData RawToolData, langCode string, result *ImportResult) error {
	// 1. Check if tool exists
	var existingToolID *int
	err := tx.Get(&existingToolID, "SELECT id FROM tools WHERE name = $1", toolData.Name)
	if err != nil && err.Error() != "sql: no rows in result set" {
		return fmt.Errorf("检查工具是否存在失败: %w", err)
	}

	var toolID int
	var toolSlug string
	isNewTool := (existingToolID == nil)

	if !isNewTool {
		// Tool exists
		toolID = *existingToolID
		err := tx.Get(&toolSlug, "SELECT slug FROM tools WHERE id = $1", toolID)
		if err != nil {
			return fmt.Errorf("获取已存在工具的 slug 失败: %w", err)
		}

		_, err = tx.Exec("UPDATE tools SET updated_at = $1 WHERE id = $2", time.Now(), toolID)
		if err != nil {
			return fmt.Errorf("更新 updated_at 失败: %w", err)
		}
	} else {
		// Create new tool
		generatedSlug, err := utils.GenerateUniqueSlug(tx, "tools", toolData.Name, nil)
		if err != nil {
			return fmt.Errorf("生成 slug 失败: %w", err)
		}
		toolSlug = truncateStr(generatedSlug, MaxLenSlug)

		reviewStatus := toolData.ReviewStatus
		if reviewStatus == "" {
			reviewStatus = "PUBLISHED"
		}

		query := `
			INSERT INTO tools (
				name, slug, official_link, category, pricing_model, is_featured,
				tags, logo_url, rating, screenshots, video_url, supported_platforms,
				review_status, edit_count, created_at, updated_at
			) VALUES (
				$1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, 0, $14, $14
			) RETURNING id
		`

		err = tx.Get(&toolID, query,
			truncateStr(toolData.Name, MaxLenName),
			toolSlug,
			truncateStr(toolData.OfficialLink, MaxLenLink),
			truncateStr(toolData.Category, MaxLenCategory),
			toolData.PricingModel,
			toolData.IsFeatured,
			jsonMarshal(toolData.Tags),
			truncateStr(toolData.LogoURL, MaxLenLink),
			toolData.Rating,
			jsonMarshal(toolData.Screenshots),
			truncateStr(toolData.VideoURL, MaxLenLink),
			jsonMarshal(toolData.SupportedPlatforms),
			reviewStatus,
			time.Now(),
		)

		if err != nil {
			return fmt.Errorf("插入 Tool 失败: %w", err)
		}
	}

	// 2. Check if translation exists
	var translationExists int
	err = tx.Get(&translationExists,
		"SELECT COUNT(*) FROM tool_translations WHERE tool_id = $1 AND lang_code = $2",
		toolID, langCode)
	if err != nil {
		return fmt.Errorf("检查翻译是否存在失败: %w", err)
	}

	if translationExists > 0 {
		result.Skipped++
		return fmt.Errorf("翻译已存在，跳过")
	}

	// 3. Insert translation
	translationQuery := `
		INSERT INTO tool_translations (
			tool_id, lang_code, description, short_description, category_name,
			features, use_cases, key_differentiators, pricing_details,
			meta_title, meta_description, pros, cons
		) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)
	`

	_, err = tx.Exec(translationQuery,
		toolID,
		langCode,
		toolData.Description,
		truncateStr(toolData.ShortDescription, MaxLenShortDesc),
		truncateStr(toolData.CategoryName, MaxLenCategory),
		jsonMarshal(toolData.Features),
		jsonMarshal(toolData.UseCases),
		jsonMarshal(toolData.KeyDifferentiators),
		toolData.PricingDetails,
		truncateStr(toolData.MetaTitle, MaxLenMetaTitle),
		truncateStr(toolData.MetaDescription, MaxLenMetaDesc),
		jsonMarshal(toolData.Pros),
		jsonMarshal(toolData.Cons),
	)

	if err != nil {
		return fmt.Errorf("插入 ToolTranslation 失败: %w", err)
	}

	// 4. Insert FAQs
	for i, faq := range toolData.FAQs {
		question, _ := faq["question"].(string)
		answer, _ := faq["answer"].(string)

		_, err = tx.Exec(`
			INSERT INTO tool_faqs (tool_id, lang_code, faq_order, question, answer)
			VALUES ($1, $2, $3, $4, $5)
		`, toolID, langCode, i, question, answer)

		if err != nil {
			return fmt.Errorf("插入 FAQ #%d 失败: %w", i, err)
		}
	}

	result.Inserted++
	return nil
}

// importToolData imports multiple tools by running each tool import in its own transaction.
func (h *AdminHandler) importToolData(tools []RawToolData, langCode string) ImportResult {
	res := ImportResult{Errors: []map[string]string{}}

	for _, t := range tools {
		tx, err := h.db.Beginx()
		if err != nil {
			res.Failed++
			res.Errors = append(res.Errors, map[string]string{"name": t.Name, "error": "开始事务失败"})
			continue
		}

		err = h.importSingleTool(tx, t, langCode, &res)
		if err != nil {
			_ = tx.Rollback()
			res.Errors = append(res.Errors, map[string]string{"name": t.Name, "error": err.Error()})
			continue
		}

		if err := tx.Commit(); err != nil {
			res.Failed++
			res.Errors = append(res.Errors, map[string]string{"name": t.Name, "error": "提交事务失败"})
			continue
		}
	}

	return res
}

// DeleteTableData deletes all rows from specified table
// DELETE /api/v1/admin/delete/:table_key
func (h *AdminHandler) DeleteTableData(c *gin.Context) {
	tableKey := c.Param("table_key")

	// Map table keys to actual table names
	tableMap := map[string][]string{
		"seo_tools":        {"tool_faqs", "tool_translations", "tools"}, // Delete in order to respect FK constraints
		"users":            {"users"},
		"workflows":        {"workflownode", "workflowtemplate"},
		"category_mapping": {"categories"},
	}

	tables, ok := tableMap[tableKey]
	if !ok {
		c.JSON(http.StatusBadRequest, gin.H{"detail": fmt.Sprintf("未知的表键: %s", tableKey)})
		return
	}

	// Begin transaction
	tx, err := h.db.Begin()
	if err != nil {
		c.JSON(http.StatusInternalServerError, gin.H{"detail": "事务开始失败"})
		return
	}
	defer tx.Rollback()

	totalDeleted := 0
	for _, table := range tables {
		result, err := tx.Exec(fmt.Sprintf("DELETE FROM %s", table))
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"detail": fmt.Sprintf("删除表 %s 失败: %v", table, err)})
			return
		}
		rows, _ := result.RowsAffected()
		totalDeleted += int(rows)
	}

	if err := tx.Commit(); err != nil {
		// DownloadFile streams a server-side file from the ./data directory back to the client.
		// Query param: path (filename under data directory). Only basename is allowed to avoid traversal.

		c.JSON(http.StatusInternalServerError, gin.H{"detail": "提交事务失败"})
		return
	}

	c.JSON(http.StatusOK, gin.H{
		"deleted":      true,
		"rows_deleted": totalDeleted,
	})
}

// GenerateCategoryMapping generates category mapping using LLM
// POST /api/v1/admin/generate-category-mapping
func (h *AdminHandler) GenerateCategoryMapping(c *gin.Context) {
	// Support both query params and JSON body for flexibility from frontend.
	// Read query params first (frontend currently sends ?commit=true)
	commitQ := strings.ToLower(c.DefaultQuery("commit", "false")) == "true"

	// Try to parse JSON body into a generic map to accept mapping overrides
	var bodyMap map[string]interface{}
	if err := c.ShouldBindJSON(&bodyMap); err != nil {
		// not fatal — body may be empty or not JSON
		bodyMap = map[string]interface{}{}
	}

	// Build effective request values
	// mappingFile is no longer used: we read existing mappings from DB instead of file

	commit := commitQ
	if !commit {
		if v, ok := bodyMap["commit"].(bool); ok {
			commit = v
		}
	}

	// note: force flag accepted from query/body but not used in current implementation

	// mapping override (optional) — frontend may POST the mapping dict directly as body
	var mappingOverride map[string]interface{}
	if mo, ok := bodyMap["mapping_override"].(map[string]interface{}); ok && len(mo) > 0 {
		mappingOverride = mo
	} else if len(bodyMap) > 0 {
		// If body is a raw mapping (original->display) accept it as mappingOverride.
		// Frontend may send values as strings (single-language) or objects {zh,en}.
		// Detect both cases.
		allStrings := true
		allObjs := true
		for _, v := range bodyMap {
			if _, ok := v.(string); !ok {
				allStrings = false
			}
			if _, ok := v.(map[string]interface{}); !ok {
				allObjs = false
			}
		}
		if allStrings {
			mappingOverride = map[string]interface{}{}
			for k, v := range bodyMap {
				if s, ok := v.(string); ok {
					mappingOverride[k] = s
				}
			}
		} else if allObjs {
			mappingOverride = map[string]interface{}{}
			for k, v := range bodyMap {
				if m, ok := v.(map[string]interface{}); ok {
					mappingOverride[k] = m
				}
			}
		}
	}

	model := os.Getenv("GEMINI_MODEL")
	// Generate bilingual mappings (zh + en) reading existing mapping from DB
	bilingual, raw, err := gen.GenerateBilingualMappingsFromDB(h.db, model)
	if err != nil {
		// On failure: only return the message (raw prompt or info) as requested
		c.JSON(http.StatusInternalServerError, gin.H{
			"message": raw,
		})
		return
	}

	// Apply mappingOverride if provided: override display name for zh/en where provided.
	for orig, val := range mappingOverride {
		switch v := val.(type) {
		case string:
			if _, exists := bilingual[orig]; !exists {
				bilingual[orig] = map[string]string{"zh": v, "en": v}
			} else {
				bilingual[orig]["zh"] = v
				bilingual[orig]["en"] = v
			}
		case map[string]interface{}:
			if _, exists := bilingual[orig]; !exists {
				bilingual[orig] = map[string]string{"zh": "", "en": ""}
			}
			if zh, ok := v["zh"].(string); ok && strings.TrimSpace(zh) != "" {
				bilingual[orig]["zh"] = zh
			}
			if en, ok := v["en"].(string); ok && strings.TrimSpace(en) != "" {
				bilingual[orig]["en"] = en
			}
		default:
			// ignore unsupported types
		}
	}

	// If commit requested, upsert into DB
	if commit {
		summary, upserr := gen.UpsertCategoryTranslations(h.db, bilingual)
		if upserr != nil {
			c.JSON(http.StatusInternalServerError, gin.H{"message": upserr.Error()})
			return
		}
		// Return mapping at top-level (no wrapper) and include upsert summary
		resp := gin.H{"upsert_summary": summary}
		for k, v := range bilingual {
			resp[k] = v
		}
		c.JSON(http.StatusOK, resp)
		return
	}

	// Success (no commit): return mapping directly at top-level without wrapper or message
	c.JSON(http.StatusOK, bilingual)
}

// Helper functions

func truncateStr(val string, maxLen int) string {
	runes := []rune(val)
	if len(runes) <= maxLen {
		return val
	}
	return string(runes[:maxLen])
}

func jsonMarshal(v interface{}) string {
	if v == nil {
		return "[]"
	}
	b, _ := json.Marshal(v)
	return string(b)
}

func contains(slice []string, item string) bool {
	for _, s := range slice {
		if s == item {
			return true
		}
	}
	return false
}
