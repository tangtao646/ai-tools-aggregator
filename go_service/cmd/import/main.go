package main

import (
	"encoding/json"
	"flag"
	"fmt"
	"log"
	"os"
	"time"

	_ "github.com/jackc/pgx/v5/stdlib"
	"github.com/jmoiron/sqlx"
	"github.com/tangtao646/ai-tools-aggregator-go/internal/utils"
)

// Constants for field length limits
const (
	MaxLenSlug      = 60
	MaxLenCategory  = 60
	MaxLenName      = 255
	MaxLenLink      = 255
	MaxLenMetaTitle = 60
	MaxLenMetaDesc  = 160
	MaxLenShortDesc = 255
	DefaultLangCode = "zh"
)

// RawToolData represents the structure of JSON input
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

// ImportResult tracks import statistics
type ImportResult struct {
	Inserted int
	Skipped  int
	Failed   int
	Errors   []map[string]string
}

func (r *ImportResult) PrintSummary() {
	fmt.Println("\n--- 导入总结 ---")
	fmt.Printf("✅ 成功插入: %d 条\n", r.Inserted)
	fmt.Printf("⚠️ 跳过 (已存在): %d 条\n", r.Skipped)
	fmt.Printf("❌ 失败 (数据库/数据错误): %d 条\n", r.Failed)
	if r.Failed > 0 {
		fmt.Printf("请检查 errors.log 文件以获取 %d 条失败详情。\n", r.Failed)
	}
}

func truncateStr(val string, maxLen int) string {
	// 将字符串转换为 rune 切片，以正确处理多字节 UTF-8 字符
	runes := []rune(val)
	if len(runes) <= maxLen {
		return val
	}
	return string(runes[:maxLen])
}

func generateUniqueSlug(db sqlx.Ext, name string) (string, error) {
	return utils.GenerateUniqueSlug(db, "tools", name, nil)
}

func loadDataFromJSON(filepath string) ([]RawToolData, error) {
	if _, err := os.Stat(filepath); os.IsNotExist(err) {
		return nil, fmt.Errorf("文件不存在: %s", filepath)
	}

	fmt.Printf("-> 正在从文件 '%s' 读取数据...\n", filepath)

	data, err := os.ReadFile(filepath)
	if err != nil {
		return nil, fmt.Errorf("读取文件失败: %w", err)
	}

	var tools []RawToolData
	if err := json.Unmarshal(data, &tools); err != nil {
		return nil, fmt.Errorf("解析 JSON 失败: %w", err)
	}

	fmt.Printf("-> 成功读取 %d 条记录。\n", len(tools))
	return tools, nil
}

func jsonMarshal(v interface{}) string {
	if v == nil {
		return "[]"
	}
	b, _ := json.Marshal(v)
	return string(b)
}

func importToolData(db *sqlx.DB, dataList []RawToolData, langCode string) {
	if len(dataList) == 0 {
		fmt.Println("--- 没有数据可导入，操作跳过。---")
		return
	}

	fmt.Printf("\n--- 开始导入 %d 条工具数据 (语言: %s) ---\n", len(dataList), langCode)

	result := &ImportResult{
		Errors: make([]map[string]string, 0),
	}

	for _, toolData := range dataList {
		if toolData.Name == "" {
			result.Failed++
			result.Errors = append(result.Errors, map[string]string{
				"name":  "N/A",
				"error": "Tool entry is missing 'name'",
			})
			continue
		}

		tx, err := db.Beginx()
		if err != nil {
			result.Failed++
			result.Errors = append(result.Errors, map[string]string{
				"name":  toolData.Name,
				"error": fmt.Sprintf("开始事务失败: %v", err),
			})
			continue
		}

		if err := importSingleTool(tx, toolData, langCode, result); err != nil {
			tx.Rollback()
			result.Failed++
			result.Errors = append(result.Errors, map[string]string{
				"name":  toolData.Name,
				"error": err.Error(),
			})
			fmt.Printf("❌ 失败：工具 '%s' 导入失败，已回滚事务。\n", toolData.Name)
			fmt.Printf("   错误详情: %v\n", err)
			continue
		}

		if err := tx.Commit(); err != nil {
			result.Failed++
			result.Errors = append(result.Errors, map[string]string{
				"name":  toolData.Name,
				"error": fmt.Sprintf("提交事务失败: %v", err),
			})
			continue
		}
	}

	// Write error log if there are failures
	if result.Failed > 0 {
		errorLog, _ := json.MarshalIndent(result.Errors, "", "  ")
		logFile := "errors.log"
		if err := os.WriteFile(logFile, errorLog, 0644); err == nil {
			fmt.Printf("⚠️ 详细错误信息已写入: %s\n", logFile)
		}
	}

	result.PrintSummary()
}

func importSingleTool(tx *sqlx.Tx, toolData RawToolData, langCode string, result *ImportResult) error {
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
		// Tool exists, update updated_at
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
		generatedSlug, err := generateUniqueSlug(tx, toolData.Name)
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

func main() {
	// Command line flags
	filename := flag.String("file", "tools_to_import.json", "JSON file to import")
	langCode := flag.String("lang", DefaultLangCode, "Language code for translations")
	dbURL := flag.String("db", "", "Database URL (default from env DATABASE_URL)")
	flag.Parse()

	// Get database URL
	databaseURL := *dbURL
	if databaseURL == "" {
		databaseURL = os.Getenv("DATABASE_URL")
	}
	if databaseURL == "" {
		log.Fatal("DATABASE_URL 未设置。请通过 -db 参数或环境变量提供。")
	}

	// Connect to database
	db, err := sqlx.Connect("pgx", databaseURL)
	if err != nil {
		log.Fatalf("连接数据库失败: %v", err)
	}
	defer db.Close()

	fmt.Println("数据库连接成功")

	// Load data
	data, err := loadDataFromJSON(*filename)
	if err != nil {
		log.Fatalf("加载数据失败: %v", err)
	}

	// Import data
	importToolData(db, data, *langCode)

	fmt.Println("\n💡 导入完成。")
	fmt.Printf("运行示例:\n")
	fmt.Printf("   - 使用默认文件: go run cmd/import/main.go\n")
	fmt.Printf("   - 指定文件: go run cmd/import/main.go -file=/path/to/tools.json\n")
	fmt.Printf("   - 指定语言: go run cmd/import/main.go -lang=en\n")
}
